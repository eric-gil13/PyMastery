"""
Part 7: Real-World Deep Learning Architectures
PyMastery Progressive Zero-to-Hero PyTorch Curriculum
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any, List, Optional, Tuple

DAY_METADATA = {
    "day_id": "pytorch07",
    "day_number": 7,
    "title": "Part 7: Real-World Deep Learning Architectures",
    "tagline": "Build production-grade CNNs and Multi-Head Attention Transformers with parameter management and serialization.",
    "estimated_time": "3-4 hours",
    "concepts_covered": [
        "2D Convolutions: nn.Conv2d receptive fields, padding, stride, and spatial dimensions",
        "Spatial downsampling with nn.MaxPool2d and stability with nn.BatchNorm2d",
        "Adaptive spatial pooling (nn.AdaptiveAvgPool2d) and feature flattening for linear heads",
        "Scaled Dot-Product Attention: Query, Key, and Value interactions",
        "Transformer Multi-Head Attention with nn.MultiheadAttention, residual skips, and LayerNorm",
        "Model serialization and weight checkpointing: torch.save and torch.load"
    ]
}

CONCEPT_PRIMER = r"""# Part 7 Concept Primer: Real-World Deep Learning Architectures

## 1. Convolutional Neural Networks (CNNs)
While standard Linear (`nn.Linear`) layers treat input features as a flat 1D vector, real-world data like images, audio spectrograms, and spatial grids have strong **2D spatial locality**:
* Nearby pixels are correlated.
* Visual features (edges, textures, shapes) are translationally invariant (a cat is still a cat whether in the top-left or bottom-right corner).

A fully connected layer on a $256 \times 256 \times 3$ image would require over 196,000 weights per neuron. A Convolutional Layer solves this through **local receptive fields** and **weight sharing**.

### Anatomy of `nn.Conv2d`
```python
conv = nn.Conv2d(
    in_channels=3,     # RGB channels
    out_channels=32,   # Number of learned feature filters
    kernel_size=3,     # 3x3 filter window
    stride=1,          # Step size across spatial dimensions
    padding=1          # Zero-padding around edges
)
```

### Spatial Dimension Arithmetic
Given input height $H_{in}$, kernel size $K$, padding $P$, and stride $S$, the output height $H_{out}$ is:
$$H_{out} = \left\lfloor \frac{H_{in} - K + 2P}{S} \right\rfloor + 1$$

* When $K=3, P=1, S=1$: $H_{out} = H_{in}$ (same spatial dimensions).
* When $K=2, P=0, S=2$ (or `nn.MaxPool2d(2)`): $H_{out} = \lfloor H_{in} / 2 \rfloor$ (halves spatial dimensions).

### The Modern CNN Block Pattern
Standard vision architectures (VGG, ResNet, EfficientNet) stack repeating convolutional blocks:
1. **`nn.Conv2d`**: Spatial feature extraction.
2. **`nn.BatchNorm2d`**: Normalizes activations across the batch, accelerating training and stabilizing gradients.
3. **`nn.ReLU`**: Non-linear thresholding ($f(x) = \max(0, x)$).
4. **`nn.MaxPool2d`**: Reduces spatial footprint and increases the effective receptive field.
5. **`nn.AdaptiveAvgPool2d((1, 1))`**: Collapses any spatial grid $(H, W)$ down to $(1, 1)$, creating fixed-length feature vectors regardless of input resolution.
6. **`nn.Flatten()` + `nn.Linear()`**: Classification head predicting class logits.

---

## 2. Multi-Head Attention & Transformer Foundations
While CNNs excel at local spatial features, Transformers use **Self-Attention** to model relationships between any two tokens in a sequence regardless of their distance.

### Scaled Dot-Product Attention
Given Query ($Q$), Key ($K$), and Value ($V$) matrices derived from sequence tokens:
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V$$

