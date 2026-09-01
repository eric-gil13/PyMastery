"""
Part 2: PyTorch Autograd & Computational Graph Tape
PyMastery Progressive Zero-to-Hero PyTorch Curriculum
"""

import math
import torch
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "pytorch02",
    "day_number": 2,
    "title": "Part 2: Autograd & Computation Graphs",
    "tagline": "Master reverse-mode automatic differentiation, gradient accumulation, .backward(), and inference guards with torch.no_grad().",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "Dynamic Directed Acyclic Graph (DAG) construction during forward pass",
        "requires_grad=True and leaf vs non-leaf tensors",
        "Vector-Jacobian Products (VJP) and .backward() traversal",
        "Gradient accumulation and .grad attribute semantics",
        "Disabling graph tracking: torch.no_grad() vs .detach() for inference"
    ]
}

CONCEPT_PRIMER = r"""# Part 2 Concept Primer: PyTorch Autograd & Computational Graphs

## 1. What is Autograd?
Neural networks are trained via **gradient-based optimization** (e.g. Stochastic Gradient Descent, Adam). To update millions of weights, we need the partial derivative of the scalar loss $\mathcal{L}$ with respect to every single parameter $w_i$: $\frac{\partial \mathcal{L}}{\partial w_i}$.

Instead of manually deriving formulas or numerically approximating them with finite differences, PyTorch provides **Autograd**: an automatic differentiation engine that records a dynamic Directed Acyclic Graph (DAG) of all executed operations.

---

## 2. The Dynamic Computation Graph (DAG)
When you set `requires_grad=True` on a tensor:
1. PyTorch tracks every mathematical operation applied to it.
2. Each operation creates a backward graph node (recorded in `tensor.grad_fn`), such as `<AddBackward0>` or `<MulBackward0>`.
3. The graph is **dynamic** ("define-by-run"): it is constructed on-the-fly during the Python forward pass and discarded after backpropagation.

```
x (leaf, requires_grad=True) ──┐
                               ├──► [* Mul Node] ──► z ──┐
w (leaf, requires_grad=True) ──┘                         ├──► [+ Add Node] ──► Loss (L)
                                                         │
b (leaf, requires_grad=True) ────────────────────────────┘
```

---

## 3. Reverse-Mode Differentiation & `.backward()`
When you call `loss.backward()` on a scalar loss:
1. Autograd traverses the graph in reverse topological order (from Loss backwards to inputs).
2. It applies the **multivariable chain rule** using Vector-Jacobian Products (VJPs).
3. The computed gradients are accumulated into the `.grad` attribute of **leaf tensors**:
   $$w\text{.grad} = \frac{\partial \mathcal{L}}{\partial w}$$

> **Important:** Gradients **accumulate** by default (`param.grad += new_grad`). In training loops, you must explicitly zero gradients (`optimizer.zero_grad()` or `param.grad = None`) before each backward pass!

---

## 4. Inference Mode: `torch.no_grad()` vs `.detach()`
During model evaluation, validation, or live production inference, we do not need gradients:
* Tracking operations builds DAG nodes in memory, consuming VRAM.
* Autograd preserves intermediate activation tensors needed for the backward pass.

### `with torch.no_grad():`
A Python context manager that globally disables the autograd tape engine within its block.
* No graph is constructed.
* Operations execute faster and consume significantly less memory.
* Output tensors have `requires_grad=False` and `grad_fn=None`.

### `tensor.detach()`
Creates a new tensor that shares storage with the original tensor, but is **severed from the computation graph**.
* In-place modifications to detached tensors modify original memory, but backpropagation through the detached tensor is blocked.
"""

