"""
Day 5: PyTorch Computational Graphs & Custom Autograd Engines
PyMastery 7-Day Curriculum
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.autograd import Function, gradcheck
from typing import Dict, Any, List, Optional, Tuple

DAY_METADATA = {
    "day_id": "day05",
    "day_number": 5,
    "title": "Day 5: PyTorch Computational Graphs & Custom Autograd Engines",
    "tagline": "Master tensor memory layouts, the dynamic computation DAG, reverse-mode automatic differentiation, and custom autograd Functions with gradcheck.",
    "estimated_time": "3-4 hours",
    "concepts_covered": [
        "Tensor storage, strides, and memory sharing in PyTorch",
        "Dynamic Computation Graph (DAG) construction & reverse-mode AD (VJP)",
        "The Autograd tape engine & backward graph traversal",
        "Inplace operations and graph invalidation pitfalls",
        "Custom torch.autograd.Function (forward/backward contracts & ctx.save_for_backward)",
        "Numerical stability with log-sum-exp & mathematical gradcheck verification"
    ]
}

CONCEPT_PRIMER = r"""# Day 5 Concept Primer: PyTorch Autograd & Computational Graph DAG

## 1. Tensor Memory Layout & Strides
A PyTorch `torch.Tensor` is a view over an underlying 1D flat block of memory called a `Storage` (or `UntypedStorage`):
* `tensor.untyped_storage()`: Raw data memory buffer.
* `tensor.stride()`: Tuple of step sizes in memory to move 1 element along each dimension.
* `tensor.is_contiguous()`: `True` if elements are stored contiguously in standard row-major C order.

```python
x = torch.randn(3, 4)
# x.stride() -> (4, 1)
# x.T.stride() -> (1, 4)  (Shares same storage, non-contiguous!)
```

### In-Place Operations Pitfall
In-place mutations (e.g. `x += 1`, `x.relu_()`, `x[0] = 5`) modify the underlying storage directly. If a tensor was saved for backward computation by an active graph node, modifying it in-place **corrupts the autograd tape**, raising:
`RuntimeError: one of the variables needed for gradient computation has been modified by an inplace operation`

---

## 2. Dynamic Computation Graph (DAG) & Vector-Jacobian Products (VJP)
PyTorch implements **Reverse-Mode Automatic Differentiation**.

During the forward pass, every operation on tensors with `requires_grad=True` generates a `Node` (or `torch.autograd.Node` / `grad_fn`) in a directed acyclic graph:
* Leaves: Input tensors with `requires_grad=True` (parameters, weights).
* Edges: Data flow and mathematical operators.
* `grad_fn`: References the backward function and its predecessor nodes (`next_functions`).

```
  x (Leaf, requires_grad=True)
  │
  ▼
[ MulBackward0 ] (x * w) ◄─── w (Leaf, requires_grad=True)
  │
  ▼
[ AddBackward0 ] (+ b) ◄──── b (Leaf, requires_grad=True)
  │
  ▼
  y (Output)
```

During `.backward(grad_output)`:
Autograd traverses the DAG in topological reverse order, multiplying incoming gradients $\frac{\partial \mathcal{L}}{\partial y}$ with local Vector-Jacobian Products (VJP) via the chain rule:
$$\frac{\partial \mathcal{L}}{\partial x} = \frac{\partial \mathcal{L}}{\partial y} \cdot \mathbf{J}_f(x)$$

---

## 3. Custom `torch.autograd.Function` Protocol
To define a custom forward and backward pass in PyTorch C++ / CUDA / Python:

1. Subclass `torch.autograd.Function`.
2. Implement `@staticmethod forward(ctx, input, ...)`:
   - `ctx`: Context object used to store information for backward pass.
   - `ctx.save_for_backward(*tensors)`: Saves tensors needed for gradient calculation.
   - Returns output tensor(s).
