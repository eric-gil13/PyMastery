import type {
  DayTrack,
  Challenge,
  ConceptPrimerData,
  TestCase
} from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData, TestCase };

export const challenge1TestCases: TestCase[] = [
  {
    id: 'tc1-p7-c1',
    name: 'Standard Image Classification Forward Pass',
    inputDescription: 'in_channels=3, num_classes=10, base_channels=16, input_shape=(4, 3, 32, 32)',
    expectedOutput: 'Output logits tensor of shape (4, 10)'
  },
  {
    id: 'tc2-p7-c1',
    name: 'Arbitrary Spatial Dimension Invariance',
    inputDescription: 'input_shape=(2, 3, 64, 48)',
    expectedOutput: 'Output shape remains (2, 10) due to AdaptiveAvgPool2d((1, 1))'
  },
  {
    id: 'tc3-p7-c1',
    name: 'Single-Channel Grayscale Configuration',
    inputDescription: 'in_channels=1, num_classes=4, base_channels=8, input_shape=(3, 1, 28, 28)',
    expectedOutput: 'Output logits tensor of shape (3, 4)'
  },
  {
    id: 'tc4-p7-c1',
    name: 'Gradient Flow and Parameter Check',
    inputDescription: 'loss.backward() through CNN outputs',
    expectedOutput: 'All trainable convolution and linear parameters have non-NaN gradients'
  }
];

export const challenge2TestCases: TestCase[] = [
  {
    id: 'tc1-p7-c2',
    name: 'Multi-Head Attention Output Shape',
    inputDescription: 'embed_dim=64, num_heads=4, input_shape=(4, 8, 64)',
    expectedOutput: 'out.shape == (4, 8, 64), weights.shape[0] == 4'
  },
  {
    id: 'tc2-p7-c2',
    name: 'LayerNorm Zero-Mean Standardization',
    inputDescription: 'Normalized residual output tensor along embed dimension',
    expectedOutput: 'out.mean(dim=-1) is approximately 0.0'
  },
  {
    id: 'tc3-p7-c2',
    name: 'Key Padding Mask Support',
    inputDescription: 'key_padding_mask on last 2 sequence tokens',
    expectedOutput: 'out_masked has shape (batch_size, seq_len, embed_dim)'
  },
  {
    id: 'tc4-p7-c2',
    name: 'Attention Residual Gradient Flow',
    inputDescription: 'loss.backward() through SelfAttentionBlock',
    expectedOutput: 'Gradients populated across MHA projections and LayerNorm weights'
  }
];

export const testCases: TestCase[] = [
  ...challenge1TestCases,
  ...challenge2TestCases
];

