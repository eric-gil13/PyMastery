"""
Part 4: Loss Functions & Optimizers in PyTorch
PyMastery Progressive Zero-to-Hero PyTorch Curriculum
"""

import torch
import torch.nn as nn
import torch.optim as optim
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "pytorch04",
    "day_number": 4,
    "title": "Part 4: Loss Functions & Optimizers",
    "tagline": "Master MSE, Cross-Entropy with logits, gradient descent mechanics, Adam optimizers, and parameter updates.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "Regression objective: Mean Squared Error (nn.MSELoss)",
        "Classification objective: Multi-class Cross-Entropy on raw logits (nn.CrossEntropyLoss)",
        "Logits vs Softmax probabilities and numerical stability (log-sum-exp trick)",
        "Stochastic Gradient Descent (SGD) with momentum vs Adam adaptive moments",
        "The canonical 5-step training update loop: zero_grad -> forward -> loss -> backward -> step"
    ]
}

CONCEPT_PRIMER = r"""# Part 4 Concept Primer: Loss Functions & Optimizers

## 1. The Loss Function: Quantifying Prediction Error
To train a neural network, we must quantify how far its predictions are from ground-truth targets. The scalar value produced by a loss function $\mathcal{L}(\hat{y}, y)$ acts as the guiding objective for optimization.

### Regression: Mean Squared Error (`nn.MSELoss`)
For continuous numeric predictions (e.g. house prices, coordinates, sensor readings):
$$\mathcal{L}_{\text{MSE}}(\hat{y}, y) = \frac{1}{N} \sum_{i=1}^N (\hat{y}_i - y_i)^2$$
Penalizes larger prediction errors quadratically.

### Multi-Class Classification: Cross-Entropy (`nn.CrossEntropyLoss`)
For predicting discrete categorical classes (e.g. image classification, language token prediction):
$$\mathcal{L}_{\text{CE}}(\mathbf{z}, y) = -\log \left( \frac{e^{z_y}}{\sum_{j} e^{z_j}} \right) = -z_y + \log \left( \sum_{j} e^{z_j} \right)$$
where $\mathbf{z}$ are raw, unnormalized model outputs called **logits**, and $y$ is the ground-truth class index.

> **Crucial PyTorch Design Choice:** `nn.CrossEntropyLoss` combines `nn.LogSoftmax` and `nn.NLLLoss` into a single, fused operation. **Never pass softmax probabilities into `nn.CrossEntropyLoss`!** Always pass raw unnormalized logits directly. Fusing softmax into the loss utilizes the numerically stable log-sum-exp formulation, preventing floating-point underflow/overflow.

---

## 2. Optimizers: Updating Model Weights
Once gradients $\nabla_\theta \mathcal{L}$ are calculated via `.backward()`, the optimizer adjusts model parameters $\theta$ to reduce the loss.

### Stochastic Gradient Descent (`torch.optim.SGD`)
$$\theta_{t+1} = \theta_t - \eta \cdot \nabla_\theta \mathcal{L}$$
where $\eta$ is the learning rate. Simple and effective, but can oscillate in saddle points without momentum.

### Adam: Adaptive Moment Estimation (`torch.optim.Adam`)
Adam computes individual adaptive learning rates for each parameter by maintaining exponentially decaying averages of past gradients ($m_t$, first moment) and squared gradients ($v_t$, second moment):
$$m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t, \quad v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2$$
$$\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon} \hat{m}_t$$
Adam is robust to sparse gradients, handles diverse parameter scales effortlessly, and is the default optimizer for deep learning.

---

## 3. The Canonical 5-Step Optimization Step
Every supervised training step in PyTorch follows the exact same 5-step rhythm:

```python
# 1. Zero out old accumulated gradients
optimizer.zero_grad()

# 2. Forward pass: compute predictions from model
predictions = model(inputs)

# 3. Compute scalar loss
loss = criterion(predictions, targets)

# 4. Backward pass: compute dLoss/dWeight
loss.backward()

# 5. Optimizer step: update weights using gradients
optimizer.step()
```
"""

