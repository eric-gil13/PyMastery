"""
Part 3: Building Neural Network Modules with torch.nn
PyMastery Progressive Zero-to-Hero PyTorch Curriculum
"""

import torch
import torch.nn as nn
from typing import Dict, Any, List, Optional

DAY_METADATA = {
    "day_id": "pytorch03",
    "day_number": 3,
    "title": "Part 3: Building Neural Network Modules",
    "tagline": "Master nn.Module subclassing, linear layers, activation functions, and residual skip connections.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "Subclassing torch.nn.Module and calling super().__init__()",
        "Configuring trainable layers: nn.Linear weights and biases",
        "Non-linear activation functions: nn.ReLU, nn.Sigmoid, nn.GELU",
        "Defining the forward() computation graph pass",
        "Parameter inspection: model.parameters() and numel() counting",
        "Residual skip connections: y = F(x) + x for deep architectures"
    ]
}

CONCEPT_PRIMER = r"""# Part 3 Concept Primer: Building Neural Network Modules

## 1. The `torch.nn.Module` Base Class
In PyTorch, all neural network architectures—from simple linear regressions to 100-billion parameter transformers—are constructed by subclassing `torch.nn.Module`.

A custom `nn.Module` follows a strict, elegant 2-part contract:
1. **`__init__(self, ...)`:**
   - Always call `super().__init__()` first to initialize PyTorch's internal layer tracking.
   - Define and instantiate all submodules and learnable parameter layers (e.g. `nn.Linear`, `nn.Conv2d`, `nn.Dropout`).
2. **`forward(self, x, ...)`:**
   - Defines the dataflow through your layers.
   - Computes and returns the transformed output tensor.

```python
import torch
import torch.nn as nn

class MyFirstNetwork(nn.Module):
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.fc = nn.Linear(in_features, out_features)
        self.relu = nn.ReLU()
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.relu(self.fc(x))
```

> **Important:** Never call `model.forward(x)` directly in user code! Always call `model(x)`. Invoking `model(x)` executes PyTorch's `__call__` method, which properly registers forward pre-hooks, forward hooks, and profiler hooks.

---

## 2. Linear Layers (`nn.Linear`)
An `nn.Linear(in_features, out_features)` computes an affine transformation:
$$y = x A^T + b$$
* **Weight matrix ($W$):** Shape `(out_features, in_features)`
* **Bias vector ($b$):** Shape `(out_features,)`
* Total learnable parameters: `(in_features * out_features) + out_features`

```python
layer = nn.Linear(4, 2)
print("Weight shape:", layer.weight.shape)  # torch.Size([2, 4])
print("Bias shape:", layer.bias.shape)      # torch.Size([2])
```

---

## 3. Activation Functions
Without non-linear activations, stacking multiple linear layers collapses mathematically into a single linear transformation:
$$(x W_1 + b_1) W_2 + b_2 = x (W_1 W_2) + (b_1 W_2 + b_2) = x W_{\text{eff}} + b_{\text{eff}}$$
Non-linear activations allow networks to learn arbitrary, complex function approximations:
* **`nn.ReLU()`:** $\max(0, x)$. Fast, sparse, prevents vanishing gradients in positive domain.
* **`nn.Sigmoid()`:** $\frac{1}{1 + e^{-x}}$. Squashes inputs into $(0, 1)$ range, ideal for binary classification probabilities.
* **`nn.GELU()`:** Gaussian Error Linear Unit used in modern transformers (BERT, GPT).

---

## 4. Residual Skip Connections (ResNets)
As neural networks grow deeper (dozens or hundreds of layers), gradients diminish during backpropagation through repeated matrix multiplications, causing the **vanishing gradient problem**.

In 2015, He et al. introduced **Residual Networks (ResNet)**:
$$y = \mathcal{F}(x) + x$$
Rather than forcing layers to learn an unconstrained mapping $\mathcal{H}(x)$, the layers learn a residual perturbation $\mathcal{F}(x) = \mathcal{H}(x) - x$.
* The identity skip connection ($+ x$) creates an unimpeded gradient highway directly from loss back to early layers during backpropagation:
  $$\frac{\partial y}{\partial x} = \frac{\partial \mathcal{F}(x)}{\partial x} + \mathbf{I}$$
* Even if $\frac{\partial \mathcal{F}}{\partial x}$ vanishes to 0, the $+ \mathbf{I}$ identity term ensures strong gradient flow.
"""

