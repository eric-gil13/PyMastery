import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const CHALLENGE_1: Challenge = {
  id: 'torch-p3-c1',
  dayId: 3,
  partId: 3,
  title: 'Multi-Layer Perceptron (MLP) Builder',
  slug: 'multi-layer-perceptron-mlp-builder',
  difficulty: 'Intermediate',
  category: 'Neural Modules',
  summary: 'Construct a 2-layer Multi-Layer Perceptron (MLP) neural network module with linear projections and activations, and calculate trainable parameter counts.',
  mentalModel5s: 'Subclass nn.Module, call super().__init__(), assign layers in __init__, and execute dataflow in forward(). Never call model.forward(x) directly—always call model(x).',
  visualAnalogy: 'Think of nn.Module as a blueprint for a specialized machine shop: __init__ installs the conveyor belts and cutting tools (layers), while forward() feeds the raw steel ingots (input tensors) through the stations to produce engine blocks (predictions).',
  pitfalls: [
    'Forgetting super().__init__() in __init__, which prevents PyTorch from tracking parameters.',
    'Calling model.forward(x) instead of model(x), which bypasses hooks and profiling mechanisms.',
    'Mismatched feature dimensions between layers (e.g. fc1 output features != fc2 input features).'
  ],
  progressiveHints: [
    'Tier 1: Subclass nn.Module and call super().__init__() at the start of __init__.',
    'Tier 2: Store self.fc1 = nn.Linear(in_features, hidden_features), self.relu = nn.ReLU(), self.fc2 = nn.Linear(hidden_features, out_features).',
    'Tier 3: In forward(self, x), pass x sequentially: self.fc2(self.relu(self.fc1(x))).',
    'Tier 4: In build_and_run_mlp, check x.shape[-1] == in_features, instantiate model, run model(x), and sum p.numel().'
  ],
  deepInternals: {
    title: 'Parameter Registration & Hook Dispatch',
    content: 'Assigning an nn.Linear to self in __init__ invokes Python __setattr__, which automatically registers the layer weights and biases in internal _parameters and _modules dictionaries. Calling model(x) dispatches through __call__ to invoke PyTorch hooks.',
    keyRule: 'Always invoke model(x) to trigger PyTorch hook registrations.'
  },
  instructions: `Neural networks are constructed modularly by subclassing \`torch.nn.Module\`.

1. Create a class \`SimpleMLP(nn.Module)\` that:
   - In \`__init__(self, in_features: int, hidden_features: int, out_features: int)\`:
     Initializes the base module and configures a two-stage feedforward architecture: a first linear projection from \`in_features\` to \`hidden_features\` (\`self.fc1\`), a rectified linear activation function (\`self.relu\`), and a second linear projection from \`hidden_features\` to \`out_features\` (\`self.fc2\`).
   - In \`forward(self, x: torch.Tensor) -> torch.Tensor\`:
     Transforms input \`x\` sequentially through the first linear layer, activation function, and output linear layer, returning the resulting tensor.

2. Write a function \`build_and_run_mlp(in_features: int, hidden_features: int, out_features: int, x: torch.Tensor) -> dict\` that:
   - Validates that the trailing feature dimension of \`x\` matches \`in_features\`. If not, raise \`ValueError("Input feature dimension mismatch")\`.
   - Instantiates \`SimpleMLP\` with the specified layer dimensions as \`model\`.
   - Executes the forward pass on \`x\` to produce \`output\`.
   - Calculates the total count of trainable parameters in the model as \`param_count\`.
   - Returns a dictionary: \`{"model": model, "output": output, "param_count": int(param_count), "out_shape": tuple(output.shape)}\`.`,
  hints: [
    'Always call super().__init__() first.',
    'Linear layers take (in_features, out_features).',
    'Execute model forward pass by invoking model(x).',
    'Count parameters using sum(p.numel() for p in model.parameters() if p.requires_grad).'
  ],
  starterCode: `import torch
import torch.nn as nn

class SimpleMLP(nn.Module):
    """
    Two-layer Multi-Layer Perceptron with ReLU activation.
    """
    def __init__(self, in_features: int, hidden_features: int, out_features: int):
        super().__init__()
        # TODO: Initialize fc1, relu, and fc2 layers
        pass
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # TODO: Pass x sequentially through linear projections and activation
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
    # TODO: Validate input, create model, run forward pass, and count trainable parameters
    pass
`,
  solutionCode: `import torch
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
`,
  testCases: [
    {
      id: 't1',
      name: 'Architecture & Layer Verification',
      inputDescription: 'Instantiate SimpleMLP(4, 8, 2) with batch size 5',
      expectedOutput: 'fc1 is nn.Linear, relu is nn.ReLU, fc2 is nn.Linear, param_count=58, out_shape=(5, 2)'
    },
    {
      id: 't2',
      name: 'Feature Dimension Mismatch Error',
      inputDescription: 'x with last dimension 10 passed to in_features=4',
      expectedOutput: 'Raises ValueError("Input feature dimension mismatch")'
    },
    {
      id: 't3',
      name: 'Parameter Count Formula',
      inputDescription: 'Calculate (in*h + h) + (h*out + out) weights and biases',
      expectedOutput: 'param_count matches exact analytical count of weights + biases'
    }
  ],
  benchmarkTargetMs: 0.2,
  memoryTargetMb: 0.2,
  conceptPrimer: {
    title: 'Building Blocks of Neural Networks: nn.Module & Linear Layers',
    subtitle: 'Modular architecture definition, parameter management, and non-linearities',
    overview: 'PyTorch models subclass nn.Module. Layers declared in __init__ are automatically registered as model parameters. The forward method defines how inputs flow through layers to produce outputs.',
    mentalModel5s: 'Declare layers in __init__; connect them in forward(). Use model(x) to run.',
    visualAnalogy: 'Designing an electronic circuit board: __init__ solders the transistors and resistors onto the board; forward() traces the electrical current from input pins to output jacks.',
    pitfalls: [
      'Omitting super().__init__(), breaking parameter discovery.',
      'Stacking linear layers without activation functions, which mathematically simplifies to a single linear layer.'
    ],
    progressiveHints: [
      'Step 1: Subclass nn.Module and call super().__init__().',
      'Step 2: Assign self.fc1, self.relu, self.fc2.',
      'Step 3: Define forward(self, x).',
      'Step 4: Count parameters with sum(p.numel() for p in model.parameters()).'
    ],
    mathFormulas: [
      {
        title: 'Linear Layer Parameter Count',
        latex: 'P = (D_{\\text{in}} \\times D_{\\text{out}} + D_{\\text{out}})',
        explanation: 'Each linear layer contains weight matrix (Din x Dout) plus bias vector (Dout).'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Manual weight matrices and bias tensors
w1 = torch.randn(4, 8, requires_grad=True)
b1 = torch.zeros(8, requires_grad=True)
w2 = torch.randn(8, 2, requires_grad=True)
b2 = torch.zeros(2, requires_grad=True)
h = torch.relu(x @ w1 + b1)
out = h @ w2 + b2`,
      naiveExplanation: 'Requires manual parameter tracking, device transfers, and state dict serialization.',
      idiomaticCode: `# PyTorch nn.Module encapsulation
class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(4, 8)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(8, 2)
    def forward(self, x):
        return self.fc2(self.relu(self.fc1(x)))`,
      idiomaticExplanation: 'Automates parameter tracking, serialization (.state_dict), and GPU transfers (.to(device)).',
      speedupText: 'Clean encapsulation'
    },
    memoryLayout: {
      title: 'nn.Parameter Tensor Layout',
      content: 'Model parameters are instances of nn.Parameter (subclasses of torch.Tensor with requires_grad=True by default).',
      diagramAscii: `[Module] ──► _parameters: {"weight": Tensor[8, 4], "bias": Tensor[8]}`,
      keyRule: 'model.parameters() yields all trainable weights across all nested child modules.'
    },
    keyTakeaways: [
      'Always subclass nn.Module and invoke super().__init__().',
      'Stack non-linear activations between linear layers to allow learning non-linear functions.',
      'Always call model(x) rather than model.forward(x).'
    ]
  },
  expectedTensors: [
    { name: 'output', shape: '(B, Out)', dtype: 'float32' }
  ]
};

export const CHALLENGE_2: Challenge = {
  id: 'torch-p3-c2',
  dayId: 3,
  partId: 3,
  title: 'Custom Residual Skip Module',
  slug: 'custom-residual-skip-module',
  difficulty: 'Advanced',
  category: 'Neural Modules',
  summary: 'Build a deep learning residual block with an identity skip connection (y = F(x) + x) and projection shortcut, ensuring uninterrupted gradient propagation.',
  mentalModel5s: 'Residual blocks add input x directly to the transformed output F(x). The skip connection creates an uninterrupted gradient highway.',
  visualAnalogy: 'A busy multi-lane highway with an express toll-free bypass lane: even if the local streets (residual transformations) suffer from traffic jams (diminishing gradients), the bypass lane guarantees free-flowing traffic directly to the destination.',
  pitfalls: [
    'Trying to add tensors with mismatched dimensions without using a projection shortcut.',
    'Forgetting bias=False when using linear projection shortcuts in residual blocks.',
    'Mutating x in-place before adding it to F(x), corrupting the skip connection.'
  ],
  progressiveHints: [
    'Tier 1: In __init__, if out_features is None, set out_features = in_features.',
    'Tier 2: Build transformation branch F(x): self.linear1 = nn.Linear(in_features, out_features), self.relu = nn.ReLU(), self.linear2 = nn.Linear(out_features, out_features).',
    'Tier 3: Check in_features == out_features: if True, self.shortcut = nn.Identity(); otherwise self.shortcut = nn.Linear(in_features, out_features, bias=False).',
    'Tier 4: In forward(self, x), calculate fx and return fx + self.shortcut(x).'
  ],
  deepInternals: {
    title: 'Solving the Vanishing Gradient Problem with Residual Connections',
    content: 'By computing y = F(x) + x, the derivative w.r.t. input is dy/dx = dF/dx + I. Even if dF/dx approaches 0 through saturation, the identity gradient I prevents gradients from vanishing, allowing networks to scale to hundreds of layers.',
    keyRule: 'Identity shortcuts require zero additional parameters and maintain gradient magnitude across deep graphs.'
  },
  instructions: `Deep convolutional and transformer networks rely on residual skip connections to train effectively across deep architectures without vanishing gradients.

1. Create a class \`ResidualBlock(nn.Module)\` that:
   - In \`__init__(self, in_features: int, out_features: Optional[int] = None)\`:
     Calls the superclass initializer. Defaults \`out_features\` to \`in_features\` if not specified.
     Constructs the main transformation branch F(x) consisting of:
       - a first linear projection (\`self.linear1\`) from \`in_features\` to \`out_features\`
       - a rectified linear activation (\`self.relu\`)
       - a second linear projection (\`self.linear2\`) from \`out_features\` to \`out_features\`
     Constructs the residual shortcut path (\`self.shortcut\`):
       - If \`in_features == out_features\`, configure an identity mapping.
       - If \`in_features != out_features\`, configure a linear projection without bias to align feature dimensions.
   - In \`forward(self, x: torch.Tensor) -> torch.Tensor\`:
     Transforms \`x\` through the two linear projections and activation function, then adds the shortcut connection output and returns the combined sum.

2. Write a function \`build_residual_block(in_features: int, out_features: Optional[int] = None, x: Optional[torch.Tensor] = None) -> dict\` that:
   - Instantiates \`ResidualBlock\` with \`in_features\` and \`out_features\` as \`block\`.
   - If \`x\` is provided:
     - Validates that the trailing feature dimension matches \`in_features\`. If not, raise \`ValueError("Dimension mismatch")\`.
     - Evaluates \`output = block(x)\`.
     - Verifies that \`output\` numerically matches the sum of the transformation branch and shortcut branch, setting boolean \`residual_verified\`.
   - Returns a dictionary: \`{"block": block, "output": output, "residual_verified": bool(residual_verified), "out_shape": tuple(output.shape) if output is not None else None}\`.`,
  hints: [
    'Use nn.Identity() when in_features == out_features.',
    'Use nn.Linear(in_features, out_features, bias=False) when dimensions differ.',
    'In forward, add the shortcut to the transformed output: return fx + self.shortcut(x).',
    'Verify that torch.allclose(output, expected) holds true.'
  ],
  starterCode: `import torch
import torch.nn as nn
from typing import Optional

class ResidualBlock(nn.Module):
    """
    Residual block with identity skip connection: y = F(x) + shortcut(x).
    """
    def __init__(self, in_features: int, out_features: Optional[int] = None):
        super().__init__()
        # TODO: Configure transformation layers and shortcut path (identity vs linear)
        pass
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # TODO: Compute transformation and combine with shortcut connection
        pass

def build_residual_block(in_features: int, out_features: Optional[int] = None, x: Optional[torch.Tensor] = None) -> dict:
    """
    Construct ResidualBlock and evaluate forward pass.
    """
    # TODO: Build block, evaluate on x if provided, verify residual property
    pass
`,
  solutionCode: `import torch
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
`,
  testCases: [
    {
      id: 't1',
      name: 'Identity Shortcut for Equal Dimensions',
      inputDescription: 'in_features=16, out_features=16',
      expectedOutput: 'block.shortcut is instance of nn.Identity'
    },
    {
      id: 't2',
      name: 'Projection Shortcut for Differing Dimensions',
      inputDescription: 'in_features=8, out_features=16',
      expectedOutput: 'block.shortcut is nn.Linear with bias=False'
    },
    {
      id: 't3',
      name: 'Residual Property & Gradient Highway',
      inputDescription: 'Forward pass on x and backward loss.backward()',
      expectedOutput: 'residual_verified is True, x.grad is non-zero across all dimensions'
    }
  ],
  benchmarkTargetMs: 0.25,
  memoryTargetMb: 0.2,
  conceptPrimer: {
    title: 'Residual Networks & The Gradient Highway',
    subtitle: 'Identity shortcuts, projection layers, and deep gradient propagation',
    overview: 'Residual skip connections reformulate layer transformations as y = F(x) + x. By adding the original input directly to the transformed output, backpropagation maintains an uninterrupted gradient path back to early layers.',
    mentalModel5s: 'y = F(x) + x gives gradients an express highway directly back to input x.',
    visualAnalogy: 'A dual-carriageway road: local lanes provide transformation shops, while the express lane ensures traffic reaches the end of the line without impedance.',
    pitfalls: [
      'Using bias in the linear projection shortcut, which adds redundant bias parameters.'
    ],
    progressiveHints: [
      'Step 1: Check if in_features == out_features.',
      'Step 2: Assign nn.Identity() or nn.Linear(..., bias=False).',
      'Step 3: In forward, compute F(x) and add self.shortcut(x).',
      'Step 4: Verify residual equality with torch.allclose.'
    ],
    mathFormulas: [
      {
        title: 'Residual Addition & Gradient Rule',
        latex: 'y = \\mathcal{F}(x) + x \\implies \\frac{\\partial \\mathcal{L}}{\\partial x} = \\frac{\\partial \\mathcal{L}}{\\partial y} \\left( \\frac{\\partial \\mathcal{F}}{\\partial x} + \\mathbf{I} \\right)',
        explanation: 'The + I identity matrix term prevents the vanishing gradient problem in deep models.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Plain plain deep linear stack
class PlainDeepNet(nn.Module):
    def forward(self, x):
        for layer in self.layers:
            x = self.relu(layer(x))  # Vanishing gradients in deep layers!
        return x`,
      naiveExplanation: 'Gradients decay exponentially through repeated matrix multiplication.',
      idiomaticCode: `# ResNet skip connection
class ResBlock(nn.Module):
    def forward(self, x):
        return self.net(x) + x  # Uninterrupted gradient flow`,
      idiomaticExplanation: 'Gradients pass freely through the identity connection, stabilizing training.',
      speedupText: 'Stable deep gradient flow'
    },
    memoryLayout: {
      title: 'Residual Graph Branching',
      content: 'The input tensor x is referenced twice in the DAG: once into the transformation branch and once into the identity addition node.',
      diagramAscii: `[x] ──┬──► [Linear] ──► [ReLU] ──► [Linear] ──► [F(x)] ──┐
      │                                                   ├──► [+ Add Node] ──► [y]
      └──────────────────────────────────► [Shortcut] ───┘`,
      keyRule: 'Gradients split and accumulate at branch points during backward propagation.'
    },
    keyTakeaways: [
      'Use identity shortcuts when input and output feature dimensions match.',
      'Use 1x1 or linear projections without bias when dimensions change.',
      'Residual connections allow training networks with hundreds of layers.'
    ]
  },
  expectedTensors: [
    { name: 'output', shape: '(B, Out)', dtype: 'float32' }
  ]
};

export const DAY03_TRACK: DayTrack = {
  partNumber: 3,
  partId: 3,
  dayNumber: 3,
  id: 3,
  title: 'Part 3: Building Neural Network Modules',
  subtitle: 'Master nn.Module subclassing, linear layers, activation functions, and residual skip connections',
  description: 'Construct modular neural network architectures with PyTorch torch.nn. Learn how to subclass nn.Module, define trainable parameters with nn.Linear, apply non-linear activations (ReLU, Sigmoid), inspect parameter counts, and implement residual skip connections for deep networks.',
  iconName: 'Boxes',
  badge: 'Part 3 • Neural Modules',
  libraryMechanics: {
    libraryName: 'PyTorch torch.nn Module System',
    tagline: 'Object-oriented neural network architecture construction with automatic parameter management.',
    overview: `### 🌟 The torch.nn Module Architecture
In PyTorch, all neural networks are built by composing \`nn.Module\` classes.

An \`nn.Module\` encapsulates:
1. **Trainable Parameters:** Weights and biases stored as \`nn.Parameter\` instances.
2. **Submodules:** Child modules nested within parents.
3. **Execution Dataflow:** Defined in the \`forward()\` method.

PyTorch automatically handles parameter registration, state saving/loading (\`state_dict\`), hardware transfers (\`.to(device)\`), and execution hooks.`,
    whyItExists: `Writing neural networks by manually managing raw weight tensors requires tracking dozens of matrices, manually zeroing gradients, and handcrafting serialization code.

\`torch.nn\` provides:
- **Automatic Parameter Discovery:** \`model.parameters()\` gathers all weights from all submodules recursively.
- **Hook Ecosystem:** Inspect or modify activations during forward and backward passes.
- **Standard Layer Zoo:** Out-of-the-box implementations of linear layers, convolutions, attention modules, normalizations, and activations.`,
    coreAnatomy: {
      objectName: 'torch.nn.Module',
      description: 'Base class for all neural network modules in PyTorch, providing parameter tracking and forward execution.',
      fields: [
        {
          name: '_parameters',
          type: 'dict[str, Parameter]',
          role: 'Dictionary storing all trainable weights and biases registered on this module.'
        },
        {
          name: '_modules',
          type: 'dict[str, Module]',
          role: 'Dictionary storing all child submodules contained within this module.'
        },
        {
          name: 'training',
          type: 'bool',
          role: 'Flag toggling between training mode (model.train()) and evaluation mode (model.eval()).'
        }
      ],
      memoryDiagramAscii: `+=============================================================+
|                      torch.nn.Module ANATOMY                |
+=============================================================+
  [MyModel: nn.Module]
    ├── _parameters: {}
    └── _modules:
          ├── 'fc1': nn.Linear(4, 8) ──► weight: [8, 4], bias: [8]
          ├── 'relu': nn.ReLU()
          └── 'fc2': nn.Linear(8, 2) ──► weight: [2, 8], bias: [2]`
    },
    chapters: [
      {
        id: 'ch1-nn-module-subclassing',
        title: 'Subclassing torch.nn.Module',
        icon: 'Boxes',
        summary: 'Learn the two essential methods of every PyTorch module: __init__ and forward.',
        markdownContent: `### Subclassing nn.Module

To build custom neural networks in PyTorch:
1. Subclass \`nn.Module\`.
2. Always call \`super().__init__()\` first in \`__init__\`.
3. Declare layers as attributes on \`self\`.
4. Define the computation graph in \`forward(self, x)\`.

\`\`\`python
import torch
import torch.nn as nn

class Classifier(nn.Module):
    def __init__(self, in_features, num_classes):
        super().__init__()
        self.fc = nn.Linear(in_features, num_classes)
        
    def forward(self, x):
        return self.fc(x)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-mlp-forward',
            title: 'Instantiating and evaluating an MLP',
            code: `import torch
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(4, 8),
    nn.ReLU(),
    nn.Linear(8, 2)
)

x = torch.randn(2, 4)
out = model(x)
print("Output shape:", out.shape)`,
            expectedOutput: `Output shape: torch.Size([2, 2])`,
            explanation: 'model(x) passes input through the layers sequentially.'
          }
        ]
      },
      {
        id: 'ch2-residual-connections',
        title: 'Residual Connections (ResNets)',
        icon: 'GitBranch',
        summary: 'Overcoming vanishing gradients in deep networks with identity skip connections.',
        markdownContent: `### Residual Skip Connections

A residual block computes:
$$y = \\mathcal{F}(x) + x$$

The addition of the input $x$ creates an uninterrupted gradient highway:
- Forward pass: features learn residual differences $\\mathcal{F}(x) = y - x$.
- Backward pass: gradients flow through the $+ x$ identity branch directly to earlier layers.`,
        codeSnippets: [
          {
            id: 'snip-res-forward',
            title: 'Residual forward pass',
            code: `import torch
import torch.nn as nn

class ResBlock(nn.Module):
    def __init__(self, d):
        super().__init__()
        self.fc = nn.Linear(d, d)
        self.act = nn.ReLU()
    def forward(self, x):
        return self.act(self.fc(x)) + x

block = ResBlock(4)
x = torch.ones(1, 4)
out = block(x)
print("Residual output shape:", out.shape)`,
            expectedOutput: `Residual output shape: torch.Size([1, 4])`,
            explanation: 'Input x is preserved and added to transformed features.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Calling model.forward(x) Directly',
        badSnippet: `output = model.forward(x)  # Bypasses PyTorch hook system!`,
        badExplanation: 'Directly invoking forward() misses forward hooks, profilers, and internal state checks.',
        goodSnippet: `output = model(x)  # Properly triggers __call__ and hooks`,
        goodExplanation: 'Always call the module instance directly to ensure all PyTorch plumbing runs.',
        perfImpact: 'Prevents silent hook failures and debugging discrepancies.'
      },
      {
        title: 'Forgetting super().__init__()',
        badSnippet: `class MyNet(nn.Module):
    def __init__(self):
        # Missing super().__init__()!
        self.fc = nn.Linear(10, 2)`,
        badExplanation: 'Fails with AttributeError because PyTorch internal module dictionaries are uninitialized.',
        goodSnippet: `class MyNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 2)`,
        goodExplanation: 'Always initialize the nn.Module base class as the very first line in __init__.',
        perfImpact: 'Prevents initialization crashes.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'nn.Module',
        category: 'Core',
        signature: 'class torch.nn.Module()',
        summary: 'Base class for all neural network modules.',
        parameters: [],
        returns: 'Module instance.',
        exampleSnippet: 'class Net(nn.Module): def __init__(self): super().__init__()'
      },
      {
        name: 'nn.Linear',
        category: 'Layers',
        signature: 'torch.nn.Linear(in_features, out_features, bias=True)',
        summary: 'Applies an affine linear transformation: y = x A^T + b.',
        parameters: [
          { name: 'in_features', type: 'int', desc: 'Size of each input sample.' },
          { name: 'out_features', type: 'int', desc: 'Size of each output sample.' },
          { name: 'bias', type: 'bool', desc: 'If set to False, the layer will not learn an additive bias.' }
        ],
        returns: 'Linear layer module.',
        exampleSnippet: 'fc = nn.Linear(64, 32)'
      },
      {
        name: 'nn.ReLU',
        category: 'Activations',
        signature: 'torch.nn.ReLU(inplace=False)',
        summary: 'Applies the rectified linear unit function element-wise: ReLU(x) = max(0, x).',
        parameters: [
          { name: 'inplace', type: 'bool', desc: 'Can optionally do the operation in-place.' }
        ],
        returns: 'ReLU activation module.',
        exampleSnippet: 'act = nn.ReLU()'
      },
      {
        name: 'model.parameters',
        category: 'Inspection',
        signature: 'model.parameters(recurse=True)',
        summary: 'Returns an iterator over module parameters.',
        parameters: [
          { name: 'recurse', type: 'bool', desc: 'If True, yields parameters of this module and all submodules.' }
        ],
        returns: 'Iterator of torch.nn.Parameter.',
        exampleSnippet: 'params = list(model.parameters())'
      }
    ],
    interactiveWidgetType: 'pytorch-nn'
  },
  challenges: [CHALLENGE_1, CHALLENGE_2]
};

export const PYTORCH_PART03_TRACK = DAY03_TRACK;
export const testCases = [...CHALLENGE_1.testCases, ...CHALLENGE_2.testCases];
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY03_TRACK;