WALKTHROUGH = r"""# Part 4 Code Walkthrough: Losses, Optimizers, and the Training Step

Let's evaluate regression and classification losses and execute an optimization step:

```python
import torch
import torch.nn as nn
import torch.optim as optim

# 1. Regression with MSELoss
mse_criterion = nn.MSELoss()
pred_reg = torch.tensor([[2.5], [4.0]], requires_grad=True)
target_reg = torch.tensor([[3.0], [4.0]])
mse_val = mse_criterion(pred_reg, target_reg)
print("MSE Loss:", mse_val.item())  # ((2.5 - 3.0)^2 + 0) / 2 = 0.25 / 2 = 0.125

# 2. Classification with CrossEntropyLoss (Raw Logits!)
ce_criterion = nn.CrossEntropyLoss()
# Batch of 2 samples, 3 classes:
logits = torch.tensor([[2.0, 1.0, 0.1], [0.5, 3.2, 0.1]], requires_grad=True)
labels = torch.tensor([0, 1])  # Target classes: class 0 for sample 1, class 1 for sample 2
ce_val = ce_criterion(logits, labels)
print("Cross Entropy Loss:", ce_val.item())

# Extract probabilities and predicted classes
probs = torch.softmax(logits, dim=-1)
predicted_classes = torch.argmax(logits, dim=-1)
print("Predicted probabilities:\n", probs)
print("Predicted classes:", predicted_classes)

# 3. Single-step Parameter Update with Adam
model = nn.Linear(3, 1)
optimizer = optim.Adam(model.parameters(), lr=0.05)

x = torch.randn(4, 3)
target = torch.randn(4, 1)

# Step 1: Zero gradients
optimizer.zero_grad()
# Step 2: Forward
out = model(x)
# Step 3: Loss
loss = mse_criterion(out, target)
print("Loss before step:", loss.item())
# Step 4: Backward
loss.backward()
# Step 5: Step
optimizer.step()

# Re-evaluate
out_new = model(x)
loss_new = mse_criterion(out_new, target)
print("Loss after step:", loss_new.item())
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Classification & Regression Loss Evaluator
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "torch-p4-c1",
    "title": "Classification & Regression Loss Evaluator",
    "difficulty": "Intermediate",
    "category": "Loss Functions & Optimizers",
    "description": (
        "Compute mean squared error loss for continuous targets and cross-entropy loss on raw logits "
        "for multi-class classification, extracting probabilities and discrete predictions."
    ),
    "instructions": (
        "Write a function `evaluate_losses(pred_reg: torch.Tensor, target_reg: torch.Tensor, "
        "logits_cls: torch.Tensor, target_cls: torch.Tensor) -> dict` that:\n"
        "1. Validates regression shape compatibility: `pred_reg.shape == target_reg.shape`. "
        "If mismatched, raise `ValueError(\"Regression predictions and targets must have matching shapes\")`.\n"
        "2. Validates classification batch dimensions: `logits_cls.shape[0] == target_cls.shape[0]`. "
        "If mismatched, raise `ValueError(\"Classification batch dimensions must match\")`.\n"
        "3. Computes mean squared error loss (`mse_loss`) between continuous predictions `pred_reg` and targets `target_reg`.\n"
        "4. Computes cross-entropy loss (`ce_loss`) between unnormalized classification logits `logits_cls` and target class labels `target_cls`.\n"
        "5. Computes predicted class probabilities along the class dimension as `probs`.\n"
        "6. Computes predicted discrete class indices along the class dimension as `preds`.\n"
        "7. Returns a dictionary containing:\n"
        "   `{\"mse_loss\": float(mse_loss.item()), \"ce_loss\": float(ce_loss.item()), \"probabilities\": probs, \"predicted_classes\": preds}`"
    ),
    "starter_code": r'''import torch
import torch.nn as nn

def evaluate_losses(
    pred_reg: torch.Tensor, 
    target_reg: torch.Tensor, 
    logits_cls: torch.Tensor, 
    target_cls: torch.Tensor
) -> dict:
    """
    Compute MSE regression loss and Cross-Entropy classification loss.
    
    Args:
        pred_reg: Continuous regression predictions
        target_reg: Continuous ground-truth targets
        logits_cls: Unnormalized classification logits (B, C)
        target_cls: Ground-truth class index labels (B,)
        
    Returns:
        Dictionary with 'mse_loss', 'ce_loss', 'probabilities', 'predicted_classes'
    """
    # TODO: Validate shapes, compute regression and classification losses, extract probabilities and predictions
    pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn

def evaluate_losses(
    pred_reg: torch.Tensor, 
    target_reg: torch.Tensor, 
    logits_cls: torch.Tensor, 
    target_cls: torch.Tensor
) -> dict:
    if pred_reg.shape != target_reg.shape:
        raise ValueError("Regression predictions and targets must have matching shapes")
        
    if logits_cls.shape[0] != target_cls.shape[0]:
        raise ValueError("Classification batch dimensions must match")
        
    mse_criterion = nn.MSELoss()
    ce_criterion = nn.CrossEntropyLoss()
    
    mse_loss = mse_criterion(pred_reg, target_reg)
    ce_loss = ce_criterion(logits_cls, target_cls)
    
    probs = torch.softmax(logits_cls, dim=-1)
    preds = torch.argmax(logits_cls, dim=-1)
    
    return {
        "mse_loss": float(mse_loss.item()),
        "ce_loss": float(ce_loss.item()),
        "probabilities": probs,
        "predicted_classes": preds,
    }
''',
    "test_suite": r'''import math
import torch
import torch.nn as nn

def run_tests(candidate_func=None):
    """Automated test harness for Classification & Regression Loss Evaluator (torch-p4-c1)."""
    if candidate_func is None:
        candidate_func = globals().get("evaluate_losses")
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard regression & classification evaluation
    p_reg = torch.tensor([[1.0], [3.0]], dtype=torch.float32)
    t_reg = torch.tensor([[1.0], [5.0]], dtype=torch.float32)
    # MSE: ((1-1)^2 + (3-5)^2) / 2 = (0 + 4) / 2 = 2.0
    
    logits = torch.tensor([[5.0, 1.0, 0.0], [0.1, 4.0, 0.2]], dtype=torch.float32)
    labels = torch.tensor([0, 1], dtype=torch.long)
    
    res = candidate_func(p_reg, t_reg, logits, labels)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    expected_keys = {"mse_loss", "ce_loss", "probabilities", "predicted_classes"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing keys: {expected_keys - set(res.keys())}")
    
    assert_test(math.isclose(res["mse_loss"], 2.0, rel_tol=1e-5), f"MSE Loss mismatch: expected 2.0, got {res['mse_loss']}")
    assert_test(isinstance(res["ce_loss"], float) and res["ce_loss"] >= 0.0, "ce_loss must be a non-negative float")
    
    # Verify probabilities sum to 1.0 along class dimension
    probs = res["probabilities"]
    assert_test(torch.allclose(probs.sum(dim=-1), torch.ones(2)), "Probabilities must sum to 1.0 along class dimension")
    
    # Verify argmax predictions
    preds = res["predicted_classes"]
    assert_test(torch.equal(preds, torch.tensor([0, 1])), f"Predictions mismatch: expected [0, 1], got {preds}")

    # Test 2: Regression shape mismatch validation
    try:
        candidate_func(torch.tensor([1.0]), torch.tensor([1.0, 2.0]), logits, labels)
        assert_test(False, "Expected ValueError on regression shape mismatch")
    except ValueError:
        report["tests_run"] += 1

    # Test 3: Classification batch mismatch validation
    try:
        candidate_func(p_reg, t_reg, logits, torch.tensor([0, 1, 2], dtype=torch.long))
        assert_test(False, "Expected ValueError on classification batch size mismatch")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Use nn.MSELoss()(pred_reg, target_reg) for regression.",
        "Pass raw unnormalized logits directly into nn.CrossEntropyLoss()(logits_cls, target_cls).",
        "Compute probabilities with torch.softmax(logits_cls, dim=-1).",
        "Compute class labels with torch.argmax(logits_cls, dim=-1)."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Single-Step Parameter Update Optimizer
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "torch-p4-c2",
    "title": "Single-Step Parameter Update Optimizer",
    "difficulty": "Advanced",
    "category": "Loss Functions & Optimizers",
    "description": (
        "Execute the canonical optimization update cycle (clear previous gradients, compute forward pass, "
        "evaluate loss, backpropagate error, and update parameters) using the Adam optimizer, and verify weight parameter mutations."
    ),
    "instructions": (
        "Write a function `single_step_adam_update(model: nn.Module, x: torch.Tensor, target: torch.Tensor, lr: float = 0.01) -> dict` that:\n"
        "1. Validates that `lr > 0`. If not, raise `ValueError(\"Learning rate must be positive\")`.\n"
        "2. Instantiates an Adam optimizer configured for the model's parameters with learning rate `lr`.\n"
        "3. Captures a detached clone of all initial model parameters for later comparison.\n"
        "4. Executes the canonical optimization update cycle:\n"
        "   - Clears previous parameter gradients\n"
        "   - Computes model predictions on `x` as `output`\n"
        "   - Evaluates mean squared error loss against `target` as `loss`\n"
        "   - Backpropagates error to compute gradients\n"
        "   - Records the Euclidean norm of each parameter gradient as Python floats in `grad_norms`\n"
        "   - Updates model parameters via the optimizer\n"
        "5. Checks whether model parameters were successfully updated compared to their initial snapshot, recording boolean `params_updated`.\n"
        "6. Returns a dictionary containing:\n"
        "   `{\"initial_loss\": float(loss.item()), \"optimizer\": optimizer, \"params_updated\": bool(params_updated), \"grad_norms\": grad_norms}`"
    ),
    "starter_code": r'''import torch
import torch.nn as nn
import torch.optim as optim

def single_step_adam_update(
    model: nn.Module, 
    x: torch.Tensor, 
    target: torch.Tensor, 
    lr: float = 0.01
) -> dict:
    """
    Execute single optimization step with Adam optimizer and verify weight updates.
    
    Args:
        model: Neural network module
        x: Input tensor
        target: Target tensor
        lr: Learning rate
        
    Returns:
        Dictionary with 'initial_loss', 'optimizer', 'params_updated', 'grad_norms'
    """
    # TODO: Validate lr, configure Adam, execute canonical update cycle, and verify parameter updates
    pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn
import torch.optim as optim

def single_step_adam_update(
    model: nn.Module, 
    x: torch.Tensor, 
    target: torch.Tensor, 
    lr: float = 0.01
) -> dict:
    if lr <= 0:
        raise ValueError("Learning rate must be positive")
        
    optimizer = optim.Adam(model.parameters(), lr=lr)
    initial_params = [p.clone().detach() for p in model.parameters()]
    
    # 1. Zero gradients
    optimizer.zero_grad()
    
    # 2. Forward pass
    output = model(x)
    
    # 3. Loss computation
    loss_fn = nn.MSELoss()
    loss = loss_fn(output, target)
    
    # 4. Backward pass
    loss.backward()
    grad_norms = [float(p.grad.norm().item()) for p in model.parameters() if p.grad is not None]
    
    # 5. Optimizer step
    optimizer.step()
    
    params_updated = any(not torch.equal(p, init_p) for p, init_p in zip(model.parameters(), initial_params))
    
    return {
        "initial_loss": float(loss.item()),
        "optimizer": optimizer,
        "params_updated": bool(params_updated),
        "grad_norms": grad_norms,
    }
''',
    "test_suite": r'''import torch
import torch.nn as nn
import torch.optim as optim

def run_tests(candidate_func=None):
    """Automated test harness for Single-Step Adam Optimizer Update (torch-p4-c2)."""
    if candidate_func is None:
        candidate_func = globals().get("single_step_adam_update")
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard linear model optimization step
    torch.manual_seed(42)
    model = nn.Linear(3, 1)
    x = torch.randn(4, 3)
    target = torch.randn(4, 1)
    
    res = candidate_func(model, x, target, lr=0.05)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    expected_keys = {"initial_loss", "optimizer", "params_updated", "grad_norms"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing keys: {expected_keys - set(res.keys())}")
    
    assert_test(res["params_updated"] is True, "Model parameters must be updated after optimizer.step()")
    assert_test(isinstance(res["optimizer"], optim.Adam), "Optimizer must be an instance of torch.optim.Adam")
    assert_test(len(res["grad_norms"]) > 0, "Gradient norms list must not be empty")
    assert_test(all(gn >= 0.0 for gn in res["grad_norms"]), "Gradient norms must be non-negative")

    # Test 2: Invalid non-positive learning rate raises ValueError
    try:
        candidate_func(model, x, target, lr=-0.01)
        assert_test(False, "Expected ValueError when lr <= 0")
    except ValueError:
        report["tests_run"] += 1

    try:
        candidate_func(model, x, target, lr=0.0)
        assert_test(False, "Expected ValueError when lr == 0")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Check lr > 0 and raise ValueError otherwise.",
        "Configure Adam via torch.optim.Adam(model.parameters(), lr=lr).",
        "Follow the 5-step training rhythm: zero_grad() -> forward -> loss -> backward() -> step().",
        "Compare model.parameters() with initial cloned snapshots to confirm update."
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
