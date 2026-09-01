import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const CHALLENGE_1: Challenge = {
  id: 'torch-p2-c1',
  dayId: 2,
  partId: 2,
  title: 'Polynomial Gradient Calculator',
  slug: 'polynomial-gradient-calculator',
  difficulty: 'Intermediate',
  category: 'Autograd & Graphs',
  summary: 'Compute exact partial derivatives of a multivariable polynomial function using PyTorch reverse-mode autograd.',
  mentalModel5s: 'Autograd records a tape of operations during the forward pass; .backward() replays the tape in reverse applying the chain rule.',
  visualAnalogy: 'Imagine an artist filming every brush stroke in reverse: by rewinding the video from finished painting back to bare canvas, we know exactly how much each paint color contributed to every pixel.',
  pitfalls: [
    'Forgetting requires_grad=True when creating leaf tensors, which prevents gradient tracking.',
    'Forgetting that calling .backward() requires a scalar (0D) loss, or passing a vector without gradient arguments.',
    'Forgetting that gradients accumulate (.grad += ...) across multiple backward calls unless zeroed.'
  ],
  progressiveHints: [
    'Tier 1: Initialize tensors with torch.tensor(float(x_val), dtype=torch.float32, requires_grad=True).',
    'Tier 2: Calculate the polynomial loss: a * (x ** 3) + b * (y ** 2) + c * (x * z) + d * z.',
    'Tier 3: Call loss.backward() to execute reverse-mode automatic differentiation.',
    'Tier 4: Extract scalar float gradients using x.grad.item(), y.grad.item(), and z.grad.item().'
  ],
  deepInternals: {
    title: 'Reverse-Mode AD & Vector-Jacobian Products (VJP)',
    content: 'For a function with many inputs and scalar output, reverse-mode AD computes all input gradients in a single backward pass of O(1) complexity relative to the forward pass, unlike forward-mode AD which requires O(N) passes.',
    keyRule: 'Leaf tensors created directly by the user retain gradients in .grad; non-leaf intermediate tensors deallocate gradients by default to conserve memory.'
  },
  instructions: `Neural network optimization relies on accurate gradient computation via the multivariable chain rule.

Consider the multivariable polynomial function:
\`f(x, y, z) = a * x^3 + b * y^2 + c * x * z + d * z\`

Write a function \`compute_polynomial_gradients(x_val: float, y_val: float, z_val: float, a: float = 2.0, b: float = 3.0, c: float = 4.0, d: float = 5.0) -> dict\` that:
1. Creates scalar float32 PyTorch tensors for \`x\`, \`y\`, and \`z\` initialized with \`x_val\`, \`y_val\`, and \`z_val\`, all with \`requires_grad=True\`.
2. Computes the scalar value \`loss\` representing f(x, y, z).
3. Executes backpropagation by calling \`loss.backward()\`.
4. Extracts the analytical gradients from \`x.grad\`, \`y.grad\`, and \`z.grad\` as Python floats using \`.item()\`.
5. Returns a dictionary containing:
   \`{"loss": float(loss.item()), "grad_x": float(x.grad.item()), "grad_y": float(y.grad.item()), "grad_z": float(z.grad.item()), "has_grad": True}\``,
  hints: [
    'Set requires_grad=True on each input tensor: torch.tensor(float(v), dtype=torch.float32, requires_grad=True).',
    'Construct the loss equation using standard Python math operators.',
    'Execute backpropagation with loss.backward().',
    'Retrieve float gradients with .item(): x.grad.item().'
  ],
  starterCode: `import torch

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
`,
  solutionCode: `import torch

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
`,
  testCases: [
    {
      id: 't1',
      name: 'Default Coefficients Analytical Verification',
      inputDescription: 'x_val=1.0, y_val=2.0, z_val=3.0, default coefficients (a=2, b=3, c=4, d=5)',
      expectedOutput: 'loss=41.0, grad_x=18.0 (3*2*1^2 + 4*3), grad_y=12.0 (2*3*2), grad_z=9.0 (4*1 + 5)'
    },
    {
      id: 't2',
      name: 'Custom Negative Coordinates',
      inputDescription: 'x_val=-2.0, y_val=3.0, z_val=0.5, a=1.0, b=2.0, c=3.0, d=-1.0',
      expectedOutput: 'loss=6.5, grad_x=13.5, grad_y=12.0, grad_z=-7.0'
    },
    {
      id: 't3',
      name: 'Gradient Availability Guard',
      inputDescription: 'Verify has_grad is True and grads are non-None numeric floats',
      expectedOutput: 'has_grad is True, all gradient components are populated'
    }
  ],
  benchmarkTargetMs: 0.15,
  memoryTargetMb: 0.1,
  conceptPrimer: {
    title: 'Autograd & Reverse-Mode Automatic Differentiation',
    subtitle: 'Computing exact derivatives across dynamic Directed Acyclic Graphs',
    overview: 'Autograd records mathematical operations executed on tensors with requires_grad=True. When loss.backward() is invoked, the engine applies the chain rule backwards to populate .grad attributes on leaf tensors.',
    mentalModel5s: 'Forward pass builds the tape; .backward() traverses the tape in reverse to compute gradients.',
    visualAnalogy: 'Leaving breadcrumbs along a hiking trail (forward pass); following the breadcrumbs in reverse to return home while measuring the total slope change (.backward()).',
    pitfalls: [
      'Gradients accumulate by default (.grad += new_grad); failing to zero them causes runaway gradient values.',
      'Calling backward on non-scalar tensors without passing an explicit gradient argument.'
    ],
    progressiveHints: [
      'Step 1: Set requires_grad=True on input tensors.',
      'Step 2: Construct the polynomial expression.',
      'Step 3: Call loss.backward().',
      'Step 4: Read out .grad.item().'
    ],
    mathFormulas: [
      {
        title: 'Polynomial Partial Derivatives',
        latex: '\\frac{\\partial f}{\\partial x} = 3 a x^2 + c z, \\quad \\frac{\\partial f}{\\partial y} = 2 b y, \\quad \\frac{\\partial f}{\\partial z} = c x + d',
        explanation: 'Analytical partial derivatives computed automatically by PyTorch autograd engine.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Manual symbolic calculus or numerical finite differences
eps = 1e-5
grad_x = (f(x + eps, y, z) - f(x - eps, y, z)) / (2 * eps)`,
      naiveExplanation: 'Prone to floating-point truncation error and requires separate evaluations for every parameter.',
      idiomaticCode: `# PyTorch automatic differentiation
loss = f(x, y, z)
loss.backward()
grad_x = x.grad.item()`,
      idiomaticExplanation: 'Exact analytical gradients calculated in a single backward pass.',
      speedupText: 'Exact precision, O(1) pass'
    },
    memoryLayout: {
      title: 'Dynamic Graph DAG Nodes',
      content: 'Each intermediate operation creates a Node with references to saved tensors and upstream functions.',
      diagramAscii: `[x] (leaf) ──► [* Mul Node] ──► [Loss Node] (grad_fn=<AddBackward0>)`,
      keyRule: 'Leaf tensors are nodes with no grad_fn that were created by the user.'
    },
    keyTakeaways: [
      'Set requires_grad=True on tensors you want to optimize.',
      'Call .backward() on scalar loss to compute gradients.',
      'Access computed gradients via tensor.grad.'
    ]
  },
  expectedTensors: [
    { name: 'loss', shape: '()', dtype: 'float32' }
  ]
};

export const CHALLENGE_2: Challenge = {
  id: 'torch-p2-c2',
  dayId: 2,
  partId: 2,
  title: 'No-Grad Inference Guard',
  slug: 'no-grad-inference-guard',
  difficulty: 'Intermediate',
  category: 'Autograd & Graphs',
  summary: 'Evaluate linear forward passes in training mode vs torch.no_grad() inference mode, and verify computational graph detachment with .detach().',
  mentalModel5s: 'torch.no_grad() turns off the recording tape to save memory during inference; .detach() cuts a tensor loose from the graph.',
  visualAnalogy: 'Running a dashcam while driving (training mode records tape) vs turning off the dashcam to save battery and storage when parked (torch.no_grad()).',
  pitfalls: [
    'Evaluating a model in production without torch.no_grad(), causing progressive GPU VRAM leaks until an Out Of Memory (OOM) crash.',
    'Mutating a detached tensor in-place when that tensor is still required by an active autograd graph.'
  ],
  progressiveHints: [
    'Tier 1: Check weights.requires_grad and bias.requires_grad; ensure both are True.',
    'Tier 2: Compute y_train = torch.matmul(x, weights) + bias and check y_train.requires_grad and y_train.grad_fn.',
    'Tier 3: In a with torch.no_grad(): block, compute y_infer and inspect its flags (both should be False/None).',
    'Tier 4: Call y_train.detach() to get y_detached and return all flags in a dictionary.'
  ],
  deepInternals: {
    title: 'Autograd Tape Overhead & Memory Conservation',
    content: 'When autograd is active, every intermediate activation must be retained in memory until the backward pass completes. In inference, we only need the final output, so torch.no_grad() deallocates intermediates immediately.',
    keyRule: 'Always wrap validation and production inference loops inside torch.no_grad() or torch.inference_mode().'
  },
  instructions: `During model deployment and validation, gradient tracking is not only unnecessary—it builds computation graphs that waste GPU VRAM and cause severe memory leaks.

Write a function \`evaluate_inference_no_grad(weights: torch.Tensor, bias: torch.Tensor, x: torch.Tensor) -> dict\` that:
1. Ensures that \`weights\` and \`bias\` have gradient tracking enabled (\`requires_grad=True\`).
2. Executes a standard linear forward pass: \`y_train = torch.matmul(x, weights) + bias\`.
3. Executes the exact same linear forward pass inside a \`with torch.no_grad():\` context manager:
   \`y_infer = torch.matmul(x, weights) + bias\`.
4. Creates a detached tensor \`y_detached = y_train.detach()\`.
5. Gathers graph metadata:
   - \`train_requires_grad\`: boolean flag of \`y_train.requires_grad\`
   - \`infer_requires_grad\`: boolean flag of \`y_infer.requires_grad\`
   - \`train_grad_fn\`: boolean flag indicating whether \`y_train.grad_fn is not None\`
   - \`infer_grad_fn\`: boolean flag indicating whether \`y_infer.grad_fn is not None\`
   - \`detached_requires_grad\`: boolean flag of \`y_detached.requires_grad\`
6. Returns a dictionary containing:
   \`{"y_train": y_train, "y_infer": y_infer, "y_detached": y_detached, "train_requires_grad": train_requires_grad, "infer_requires_grad": infer_requires_grad, "train_grad_fn": train_grad_fn, "infer_grad_fn": infer_grad_fn, "detached_requires_grad": detached_requires_grad}\``,
  hints: [
    'Use tensor.requires_grad_(True) if requires_grad is not already enabled.',
    'Wrap inference code inside with torch.no_grad(): to disable the autograd engine.',
    'Use tensor.detach() to sever an existing tensor from the graph.',
    'Check tensor.grad_fn is not None to detect active backward graph nodes.'
  ],
  starterCode: `import torch

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
`,
  solutionCode: `import torch

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
`,
  testCases: [
    {
      id: 't1',
      name: 'Numerical Consistency Between Modes',
      inputDescription: 'W (2x2), b (2), x (1x2) with requires_grad=True',
      expectedOutput: 'y_train, y_infer, and y_detached are numerically identical'
    },
    {
      id: 't2',
      name: 'Graph Tracking Flag Verification',
      inputDescription: 'Compare autograd tracking across training vs no_grad vs detach',
      expectedOutput: 'train_requires_grad=True, infer_requires_grad=False, detached_requires_grad=False'
    },
    {
      id: 't3',
      name: 'Inference Backward Safety',
      inputDescription: 'Calling backward on y_infer.sum()',
      expectedOutput: 'Raises RuntimeError because element requires_grad is False'
    }
  ],
  benchmarkTargetMs: 0.15,
  memoryTargetMb: 0.1,
  conceptPrimer: {
    title: 'Inference Optimization & Graph Detachment',
    subtitle: 'Controlling memory usage and disabling gradient computation',
    overview: 'During evaluation and production inference, tracking operations creates unnecessary computational graph nodes and prevents activation tensors from being deallocated. Wrapping code in torch.no_grad() eliminates this overhead.',
    mentalModel5s: 'Use torch.no_grad() for blocks of inference code; use .detach() to sever specific tensors from the graph.',
    visualAnalogy: 'Tethering a balloon to a post (requires_grad connects tensor to DAG) vs cutting the tether with scissors (.detach()).',
    pitfalls: [
      'Forgetting torch.no_grad() in validation loops, leading to memory accumulation and GPU Out-of-Memory crashes.'
    ],
    progressiveHints: [
      'Step 1: Compute training pass and note y_train.requires_grad.',
      'Step 2: Wrap forward pass in with torch.no_grad(): and note y_infer.requires_grad.',
      'Step 3: Call y_train.detach() to get an unhooked tensor.',
      'Step 4: Return all values and verification flags.'
    ],
    mathFormulas: [
      {
        title: 'Linear Forward Transformation',
        latex: 'y = x W + b',
        explanation: 'Affine transformation computed identically in training and inference modes.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Inference without no_grad
outputs = []
for batch in val_loader:
    out = model(batch)  # Builds huge graph in VRAM!
    outputs.append(out)`,
      naiveExplanation: 'Builds graph nodes on every batch, causing VRAM memory usage to grow until an OOM crash.',
      idiomaticCode: `# Memory-guarded inference
with torch.no_grad():
    for batch in val_loader:
        out = model(batch)
        outputs.append(out)`,
      idiomaticExplanation: 'Disables graph construction, keeping memory constant and accelerating evaluation.',
      speedupText: '50% less memory, 20% faster'
    },
    memoryLayout: {
      title: 'Detached Storage vs Connected DAG',
      content: 'A detached tensor points to the same storage buffer as the source tensor, but its grad_fn pointer is set to nullptr.',
      diagramAscii: `[y_train] ──► [grad_fn: <AddBackward0>]
[y_detached] ──► [grad_fn: None] (Both share data storage)`,
      keyRule: 'Detached tensors do not propagate gradients during .backward().'
    },
    keyTakeaways: [
      'Always wrap validation and inference code in with torch.no_grad():',
      'Use .detach() when you need to use a tensor value in downstream code without backpropagating into it.',
      'Numerical outputs of forward passes are identical with or without autograd.'
    ]
  },
  expectedTensors: [
    { name: 'y_train', shape: '(B, Out)', dtype: 'float32' },
    { name: 'y_infer', shape: '(B, Out)', dtype: 'float32' },
    { name: 'y_detached', shape: '(B, Out)', dtype: 'float32' }
  ]
};

export const DAY02_TRACK: DayTrack = {
  partNumber: 2,
  partId: 2,
  dayNumber: 2,
  id: 2,
  title: 'Part 2: Autograd & Computation Graphs',
  subtitle: 'Master reverse-mode automatic differentiation, gradient accumulation, and inference guards',
  description: 'Understand the dynamic Directed Acyclic Graph (DAG) constructed by PyTorch. Master requires_grad=True, Vector-Jacobian Products, backward traversal, gradient accumulation semantics, and memory conservation using torch.no_grad() and .detach().',
  iconName: 'Network',
  badge: 'Part 2 • Autograd & Graphs',
  libraryMechanics: {
    libraryName: 'PyTorch Autograd Engine',
    tagline: 'Dynamic reverse-mode automatic differentiation with tape-based execution.',
    overview: `### 🌟 The Autograd Engine: Heart of Deep Learning
PyTorch uses a "define-by-run" framework. Rather than compiling a static computation graph ahead of time, PyTorch records operations eagerly as your Python code executes.

Every operation performed on tensors with \`requires_grad=True\` dynamically creates a backward operator \`Node\` (visible on \`tensor.grad_fn\`). When \`.backward()\` is called on a scalar loss, PyTorch traverses this DAG in reverse topological order, multiplying incoming gradients by local derivatives via the chain rule.`,
    whyItExists: `Manual gradient computation for modern neural networks with hundreds of millions of parameters is mathematically intractable.

Autograd gives you:
- **Exact analytical derivatives:** No numerical approximations or truncation errors.
- **Pythonic control flow:** Use standard Python \`if\` statements, \`for\` loops, and recursion—autograd traces whatever executed!
- **Zero memory leaks with no_grad:** Complete control over when the computation graph is created.`,
    coreAnatomy: {
      objectName: 'torch.autograd.Node',
      description: 'A backward execution node that stores saved activations and implements the Vector-Jacobian Product (VJP).',
      fields: [
        {
          name: 'requires_grad',
          type: 'bool',
          role: 'Flag specifying whether the tensor tracks operations for gradient calculation.'
        },
        {
          name: 'grad',
          type: 'torch.Tensor | None',
          role: 'Accumulated gradient tensor populated after calling .backward().'
        },
        {
          name: 'grad_fn',
          type: 'torch.autograd.Node | None',
          role: 'Reference to the operation node that generated this tensor (None for leaf tensors).'
        },
        {
          name: 'is_leaf',
          type: 'bool',
          role: 'True if tensor was created by user or is a model parameter; only leaf tensors retain .grad by default.'
        }
      ],
      memoryDiagramAscii: `+=============================================================+
|                 AUTOGRAD COMPUTATION GRAPH DAG              |
+=============================================================+
  [Leaf x] (requires_grad=True) ──┐
                                  ├──► [* Mul Node] ──► [z]
  [Leaf w] (requires_grad=True) ──┘       (<MulBackward0>)  |
                                                            v
  [Leaf b] (requires_grad=True) ───────────────────► [+ Add Node] ──► [Loss]
                                                       (<AddBackward0>)`
    },
    chapters: [
      {
        id: 'ch1-autograd-basics',
        title: 'Building Computation Graphs with requires_grad',
        icon: 'Network',
        summary: 'How PyTorch links tensors through backward nodes during forward evaluation.',
        markdownContent: `### Tracking Gradients

When you create a tensor with \`requires_grad=True\`, PyTorch begins recording operations:

\`\`\`python
import torch

x = torch.tensor(3.0, requires_grad=True)
y = x ** 2 + 5  # y = 3^2 + 5 = 14
print("y.grad_fn:", y.grad_fn)  # <AddBackward0>

# Backpropagate
y.backward()
print("x.grad (dy/dx = 2x):", x.grad)  # 6.0
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-autograd-demo',
            title: 'Simple gradient computation',
            code: `import torch

w = torch.tensor(4.0, requires_grad=True)
b = torch.tensor(2.0, requires_grad=True)
x = 3.0

y = w * x + b
y.backward()

print("dL/dw:", w.grad.item())  # 3.0
print("dL/db:", b.grad.item())  # 1.0`,
            expectedOutput: `dL/dw: 3.0
dL/db: 1.0`,
            explanation: 'w.grad reflects dy/dw = x = 3.0, and b.grad reflects dy/db = 1.0.'
          }
        ]
      },
      {
        id: 'ch2-no-grad-inference',
        title: 'Memory Optimization with torch.no_grad',
        icon: 'Shield',
        summary: 'Turning off autograd during validation and production inference to prevent memory leaks.',
        markdownContent: `### Inference with torch.no_grad()

During model evaluation or inference, computing gradients is unnecessary and wastes VRAM:

\`\`\`python
import torch

with torch.no_grad():
    # Inside this block, no DAG is recorded
    output = model(input_data)
\`\`\`

You can also detach a specific tensor from the graph using \`tensor.detach()\`.`,
        codeSnippets: [
          {
            id: 'snip-no-grad',
            title: 'Inference without graph construction',
            code: `import torch

w = torch.tensor(2.0, requires_grad=True)
x = torch.tensor(3.0)

with torch.no_grad():
    y = w * x

print("Requires grad?", y.requires_grad)
print("grad_fn:", y.grad_fn)`,
            expectedOutput: `Requires grad? False
grad_fn: None`,
            explanation: 'torch.no_grad() prevents graph node construction and disables gradient tracking.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Forgetting to Zero Gradients in Training Loops',
        badSnippet: `for epoch in range(10):
    loss = model(x)
    loss.backward()  # Gradients accumulate!`,
        badExplanation: 'PyTorch accumulates gradients (param.grad += new_grad) on every backward call.',
        goodSnippet: `for epoch in range(10):
    optimizer.zero_grad()  # or model.zero_grad()
    loss = model(x)
    loss.backward()`,
        goodExplanation: 'Always zero gradients before backpropagation to prevent accumulating stale gradients.',
        perfImpact: 'Prevents divergent gradient updates and exploding loss values.'
      },
      {
        title: 'Evaluating Models Without torch.no_grad()',
        badSnippet: `# Validation loop without no_grad
for val_x, val_y in val_loader:
    pred = model(val_x)  # Accumulates graphs in VRAM!`,
        badExplanation: 'Retains all forward activation tensors in GPU memory, eventually triggering CUDA OOM.',
        goodSnippet: `with torch.no_grad():
    for val_x, val_y in val_loader:
        pred = model(val_x)`,
        goodExplanation: 'Frees activations immediately and accelerates validation runtime.',
        perfImpact: 'Reduces peak GPU memory usage by up to 60% and increases inference speed.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'tensor.backward',
        category: 'Autograd',
        signature: 'tensor.backward(gradient=None, retain_graph=None, create_graph=False)',
        summary: 'Computes the sum of gradients of current tensor w.r.t. graph leaves.',
        parameters: [
          { name: 'gradient', type: 'Tensor | None', desc: 'Gradient w.r.t. the tensor; required if tensor is non-scalar.' }
        ],
        returns: 'None (populates .grad on leaf tensors).',
        exampleSnippet: 'loss.backward()'
      },
      {
        name: 'torch.no_grad',
        category: 'Context',
        signature: 'torch.no_grad()',
        summary: 'Context-manager that disables gradient calculation.',
        parameters: [],
        returns: 'ContextManager disabling autograd.',
        exampleSnippet: 'with torch.no_grad(): y = model(x)'
      },
      {
        name: 'tensor.detach',
        category: 'Autograd',
        signature: 'tensor.detach()',
        summary: 'Returns a new Tensor, detached from the current graph.',
        parameters: [],
        returns: 'Tensor sharing storage but severed from DAG.',
        exampleSnippet: 'y_clean = y.detach()'
      },
      {
        name: 'tensor.item',
        category: 'Extraction',
        signature: 'tensor.item()',
        summary: 'Returns the value of this tensor as a standard Python number (only for 1-element tensors).',
        parameters: [],
        returns: 'Python float or int.',
        exampleSnippet: 'scalar_val = loss.item()'
      }
    ],
    interactiveWidgetType: 'pytorch-autograd'
  },
  challenges: [CHALLENGE_1, CHALLENGE_2]
};

export const PYTORCH_PART02_TRACK = DAY02_TRACK;
export const testCases = [...CHALLENGE_1.testCases, ...CHALLENGE_2.testCases];
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY02_TRACK;
