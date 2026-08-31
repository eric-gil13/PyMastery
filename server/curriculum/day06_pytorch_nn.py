"""
Day 6: PyTorch Deep Architectures & Robust Training Loops
PyMastery 7-Day Curriculum
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
import copy
from typing import Dict, Any, List, Optional, Tuple

DAY_METADATA = {
    "day_id": "day06",
    "day_number": 6,
    "title": "Day 6: PyTorch Deep Architectures & Robust Training Loops",
    "tagline": "Master nn.Module lifecycles, residual skip connections, zero-init heuristics, gradient clipping, learning rate schedulers, and early stopping.",
    "estimated_time": "3-4 hours",
    "concepts_covered": [
        "nn.Module lifecycle, submodules, parameters vs registered buffers",
        "Train vs Eval modes (Dropout, BatchNorm running stats)",
        "Residual connections & zero-gamma BatchNorm initialization",
        "Gradient clipping (clip_grad_norm_) for training stability",
        "Learning rate schedulers (CosineAnnealing, ReduceLROnPlateau)",
        "Early stopping with checkpoint weight restoration"
    ]
}

CONCEPT_PRIMER = r"""# Day 6 Concept Primer: PyTorch Neural Architecture & Production Training

## 1. `nn.Module` Lifecycle: Parameters vs Buffers
PyTorch modules distinguish between two types of internal tensor state:

| State Type | Registration Method | Updated by Autograd | Saved in `state_dict` | Moved by `.to(device)` |
| :--- | :--- | :--- | :--- | :--- |
| **Parameter** | `nn.Parameter(t)` | **Yes** (`requires_grad=True`) | **Yes** | **Yes** |
| **Persistent Buffer** | `self.register_buffer(name, t)` | **No** | **Yes** | **Yes** |
| **Non-Persistent Buffer** | `self.register_buffer(name, t, persistent=False)` | **No** | **No** | **Yes** |

### Train vs Eval Mode Semantics
Calling `model.train()` or `model.eval()` toggles the `.training` boolean flag recursively across all submodules:
* **`nn.Dropout`**: Active during `.train()`; disabled (identity pass-through) during `.eval()`.
* **`nn.BatchNorm2d`**: Computes mean/variance across the current mini-batch and updates exponential moving averages during `.train()`; uses frozen `running_mean` and `running_var` buffers during `.eval()`.

---

## 2. Residual Architectures & Zero-Initialization
Deep neural networks suffer from vanishing/exploding gradients and representation degradation. **Residual Blocks** introduce identity skip connections:
$$\mathbf{y} = \mathcal{F}(\mathbf{x}, \{W_i\}) + \mathcal{W}_s \mathbf{x}$$

Where:
* $\mathcal{F}(\mathbf{x})$: Residual function (e.g. Conv $\to$ BN $\to$ ReLU $\to$ Conv $\to$ BN).
* $\mathcal{W}_s$: Identity mapping when input and output shapes match, or a $1 \times 1$ Conv projection when channels or spatial strides change.

### The Zero-$\gamma$ Initialization Trick
In a residual block with BatchNorm:
$$\text{Output} = \text{ReLU}\left(\text{BN}_2(\text{Conv}_2(\dots)) + \mathbf{x}\right)$$
If the scale parameter $\gamma$ of the last $\text{BN}_2$ layer is initialized to **$0.0$** (instead of $1.0$), then $\mathcal{F}(\mathbf{x}) = \mathbf{0}$, causing the residual block to initially act as an **exact identity mapping**. This allows networks with 100+ layers to train smoothly from the very first step!

```python
# Kaiming He Normal for Conv layers
nn.init.kaiming_normal_(conv.weight, mode='fan_out', nonlinearity='relu')
# Zero-init last BN in residual branch
nn.init.constant_(bn2.weight, 0.0)
```

---

## 3. Production Training Loop Best Practices
A robust training harness requires:
1. **Gradient Clipping (`torch.nn.utils.clip_grad_norm_`)**: Rescales gradients if $\|\mathbf{g}\|_2 > \text{max\_norm}$, preventing catastrophic gradient explosions in RNNs/Transformers/Deep MLPs.
2. **Learning Rate Scheduling**: Dynamically decreases learning rate during training (e.g. `CosineAnnealingLR` or `ReduceLROnPlateau`).
3. **Early Stopping & State Restoration**: Monitors validation loss. If validation loss does not improve for `patience` consecutive epochs, training halts early and the model's weights are restored to the **best checkpoint** via `model.load_state_dict(best_weights)`.
"""

WALKTHROUGH = r"""# Day 6 Walkthrough: Building a Custom Module with Registered Buffers