3. Implement `@staticmethod backward(ctx, grad_output)`:
   - `ctx.saved_tensors`: Unpacks saved tensors.
   - Computes analytical gradients for each forward argument in exact positional order.
   - If an argument is non-tensor or non-differentiable (like an integer stride), return `None` for that position.

### Verifying with `torch.autograd.gradcheck`
`gradcheck` compares the analytical gradients returned by your `.backward()` against finite-difference numerical approximations:
$$\frac{\partial f}{\partial x_i} \approx \frac{f(x + \epsilon e_i) - f(x - \epsilon e_i)}{2\epsilon}$$
* Always use `torch.float64` (double precision) when running `gradcheck`.
"""

WALKTHROUGH = r"""# Day 5 Walkthrough: Authoring & Verifying a Custom Autograd Function

Let's derive and implement a custom Leaky ReLU activation from scratch:
$$f(x) = \begin{cases} x & \text{if } x > 0 \\ \alpha x & \text{if } x \le 0 \end{cases}, \quad \frac{\partial f}{\partial x} = \begin{cases} 1 & \text{if } x > 0 \\ \alpha & \text{if } x \le 0 \end{cases}$$

```python
import torch
from torch.autograd import Function, gradcheck

class CustomLeakyReLUFunction(Function):
    @staticmethod
    def forward(ctx, x: torch.Tensor, alpha: float = 0.01) -> torch.Tensor:
        ctx.alpha = alpha
        ctx.save_for_backward(x)
        return torch.where(x > 0, x, alpha * x)

    @staticmethod
    def backward(ctx, grad_output: torch.Tensor):
        x, = ctx.saved_tensors
        grad_x = torch.where(x > 0, 1.0, ctx.alpha) * grad_output
        # Return gradient for each forward input: (x, alpha)
        # Since alpha is a float, return None for alpha
        return grad_x, None

# Gradcheck verification with double precision
x_test = torch.randn(5, 5, dtype=torch.float64, requires_grad=True)
passed = gradcheck(CustomLeakyReLUFunction.apply, (x_test, 0.05), eps=1e-6, atol=1e-4)
print(f"LeakyReLU Gradcheck passed: {passed}")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Custom Parametric Swish (SiLU) with Gradcheck
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "day05_ch01_parametric_swish",
    "title": "Custom Parametric Swish (SiLU) with Analytical Gradients",
    "difficulty": "Hard",
    "category": "Autograd & Custom Operators",
    "description": (
        "Implement a custom autograd activation function `ParametricSwishFunction` and its `nn.Module` "
        "wrapper `ParametricSwish`. The function computes $f(x, \\beta) = x \\cdot \\sigma(\\beta x)$. "
        "Derive and implement exact analytical gradients for BOTH $x$ and the learnable scale parameter $\\beta$, "
        "ensuring mathematical precision verifiable by `torch.autograd.gradcheck`."
    ),
    "instructions": (
        "1. Derive mathematical gradients:\n"
        "   $$\\sigma(z) = \\frac{1}{1 + e^{-z}}$$\n"
        "   $$f(x, \\beta) = x \\cdot \\sigma(\\beta x)$$\n"
        "   $$\\frac{\\partial f}{\\partial x} = \\sigma(\\beta x) + \\beta x \\sigma(\\beta x)(1 - \\sigma(\\beta x)) = \\sigma(\\beta x)[1 + \\beta x(1 - \\sigma(\\beta x))]]$$\n"
        "   $$\\frac{\\partial f}{\\partial \\beta} = x^2 \\sigma(\\beta x)(1 - \\sigma(\\beta x))$$\n"
        "2. Implement `ParametricSwishFunction(torch.autograd.Function)`:\n"
        "   - `@staticmethod forward(ctx, x, beta)`: Saves necessary tensors via `ctx.save_for_backward`.\n"
        "   - `@staticmethod backward(ctx, grad_output)`: Computes and returns `(grad_x, grad_beta)`.\n"
        "   - Note: If $\\beta$ is a 1-element tensor or broadcasted scalar, ensure `grad_beta` is reduced (summed) to match $\\beta$'s original shape.\n"
        "3. Implement `ParametricSwish(nn.Module)`:\n"
        "   - `__init__(self, init_beta: float = 1.0)`: Registers `self.beta = nn.Parameter(torch.tensor(init_beta))`.\n"
        "   - `forward(self, x)`: Calls `ParametricSwishFunction.apply(x, self.beta)`.\n"
        "4. Pass `torch.autograd.gradcheck` using `float64`."
    ),
    "starter_code": r'''import torch
import torch.nn as nn
from torch.autograd import Function

class ParametricSwishFunction(Function):
    @staticmethod
    def forward(ctx, x: torch.Tensor, beta: torch.Tensor) -> torch.Tensor:
        # TODO: Forward pass and save tensors for backward
        pass

    @staticmethod
    def backward(ctx, grad_output: torch.Tensor):
        # TODO: Compute analytical grad_x and grad_beta
        pass

class ParametricSwish(nn.Module):
    def __init__(self, init_beta: float = 1.0):
        super().__init__()
        # TODO: Register learnable parameter beta
        pass

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # TODO: Apply custom function
        pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn
from torch.autograd import Function

class ParametricSwishFunction(Function):
    @staticmethod
    def forward(ctx, x: torch.Tensor, beta: torch.Tensor) -> torch.Tensor:
        # Compute sigmoid(beta * x)
        bx = beta * x
        sig_bx = torch.sigmoid(bx)
        out = x * sig_bx
        
        ctx.save_for_backward(x, beta, sig_bx)
        return out

    @staticmethod
    def backward(ctx, grad_output: torch.Tensor):
        x, beta, sig_bx = ctx.saved_tensors
        
        # d_sig = sig(bx) * (1 - sig(bx))
        d_sig = sig_bx * (1.0 - sig_bx)
        
        # df/dx = sig(bx) + beta * x * d_sig
        df_dx = sig_bx + beta * x * d_sig
        grad_x = grad_output * df_dx
        
        # df/dbeta = x^2 * d_sig
        df_dbeta = (x ** 2) * d_sig
        grad_beta = grad_output * df_dbeta
        
        # If beta is a scalar / smaller shape, sum gradients to match beta's shape
        if grad_beta.shape != beta.shape:
            # Sum over all broadcasted dimensions
            grad_beta = grad_beta.sum().view_as(beta)
            
        return grad_x, grad_beta

class ParametricSwish(nn.Module):
    def __init__(self, init_beta: float = 1.0):
        super().__init__()
        self.beta = nn.Parameter(torch.tensor(float(init_beta), dtype=torch.float32))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return ParametricSwishFunction.apply(x, self.beta)
''',
    "test_suite": r'''import torch
import torch.nn as nn
from torch.autograd import gradcheck

def run_tests(candidate_module):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Mathematical Gradcheck Verification (Float64)
    func_apply = candidate_module["ParametricSwishFunction"].apply
    
    x_test = torch.randn(4, 3, dtype=torch.float64, requires_grad=True)
    beta_test = torch.tensor(1.25, dtype=torch.float64, requires_grad=True)
    
    gradcheck_passed = gradcheck(func_apply, (x_test, beta_test), eps=1e-6, atol=1e-4)
    assert_test(gradcheck_passed, "Gradcheck failed for ParametricSwishFunction")
    
    # 2. Module Integration & Parameter Optimization
    model = candidate_module["ParametricSwish"](init_beta=0.5)
    optimizer = torch.optim.SGD(model.parameters(), lr=0.1)
    
    x = torch.randn(10, 5, requires_grad=False)
    target = torch.randn(10, 5)
    
    initial_beta = float(model.beta.item())
    
    # Train 5 steps
    for _ in range(5):
        optimizer.zero_grad()
        out = model(x)
        loss = nn.MSELoss()(out, target)
        loss.backward()
        optimizer.step()
        
    final_beta = float(model.beta.item())
    assert_test(initial_beta != final_beta, "Beta parameter was not updated during gradient descent")
    assert_test(not torch.isnan(model.beta).any(), "Beta contains NaN after training")

    return report
''',
    "hints": [
        "In `forward`, calculate `sig_bx = torch.sigmoid(beta * x)` and save `(x, beta, sig_bx)` in `ctx`.",
        "In `backward`, `df_dx = sig_bx + beta * x * sig_bx * (1.0 - sig_bx)` and `df_dbeta = (x ** 2) * sig_bx * (1.0 - sig_bx)`.",
        "Sum `grad_beta` if `beta` is a scalar: `grad_beta.sum().view_as(beta)`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Custom Numerically Stable Focal Loss
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "day05_ch02_focal_loss",
    "title": "Numerically Stable Binary Focal Loss Module",
    "difficulty": "Hard",
    "category": "Loss Functions & Numerical Stability",
    "description": (
        "Implement a numerically stable Binary Focal Loss `FocalLoss(nn.Module)` operating directly on raw "
        "unnormalized logits. The module must prevent underflow/overflow in log probabilities using log-sigmoid "
        "identities, support focusing parameter $\\gamma$, class weighting $\\alpha$, and `'mean'`, `'sum'`, `'none'` reductions."
    ),
    "instructions": (
        "1. Focal Loss formula:\n"
        "   $$\\text{FL}(p_t) = -\\alpha_t (1 - p_t)^\\gamma \\log(p_t)$$\n"
        "   Where for binary target $y \\in \\{0, 1\\}$:\n"
        "   - If $y=1$: $p_t = \\sigma(z)$, $\\alpha_t = \\alpha$\n"
        "   - If $y=0$: $p_t = 1 - \\sigma(z) = \\sigma(-z)$, $\\alpha_t = 1 - \\alpha$\n"
        "2. Numerical Stability via Log-Sigmoid:\n"
        "   - Use `F.logsigmoid(z)` for $\\log(\\sigma(z)) = -\\text{softplus}(-z)$.\n"
        "   - Use `F.logsigmoid(-z)` for $\\log(1 - \\sigma(z)) = -\\text{softplus}(z)$.\n"
        "   - Compute modulating factor $(1 - p_t)^\\gamma = (\\sigma(-z))^\\gamma$ for $y=1$ and $(\\sigma(z))^\\gamma$ for $y=0$.\n"
        "3. Implement `FocalLoss(gamma: float = 2.0, alpha: float = 0.25, reduction: str = 'mean')`:\n"
        "   - Handles extreme logits ($z = -100$ or $z = +100$) without returning `NaN` or `Inf`.\n"
        "   - Reduces loss according to `reduction` parameter (`'mean'`, `'sum'`, `'none'`).\n"
        "   - When $\\gamma = 0$ and $\\alpha = 0.5$, $2 \\times \\text{FL}$ matches standard `BCEWithLogitsLoss`."
    ),
    "starter_code": r'''import torch
import torch.nn as nn
import torch.nn.functional as F

class FocalLoss(nn.Module):
    def __init__(self, gamma: float = 2.0, alpha: float = 0.25, reduction: str = "mean"):
        super().__init__()
        self.gamma = gamma
        self.alpha = alpha
        self.reduction = reduction

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        Args:
            logits: Raw unnormalized predictions of shape (N, ...)
            targets: Binary ground truth labels (0.0 or 1.0) of shape (N, ...)
        """
        # TODO: Implement numerically stable Focal Loss
        pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn
import torch.nn.functional as F

class FocalLoss(nn.Module):
    def __init__(self, gamma: float = 2.0, alpha: float = 0.25, reduction: str = "mean"):
        super().__init__()
        if reduction not in ["mean", "sum", "none"]:
            raise ValueError(f"Unsupported reduction mode: {reduction}")
        self.gamma = gamma
        self.alpha = alpha
        self.reduction = reduction

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        # Ensure float tensors and matching shapes
        targets = targets.type_as(logits)
        
        # Stable log probabilities using logsigmoid
        # log(p) = logsigmoid(z), log(1-p) = logsigmoid(-z)
        log_p = F.logsigmoid(logits)
        log_1_minus_p = F.logsigmoid(-logits)
        
        # Probabilities for modulating factor
        # 1 - p = sigmoid(-z)
        # p = sigmoid(z)
        p = torch.sigmoid(logits)
        one_minus_p = torch.sigmoid(-logits)
        
        # Loss for positive class (y = 1): -alpha * (1 - p)^gamma * log_p
        pos_loss = -self.alpha * (one_minus_p ** self.gamma) * log_p
        
        # Loss for negative class (y = 0): -(1 - alpha) * p^gamma * log_1_minus_p
        neg_loss = -(1.0 - self.alpha) * (p ** self.gamma) * log_1_minus_p
        
        # Select loss based on target
        loss = targets * pos_loss + (1.0 - targets) * neg_loss
        
        if self.reduction == "mean":
            return loss.mean()
        elif self.reduction == "sum":
            return loss.sum()
        else:
            return loss
''',
    "test_suite": r'''import torch
import torch.nn as nn
import torch.nn.functional as F

def run_tests(candidate_module):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    focal_class = candidate_module["FocalLoss"] if isinstance(candidate_module, dict) else candidate_module
    
    # 1. Extreme Logits Stability Test (No NaN / Inf)
    loss_fn = focal_class(gamma=2.0, alpha=0.25, reduction="mean")
    extreme_logits = torch.tensor([-1000.0, -100.0, 0.0, 100.0, 1000.0], dtype=torch.float32)
    extreme_targets = torch.tensor([0.0, 1.0, 1.0, 0.0, 1.0], dtype=torch.float32)
    
    loss_val = loss_fn(extreme_logits, extreme_targets)
    assert_test(not torch.isnan(loss_val), "Loss returned NaN on extreme logits")
    assert_test(not torch.isinf(loss_val), "Loss returned Inf on extreme logits")
    assert_test(loss_val >= 0.0, f"Loss must be non-negative, got {loss_val.item()}")
    
    # 2. Reduction Modes Test
    logits = torch.randn(8, 4, requires_grad=True)
    targets = torch.randint(0, 2, (8, 4)).float()
    
    fn_none = focal_class(gamma=2.0, alpha=0.5, reduction="none")
    loss_none = fn_none(logits, targets)
    assert_test(loss_none.shape == (8, 4), f"Reduction 'none' shape mismatch: {loss_none.shape}")
    
    fn_sum = focal_class(gamma=2.0, alpha=0.5, reduction="sum")
    assert_test(torch.isclose(fn_sum(logits, targets), loss_none.sum()), "Reduction 'sum' mismatch")
    
    # 3. Equivalence to BCE when gamma=0 and alpha=0.5
    fn_gamma0 = focal_class(gamma=0.0, alpha=0.5, reduction="mean")
    bce = nn.BCEWithLogitsLoss(reduction="mean")
    
    # When alpha=0.5 and gamma=0, focal_loss = 0.5 * BCE
    assert_test(torch.allclose(fn_gamma0(logits, targets) * 2.0, bce(logits, targets), atol=1e-5), "Gamma=0 Focal loss did not match BCE")

    return report
''',
    "hints": [
        "Use `F.logsigmoid(logits)` for $\\log(p)$ and `F.logsigmoid(-logits)` for $\\log(1 - p)$ to avoid NaN.",
        "Modulating factor for $y=1$ is `torch.sigmoid(-logits) ** gamma`.",
        "Compute `pos_loss = -alpha * ((1 - p) ** gamma) * log_p` and `neg_loss = -(1 - alpha) * (p ** gamma) * log_1_minus_p`."
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