1. **Similarity Scores ($Q K^T$):** Computes how much token $i$ attends to token $j$.
2. **Scaling Factor ($\sqrt{d_k}$):** Divides by the square root of key dimension to prevent softmax gradients from vanishing for large dimension sizes.
3. **Softmax:** Normalizes similarity scores into probabilities summing to $1.0$ across keys.
4. **Weighted Values:** Multiplies probabilities by $V$ to create a context-aware token representation.

```
       Query (Q)       Key (K)
           │               │
           └───────┬───────┘
                   ▼
             [ Q @ K.T ]  (Similarity Matrix)
                   │
                   ▼  / sqrt(d_k)
             [ Scaled Scores ]
                   │
                   ▼  Softmax(dim=-1)
           [ Attention Weights ] ────┐
                                     │
           Value (V) ────────────────┴──► [ Weights @ V ] (Context Output)
```

### Multi-Head Self-Attention (`nn.MultiheadAttention`)
Instead of a single attention head, Multi-Head Attention projects $Q, K, V$ into $h$ different subspaces with dimension $d_k = d_{model} / h$. Each head learns distinct relationship patterns (e.g. syntax, semantics, coreference).

```python
mha = nn.MultiheadAttention(
    embed_dim=128,
    num_heads=4,
    dropout=0.1,
    batch_first=True  # Expects input shape: (batch_size, seq_len, embed_dim)
)
```

### The Residual Skip & LayerNorm Wrapper
In modern Transformers, self-attention is wrapped with a **residual connection** and **Layer Normalization**:
$$\text{Output} = \text{LayerNorm}(x + \text{MultiheadAttention}(x, x, x))$$
* **Residual Connection ($x + \text{MHA}(x)$):** Allows gradients to flow directly back through layers without degradation.
* **`nn.LayerNorm`:** Normalizes activations per sample across feature embeddings, ensuring scale consistency across deep networks.

---

## 3. Model Saving and Checkpointing
PyTorch provides two serialization paradigms:
1. **State Dictionary (`state_dict`):** A standard Python dictionary mapping each layer's parameter and buffer names to their tensor weights. **(Industry standard and recommended!)**
2. **Whole Model Pickling:** Pickles the entire class instance. Fragile across different codebases or PyTorch versions.

```python
# Saving model weights:
torch.save(model.state_dict(), "model_weights.pt")

# Restoring weights into an initialized model:
new_model = ConvClassifier()
new_model.load_state_dict(torch.load("model_weights.pt"))
new_model.eval()
```
"""

WALKTHROUGH = r"""# Part 7 Code Walkthrough: CNNs and Multi-Head Attention

Let's test both computer vision CNN feature extraction and transformer self-attention interactively:

```python
import torch
import torch.nn as nn

# 1. Building a 2-stage CNN Feature Extractor
class MiniCNN(nn.Module):
    def __init__(self, in_channels=3, num_classes=5):
        super().__init__()
        self.features = nn.Sequential(
            # Stage 1: (B, 3, 32, 32) -> (B, 16, 16, 16)
            nn.Conv2d(in_channels, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            
            # Stage 2: (B, 16, 16, 16) -> (B, 32, 8, 8)
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2)
        )
        self.gap = nn.AdaptiveAvgPool2d((1, 1))  # (B, 32, 1, 1)
        self.classifier = nn.Linear(32, num_classes)

    def forward(self, x):
        feat = self.features(x)
        pooled = self.gap(feat)
        flat = torch.flatten(pooled, 1)
        return self.classifier(flat)

cnn = MiniCNN(in_channels=3, num_classes=5)
dummy_img = torch.randn(2, 3, 32, 32)
logits = cnn(dummy_img)
print("CNN Logits output shape:", logits.shape)  # torch.Size([2, 5])

# 2. Multi-Head Self-Attention Block
class AttentionBlock(nn.Module):
    def __init__(self, embed_dim=64, num_heads=4):
        super().__init__()
        self.mha = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
        self.norm = nn.LayerNorm(embed_dim)

    def forward(self, x):
        attn_out, weights = self.mha(x, x, x)
        return self.norm(x + attn_out), weights

transformer_block = AttentionBlock(embed_dim=64, num_heads=4)
seq_input = torch.randn(2, 10, 64)  # batch=2, seq_len=10, embed=64
out, weights = transformer_block(seq_input)
print("Attention output shape:", out.shape)          # torch.Size([2, 10, 64])
print("Attention weights shape:", weights.shape)    # torch.Size([2, 10, 10])
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Convolutional Feature Extractor (torch-p7-c1)
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "torch-p7-c1",
    "title": "Convolutional Feature Extractor",
    "difficulty": "Intermediate",
    "category": "Neural Architectures",
    "description": (
        "Construct a modular Convolutional Neural Network with Conv2d, BatchNorm2d, ReLU, "
        "MaxPool2d, adaptive global average pooling, and a linear classification head. "
        "Support arbitrary spatial resolutions and variable channel configurations."
    ),
    "instructions": (
        "Implement a PyTorch neural network class `ConvFeatureExtractor(nn.Module)` with:\n"
        "1. `__init__(self, in_channels: int = 3, num_classes: int = 10, base_channels: int = 16)`:\n"
        "   - Call `super().__init__()`.\n"
        "   - Construct a convolutional backbone using `nn.Sequential`:\n"
        "     - Stage 1:\n"
        "       - `nn.Conv2d(in_channels, base_channels, kernel_size=3, padding=1)`\n"
        "       - `nn.BatchNorm2d(base_channels)`\n"
        "       - `nn.ReLU(inplace=True)`\n"
        "       - `nn.MaxPool2d(kernel_size=2, stride=2)`\n"
        "     - Stage 2:\n"
        "       - `nn.Conv2d(base_channels, base_channels * 2, kernel_size=3, padding=1)`\n"
        "       - `nn.BatchNorm2d(base_channels * 2)`\n"
        "       - `nn.ReLU(inplace=True)`\n"
        "       - `nn.MaxPool2d(kernel_size=2, stride=2)`\n"
        "   - Add global pooling: `self.pool = nn.AdaptiveAvgPool2d((1, 1))`.\n"
        "   - Add flattening: `self.flatten = nn.Flatten()`.\n"
        "   - Add classifier: `self.classifier = nn.Linear(base_channels * 2, num_classes)`.\n"
        "2. `forward(self, x: torch.Tensor) -> torch.Tensor`:\n"
        "   - Accepts 4D tensor `x` of shape `(batch_size, in_channels, height, width)`.\n"
        "   - Passes `x` through backbone, adaptive pool, flatten, and classifier.\n"
        "   - Returns output logits tensor of shape `(batch_size, num_classes)`."
    ),
    "starter_code": r'''import torch
import torch.nn as nn

class ConvFeatureExtractor(nn.Module):
    """
    Modular 2-stage CNN with BatchNorm, MaxPool, Adaptive Pooling, and Linear head.
    """
    def __init__(
        self,
        in_channels: int = 3,
        num_classes: int = 10,
        base_channels: int = 16
    ):
        super().__init__()
        # TODO: Define stage 1, stage 2, adaptive pool, flatten, and classifier head
        pass

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # TODO: Forward pass through features, pooling, flatten, and classifier
        pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn

class ConvFeatureExtractor(nn.Module):
    """
    Modular 2-stage CNN with BatchNorm, MaxPool, Adaptive Pooling, and Linear head.
    """
    def __init__(
        self,
        in_channels: int = 3,
        num_classes: int = 10,
        base_channels: int = 16
    ):
        super().__init__()
        self.features = nn.Sequential(
            # Stage 1
            nn.Conv2d(in_channels, base_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(base_channels),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            # Stage 2
            nn.Conv2d(base_channels, base_channels * 2, kernel_size=3, padding=1),
            nn.BatchNorm2d(base_channels * 2),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.flatten = nn.Flatten()
        self.classifier = nn.Linear(base_channels * 2, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feat = self.features(x)
        pooled = self.pool(feat)
        flat = self.flatten(pooled)
        return self.classifier(flat)
''',
    "test_suite": r'''import torch
import torch.nn as nn

def run_tests(candidate_func):
    """
    Automated test harness for Convolutional Feature Extractor (torch-p7-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard instantiation and forward pass
    model = candidate_func(in_channels=3, num_classes=10, base_channels=16)
    assert_test(isinstance(model, nn.Module), "Candidate must be a subclass of torch.nn.Module")

    x = torch.randn(4, 3, 32, 32)
    out = model(x)
    assert_test(isinstance(out, torch.Tensor), "Output must be a torch.Tensor")
    assert_test(out.shape == (4, 10), f"Expected shape (4, 10), got {out.shape}")

    # Test 2: Invariance to arbitrary spatial dimensions (AdaptiveAvgPool2d test)
    x_large = torch.randn(2, 3, 64, 48)
    out_large = model(x_large)
    assert_test(out_large.shape == (2, 10), f"Expected shape (2, 10) for arbitrary spatial size, got {out_large.shape}")

    # Test 3: Custom channel and class counts
    model_custom = candidate_func(in_channels=1, num_classes=4, base_channels=8)
    x_custom = torch.randn(3, 1, 28, 28)
    out_custom = model_custom(x_custom)
    assert_test(out_custom.shape == (3, 4), f"Expected shape (3, 4), got {out_custom.shape}")

    # Test 4: Backpropagation and gradient check
    loss = out.sum()
    loss.backward()
    for name, param in model.named_parameters():
        if param.requires_grad:
            assert_test(param.grad is not None, f"Parameter {name} has no gradient after backward()")
            assert_test(not torch.isnan(param.grad).any(), f"Parameter {name} has NaN gradients")

    # Test 5: State dict check
    state = model.state_dict()
    assert_test("classifier.weight" in state or any("classifier" in k for k in state), "Classifier weights missing in state_dict")

    return report
''',
    "hints": [
        "In Stage 1, use Conv2d(in_channels, base_channels, 3, padding=1) followed by BatchNorm2d, ReLU, and MaxPool2d(2).",
        "In Stage 2, double the channels: Conv2d(base_channels, base_channels * 2, 3, padding=1).",
        "AdaptiveAvgPool2d((1, 1)) collapses spatial (H, W) to (1, 1), and nn.Flatten() reshapes (B, C, 1, 1) into (B, C)."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Self-Attention Feature Layer (torch-p7-c2)
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "torch-p7-c2",
    "title": "Self-Attention Feature Layer",
    "difficulty": "Intermediate",
    "category": "Neural Architectures",
    "description": (
        "Implement a Transformer self-attention block featuring PyTorch's nn.MultiheadAttention, "
        "a residual skip connection, and Layer Normalization. Process sequence embeddings and output both "
        "transformed representations and attention weight matrices."
    ),
    "instructions": (
        "Implement a PyTorch module `SelfAttentionBlock(nn.Module)` with:\n"
        "1. `__init__(self, embed_dim: int, num_heads: int, dropout: float = 0.0)`:\n"
        "   - Call `super().__init__()`.\n"
        "   - Initialize `self.mha = nn.MultiheadAttention(embed_dim=embed_dim, num_heads=num_heads, dropout=dropout, batch_first=True)`.\n"
        "   - Initialize `self.norm = nn.LayerNorm(embed_dim)`.\n"
        "2. `forward(self, x: torch.Tensor, key_padding_mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]`:\n"
        "   - Takes `x` of shape `(batch_size, seq_len, embed_dim)`.\n"
        "   - Computes multi-head self-attention by passing `query=x, key=x, value=x` and `key_padding_mask=key_padding_mask` to `self.mha`.\n"
        "   - Applies residual skip connection and LayerNorm: `out = self.norm(x + attn_output)`.\n"
        "   - Returns tuple `(out, attn_weights)` where `out` is shape `(batch_size, seq_len, embed_dim)`."
    ),
    "starter_code": r'''import torch
import torch.nn as nn
from typing import Optional, Tuple

class SelfAttentionBlock(nn.Module):
    """
    Transformer Self-Attention layer with residual connection and LayerNorm.
    """
    def __init__(self, embed_dim: int, num_heads: int, dropout: float = 0.0):
        super().__init__()
        # TODO: Initialize MultiheadAttention with batch_first=True and LayerNorm
        pass

    def forward(
        self,
        x: torch.Tensor,
        key_padding_mask: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        # TODO: Compute self-attention, apply residual skip and LayerNorm, return (out, attn_weights)
        pass
''',
    "reference_solution": r'''import torch
import torch.nn as nn
from typing import Optional, Tuple

class SelfAttentionBlock(nn.Module):
    """
    Transformer Self-Attention layer with residual connection and LayerNorm.
    """
    def __init__(self, embed_dim: int, num_heads: int, dropout: float = 0.0):
        super().__init__()
        self.mha = nn.MultiheadAttention(
            embed_dim=embed_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True
        )
        self.norm = nn.LayerNorm(embed_dim)

    def forward(
        self,
        x: torch.Tensor,
        key_padding_mask: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        attn_out, attn_weights = self.mha(
            query=x,
            key=x,
            value=x,
            key_padding_mask=key_padding_mask,
            need_weights=True
        )
        out = self.norm(x + attn_out)
        return out, attn_weights
''',
    "test_suite": r'''import torch
import torch.nn as nn

def run_tests(candidate_func):
    """
    Automated test harness for Self-Attention Feature Layer (torch-p7-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Instantiation and forward shape
    embed_dim = 64
    num_heads = 4
    block = candidate_func(embed_dim=embed_dim, num_heads=num_heads)
    assert_test(isinstance(block, nn.Module), "Candidate must be a subclass of nn.Module")

    batch_size = 4
    seq_len = 8
    x = torch.randn(batch_size, seq_len, embed_dim)

    out, weights = block(x)
    assert_test(isinstance(out, torch.Tensor), "out must be a torch.Tensor")
    assert_test(isinstance(weights, torch.Tensor), "weights must be a torch.Tensor")
    assert_test(out.shape == (batch_size, seq_len, embed_dim),
                f"Expected out shape ({batch_size}, {seq_len}, {embed_dim}), got {out.shape}")
    assert_test(weights.shape[0] == batch_size, "Weights batch dimension mismatch")

    # Test 2: LayerNorm verification (normalized features have ~zero mean along embed_dim)
    mean_along_dim = out.mean(dim=-1)
    assert_test(torch.allclose(mean_along_dim, torch.zeros_like(mean_along_dim), atol=1e-5),
                "LayerNorm mean along embed_dim should be approximately 0.0")

    # Test 3: Gradient flow through residual and attention weights
    loss = out.sum()
    loss.backward()
    for name, param in block.named_parameters():
        if param.requires_grad:
            assert_test(param.grad is not None, f"Parameter '{name}' received no gradient")

    # Test 4: Key padding mask support
    mask = torch.zeros(batch_size, seq_len, dtype=torch.bool)
    mask[:, -2:] = True  # mask out last 2 tokens
    out_masked, weights_masked = block(x, key_padding_mask=mask)
    assert_test(out_masked.shape == (batch_size, seq_len, embed_dim), "Masked output shape mismatch")

    return report
''',
    "hints": [
        "Set batch_first=True in nn.MultiheadAttention so input tensors have shape (batch, seq, embed).",
        "Self-attention means Query = Key = Value = x.",
        "Residual connection is computed as x + attn_out before passing into self.norm()."
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