```python
import torch
import torch.nn as nn

class RunningExponentialMovingAverage(nn.Module):
    def __init__(self, num_features: int, momentum: float = 0.1):
        super().__init__()
        self.momentum = momentum
        # Register persistent buffer (saved in state_dict, not optimized by optimizer)
        self.register_buffer("running_mean", torch.zeros(num_features))
        self.register_buffer("num_batches_tracked", torch.tensor(0, dtype=torch.long))
        
        # Learnable affine parameters
        self.weight = nn.Parameter(torch.ones(num_features))
        self.bias = nn.Parameter(torch.zeros(num_features))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.training:
            batch_mean = x.mean(dim=0)
            self.running_mean.mul_(1.0 - self.momentum).add_(batch_mean * self.momentum)
            self.num_batches_tracked.add_(1)
            mean = batch_mean
        else:
            mean = self.running_mean
            
        return (x - mean) * self.weight + self.bias

layer = RunningExponentialMovingAverage(num_features=4)
x = torch.randn(8, 4)
layer.train()
out_train = layer(x)
layer.eval()
out_eval = layer(x)
print(f"Tracked batches: {layer.num_batches_tracked.item()}")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Modular Residual Block with Skip Connection & Zero-Init
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "day06_ch01_residual_block",
    "title": "Modular 2D Residual Block with Projection Shortcut",
    "difficulty": "Hard",
    "category": "Neural Network Architecture",
    "description": (
        "Implement a modular 2D Residual Block `ResidualBlock(nn.Module)` with 3x3 convolutions, "
        "Batch Normalization, ReLU activations, an automatic 1x1 projection shortcut when spatial stride > 1 "
        "or channel dimensions change, and Kaiming/Zero-gamma parameter initialization."
    ),
    "instructions": (
        "1. Implement `ResidualBlock(in_channels: int, out_channels: int, stride: int = 1)`.\n"
        "2. Architecture:\n"
        "   - `conv1`: `nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)`\n"
        "   - `bn1`: `nn.BatchNorm2d(out_channels)`\n"
        "   - `relu`: `nn.ReLU(inplace=True)`\n"
        "   - `conv2`: `nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1, bias=False)`\n"
        "   - `bn2`: `nn.BatchNorm2d(out_channels)`\n"
        "3. Shortcut Connection:\n"
        "   - If `stride != 1` or `in_channels != out_channels`: `shortcut` is `nn.Sequential(Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False), BatchNorm2d(out_channels))`.\n"
        "   - Else: `shortcut` is `nn.Identity()`.\n"
        "4. Forward pass:\n"
        "   - $F(x) = \\text{bn2}(\\text{conv2}(\\text{relu}(\\text{bn1}(\\text{conv1}(x)))))$\n"
        "   - $\\text{out} = \\text{relu}(F(x) + \\text{shortcut}(x))$\n"
        "5. Parameter Initialization:\n"
        "   - Apply `nn.init.kaiming_normal_(conv.weight, mode='fan_out', nonlinearity='relu')` to all Conv layers.\n"
        "   - Apply `nn.init.constant_(bn2.weight, 0.0)` so that $F(x)$ starts at 0."
    ),
    "starter_code": r'''import torch
import torch.nn as nn

class ResidualBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int = 1):
        super().__init__()
        # TODO: Define layers, shortcut, and zero-gamma initialization
        pass

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # TODO: Execute residual forward pass
        pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn

class ResidualBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int = 1):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.stride = stride
        
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )
        else:
            self.shortcut = nn.Identity()
            
        self._initialize_weights()

    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1.0)
                nn.init.constant_(m.bias, 0.0)
                
        # Zero-initialize the last BN in residual branch so residual branch starts at zero
        nn.init.constant_(self.bn2.weight, 0.0)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = self.shortcut(x)
        
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        
        out = self.conv2(out)
        out = self.bn2(out)
        
        out = out + residual
        out = self.relu(out)
        return out
''',
    "test_suite": r'''import torch
import torch.nn as nn

def run_tests(candidate_class):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Identity Shortcut (in_channels == out_channels, stride=1)
    block_same = candidate_class(in_channels=16, out_channels=16, stride=1)
    block_same.eval()
    
    x = torch.randn(4, 16, 32, 32)
    out_same = block_same(x)
    assert_test(out_same.shape == (4, 16, 32, 32), f"Expected shape (4, 16, 32, 32), got {out_same.shape}")
    
    # 2. Downsampling & Channel Expansion (stride=2)
    block_down = candidate_class(in_channels=16, out_channels=32, stride=2)
    block_down.eval()
    out_down = block_down(x)
    assert_test(out_down.shape == (4, 32, 16, 16), f"Expected downsampled shape (4, 32, 16, 16), got {out_down.shape}")
    
    # 3. Verify Zero-Initialization Heuristic
    # At initialization before training, with positive input, out_same should equal relu(x)
    assert_test(torch.allclose(block_same.bn2.weight, torch.zeros_like(block_same.bn2.weight)), "bn2.weight must be initialized to 0.0")

    return report
''',
    "hints": [
        "Create shortcut as `nn.Sequential(Conv2d(1x1), BatchNorm2d)` if `stride != 1 or in_channels != out_channels`.",
        "Remember to call `nn.init.kaiming_normal_` on conv weights and `nn.init.constant_(self.bn2.weight, 0.0)`.",
        "Add residual before final activation: `out = self.relu(out + residual)`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Robust Training Loop with Early Stopping & State Restoration
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "day06_ch02_robust_train_loop",
    "title": "Production Training Loop with Gradient Clipping & Early Stopping",
    "difficulty": "Hard",
    "category": "Training Optimization & Model Checkpointing",
    "description": (
        "Implement a complete, production-grade PyTorch training loop `train_model` that executes "
        "gradient clipping, learning rate scheduler updates, validation tracking, and early stopping "
        "with deepcopy checkpoint restoration of the optimal model weights."
    ),
    "instructions": (
        "1. Implement `train_model(model, train_loader, val_loader, criterion, optimizer, scheduler=None, epochs=10, max_grad_norm=1.0, patience=3, device='cpu') -> dict`.\n"
        "2. Training Phase per Epoch:\n"
        "   - Set `model.train()`.\n"
        "   - For each batch `(x, y)`: `optimizer.zero_grad()`, compute loss, `loss.backward()`.\n"
        "   - Apply `torch.nn.utils.clip_grad_norm_(model.parameters(), max_grad_norm)`.\n"
        "   - `optimizer.step()`.\n"
        "   - Track epoch training loss and accuracy.\n"
        "3. Validation Phase per Epoch:\n"
        "   - Set `model.eval()` with `torch.no_grad()`.\n"
        "   - Compute total validation loss and accuracy.\n"
        "4. Learning Rate Scheduler:\n"
        "   - If scheduler provided: step it (e.g. `scheduler.step(val_loss)` if `ReduceLROnPlateau`, else `scheduler.step()`).\n"
        "5. Early Stopping:\n"
        "   - Track best validation loss. When an improvement occurs, save `copy.deepcopy(model.state_dict())`.\n"
        "   - If no improvement for `patience` consecutive epochs, break early.\n"
        "6. Return history dictionary `{'train_loss': [...], 'val_loss': [...], 'train_acc': [...], 'val_acc': [...], 'best_val_loss': float, 'stopped_epoch': int}` and restore the best weights to `model`."
    ),
    "starter_code": r'''import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import Dict, Any, Optional
import copy

def train_model(
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    scheduler: Optional[Any] = None,
    epochs: int = 10,
    max_grad_norm: float = 1.0,
    patience: int = 3,
    device: str = "cpu"
) -> Dict[str, Any]:
    """
    Execute robust model training with gradient clipping, LR scheduling, and early stopping.
    """
    # TODO: Implement full production training loop
    pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import Dict, Any, Optional
import copy

def train_model(
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    scheduler: Optional[Any] = None,
    epochs: int = 10,
    max_grad_norm: float = 1.0,
    patience: int = 3,
    device: str = "cpu"
) -> Dict[str, Any]:
    model.to(device)
    
    history = {
        "train_loss": [],
        "val_loss": [],
        "train_acc": [],
        "val_acc": []
    }
    
    best_val_loss = float("inf")
    best_weights = copy.deepcopy(model.state_dict())
    patience_counter = 0
    stopped_epoch = epochs
    
    for epoch in range(1, epochs + 1):
        # 1. Training Pass
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0
        
        for x_b, y_b in train_loader:
            x_b, y_b = x_b.to(device), y_b.to(device)
            
            optimizer.zero_grad()
            outputs = model(x_b)
            loss = criterion(outputs, y_b)
            loss.backward()
            
            if max_grad_norm is not None and max_grad_norm > 0:
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_grad_norm)
                
            optimizer.step()
            
            running_loss += loss.item() * len(y_b)
            preds = outputs.argmax(dim=-1)
            correct_train += (preds == y_b).sum().item()
            total_train += len(y_b)
            
        epoch_train_loss = running_loss / max(1, total_train)
        epoch_train_acc = correct_train / max(1, total_train)
        history["train_loss"].append(float(epoch_train_loss))
        history["train_acc"].append(float(epoch_train_acc))
        
        # 2. Validation Pass
        model.eval()
        val_running_loss = 0.0
        correct_val = 0
        total_val = 0
        
        with torch.no_grad():
            for x_b, y_b in val_loader:
                x_b, y_b = x_b.to(device), y_b.to(device)
                outputs = model(x_b)
                loss = criterion(outputs, y_b)
                
                val_running_loss += loss.item() * len(y_b)
                preds = outputs.argmax(dim=-1)
                correct_val += (preds == y_b).sum().item()
                total_val += len(y_b)
                
        epoch_val_loss = val_running_loss / max(1, total_val)
        epoch_val_acc = correct_val / max(1, total_val)
        history["val_loss"].append(float(epoch_val_loss))
        history["val_acc"].append(float(epoch_val_acc))
        
        # 3. Learning Rate Scheduler
        if scheduler is not None:
            if isinstance(scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
                scheduler.step(epoch_val_loss)
            else:
                scheduler.step()
                
        # 4. Early Stopping Check
        if epoch_val_loss < best_val_loss - 1e-5:
            best_val_loss = epoch_val_loss
            best_weights = copy.deepcopy(model.state_dict())
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                stopped_epoch = epoch
                break

    # Restore best checkpoint weights
    model.load_state_dict(best_weights)
    
    history["best_val_loss"] = float(best_val_loss)
    history["stopped_epoch"] = stopped_epoch
    return history
''',
    "test_suite": r'''import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Synthetic Classification Task
    torch.manual_seed(42)
    X_train = torch.randn(100, 10)
    y_train = torch.randint(0, 2, (100,))
    X_val = torch.randn(40, 10)
    y_val = torch.randint(0, 2, (40,))
    
    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=16, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val), batch_size=16, shuffle=False)
    
    model = nn.Sequential(
        nn.Linear(10, 16),
        nn.ReLU(),
        nn.Linear(16, 2)
    )
    
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.CrossEntropyLoss()
    
    history = candidate_func(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        criterion=criterion,
        optimizer=optimizer,
        epochs=15,
        patience=4
    )
    
    assert_test(isinstance(history, dict), "Result must be a dictionary")
    assert_test("train_loss" in history, "train_loss missing")
    assert_test("val_loss" in history, "val_loss missing")
    assert_test("best_val_loss" in history, "best_val_loss missing")
    assert_test(len(history["train_loss"]) > 0, "No epochs recorded")
    assert_test(history["best_val_loss"] <= min(history["val_loss"]), "best_val_loss not matching minimum val loss")

    return report
''',
    "hints": [
        "In training loop, use `loss.backward()` followed by `torch.nn.utils.clip_grad_norm_(model.parameters(), max_grad_norm)`.",
        "Use `with torch.no_grad():` and `model.eval()` for validation passes.",
        "Store the best model weights via `copy.deepcopy(model.state_dict())` and restore with `model.load_state_dict(best_weights)`."
    ]
}

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": [CHALLENGE_1, CHALLENGE_2]
}

def get_curriculum() -> Dict[str, Any]:
    return CURRICULUM_DATA