WALKTHROUGH = r"""# Part 2 Code Walkthrough: Autograd in Action

Let's compute gradients of a mathematical function and observe graph creation:

```python
import torch

# 1. Create leaf tensors with gradient tracking
x = torch.tensor(3.0, requires_grad=True)
w = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(1.0, requires_grad=True)

# 2. Forward pass: y = w * x + b
y = w * x + b  # 2.0 * 3.0 + 1.0 = 7.0
print("y:", y)
print("y.grad_fn:", y.grad_fn)  # <AddBackward0>

# 3. Compute loss: L = (y - 10)^2
loss = (y - 10.0) ** 2  # (7.0 - 10.0)^2 = 9.0
print("Loss:", loss)
print("Loss.grad_fn:", loss.grad_fn)  # <PowBackward0>

# 4. Backward pass: compute analytical derivatives
loss.backward()

# Analytical checks via chain rule:
# dL/dy = 2 * (y - 10) = 2 * (7 - 10) = -6
# dy/dw = x = 3.0 => dL/dw = -6 * 3 = -18.0
# dy/dx = w = 2.0 => dL/dx = -6 * 2 = -12.0
# dy/db = 1.0     => dL/db = -6 * 1 = -6.0

print("x.grad (dL/dx):", x.grad.item())  # -12.0
print("w.grad (dL/dw):", w.grad.item())  # -18.0
print("b.grad (dL/db):", b.grad.item())  # -6.0

# 5. Disabling autograd for inference
with torch.no_grad():
    y_test = w * x + b
    print("Inference y requires_grad?", y_test.requires_grad)  # False
    print("Inference y grad_fn:", y_test.grad_fn)              # None

# 6. Detaching a tensor
y_detached = y.detach()
print("Detached requires_grad?", y_detached.requires_grad)      # False
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Polynomial Gradient Calculator
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "torch-p2-c1",
    "title": "Polynomial Gradient Calculator",
    "difficulty": "Intermediate",
    "category": "Autograd & Graphs",
    "description": (
        "Compute exact partial derivatives of a multivariable polynomial function using PyTorch's "
        "reverse-mode autograd tape and verify them against analytical calculus."
    ),
    "instructions": (
        "Consider the multivariable polynomial function:\n"
        "   f(x, y, z) = a * x^3 + b * y^2 + c * x * z + d * z\n\n"
        "Write a function `compute_polynomial_gradients(x_val: float, y_val: float, z_val: float, "
        "a: float = 2.0, b: float = 3.0, c: float = 4.0, d: float = 5.0) -> dict` that:\n"
        "1. Creates scalar float32 PyTorch tensors for `x`, `y`, and `z` initialized with `x_val`, `y_val`, `z_val`, "
        "all with `requires_grad=True`.\n"
        "2. Computes the scalar value `loss` representing f(x, y, z).\n"
        "3. Executes backpropagation by calling `loss.backward()`.\n"
        "4. Extracts the analytical gradients from `x.grad`, `y.grad`, and `z.grad` as Python floats using `.item()`.\n"
        "5. Returns a dictionary containing:\n"
        "   `{\"loss\": float(loss.item()), \"grad_x\": float(x.grad.item()), \"grad_y\": float(y.grad.item()), \"grad_z\": float(z.grad.item()), \"has_grad\": True}`"
    ),
    "starter_code": r'''import torch

def compute_polynomial_gradients(
    x_val: float, 
    y_val: float, 
    z_val: float, 
    a: float = 2.0, 
    b: float = 3.0, 
    c: float = 4.0, 
    d: float = 5.0
) -> dict:
    """
    Compute polynomial loss and analytical gradients via PyTorch autograd.
    
    Args:
        x_val, y_val, z_val: Input coordinates
        a, b, c, d: Polynomial coefficients
        
    Returns:
        Dictionary with 'loss', 'grad_x', 'grad_y', 'grad_z', 'has_grad'
    """
    # TODO: Create leaf tensors with requires_grad=True, compute polynomial, run .backward()
    pass
''',
    "reference_solution": r'''import torch

def compute_polynomial_gradients(
    x_val: float, 
    y_val: float, 
    z_val: float, 
    a: float = 2.0, 
    b: float = 3.0, 
    c: float = 4.0, 
    d: float = 5.0
) -> dict:
    x = torch.tensor(float(x_val), dtype=torch.float32, requires_grad=True)
    y = torch.tensor(float(y_val), dtype=torch.float32, requires_grad=True)
    z = torch.tensor(float(z_val), dtype=torch.float32, requires_grad=True)
    
    loss = a * (x ** 3) + b * (y ** 2) + c * (x * z) + d * z
    loss.backward()
    
    return {
        "loss": float(loss.item()),
        "grad_x": float(x.grad.item()),
        "grad_y": float(y.grad.item()),
        "grad_z": float(z.grad.item()),
        "has_grad": bool(x.grad is not None and y.grad is not None and z.grad is not None),
    }
''',
    "test_suite": r'''import math
import torch

def run_tests(candidate_func=None):
    """Automated test harness for Polynomial Gradient Calculator (torch-p2-c1)."""
    if candidate_func is None:
        candidate_func = globals().get("compute_polynomial_gradients")
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard coordinates (x=1.0, y=2.0, z=3.0) with default coefficients (a=2, b=3, c=4, d=5)
    # f = 2*(1^3) + 3*(2^2) + 4*(1*3) + 5*(3) = 2 + 12 + 12 + 15 = 41.0
    # df/dx = 3*a*x^2 + c*z = 3*2*(1) + 4*(3) = 6 + 12 = 18.0
    # df/dy = 2*b*y = 2*3*(2) = 12.0
    # df/dz = c*x + d = 4*(1) + 5 = 9.0
    res = candidate_func(1.0, 2.0, 3.0)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    expected_keys = {"loss", "grad_x", "grad_y", "grad_z", "has_grad"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing keys: {expected_keys - set(res.keys())}")
    
    assert_test(math.isclose(res["loss"], 41.0, rel_tol=1e-5), f"Loss mismatch: expected 41.0, got {res['loss']}")
    assert_test(math.isclose(res["grad_x"], 18.0, rel_tol=1e-5), f"grad_x mismatch: expected 18.0, got {res['grad_x']}")
    assert_test(math.isclose(res["grad_y"], 12.0, rel_tol=1e-5), f"grad_y mismatch: expected 12.0, got {res['grad_y']}")
    assert_test(math.isclose(res["grad_z"], 9.0, rel_tol=1e-5), f"grad_z mismatch: expected 9.0, got {res['grad_z']}")
    assert_test(res["has_grad"] is True, "has_grad must be True")

    # Test 2: Custom coefficients and negative coordinates
    # x = -2.0, y = 3.0, z = 0.5, a = 1.0, b = 2.0, c = 3.0, d = -1.0
    # f = 1*(-8) + 2*(9) + 3*(-2 * 0.5) + (-1)*(0.5) = -8 + 18 - 3 - 0.5 = 6.5
    # df/dx = 3*1*(-2)^2 + 3*(0.5) = 12 + 1.5 = 13.5
    # df/dy = 2*2*(3) = 12.0
    # df/dz = 3*(-2) + (-1) = -6 - 1 = -7.0
    res2 = candidate_func(-2.0, 3.0, 0.5, a=1.0, b=2.0, c=3.0, d=-1.0)
    assert_test(math.isclose(res2["loss"], 6.5, rel_tol=1e-5), f"Loss mismatch: expected 6.5, got {res2['loss']}")
    assert_test(math.isclose(res2["grad_x"], 13.5, rel_tol=1e-5), f"grad_x mismatch: expected 13.5, got {res2['grad_x']}")
    assert_test(math.isclose(res2["grad_y"], 12.0, rel_tol=1e-5), f"grad_y mismatch: expected 12.0, got {res2['grad_y']}")
    assert_test(math.isclose(res2["grad_z"], -7.0, rel_tol=1e-5), f"grad_z mismatch: expected -7.0, got {res2['grad_z']}")

    return report
''',
    "hints": [
        "Initialize tensors with requires_grad=True: torch.tensor(float(x_val), dtype=torch.float32, requires_grad=True).",
        "Define the polynomial loss using standard Python operators: a * (x ** 3) + ...",
        "Call loss.backward() to propagate gradients back to inputs.",
        "Retrieve scalar values using .item() on tensor.grad."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: No-Grad Inference Guard
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "torch-p2-c2",
    "title": "No-Grad Inference Guard",
    "difficulty": "Intermediate",
    "category": "Autograd & Graphs",
    "description": (
        "Evaluate linear forward passes in training mode vs torch.no_grad() inference mode, "
        "and verify computational graph detachment with .detach()."
    ),
    "instructions": (
        "Write a function `evaluate_inference_no_grad(weights: torch.Tensor, bias: torch.Tensor, x: torch.Tensor) -> dict` that:\n"
        "1. Ensures that `weights` and `bias` have gradient tracking enabled (`requires_grad=True`).\n"
        "2. Executes a standard linear forward pass: `y_train = torch.matmul(x, weights) + bias`.\n"
        "3. Executes the exact same linear forward pass inside a `with torch.no_grad():` context manager: "
        "`y_infer = torch.matmul(x, weights) + bias`.\n"
        "4. Creates a detached tensor `y_detached = y_train.detach()`.\n"
        "5. Gathers graph metadata:\n"
        "   - `train_requires_grad`: bool flag of `y_train.requires_grad`\n"
        "   - `infer_requires_grad`: bool flag of `y_infer.requires_grad`\n"
        "   - `train_grad_fn`: bool flag indicating whether `y_train.grad_fn is not None`\n"
        "   - `infer_grad_fn`: bool flag indicating whether `y_infer.grad_fn is not None`\n"
        "   - `detached_requires_grad`: bool flag of `y_detached.requires_grad`\n"
        "6. Returns a dictionary containing:\n"
        "   `{\"y_train\": y_train, \"y_infer\": y_infer, \"y_detached\": y_detached, "
        "\"train_requires_grad\": train_requires_grad, \"infer_requires_grad\": infer_requires_grad, "
        "\"train_grad_fn\": train_grad_fn, \"infer_grad_fn\": infer_grad_fn, \"detached_requires_grad\": detached_requires_grad}`"
    ),
    "starter_code": r'''import torch

def evaluate_inference_no_grad(weights: torch.Tensor, bias: torch.Tensor, x: torch.Tensor) -> dict:
    """
    Compare training forward pass vs torch.no_grad() inference and .detach().
    
    Args:
        weights: Weight matrix tensor
        bias: Bias vector tensor
        x: Input feature tensor
        
    Returns:
        Dictionary with outputs and autograd tracking metadata
    """
    # TODO: Implement training pass, torch.no_grad() pass, detach, and inspect graph flags
    pass
''',
    "reference_solution": r'''import torch

def evaluate_inference_no_grad(weights: torch.Tensor, bias: torch.Tensor, x: torch.Tensor) -> dict:
    if not weights.requires_grad:
        weights.requires_grad_(True)
    if not bias.requires_grad:
        bias.requires_grad_(True)
        
    y_train = torch.matmul(x, weights) + bias
    
    with torch.no_grad():
        y_infer = torch.matmul(x, weights) + bias
        
    y_detached = y_train.detach()
    
    return {
        "y_train": y_train,
        "y_infer": y_infer,
        "y_detached": y_detached,
        "train_requires_grad": bool(y_train.requires_grad),
        "infer_requires_grad": bool(y_infer.requires_grad),
        "train_grad_fn": bool(y_train.grad_fn is not None),
        "infer_grad_fn": bool(y_infer.grad_fn is not None),
        "detached_requires_grad": bool(y_detached.requires_grad),
    }
''',
    "test_suite": r'''import torch

def run_tests(candidate_func=None):
    """Automated test harness for No-Grad Inference Guard (torch-p2-c2)."""
    if candidate_func is None:
        candidate_func = globals().get("evaluate_inference_no_grad")
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Forward pass evaluation with requires_grad tensors
    W = torch.tensor([[1.0, 2.0], [3.0, 4.0]], dtype=torch.float32, requires_grad=True)
    b = torch.tensor([0.5, -0.5], dtype=torch.float32, requires_grad=True)
    x = torch.tensor([[2.0, 1.0]], dtype=torch.float32)
    
    res = candidate_func(W, b, x)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    
    expected_keys = {
        "y_train", "y_infer", "y_detached",
        "train_requires_grad", "infer_requires_grad",
        "train_grad_fn", "infer_grad_fn", "detached_requires_grad"
    }
    assert_test(expected_keys.issubset(res.keys()), f"Missing keys: {expected_keys - set(res.keys())}")
    
    # Check numerical equality across all 3 outputs
    y_tr, y_inf, y_det = res["y_train"], res["y_infer"], res["y_detached"]
    assert_test(torch.allclose(y_tr, y_inf), "y_train and y_infer must be numerically equal")
    assert_test(torch.allclose(y_tr, y_det), "y_train and y_detached must be numerically equal")
    
    # Check autograd tracking flags
    assert_test(res["train_requires_grad"] is True, "train_requires_grad must be True")
    assert_test(res["train_grad_fn"] is True, "train_grad_fn must be True (has grad_fn)")
    assert_test(res["infer_requires_grad"] is False, "infer_requires_grad must be False in no_grad")
    assert_test(res["infer_grad_fn"] is False, "infer_grad_fn must be False in no_grad (no grad_fn)")
    assert_test(res["detached_requires_grad"] is False, "detached_requires_grad must be False")

    # Test 2: Verify backward pass works on y_train but fails on y_infer
    loss_tr = y_tr.sum()
    loss_tr.backward()
    assert_test(W.grad is not None, "W.grad must be populated after y_train backward pass")
    
    # Calling backward on y_infer should raise RuntimeError because requires_grad is False
    try:
        y_inf.sum().backward()
        assert_test(False, "Calling backward() on inference tensor must raise RuntimeError")
    except RuntimeError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Use weights.requires_grad_(True) to ensure gradient tracking.",
        "Perform forward inference inside with torch.no_grad():",
        "Use tensor.detach() to create a graph-severed view of a tensor.",
        "Inspect tensor.requires_grad and tensor.grad_fn is not None."
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
