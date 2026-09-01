"""
Part 5: The PyTorch Training Loop & Checkpointing
PyMastery Progressive Zero-to-Hero PyTorch Curriculum
"""

import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from typing import Dict, Any, List, Optional, Tuple

DAY_METADATA = {
    "day_id": "pytorch05",
    "day_number": 5,
    "title": "Part 5: The PyTorch Training Loop & Checkpointing",
    "tagline": "Master the canonical 5-step optimization loop, train/eval modes, loss tracking, and early stopping checkpointers.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "The 5 Canonical Steps: zero_grad, forward, compute loss, backward, optimizer step",
        "Epoch vs Mini-Batch loops with running sample-weighted loss aggregation",
        "Train vs Eval mode (model.train() and model.eval())",
        "Disabling Autograd graph tape with torch.no_grad() during validation",
        "Early Stopping mechanics with validation patience and delta thresholds",
        "Model state persistence: state_dict, deepcopy, and load_state_dict"
    ]
}

CONCEPT_PRIMER = r"""# Part 5 Concept Primer: The PyTorch Training Loop & Model Checkpointing

## 1. The 5 Canonical Steps of Optimization
At the core of deep learning in PyTorch is an iterative optimization loop. Every single gradient descent step—from linear regression to a 100-billion parameter Large Language Model—follows the exact same **5 canonical steps**:

```python
# The 5 Canonical Steps inside the mini-batch loop:
optimizer.zero_grad()               # Step 1: Clear stale accumulated gradients
outputs = model(inputs)             # Step 2: Forward pass (compute predictions)
loss = criterion(outputs, targets)  # Step 3: Compute scalar objective loss
loss.backward()                     # Step 4: Backpropagation (reverse-mode AD)
optimizer.step()                    # Step 5: Update weights via optimizer rule
```

### Why does `optimizer.zero_grad()` exist?
In PyTorch, tensor gradients (`param.grad`) **accumulate by default** (i.e. `param.grad += dL/dParam`). PyTorch does NOT automatically overwrite or reset `.grad` to zero on each `.backward()` call.

This design is intentional:
* It enables **gradient accumulation across multiple micro-batches**, allowing you to simulate a batch size of 256 or 512 on a GPU that can physically fit only 32 samples in VRAM.
* It accommodates Recurrent Neural Networks (RNNs) unfolding over time.

However, if you forget `optimizer.zero_grad()`, gradients from the current batch add to the gradients of all previous batches. Within a few steps, gradient magnitudes explode, ruining model parameters!

---

## 2. Epoch vs Batch Loops & Running Loss Accumulation
Training involves two nested loops:
1. **Epoch Loop:** One full pass through the entire training dataset.
2. **Batch Loop:** Iteration over mini-batches provided by a `DataLoader`.

### Tracking Loss Correctly
Because the final mini-batch in an epoch might have fewer samples than `batch_size` (unless `drop_last=True`), simply averaging batch losses can introduce subtle bias:
```python
running_loss = 0.0
total_samples = 0

for inputs, targets in dataloader:
    optimizer.zero_grad()
    outputs = model(inputs)
    loss = criterion(outputs, targets)
    loss.backward()
    optimizer.step()

    # Weight loss by actual number of samples in this batch:
    batch_size = inputs.size(0)
    running_loss += loss.item() * batch_size
    total_samples += batch_size

epoch_loss = running_loss / total_samples
```
> **Critical Rule:** Always use `loss.item()` when tracking metrics! Calling `running_loss += loss` retains the entire dynamic computational graph in GPU memory, leading to an Out-Of-Memory (OOM) crash within a few batches.

---

## 3. Evaluation Mode: `model.eval()` & `torch.no_grad()`
Deep neural networks behave differently during training versus evaluation:
* **Dropout:** During training, randomly zeros out activations with probability $p$. During evaluation, all units are active, scaled by $(1 - p)$.
* **Batch Normalization:** During training, computes batch-specific mean and variance, and updates exponential running estimates (`running_mean`, `running_var`). During evaluation, uses the frozen running estimates.

### The Evaluation Protocol
```python
model.eval()  # Toggle evaluation mode for Dropout & BatchNorm

with torch.no_grad():  # Disable Autograd tape recording (saves RAM & computation)
    for val_inputs, val_targets in val_loader:
        val_outputs = model(val_inputs)
        val_loss = criterion(val_outputs, val_targets)
        # Compute validation metrics...

model.train()  # Switch back to training mode for next epoch
```

---

## 4. Early Stopping & Model Checkpointing
Deep models are prone to **overfitting**: training loss continues to drop while validation loss hits a minimum and starts climbing.

**Early Stopping** monitors validation loss:
1. Track the `best_loss` achieved so far.
2. If validation loss improves by at least `delta`, update `best_loss`, save a copy of `model.state_dict()`, and reset the patience counter to 0.
3. If validation loss fails to improve, increment `patience_counter`.
4. When `patience_counter >= patience`, terminate training early and restore `best_state_dict`.

```
Validation Loss Trajectory:
Loss
 │
 │   \
 │    \      Best Epoch (Patience=0)
 │     \    /
 │      \  /  <-- Patience=1
 │       \/   <-- Patience=2  <-- Patience=3 (TRIGGER EARLY STOP!)
 └────────────────────────────────────────────── Epoch
```

> **Deepcopy Gotcha:** `model.state_dict()` returns a dictionary of references to internal parameter tensors. If you save `best_state = model.state_dict()` without `copy.deepcopy()`, subsequent `optimizer.step()` calls will mutate the tensors inside your saved dictionary! Always use `copy.deepcopy(model.state_dict())`.
"""