export const CHALLENGE_1: Challenge = {
  id: 'torch-p7-c1',
  dayId: 7,
  partId: 7,
  title: 'Convolutional Feature Extractor',
  slug: 'convolutional-feature-extractor',
  difficulty: 'Intermediate',
  category: 'Neural Architectures',
  summary: 'Construct a modular 2-stage CNN with Conv2d, BatchNorm2d, ReLU, MaxPool2d, AdaptiveAvgPool2d, and a Linear classification head.',
  mentalModel5s: 'Conv2d extracts local spatial patterns, BatchNorm stabilizes, MaxPool halves spatial size, AdaptiveAvgPool collapses to 1x1, and Linear head predicts classes.',
  visualAnalogy: 'Like processing a photograph through progressive lenses: Stage 1 detects edges and color gradients, Stage 2 combines edges into textures and object parts, Global Average Pooling condenses each feature map into a single summary score, and the Linear layer casts votes for the final class prediction.',
  pitfalls: [
    'Hardcoding spatial flatten dimensions: assuming input images will always be 32x32 breaks on images of other resolutions. Use nn.AdaptiveAvgPool2d((1, 1)) to handle arbitrary sizes.',
    'Mismatching in_channels and out_channels between stages: Stage 2 in_channels must match Stage 1 out_channels (base_channels * 2).',
    'Calling flattened features without flattening first: passing a 4D tensor into nn.Linear throws dimension mismatch errors.'
  ],
  progressiveHints: [
    'Tier 1: Call super().__init__() and build self.features with nn.Sequential.',
    'Tier 2: In Stage 1, use Conv2d(in_channels, base_channels, 3, padding=1), BatchNorm2d(base_channels), ReLU(inplace=True), and MaxPool2d(2, 2).',
    'Tier 3: In Stage 2, double channels: Conv2d(base_channels, base_channels * 2, 3, padding=1), BatchNorm2d(base_channels * 2), ReLU(inplace=True), and MaxPool2d(2, 2).',
    'Tier 4: Add self.pool = nn.AdaptiveAvgPool2d((1, 1)), self.flatten = nn.Flatten(), and self.classifier = nn.Linear(base_channels * 2, num_classes).',
    'Tier 5: In forward(self, x), pass x sequentially through features, pool, flatten, and classifier.'
  ],
  deepInternals: {
    title: 'Adaptive Average Pooling Architecture',
    content: 'Standard CNNs like early AlexNet were locked to exact 224x224 resolutions because the final linear layer was tied to a fixed spatial grid (e.g. 256 * 6 * 6). Modern architectures (ResNet, ConvNeXt) place nn.AdaptiveAvgPool2d((1, 1)) before the linear head. This spatially reduces any (B, C, H, W) tensor to (B, C, 1, 1), enabling the network to accept images of arbitrary height and width dynamically.',
    keyRule: 'Always use AdaptiveAvgPool2d((1, 1)) followed by nn.Flatten() before final classification heads.'
  },
  instructions: `Construct a modular Convolutional Neural Network subclassing \`nn.Module\` that extracts spatial visual features and classifies images.

Implement the class \`ConvFeatureExtractor(nn.Module)\`:

1. \`__init__(self, in_channels: int = 3, num_classes: int = 10, base_channels: int = 16)\`:
   - Call \`super().__init__()\`.
   - Build a convolutional backbone named \`self.features\` using \`nn.Sequential\`:
     - **Stage 1:**
       - \`nn.Conv2d(in_channels, base_channels, kernel_size=3, padding=1)\`
       - \`nn.BatchNorm2d(base_channels)\`
       - \`nn.ReLU(inplace=True)\`
       - \`nn.MaxPool2d(kernel_size=2, stride=2)\`
     - **Stage 2:**
       - \`nn.Conv2d(base_channels, base_channels * 2, kernel_size=3, padding=1)\`
       - \`nn.BatchNorm2d(base_channels * 2)\`
       - \`nn.ReLU(inplace=True)\`
       - \`nn.MaxPool2d(kernel_size=2, stride=2)\`
   - Add adaptive pooling: \`self.pool = nn.AdaptiveAvgPool2d((1, 1))\`.
   - Add flattening: \`self.flatten = nn.Flatten()\`.
   - Add linear classification head: \`self.classifier = nn.Linear(base_channels * 2, num_classes)\`.

2. \`forward(self, x: torch.Tensor) -> torch.Tensor\`:
   - Accepts 4D tensor \`x\` of shape \`(batch_size, in_channels, height, width)\`.
   - Passes \`x\` through \`self.features\`, \`self.pool\`, \`self.flatten\`, and \`self.classifier\`.
   - Returns output logits tensor of shape \`(batch_size, num_classes)\`.`,
  hints: [
    'Conv2d with kernel_size=3 and padding=1 preserves spatial dimensions before pooling.',
    'MaxPool2d(kernel_size=2, stride=2) halves height and width.',
    'AdaptiveAvgPool2d((1, 1)) condenses each spatial feature channel into a single scalar value.'
  ],
  starterCode: `import torch
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
`,
  solutionCode: `import torch
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
`,
  testCases: challenge1TestCases,
  benchmarkTargetMs: 30.0,
  memoryTargetMb: 12.0,
  conceptPrimer: {
    title: 'Convolutional Operations & Spatial Downsampling',
    subtitle: 'Extracting translation-invariant visual features with Conv2d and Pooling',
    overview: 'Convolutional Neural Networks preserve 2D grid structure by applying localized sliding filter kernels across channels. By stacking convolutions with non-linearities and spatial downsampling, CNNs build hierarchical representations from low-level edges to semantic object parts.',
    mentalModel5s: 'Slide filter kernels across the image -> normalize activations -> rectify -> downsample spatial footprint.',
    visualAnalogy: 'A flashlight scanning across a mural: at each spot, it detects whether specific brush patterns exist, producing an activation map of recognized features.',
    pitfalls: [
      'Forgetting padding=1 when kernel_size=3: shrinks feature map dimensions prematurely.',
      'Omitting BatchNorm: deep networks suffer from internal covariate shift and slow convergence.'
    ],
    progressiveHints: [
      'In Stage 1: Conv2d(in_channels, base_channels, 3, padding=1).',
      'In Stage 2: Conv2d(base_channels, base_channels * 2, 3, padding=1).',
      'Use AdaptiveAvgPool2d((1, 1)) and nn.Flatten() before nn.Linear.'
    ],
    mathFormulas: [
      {
        title: 'Spatial Dimension Formula for Conv2d',
        latex: 'H_{\\text{out}} = \\left\\lfloor \\frac{H_{\\text{in}} - K + 2P}{S} \\right\\rfloor + 1',
        explanation: 'Calculates the output spatial dimension given input size H, kernel size K, padding P, and stride S.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Hardcoded spatial dimensions in linear head
self.linear = nn.Linear(32 * 8 * 8, num_classes)
# FAILS if input image resolution changes!`,
      naiveExplanation: 'Breaks if passed images of any resolution other than exactly 32x32.',
      idiomaticCode: `# Modern resolution-agnostic architecture
self.pool = nn.AdaptiveAvgPool2d((1, 1))
self.classifier = nn.Linear(base_channels * 2, num_classes)`,
      idiomaticExplanation: 'Adaptive pooling reduces spatial dimensions to 1x1 regardless of input image size.',
      speedupText: 'Resolution independent'
    },
    memoryLayout: {
      title: 'NCHW Tensor Memory Layout',
      content: 'PyTorch represents 4D vision tensors in NCHW format (Batch, Channels, Height, Width). Elements within the same channel are stored sequentially row-by-row.',
      diagramAscii: `Input:  (B, C_in, H, W)
           │
           ▼ Conv2d (expand channels)
        (B, C_out, H, W)
           │
           ▼ MaxPool2d (halve spatial dims)
        (B, C_out, H/2, W/2)
           │
           ▼ AdaptiveAvgPool2d((1, 1)) + Flatten
        (B, C_out) ──► Linear Head ──► (B, NumClasses)`,
      keyRule: 'PyTorch standard vision format is always (Batch, Channels, Height, Width).'
    },
    keyTakeaways: [
      'Conv2d slides 3x3 kernels over input channels with shared parameters.',
      'BatchNorm2d stabilizes training dynamics across deep layers.',
      'MaxPool2d reduces spatial dimensions and expands effective receptive field.',
      'AdaptiveAvgPool2d((1, 1)) provides robust invariance to input resolution.'
    ]
  },
  expectedTensors: [
    { name: 'input_images', shape: '(B, C, H, W)', dtype: 'float32' },
    { name: 'logits', shape: '(B, NumClasses)', dtype: 'float32' }
  ]
};

export const CHALLENGE_2: Challenge = {
  id: 'torch-p7-c2',
  dayId: 7,
  partId: 7,
  title: 'Self-Attention Feature Layer',
  slug: 'self-attention-feature-layer',
  difficulty: 'Intermediate',
  category: 'Neural Architectures',
  summary: 'Implement a Transformer self-attention block featuring nn.MultiheadAttention, a residual skip connection, and Layer Normalization.',
  mentalModel5s: 'Tokens attend to all other tokens via Query-Key dot products; residual connection and LayerNorm ensure stable gradient flow.',
  visualAnalogy: 'A roundtable conference: each speaker (token) poses a question (Query), listens to everyone else summarizes their expertise (Keys), and collects relevant insights (Values) to update their knowledge without forgetting their original thoughts (residual connection).',
  pitfalls: [
    'Forgetting batch_first=True in nn.MultiheadAttention: PyTorch defaults to (seq_len, batch_size, embed_dim), which transposes batch and sequence dimensions.',
    'Passing incorrect arguments to self-attention: for self-attention, Query, Key, and Value must all be the exact same input tensor x.',
    'Omitting the residual connection: deep Transformer stacks fail to propagate gradients without x + attn_out.'
  ],
  progressiveHints: [
    'Tier 1: Initialize self.mha = nn.MultiheadAttention(embed_dim=embed_dim, num_heads=num_heads, dropout=dropout, batch_first=True).',
    'Tier 2: Initialize self.norm = nn.LayerNorm(embed_dim).',
    'Tier 3: In forward(self, x, key_padding_mask=None), call self.mha(query=x, key=x, value=x, key_padding_mask=key_padding_mask).',
    'Tier 4: Add residual skip connection and apply LayerNorm: out = self.norm(x + attn_output).',
    'Tier 5: Return the tuple (out, attn_weights).'
  ],
  deepInternals: {
    title: 'Why Scale by sqrt(d_k)?',
    content: 'As embedding dimension d_k increases, the dot product Q @ K^T grows large in magnitude. Large values push the softmax function into regions with near-zero gradients (saturation), causing backpropagation to stall. Dividing by sqrt(d_k) normalizes the variance to 1.0, preserving healthy gradient flow.',
    keyRule: 'Always use batch_first=True in modern PyTorch MultiheadAttention layers.'
  },
  instructions: `Construct a Transformer Self-Attention Block subclassing \`nn.Module\` that implements multi-head token attention, a residual connection, and Layer Normalization.

Implement the class \`SelfAttentionBlock(nn.Module)\`:

1. \`__init__(self, embed_dim: int, num_heads: int, dropout: float = 0.0)\`:
   - Call \`super().__init__()\`.
   - Initialize \`self.mha = nn.MultiheadAttention(embed_dim=embed_dim, num_heads=num_heads, dropout=dropout, batch_first=True)\`.
   - Initialize \`self.norm = nn.LayerNorm(embed_dim)\`.

2. \`forward(self, x: torch.Tensor, key_padding_mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]\`:
   - Takes sequence tensor \`x\` of shape \`(batch_size, seq_len, embed_dim)\`.
   - Computes multi-head self-attention by passing \`query=x, key=x, value=x\` and \`key_padding_mask=key_padding_mask\` to \`self.mha\`.
   - Applies residual skip connection and LayerNorm: \`out = self.norm(x + attn_output)\`.
   - Returns the tuple \`(out, attn_weights)\` where \`out\` is shape \`(batch_size, seq_len, embed_dim)\`.`,
  hints: [
    'MultiheadAttention expects batch_first=True when tensors are formatted as (batch, seq, embed).',
    'For self-attention, pass query=x, key=x, value=x.',
    'Add the residual skip before passing into self.norm: self.norm(x + attn_out).'
  ],
  starterCode: `import torch
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
`,
  solutionCode: `import torch
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
`,
  testCases: challenge2TestCases,
  benchmarkTargetMs: 25.0,
  memoryTargetMb: 10.0,
  conceptPrimer: {
    title: 'Multi-Head Attention & Transformer Dynamics',
    subtitle: 'From Scaled Dot-Product to Subspace Projection and Residual Skip Normalization',
    overview: 'Self-Attention allows models to dynamically weigh the importance of different sequence tokens relative to each other. Multi-Head Attention projects representations into multiple representation subspaces, while residual connections and LayerNorm guarantee gradient propagation in deep networks.',
    mentalModel5s: 'Q, K, V projections -> Scaled dot product similarity -> Softmax weights -> Context mixture + Residual skip + LayerNorm.',
    visualAnalogy: 'A search engine: your Query is what you seek, Keys are web page titles, and Values are the page contents. Attention scores determine how much information from each page gets summarized into the final answer.',
    pitfalls: [
      'Neglecting batch_first=True: transposes dimensions and breaks batch processing.',
      'Applying LayerNorm before the residual addition instead of around the sum.'
    ],
    progressiveHints: [
      'Instantiate nn.MultiheadAttention(embed_dim, num_heads, batch_first=True).',
      'Pass query=x, key=x, value=x.',
      'Add residual x + attn_out and pass through self.norm.'
    ],
    mathFormulas: [
      {
        title: 'Scaled Dot-Product Attention',
        latex: '\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V',
        explanation: 'Computes context vectors by weighting Values according to normalized Query-Key alignment.'
      },
      {
        title: 'Layer Normalization',
        latex: '\\text{LN}(z) = \\frac{z - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}} \\cdot \\gamma + \\beta',
        explanation: 'Normalizes features across the embedding dimension independently for each sequence token.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Attention without residual connection or normalization
attn_out, _ = self.mha(x, x, x)
return attn_out  # FAILS to train in deep networks due to vanishing gradients!`,
      naiveExplanation: 'Information is lost and gradients degrade rapidly across deep transformer layers.',
      idiomaticCode: `# Modern Transformer Attention Block with Pre/Post-LN skip
attn_out, weights = self.mha(query=x, key=x, value=x)
out = self.norm(x + attn_out)
return out, weights`,
      idiomaticExplanation: 'Residual connection preserves identity gradient path while LayerNorm controls activation scales.',
      speedupText: 'Enables stable deep scaling'
    },
    memoryLayout: {
      title: 'Sequence Token Geometry',
      content: 'Sequence embeddings are stored in 3D tensors of shape (Batch, SeqLen, EmbedDim). Each token has a 1D vector of length EmbedDim.',
      diagramAscii: `Input Token Tensor: (B, S, D)
       │
       ├───► [MultiheadAttention] ──► (B, S, D)
       │                                  │
       ▼                                  ▼
      (x) ────────────────────────────► (+) [Residual Addition]
                                          │
                                          ▼
                                     [LayerNorm] ──► Output: (B, S, D)`,
      keyRule: 'Multi-Head Attention preserves input tensor dimensions (B, S, D).'
    },
    keyTakeaways: [
      'Self-Attention computes context-aware token representations.',
      'nn.MultiheadAttention projects into h subspaces for diverse relational feature extraction.',
      'Residual skip connections prevent vanishing gradients.',
      'LayerNorm standardizes token feature scales across embeddings.'
    ]
  },
  expectedTensors: [
    { name: 'sequence_input', shape: '(B, S, D)', dtype: 'float32' },
    { name: 'attention_output', shape: '(B, S, D)', dtype: 'float32' },
    { name: 'attention_weights', shape: '(B, S, S)', dtype: 'float32' }
  ]
};

export const DAY07_TRACK: DayTrack = {
  partNumber: 7,
  partId: 7,
  dayNumber: 7,
  id: 7,
  title: 'Part 7: Real-World Deep Learning Architectures',
  subtitle: 'Master 2D CNNs, BatchNorm, MaxPool, Multi-Head Self-Attention, and Transformer Blocks',
  description: 'Build production deep learning architectures from the ground up. Implement 2D Convolutional Neural Networks with batch normalization and adaptive pooling, construct Transformer Multi-Head Self-Attention blocks with residual connections, and master model weight serialization.',
  iconName: 'Cpu',
  badge: 'Part 7 • Architectures',
  libraryMechanics: {
    libraryName: 'PyTorch Deep Learning Architectures: CNNs & Transformers',
    tagline: 'Construct state-of-the-art vision and sequence architectures with modular PyTorch blocks.',
    overview: `Modern deep learning revolves around two dominant architectural families:
1. **Convolutional Neural Networks (CNNs):** Specialized for 2D spatial locality and translation equivariance in vision, audio spectrograms, and spatial grids.
2. **Transformers & Self-Attention:** Specialized for dynamic, long-range relational reasoning across sequences in natural language, code, and multimodal foundation models.

Mastering how to construct modular layers, verify gradient flow, handle arbitrary spatial dimensions with adaptive pooling, and serialize weights via \`state_dict\` completes the Zero-to-Hero PyTorch journey.`,
    whyItExists: `Handcrafting neural network operations in raw tensor arithmetic is error-prone and misses hardware-optimized CUDA kernels (like cuDNN convolutions and FlashAttention).

PyTorch provides high-level modular building blocks (\`nn.Conv2d\`, \`nn.BatchNorm2d\`, \`nn.AdaptiveAvgPool2d\`, \`nn.MultiheadAttention\`, \`nn.LayerNorm\`) that wrap compiled C++/CUDA kernels with automatic differentiation, optimal memory layouts, and device portability.`,
    coreAnatomy: {
      objectName: 'Deep Architecture Building Blocks',
      description: 'The primary layer primitives for computer vision and transformer sequence modeling.',
      fields: [
        {
          name: 'nn.Conv2d',
          type: 'spatial filter',
          role: 'Slides 2D learned kernels across spatial feature channels.'
        },
        {
          name: 'nn.BatchNorm2d',
          type: 'normalization layer',
          role: 'Normalizes 2D feature maps across the mini-batch to accelerate convergence.'
        },
        {
          name: 'nn.AdaptiveAvgPool2d',
          type: 'spatial pooling',
          role: 'Spatially reduces feature maps to a fixed (H, W) grid regardless of input size.'
        },
        {
          name: 'nn.MultiheadAttention',
          type: 'attention mechanism',
          role: 'Computes scaled dot-product attention across multiple projected subspaces.'
        },
        {
          name: 'nn.LayerNorm',
          type: 'normalization layer',
          role: 'Standardizes features across the embedding dimension for each token independently.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                       Vision vs Sequence Architecture Comparison              |
+-------------------------------------------------------------------------------+
  CNN Vision Pipeline:
  Input (B, C, H, W) ──► Conv2d ──► BatchNorm ──► ReLU ──► MaxPool
                     ──► AdaptiveAvgPool((1, 1)) ──► Flatten ──► Linear Head

  Transformer Sequence Pipeline:
  Input (B, S, D)    ──► MultiheadAttention(Q, K, V) ──► (+ Residual) ──► LayerNorm`
    },
    chapters: [
      {
        id: 'ch1-cnn-foundations',
        title: 'Convolutional Feature Extraction',
        icon: 'Eye',
        summary: 'How Conv2d, BatchNorm, and MaxPool extract spatial visual hierarchies.',
        markdownContent: `### Spatial Locality and Weight Sharing
Unlike fully connected layers, \`nn.Conv2d\` shares parameters across the entire spatial plane. A 3x3 filter kernel scans across the image, activating when it detects specific localized visual cues.

Staging:
1. Low-level features: Edges, colors, textures.
2. High-level features: Complex shapes, object parts.`,
        codeSnippets: [
          {
            id: 'snip-conv-block',
            title: 'Simple Conv2d Block',
            code: `import torch
import torch.nn as nn

block = nn.Sequential(
    nn.Conv2d(3, 16, kernel_size=3, padding=1),
    nn.BatchNorm2d(16),
    nn.ReLU(),
    nn.MaxPool2d(2)
)

img = torch.randn(1, 3, 32, 32)
out = block(img)
print("Output shape:", out.shape)`,
            expectedOutput: `Output shape: torch.Size([1, 16, 16, 16])`,
            explanation: 'Halves spatial dimensions from 32x32 to 16x16 while expanding channels from 3 to 16.'
          }
        ]
      },
      {
        id: 'ch2-attention-transformers',
        title: 'Self-Attention & Transformer Blocks',
        icon: 'Cpu',
        summary: 'How Query, Key, and Value matrices compute context-aware token representations.',
        markdownContent: `### Scaled Dot-Product Mechanics
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$$

Multi-Head Attention projects $Q, K, V$ into $h$ heads, enabling the model to jointly attend to information from different representation subspaces.`,
        codeSnippets: [
          {
            id: 'snip-mha-block',
            title: 'Multi-Head Attention Execution',
            code: `import torch
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=64, num_heads=4, batch_first=True)
tokens = torch.randn(2, 10, 64)  # batch=2, seq_len=10, embed=64
out, weights = mha(tokens, tokens, tokens)

print("Attended output:", out.shape)
print("Attention weights:", weights.shape)`,
            expectedOutput: `Attended output: torch.Size([2, 10, 64])\nAttention weights: torch.Size([2, 10, 10])`,
            explanation: 'Each of the 10 tokens attends to all 10 tokens across 4 parallel attention heads.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Omitting batch_first=True in MultiheadAttention',
        badSnippet: 'mha = nn.MultiheadAttention(64, 4)  # Default: batch_first=False!',
        badExplanation: 'By default, PyTorch expects (seq_len, batch_size, embed_dim). Passing standard (batch, seq, embed) tensors transposes batch and sequence dimensions!',
        goodSnippet: 'mha = nn.MultiheadAttention(64, 4, batch_first=True)',
        goodExplanation: 'Ensures PyTorch correctly treats dimension 0 as the batch size.',
        perfImpact: 'Eliminates silent dimension permutation bugs in sequence models.'
      },
      {
        title: 'Hardcoding Classifier Input Spatial Dimensions',
        badSnippet: 'self.classifier = nn.Linear(32 * 8 * 8, num_classes)',
        badExplanation: 'Restricts the entire model to a fixed 32x32 resolution. Images of any other resolution will crash the model with shape errors.',
        goodSnippet: 'self.pool = nn.AdaptiveAvgPool2d((1, 1))\nself.classifier = nn.Linear(32, num_classes)',
        goodExplanation: 'AdaptiveAvgPool collapses spatial dimensions down to 1x1 regardless of input image resolution.',
        perfImpact: 'Provides robust resolution invariance.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'nn.Conv2d',
        category: 'Vision',
        signature: 'nn.Conv2d(in_channels, out_channels, kernel_size, stride=1, padding=0)',
        summary: 'Applies a 2D convolution over an input signal composed of several input planes.',
        parameters: [
          { name: 'in_channels', type: 'int', desc: 'Number of channels in input image.' },
          { name: 'out_channels', type: 'int', desc: 'Number of channels produced by convolution.' },
          { name: 'kernel_size', type: 'int | tuple', desc: 'Size of the convolving kernel.' }
        ],
        returns: 'Tensor of shape (N, C_out, H_out, W_out)',
        exampleSnippet: 'conv = nn.Conv2d(3, 32, kernel_size=3, padding=1)'
      },
      {
        name: 'nn.AdaptiveAvgPool2d',
        category: 'Vision',
        signature: 'nn.AdaptiveAvgPool2d(output_size)',
        summary: 'Applies a 2D adaptive average pooling over an input signal composed of several input planes.',
        parameters: [
          { name: 'output_size', type: 'int | tuple', desc: 'Target output spatial size (H, W).' }
        ],
        returns: 'Tensor of shape (N, C, H_out, W_out)',
        exampleSnippet: 'gap = nn.AdaptiveAvgPool2d((1, 1))'
      },
      {
        name: 'nn.MultiheadAttention',
        category: 'Sequence',
        signature: 'nn.MultiheadAttention(embed_dim, num_heads, dropout=0.0, batch_first=False)',
        summary: 'Allows the model to jointly attend to information from different representation subspaces.',
        parameters: [
          { name: 'embed_dim', type: 'int', desc: 'Total dimension of the model.' },
          { name: 'num_heads', type: 'int', desc: 'Number of parallel attention heads.' },
          { name: 'batch_first', type: 'bool', desc: 'If True, then input and output tensors are provided as (batch, seq, embed).' }
        ],
        returns: 'Tuple (attn_output, attn_output_weights)',
        exampleSnippet: 'mha = nn.MultiheadAttention(embed_dim=128, num_heads=4, batch_first=True)'
      }
    ],
    interactiveWidgetType: 'pytorch-nn'
  },
  challenges: [CHALLENGE_1, CHALLENGE_2]
};

export const PYTORCH_PART07_TRACK = DAY07_TRACK;
export default DAY07_TRACK;