WALKTHROUGH = r"""# Part 3 Code Walkthrough: Crafting Custom Modules & Residual Blocks

Let's build an MLP and a Residual Block, inspect parameters, and verify gradient flow:

```python
import torch
import torch.nn as nn

# 1. Defining a Multi-Layer Perceptron (MLP)
class TwoLayerMLP(nn.Module):
    def __init__(self, in_features: int, hidden_features: int, out_features: int):
        super().__init__()
        self.fc1 = nn.Linear(in_features, hidden_features)
        self.act = nn.ReLU()
        self.fc2 = nn.Linear(hidden_features, out_features)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = self.act(self.fc1(x))
        out = self.fc2(h)
        return out

# Instantiate model
mlp = TwoLayerMLP(in_features=8, hidden_features=16, out_features=4)
print("Model structure:\n", mlp)

# Parameter counting
total_params = sum(p.numel() for p in mlp.parameters() if p.requires_grad)
print(f"Total trainable parameters: {total_params}")
# fc1: 8*16 + 16 = 144
# fc2: 16*4 + 4 = 68
# Total = 212

# Forward pass with batch size 3
dummy_x = torch.randn(3, 8)
dummy_out = mlp(dummy_x)
print("Output shape:", dummy_out.shape)  # torch.Size([3, 4])

# 2. Residual Block with Identity Skip
class SimpleResBlock(nn.Module):
    def __init__(self, features: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(features, features),
            nn.ReLU(),
            nn.Linear(features, features)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x) + x  # Identity skip connection

res_block = SimpleResBlock(features=8)
x_res = torch.ones(2, 8, requires_grad=True)
y_res = res_block(x_res)
print("Residual output shape:", y_res.shape)

# Verify backward gradient flow through identity branch
loss = y_res.sum()
loss.backward()
print("Gradient on x_res arrived successfully:", x_res.grad is not None)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Multi-Layer Perceptron (MLP) Builder
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "torch-p3-c1",
    "title": "Multi-Layer Perceptron (MLP) Builder",
    "difficulty": "Intermediate",
    "category": "Neural Modules",
    "description": (
        "Construct a 2-layer Multi-Layer Perceptron (MLP) neural network by subclassing torch.nn.Module, "
        "incorporating linear projections and ReLU activation, and calculating trainable parameter counts."
    ),
    "instructions": (
        "1. Create a class `SimpleMLP(nn.Module)` with:\n"
        "   - `__init__(self, in_features: int, hidden_features: int, out_features: int)`:\n"
        "     Calls `super().__init__()` and initializes:\n"
        "       - `self.fc1 = nn.Linear(in_features, hidden_features)`\n"
        "       - `self.relu = nn.ReLU()`\n"
        "       - `self.fc2 = nn.Linear(hidden_features, out_features)`\n"
        "   - `forward(self, x: torch.Tensor) -> torch.Tensor`:\n"
        "     Computes `self.fc2(self.relu(self.fc1(x)))` and returns the output.\n\n"
        "2. Write a function `build_and_run_mlp(in_features: int, hidden_features: int, out_features: int, x: torch.Tensor) -> dict` that:\n"
        "   - Validates that `x.shape[-1] == in_features`. If not, raise `ValueError(\"Input feature dimension mismatch\")`.\n"
        "   - Instantiates `model = SimpleMLP(in_features, hidden_features, out_features)`.\n"
        "   - Executes forward pass: `output = model(x)`.\n"
        "   - Calculates total trainable parameter count: `param_count = sum(p.numel() for p in model.parameters() if p.requires_grad)`.\n"
        "   - Returns dictionary: `{\"model\": model, \"output\": output, \"param_count\": int(param_count), \"out_shape\": tuple(output.shape)}`."
    ),
    "starter_code": r'''import torch
import torch.nn as nn

class SimpleMLP(nn.Module):
    """
    Two-layer Multi-Layer Perceptron with ReLU activation.
    """
    def __init__(self, in_features: int, hidden_features: int, out_features: int):
        super().__init__()
        # TODO: Define fc1, relu, and fc2
        pass
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # TODO: Pass x through fc1 -> relu -> fc2
        pass

def build_and_run_mlp(in_features: int, hidden_features: int, out_features: int, x: torch.Tensor) -> dict:
    """
    Instantiate SimpleMLP, execute forward pass on x, and calculate parameter counts.
    
    Args:
        in_features: Dimension of input features
        hidden_features: Dimension of hidden layer
        out_features: Dimension of output predictions
        x: Input tensor of shape (..., in_features)
        
    Returns:
        Dictionary with 'model', 'output', 'param_count', 'out_shape'
    """
    # TODO: Validate input, create model, run forward pass, count parameters
    pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn

class SimpleMLP(nn.Module):
    def __init__(self, in_features: int, hidden_features: int, out_features: int):
        super().__init__()
        self.fc1 = nn.Linear(in_features, hidden_features)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_features, out_features)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.fc2(self.relu(self.fc1(x)))

def build_and_run_mlp(in_features: int, hidden_features: int, out_features: int, x: torch.Tensor) -> dict:
    if x.shape[-1] != in_features:
        raise ValueError(f"Input feature dimension mismatch: expected {in_features}, got {x.shape[-1]}")
        
    model = SimpleMLP(in_features, hidden_features, out_features)
    output = model(x)
    param_count = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    return {
        "model": model,
        "output": output,
        "param_count": int(param_count),
        "out_shape": tuple(output.shape),
    }
''',
    "test_suite": r'''import torch
import torch.nn as nn

def run_tests(candidate_func=None):
    """Automated test harness for Multi-Layer Perceptron Builder (torch-p3-c1)."""
    if candidate_func is None:
        candidate_func = globals().get("build_and_run_mlp")
    SimpleMLPClass = globals().get("SimpleMLP")
    
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Class architecture checks
    assert_test(issubclass(SimpleMLPClass, nn.Module), "SimpleMLP must subclass nn.Module")
    test_model = SimpleMLPClass(in_features=4, hidden_features=8, out_features=2)
    assert_test(isinstance(test_model.fc1, nn.Linear), "test_model.fc1 must be an nn.Linear instance")
    assert_test(isinstance(test_model.relu, nn.ReLU), "test_model.relu must be an nn.ReLU instance")
    assert_test(isinstance(test_model.fc2, nn.Linear), "test_model.fc2 must be an nn.Linear instance")

    # Test 2: Execution and parameter count verification
    # in=4, hidden=8, out=2:
    # fc1: 4*8 + 8 = 40
    # fc2: 8*2 + 2 = 18
    # Total = 58 parameters
    x_input = torch.randn(5, 4)  # batch size 5
    res = candidate_func(4, 8, 2, x_input)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    
    expected_keys = {"model", "output", "param_count", "out_shape"}
    assert_test(expected_keys.issubset(res.keys()), f"Missing keys: {expected_keys - set(res.keys())}")
    assert_test(res["param_count"] == 58, f"Parameter count mismatch: expected 58, got {res['param_count']}")
    assert_test(res["out_shape"] == (5, 2), f"Output shape mismatch: expected (5, 2), got {res['out_shape']}")
    assert_test(isinstance(res["output"], torch.Tensor), "output must be a torch.Tensor")

    # Test 3: Dimension mismatch validation
    try:
        invalid_x = torch.randn(5, 10)  # feature dim 10 != in_features 4
        candidate_func(4, 8, 2, invalid_x)
        assert_test(False, "Expected ValueError when input feature dimension mismatches")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Inherit from nn.Module and call super().__init__() first.",
        "Store layers as attributes on self: self.fc1, self.relu, self.fc2.",
        "In forward(self, x), chain the layers: self.fc2(self.relu(self.fc1(x))).",
        "Count parameters using sum(p.numel() for p in model.parameters() if p.requires_grad)."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Custom Residual Skip Module
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "torch-p3-c2",
    "title": "Custom Residual Skip Module",
    "difficulty": "Advanced",
    "category": "Neural Modules",
    "description": (
        "Build a deep learning residual block with an identity skip connection (y = F(x) + x) "
        "and projection shortcut, ensuring uninterrupted gradient propagation."
    ),
    "instructions": (
        "1. Create a class `ResidualBlock(nn.Module)` with:\n"
        "   - `__init__(self, in_features: int, out_features: Optional[int] = None)`:\n"
        "     Calls `super().__init__()`.\n"
        "     If `out_features is None`, sets `out_features = in_features`.\n"
        "     Defines the transformation branch F(x):\n"
        "       - `self.linear1 = nn.Linear(in_features, out_features)`\n"
        "       - `self.relu = nn.ReLU()`\n"
        "       - `self.linear2 = nn.Linear(out_features, out_features)`\n"
        "     Defines the shortcut connection:\n"
        "       - If `in_features == out_features`: `self.shortcut = nn.Identity()`\n"
        "       - If `in_features != out_features`: `self.shortcut = nn.Linear(in_features, out_features, bias=False)`\n"
        "   - `forward(self, x: torch.Tensor) -> torch.Tensor`:\n"
        "     Computes `fx = self.linear2(self.relu(self.linear1(x)))`\n"
        "     Returns `fx + self.shortcut(x)`.\n\n"
        "2. Write a function `build_residual_block(in_features: int, out_features: Optional[int] = None, x: Optional[torch.Tensor] = None) -> dict` that:\n"
        "   - Instantiates `block = ResidualBlock(in_features, out_features)`.\n"
        "   - If `x` is provided:\n"
        "     - Validates that `x.shape[-1] == in_features`, raising `ValueError(\"Dimension mismatch\")` otherwise.\n"
        "     - Evaluates `output = block(x)`.\n"
        "     - Verifies that `output` equals `block.linear2(block.relu(block.linear1(x))) + block.shortcut(x)`.\n"
        "   - Returns dictionary: `{\"block\": block, \"output\": output, \"residual_verified\": bool, \"out_shape\": tuple(output.shape) if output is not None else None}`."
    ),
    "starter_code": r'''import torch
import torch.nn as nn
from typing import Optional

class ResidualBlock(nn.Module):
    """
    Residual block with identity skip connection: y = F(x) + shortcut(x).
    """
    def __init__(self, in_features: int, out_features: Optional[int] = None):
        super().__init__()
        # TODO: Configure linear1, relu, linear2, and shortcut (Identity vs Linear)
        pass
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # TODO: Compute F(x) + shortcut(x)
        pass

def build_residual_block(in_features: int, out_features: Optional[int] = None, x: Optional[torch.Tensor] = None) -> dict:
    """
    Construct ResidualBlock and evaluate forward pass.
    """
    # TODO: Build block, evaluate on x if provided, verify residual property
    pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn
from typing import Optional

class ResidualBlock(nn.Module):
    def __init__(self, in_features: int, out_features: Optional[int] = None):
        super().__init__()
        if out_features is None:
            out_features = in_features
        self.in_features = in_features
        self.out_features = out_features
        
        self.linear1 = nn.Linear(in_features, out_features)
        self.relu = nn.ReLU()
        self.linear2 = nn.Linear(out_features, out_features)
        
        if in_features == out_features:
            self.shortcut = nn.Identity()
        else:
            self.shortcut = nn.Linear(in_features, out_features, bias=False)
            
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        fx = self.linear2(self.relu(self.linear1(x)))
        return fx + self.shortcut(x)

def build_residual_block(in_features: int, out_features: Optional[int] = None, x: Optional[torch.Tensor] = None) -> dict:
    if out_features is None:
        out_features = in_features
        
    block = ResidualBlock(in_features, out_features)
    
    output = None
    residual_verified = False
    if x is not None:
        if x.shape[-1] != in_features:
            raise ValueError(f"Input feature dimension {x.shape[-1]} != in_features {in_features}")
        output = block(x)
        expected_fx = block.linear2(block.relu(block.linear1(x)))
        expected_total = expected_fx + block.shortcut(x)
        residual_verified = bool(torch.allclose(output, expected_total, atol=1e-5))
        
    return {
        "block": block,
        "output": output,
        "residual_verified": residual_verified,
        "out_shape": tuple(output.shape) if output is not None else None,
    }
''',
    "test_suite": r'''import torch
import torch.nn as nn

def run_tests(candidate_func=None):
    """Automated test harness for Custom Residual Skip Module (torch-p3-c2)."""
    if candidate_func is None:
        candidate_func = globals().get("build_residual_block")
    ResidualBlockClass = globals().get("ResidualBlock")
    
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Identity shortcut when in_features == out_features
    b_same = ResidualBlockClass(in_features=16, out_features=16)
    assert_test(isinstance(b_same.shortcut, nn.Identity), "Shortcut must be nn.Identity when in_features == out_features")

    # Test 2: Linear projection shortcut when in_features != out_features
    b_diff = ResidualBlockClass(in_features=8, out_features=16)
    assert_test(isinstance(b_diff.shortcut, nn.Linear), "Shortcut must be nn.Linear when in_features != out_features")
    assert_test(b_diff.shortcut.bias is None, "Shortcut projection should have bias=False")

    # Test 3: Execution and residual property verification
    x_test = torch.randn(4, 16, requires_grad=True)
    res = candidate_func(in_features=16, out_features=16, x=x_test)
    assert_test(isinstance(res, dict), "Result must be a dictionary")
    assert_test(res["residual_verified"] is True, "Residual addition (fx + shortcut(x)) verification failed")
    assert_test(res["out_shape"] == (4, 16), f"Output shape mismatch: expected (4, 16), got {res['out_shape']}")

    # Test 4: Gradient flow through residual skip connection
    out = res["output"]
    loss = out.sum()
    loss.backward()
    assert_test(x_test.grad is not None, "Gradient must propagate back to input tensor x")
    assert_test(torch.all(x_test.grad != 0.0), "Gradients should be non-zero across all coordinates")

    # Test 5: Dimension mismatch handling
    try:
        candidate_func(in_features=16, out_features=16, x=torch.randn(4, 8))
        assert_test(False, "Expected ValueError when x feature dimension != in_features")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Use nn.Identity() for the shortcut when dimensions match.",
        "Use nn.Linear(in_features, out_features, bias=False) when dimensions differ.",
        "In forward(self, x), calculate fx and return fx + self.shortcut(x).",
        "Verify residual property with torch.allclose."
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