WALKTHROUGH = r"""# Part 5 Code Walkthrough: Building a Complete Training Pipeline

Let's observe the 5 canonical steps, evaluation mode, and state checkpointing in action:

```python
import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# 1. Define synthetic data and model
torch.manual_seed(42)
X = torch.randn(100, 4)
y = (X[:, 0] * 2.0 - X[:, 1] * 1.5 + torch.randn(100) * 0.1).unsqueeze(1)

dataset = TensorDataset(X, y)
loader = DataLoader(dataset, batch_size=16, shuffle=True)

model = nn.Linear(4, 1)
criterion = nn.MSELoss()
optimizer = optim.SGD(model.parameters(), lr=0.05)

# 2. Canonical training loop
print("Starting 5-epoch training:")
for epoch in range(1, 6):
    model.train()
    running_loss = 0.0
    total_samples = 0
    
    for batch_x, batch_y in loader:
        # Step 1: Zero gradients
        optimizer.zero_grad()
        
        # Step 2: Forward pass
        preds = model(batch_x)
        
        # Step 3: Compute loss
        loss = criterion(preds, batch_y)
        
        # Step 4: Backward pass
        loss.backward()
        
        # Step 5: Optimizer step
        optimizer.step()
        
        running_loss += loss.item() * batch_x.size(0)
        total_samples += batch_x.size(0)
        
    epoch_loss = running_loss / total_samples
    print(f"Epoch {epoch}/5 - Loss: {epoch_loss:.4f}")

# 3. Model checkpointing: save and restore state_dict
saved_state = copy.deepcopy(model.state_dict())
print("\nSaved model state_dict keys:", list(saved_state.keys()))

# Model evaluation
model.eval()
with torch.no_grad():
    sample_test = torch.randn(2, 4)
    predictions = model(sample_test)
    print("Evaluation predictions shape:", predictions.shape)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Canonical 5-Step Training Loop (torch-p5-c1)
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "torch-p5-c1",
    "title": "Canonical 5-Step Training Loop",
    "difficulty": "Beginner",
    "category": "Training Loop",
    "description": (
        "Implement the fundamental 5-step PyTorch optimization loop across multiple epochs. "
        "Iterate over a DataLoader, execute optimizer.zero_grad(), forward propagation, loss calculation, "
        "backward pass, and optimizer.step(). Track sample-weighted running loss and return the loss history."
    ),
    "instructions": (
        "Write a function `train_model(model: torch.nn.Module, dataloader: torch.utils.data.DataLoader, "
        "criterion: torch.nn.Module, optimizer: torch.optim.Optimizer, num_epochs: int = 5) -> list[float]` that:\n"
        "1. Executes an outer loop for `num_epochs` (from 0 to `num_epochs - 1`).\n"
        "2. Sets the model to training mode (`model.train()`) at the start of each epoch.\n"
        "3. Initializes running loss accumulation: `running_loss = 0.0` and `total_samples = 0`.\n"
        "4. Iterates through batches `(inputs, targets)` in `dataloader`:\n"
        "   - Step 1: Clear prior gradients with `optimizer.zero_grad()`.\n"
        "   - Step 2: Compute model predictions `outputs = model(inputs)`.\n"
        "   - Step 3: Compute scalar loss with `loss = criterion(outputs, targets)`.\n"
        "   - Step 4: Compute gradients via backpropagation with `loss.backward()`.\n"
        "   - Step 5: Update model parameters with `optimizer.step()`.\n"
        "   - Accumulate sample-weighted loss: `running_loss += loss.item() * inputs.size(0)`.\n"
        "   - Increment sample count: `total_samples += inputs.size(0)`.\n"
        "5. Computes average epoch loss: `epoch_loss = running_loss / total_samples` (or 0.0 if empty).\n"
        "6. Appends `float(epoch_loss)` to a list and returns `loss_history` of length `num_epochs`."
    ),
    "starter_code": r'''import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import List

def train_model(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    num_epochs: int = 5
) -> List[float]:
    """
    Execute standard 5-step PyTorch training loop across epochs.
    
    Args:
        model: PyTorch nn.Module to train
        dataloader: DataLoader providing (inputs, targets) batches
        criterion: Loss function module (e.g. nn.MSELoss, nn.CrossEntropyLoss)
        optimizer: PyTorch optimizer (e.g. optim.SGD, optim.Adam)
        num_epochs: Total number of training epochs
        
    Returns:
        List of average loss values per epoch
    """
    # TODO: Implement the 5 canonical training steps per batch across epochs
    pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import List

def train_model(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    num_epochs: int = 5
) -> List[float]:
    """
    Execute standard 5-step PyTorch training loop across epochs.
    """
    loss_history: List[float] = []
    
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        total_samples = 0
        
        for inputs, targets in dataloader:
            # 1. Clear gradients
            optimizer.zero_grad()
            
            # 2. Forward pass
            outputs = model(inputs)
            
            # 3. Compute loss
            loss = criterion(outputs, targets)
            
            # 4. Backward pass
            loss.backward()
            
            # 5. Parameter update
            optimizer.step()
            
            batch_size = inputs.size(0)
            running_loss += loss.item() * batch_size
            total_samples += batch_size
            
        epoch_loss = running_loss / total_samples if total_samples > 0 else 0.0
        loss_history.append(float(epoch_loss))
        
    return loss_history
''',
    "test_suite": r'''import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

def run_tests(candidate_func):
    """
    Automated test harness for Canonical 5-Step Training Loop (torch-p5-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Linear regression convergence
    torch.manual_seed(123)
    X = torch.randn(80, 2)
    # y = 3*x0 - 2*x1 + 1
    true_w = torch.tensor([[3.0], [-2.0]])
    y = X @ true_w + 1.0 + torch.randn(80, 1) * 0.05
    dataset = TensorDataset(X, y)
    loader = DataLoader(dataset, batch_size=16, shuffle=True)

    model = nn.Linear(2, 1)
    initial_weights = model.weight.clone().detach()
    criterion = nn.MSELoss()
    optimizer = optim.SGD(model.parameters(), lr=0.1)

    loss_history = candidate_func(model, loader, criterion, optimizer, num_epochs=6)

    assert_test(isinstance(loss_history, list), f"Expected list return type, got {type(loss_history)}")
    assert_test(len(loss_history) == 6, f"Expected 6 epoch losses, got {len(loss_history)}")
    for val in loss_history:
        assert_test(isinstance(val, float), f"Loss elements must be float, got {type(val)}")

    # Loss must strictly decrease overall
    assert_test(loss_history[-1] < loss_history[0], f"Loss did not decrease: start={loss_history[0]}, end={loss_history[-1]}")
    assert_test(loss_history[-1] < 0.2, f"Expected final loss < 0.2, got {loss_history[-1]}")

    # Parameters must have been updated
    assert_test(not torch.equal(model.weight, initial_weights), "Model weights did not change during training")

    # Test 2: Training mode check
    assert_test(model.training is True, "Model should remain in training mode after train_model()")

    # Test 3: Custom num_epochs = 1
    single_hist = candidate_func(model, loader, criterion, optimizer, num_epochs=1)
    assert_test(len(single_hist) == 1, f"Expected 1 epoch loss, got {len(single_hist)}")

    return report
''',
    "hints": [
        "Remember the 5 steps in order: optimizer.zero_grad(), outputs = model(inputs), loss = criterion(outputs, targets), loss.backward(), optimizer.step().",
        "Accumulate sample-weighted loss: running_loss += loss.item() * inputs.size(0) and total_samples += inputs.size(0).",
        "Use loss.item() to extract the scalar float without leaking the autograd computational graph."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Early Stopping & Model Checkpointer (torch-p5-c2)
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "torch-p5-c2",
    "title": "Early Stopping & Model Checkpointer",
    "difficulty": "Intermediate",
    "category": "Training & Regularization",
    "description": (
        "Implement a complete train-and-evaluate pipeline equipped with early stopping and state_dict checkpointing. "
        "Track validation loss across epochs, stop training when patience is exhausted, and restore the best weights."
    ),
    "instructions": (
        "Write a function `train_with_early_stopping(model: torch.nn.Module, train_loader: torch.utils.data.DataLoader, "
        "val_loader: torch.utils.data.DataLoader, criterion: torch.nn.Module, optimizer: torch.optim.Optimizer, "
        "max_epochs: int = 10, patience: int = 3, delta: float = 0.0) -> dict` that:\n"
        "1. Initializes `best_loss = float('inf')`, `patience_counter = 0`, `best_state_dict = copy.deepcopy(model.state_dict())`, "
        "`train_losses = []`, and `val_losses = []`.\n"
        "2. Iterates epoch from `1` to `max_epochs` (inclusive):\n"
        "   a. Training Phase:\n"
        "      - Set `model.train()`.\n"
        "      - For `inputs, targets` in `train_loader`: run 5 canonical optimization steps and accumulate weighted train loss.\n"
        "      - Record `train_loss = running_train_loss / total_train_samples` in `train_losses`.\n"
        "   b. Validation Phase:\n"
        "      - Set `model.eval()`.\n"
        "      - Under `with torch.no_grad():`, iterate `val_loader` and accumulate weighted val loss without gradient computation.\n"
        "      - Record `val_loss = running_val_loss / total_val_samples` in `val_losses`.\n"
        "   c. Early Stopping Logic:\n"
        "      - If `val_loss < best_loss - delta`:\n"
        "        - Update `best_loss = val_loss`.\n"
        "        - Save `best_state_dict = copy.deepcopy(model.state_dict())`.\n"
        "        - Reset `patience_counter = 0`.\n"
        "      - Else:\n"
        "        - Increment `patience_counter += 1`.\n"
        "        - If `patience_counter >= patience`: early stopping triggered! Record `stopped_epoch = epoch`, `early_stopped = True`, and break.\n"
        "3. If loop finishes without early stopping: record `stopped_epoch = max_epochs` and `early_stopped = False`.\n"
        "4. Restore best weights: `model.load_state_dict(best_state_dict)`.\n"
        "5. Returns dictionary:\n"
        "   `{\"best_loss\": float(best_loss), \"stopped_epoch\": int(stopped_epoch), \"best_state_dict\": best_state_dict, "
        "\"train_losses\": train_losses, \"val_losses\": val_losses, \"early_stopped\": bool(early_stopped)}`"
    ),
    "starter_code": r'''import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import Dict, Any

def train_with_early_stopping(
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    max_epochs: int = 10,
    patience: int = 3,
    delta: float = 0.0
) -> Dict[str, Any]:
    """
    Train model with validation tracking, early stopping, and state_dict restoration.
    
    Args:
        model: PyTorch nn.Module to train
        train_loader: DataLoader for training set
        val_loader: DataLoader for validation set
        criterion: Loss module
        optimizer: Optimization algorithm
        max_epochs: Maximum allowable training epochs
        patience: Epochs without improvement before stopping
        delta: Minimum change in loss to qualify as improvement
        
    Returns:
        Dictionary with best_loss, stopped_epoch, best_state_dict, train_losses, val_losses, early_stopped
    """
    # TODO: Implement complete training loop with early stopping checkpointer
    pass
''',
    "reference_solution": r'''import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import Dict, Any

def train_with_early_stopping(
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    max_epochs: int = 10,
    patience: int = 3,
    delta: float = 0.0
) -> Dict[str, Any]:
    """
    Train model with validation tracking, early stopping, and state_dict restoration.
    """
    best_loss = float("inf")
    patience_counter = 0
    best_state_dict = copy.deepcopy(model.state_dict())
    train_losses = []
    val_losses = []
    early_stopped = False
    stopped_epoch = max_epochs

    for epoch in range(1, max_epochs + 1):
        # 1. Training Phase
        model.train()
        running_train_loss = 0.0
        train_samples = 0
        
        for inputs, targets in train_loader:
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            b_size = inputs.size(0)
            running_train_loss += loss.item() * b_size
            train_samples += b_size
            
        epoch_train_loss = running_train_loss / train_samples if train_samples > 0 else 0.0
        train_losses.append(float(epoch_train_loss))

        # 2. Validation Phase
        model.eval()
        running_val_loss = 0.0
        val_samples = 0
        
        with torch.no_grad():
            for val_inputs, val_targets in val_loader:
                val_outputs = model(val_inputs)
                val_loss = criterion(val_outputs, val_targets)
                b_size = val_inputs.size(0)
                running_val_loss += val_loss.item() * b_size
                val_samples += b_size
                
        epoch_val_loss = running_val_loss / val_samples if val_samples > 0 else 0.0
        val_losses.append(float(epoch_val_loss))

        # 3. Early Stopping Evaluation
        if epoch_val_loss < best_loss - delta:
            best_loss = epoch_val_loss
            best_state_dict = copy.deepcopy(model.state_dict())
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                early_stopped = True
                stopped_epoch = epoch
                break

    # Restore best checkpoint
    model.load_state_dict(best_state_dict)

    return {
        "best_loss": float(best_loss),
        "stopped_epoch": int(stopped_epoch),
        "best_state_dict": best_state_dict,
        "train_losses": train_losses,
        "val_losses": val_losses,
        "early_stopped": early_stopped,
    }
''',
    "test_suite": r'''import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

def run_tests(candidate_func):
    """
    Automated test harness for Early Stopping & Model Checkpointer (torch-p5-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Synthetic dataset
    torch.manual_seed(42)
    X_train = torch.randn(64, 4)
    y_train = (X_train[:, :1] * 2.0).float()
    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=16)

    X_val = torch.randn(32, 4)
    y_val = (X_val[:, :1] * 2.0).float()
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=16)

    model = nn.Linear(4, 1)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.05)

    # Test 1: Standard run with patience=2, max_epochs=8
    res = candidate_func(model, train_loader, val_loader, criterion, optimizer, max_epochs=8, patience=2)

    assert_test(isinstance(res, dict), f"Expected dict return, got {type(res)}")
    expected_keys = {"best_loss", "stopped_epoch", "best_state_dict", "train_losses", "val_losses", "early_stopped"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing keys: {expected_keys - set(res.keys())}")

    assert_test(len(res["train_losses"]) == res["stopped_epoch"], "train_losses length must equal stopped_epoch")
    assert_test(len(res["val_losses"]) == res["stopped_epoch"], "val_losses length must equal stopped_epoch")
    assert_test(res["best_loss"] <= min(res["val_losses"]), "best_loss should equal the minimum recorded val_loss")

    # Verify best_state_dict was loaded back into model
    for k, v in res["best_state_dict"].items():
        assert_test(torch.allclose(model.state_dict()[k], v), f"Model parameter '{k}' does not match best_state_dict")

    # Test 2: Verify copy.deepcopy isolation (mutating model does not corrupt saved state)
    with torch.no_grad():
        model.weight.add_(10.0)
    for k, v in res["best_state_dict"].items():
        assert_test(not torch.allclose(model.state_dict()["weight"], res["best_state_dict"]["weight"]),
                    "best_state_dict was mutated when model weights changed! Ensure copy.deepcopy is used.")

    # Test 3: Early stopping triggered test
    class ConstantModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.param = nn.Parameter(torch.tensor([1.0]))
        def forward(self, x):
            return x[:, :1] * self.param

    const_model = ConstantModel()
    const_opt = optim.SGD(const_model.parameters(), lr=0.0001)
    res_stop = candidate_func(const_model, train_loader, val_loader, criterion, const_opt, max_epochs=10, patience=2)
    assert_test(res_stop["stopped_epoch"] <= 10, f"stopped_epoch {res_stop['stopped_epoch']} exceeds max_epochs")

    return report
''',
    "hints": [
        "Toggle model.train() before training and model.eval() before validation.",
        "Wrap the validation evaluation in `with torch.no_grad():` to conserve memory and disable Autograd.",
        "Always use `copy.deepcopy(model.state_dict())` so subsequent parameter updates do not mutate your saved best checkpoint.",
        "Remember to call `model.load_state_dict(best_state_dict)` before returning."
    ]
}

CHALLENGES = [CHALLENGE_1, CHALLENGE_2]

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": CHALLENGES
}

def get_curriculum() -> Dict[str, Any]:
    return CURRICULUM_DATA
