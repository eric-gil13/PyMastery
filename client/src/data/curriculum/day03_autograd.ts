import type { DayTrack } from '../../types';

export const DAY03_TRACK: DayTrack = {
  partNumber: 3,
  partId: 3,
  dayNumber: 3,
  id: 3,
  title: 'Part 3: PyTorch Autograd & Computational Graph DAGs',
  subtitle: 'Dynamic DAG execution, exact Vector-Jacobian Products (VJP), and memory-efficient activation saving',
  description: 'Deconstruct PyTorch reverse-mode automatic differentiation. Master dynamic computational graph construction, grad_fn operator nodes, custom torch.autograd.Function implementations with analytical gradients, activation caching, and numerical gradient verification.',
  iconName: 'Network',
  badge: 'Part 3 • Autograd',
  libraryMechanics: {
    libraryName: 'PyTorch Dynamic Computational Graph & Autograd Engine',
    tagline: 'Deconstruct reverse-mode automatic differentiation, dynamic DAG construction, exact Vector-Jacobian Products (VJP), and memory-efficient activation caching.',
    overview: 'PyTorch employs a tape-based, dynamic automatic differentiation engine (Autograd). Unlike static computation graph frameworks that compile a fixed graph upfront, PyTorch constructs a dynamic Directed Acyclic Graph (DAG) on-the-fly during the forward pass ("define-by-run"). Every mathematical operation executed on tensors with requires_grad=True dynamically instantiates a backward operator Node (recorded in tensor.grad_fn). When .backward() is invoked, the engine traverses this graph in reverse topological order, evaluating Vector-Jacobian Products (VJPs) and accumulating gradients into leaf tensors while automatically deallocating intermediate node buffers.',
    whyItExists: 'In deep learning optimization, scalar objective losses L in R are differentiated with respect to millions or billions of parameters theta in R^P. Forward-mode automatic differentiation requires computing the full Jacobian matrix J in R^{M x P} through P separate forward passes (an O(P) computational complexity that is intractable for large networks). Reverse-mode automatic differentiation (Backpropagation) computes the exact gradient via Vector-Jacobian Products (VJP) v_bar * J = (dL/dy) * (dy/dx) in a single O(1) backward traversal. Writing custom torch.autograd.Function operators allows developers to fuse multi-operator computational subgraphs, perform analytical derivative cancellations, eliminate intermediate activation tensor allocations in VRAM, and achieve optimal GPU memory throughput.',
    coreAnatomy: {
      objectName: 'Tensor & Node',
      description: 'At the C++ core (c10::TensorImpl and torch::autograd::Node), the computational graph consists of Tensor metadata wrappers pointing to contiguous memory storage, linked backward by Node operators that hold closures, execution functions, and references to upstream parent nodes.',
      memoryDiagramAscii: `+========================================================================================+
|                       PYTORCH AUTOGRAD TENSOR & DAG ANATOMY                           |
+========================================================================================+

  [Leaf Tensor: x] (requires_grad=True, is_leaf=True)
  +------------------------------------------------------------------------------------+
  |  .data: Storage pointer [0x7f80...] -> 1D contiguous RAM/VRAM buffer (Float32)     |
  |  .grad: Accumulated gradient dL/dx [None until .backward()]                         |
  |  .grad_fn: None (since it is a leaf created by user)                               |
  +------------------------------------------------------------------------------------+
                                     \\
                                      \\  (Forward Pass: defines-by-run)
                                       v
  [Leaf Tensor: w] -------------> [* Mul Node] ----> [Tensor z] ---> [+ Add Node] ---> [Loss]
  (requires_grad=True)           (<MulBackward0>)   (grad_fn=<Mul>)  (<AddBackward0>)   (L)
                                  |                  |                |                  |
                                  |                  v                |                  v
                                  | ctx.saved_tensors:[x, w]          | ctx.saved_tensors:[b]
                                  |                                   |                  |
  +===============================|===================================|==================|==+
  | REVERSE-MODE BACKWARD (VJP)   v                                   v                  v  |
  |  Accumulate grad:        w.grad += v * x                     z.grad = v * 1    dL/dL = 1|
  |  dL/dw = dL/dz * dz/dw   x.grad += v * w                     b.grad += v * 1            |
  +=========================================================================================+`,
      fields: [
        {
          name: 'data',
          type: 'Storage (c10::Storage)',
          role: 'Pointer to underlying contiguous 1D memory buffer holding raw numerical array values in host RAM or GPU VRAM.'
        },
        {
          name: 'grad',
          type: 'Tensor | None',
          role: 'Accumulated gradient tensor (dL/dx) matching the tensor shape and dtype, populated after backward pass on leaf tensors.'
        },
        {
          name: 'grad_fn',
          type: 'Node | None',
          role: 'Reference to the backward operator graph Node (<AddBackward0>, <MulBackward0>, etc.) that created this tensor; None for leaf tensors.'
        },
        {
          name: 'requires_grad',
          type: 'bool',
          role: 'Flag indicating whether the autograd engine must track operations on this tensor and construct backward graph edges.'
        },
        {
          name: 'is_leaf',
          type: 'bool',
          role: 'True if tensor was created explicitly by the user or as an nn.Parameter (has no grad_fn); autograd only retains .grad on leaf nodes by default.'
        },
        {
          name: '_version',
          type: 'int',
          role: 'Internal mutation counter incremented on every in-place modification, used by autograd to detect unsafe tensor overwrites.'
        },
        {
          name: 'saved_tensors',
          type: 'tuple[Tensor, ...]',
          role: 'Tuple of forward activation tensors preserved by ctx.save_for_backward for computing exact VJPs during backward execution.'
        }
      ]
    },
    chapters: [
      {
        id: 'dag-and-reverse-mode',
        title: 'Computational Graph DAG & Reverse-Mode Differentiation',
        icon: 'Network',
        summary: 'Explore how PyTorch constructs dynamic Directed Acyclic Graphs during forward evaluation and executes reverse topological VJP traversal during .backward().',
        markdownContent: `### The Dynamic Computational Graph (DAG)

In PyTorch, computation graphs are dynamic: they are constructed eagerly in Python as mathematical expressions are executed. Each intermediate tensor produced by an operation receives a \`grad_fn\` attribute referencing a graph \`Node\` (such as \`<AddBackward0>\` or \`<MulBackward0>\`).

\`\`\`
   x (leaf) ──┐
              ├──► [* Mul Node] ──► z ──┐
   w (leaf) ──┘                         ├──► [+ Add Node] ──► y ──► [Loss]
                                        │
   b (leaf) ────────────────────────────┘
\`\`\`

#### Reverse-Mode VJP Execution Flow
1. **Root Seeding**: Calling \`loss.backward()\` seeds the graph root with an incoming upstream gradient $v = \\frac{\\partial L}{\\partial L} = 1.0$.
2. **Reverse Topological Traversal**: The autograd engine evaluates nodes in reverse topological order, calling each node's internal backward function.
3. **Chain Rule Evaluation**: Each node computes the Vector-Jacobian Product (VJP) $\\bar{v} \\cdot J$ with respect to its inputs and passes the resulting gradient to upstream nodes.
4. **Leaf Accumulation**: When traversal reaches a leaf tensor (\`is_leaf=True\`), the computed gradient is accumulated into \`tensor.grad\` via \`tensor.grad += grad_input\`.
5. **Graph Deallocation**: By default, intermediate graph nodes and saved activation buffers are immediately freed after \`backward()\` completes to minimize VRAM retention.`,
        codeSnippets: [
          {
            id: 'snippet-autograd-dag',
            title: 'Inspecting Autograd DAG Nodes & Gradients',
            code: `import torch

# 1. Instantiate leaf tensors
x = torch.tensor([2.0, 3.0], requires_grad=True)
w = torch.tensor([4.0, 5.0], requires_grad=True)
b = torch.tensor([1.0, 1.0], requires_grad=True)

# 2. Forward pass constructing dynamic DAG
z = w * x          # grad_fn: <MulBackward0>
y = z + b          # grad_fn: <AddBackward0>
loss = y.sum()     # grad_fn: <SumBackward0>

print(f"y.grad_fn: {y.grad_fn}")
print(f"z.grad_fn: {z.grad_fn}")
print(f"x.is_leaf: {x.is_leaf}, x.grad_fn: {x.grad_fn}")

# 3. Backward pass
loss.backward()

print(f"dL/dw (equals x): {w.grad}")
print(f"dL/dx (equals w): {x.grad}")
print(f"dL/db: {b.grad}")`,
            expectedOutput: `y.grad_fn: <AddBackward0 object at 0x...>
z.grad_fn: <MulBackward0 object at 0x...>
x.is_leaf: True, x.grad_fn: None
dL/dw (equals x): tensor([2., 3.])
dL/dx (equals w): tensor([4., 5.])
dL/db: tensor([1., 1.])`,
            explanation: 'Demonstrates how PyTorch creates grad_fn nodes on intermediate tensors and populates .grad on leaf nodes during reverse-mode automatic differentiation.'
          }
        ]
      },
      {
        id: 'custom-autograd-function',
        title: 'Writing Custom torch.autograd.Function with Exact VJP',
        icon: 'Code2',
        summary: 'Master the implementation of custom forward and backward operators with ctx context management, manual analytical gradients, and vector-Jacobian products.',
        markdownContent: `### Extending Autograd with Custom Operators

When implementing non-standard activation functions, fused layers, or integrating external C++/CUDA kernels, you subclass \`torch.autograd.Function\`.

\`\`\`python
class MyCustomOp(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x, weight):
        # 1. Perform forward computation
        out = x @ weight
        # 2. Stash necessary tensors for backward
        ctx.save_for_backward(x, weight)
        return out

    @staticmethod
    def backward(ctx, grad_output):
        # 3. Retrieve saved activations
        x, weight = ctx.saved_tensors
        # 4. Compute analytical Vector-Jacobian Products
        grad_x = grad_output @ weight.T
        grad_weight = x.T @ grad_output
        # 5. Return one gradient per forward input (or None for non-tensors)
        return grad_x, grad_weight
\`\`\`

#### Key Rules for Custom Autograd Functions:
- **Static Methods**: Both \`forward\` and \`backward\` must be decorated with \`@staticmethod\`.
- **Context Object (\`ctx\`)**: Use \`ctx.save_for_backward(*tensors)\` to store tensors. Non-tensor metadata (integers, strings, booleans) should be attached directly as attributes on \`ctx\` (e.g., \`ctx.dim = dim\`).
- **Return Count Symmetry**: The \`backward\` method must return exactly as many gradient outputs as there were input arguments in \`forward\`. Non-differentiable inputs must return \`None\`.
- **Execution via \`.apply()\`**: Custom functions must always be executed using \`MyCustomOp.apply(*args)\`, not by instantiating the class.`,
        codeSnippets: [
          {
            id: 'snippet-custom-autograd-function',
            title: 'Custom Polynomial Operator with Exact VJP',
            code: `import torch

class CubicPolynomialFunction(torch.autograd.Function):
    """
    Computes f(x) = a * x^3 + b * x^2 + c
    Forward: f(x)
    Backward: df/dx = grad_output * (3 * a * x^2 + 2 * b * x)
    """
    @staticmethod
    def forward(ctx, x: torch.Tensor, a: float, b: float, c: float) -> torch.Tensor:
        ctx.save_for_backward(x)
        ctx.a = a
        ctx.b = b
        return a * (x ** 3) + b * (x ** 2) + c

    @staticmethod
    def backward(ctx, grad_output: torch.Tensor):
        (x,) = ctx.saved_tensors
        a, b = ctx.a, ctx.b
        # Analytical derivative: 3*a*x^2 + 2*b*x
        grad_x = grad_output * (3.0 * a * (x ** 2) + 2.0 * b * x)
        # Return gradients matching forward signature: (x, a, b, c)
        return grad_x, None, None, None

def cubic_poly(x, a=2.0, b=3.0, c=1.0):
    return CubicPolynomialFunction.apply(x, a, b, c)

# Test custom operator
x = torch.tensor([2.0, -1.0], requires_grad=True)
y = cubic_poly(x, a=2.0, b=3.0, c=1.0)
loss = y.sum()
loss.backward()

print("Computed y:", y)
# Analytical grad for x=2: 3*(2)*(4) + 2*(3)*(2) = 24 + 12 = 36
# Analytical grad for x=-1: 3*(2)*(1) + 2*(3)*(-1) = 6 - 6 = 0
print("Computed x.grad:", x.grad)`,
            expectedOutput: `Computed y: tensor([29.,   2.], grad_fn=<CubicPolynomialFunctionBackward>)
Computed x.grad: tensor([36.,  0.])`,
            explanation: 'Demonstrates implementing a custom torch.autograd.Function with scalar ctx attributes and exact analytical Vector-Jacobian Product derivatives.'
          }
        ]
      },
      {
        id: 'memory-pruning-and-no-grad',
        title: 'Memory Pruning with ctx.save_for_backward and torch.no_grad()',
        icon: 'HardDrive',
        summary: 'Eliminate VRAM bottlenecks by saving only necessary activation scalars/tensors, using torch.no_grad(), torch.inference_mode(), and tensor.detach().',
        markdownContent: `### Memory Management in Autograd

The dominant memory consumer in neural network training is not the model parameters, but the **intermediate activations** saved during the forward pass for backward gradient computation.

#### 1. Minimal Activation Caching
When writing custom operators, never save intermediate tensors that can be trivially recomputed from lighter scalars or post-activation values.
- *Example (Sigmoid/GeLU)*: Storing the post-activation output $s = \\sigma(x)$ allows computing the derivative $\\frac{ds}{dx} = s(1 - s)$ without re-evaluating the expensive exponential $\\exp(-x)$ or keeping raw large inputs.

#### 2. Disabling Gradient Tracking
- **\`torch.no_grad()\`**: Disables autograd graph construction. Reduces memory overhead during validation, testing, and evaluation loops.
- **\`torch.inference_mode()\`**: Stricter and faster than \`torch.no_grad()\`. Disables both autograd tracking and tensor version tracking (\`_version\`), allowing PyTorch to produce zero-overhead views.
- **\`tensor.detach()\`**: Returns a new tensor that shares the underlying memory buffer with \`requires_grad=False\`, effectively pruning that branch from the computation graph.`,
        codeSnippets: [
          {
            id: 'snippet-memory-pruning',
            title: 'Benchmarking Autograd vs torch.no_grad() vs inference_mode()',
            code: `import torch

x = torch.randn(1000, 1000, requires_grad=True)
w = torch.randn(1000, 1000, requires_grad=True)

# 1. Standard Forward Pass with Autograd tracking
y_grad = x @ w
print(f"y_grad requires_grad: {y_grad.requires_grad}, grad_fn: {y_grad.grad_fn is not None}")

# 2. Inside torch.no_grad()
with torch.no_grad():
    y_nograd = x @ w
    print(f"y_nograd requires_grad: {y_nograd.requires_grad}, grad_fn: {y_nograd.grad_fn}")

# 3. Inside torch.inference_mode()
with torch.inference_mode():
    y_infer = x @ w
    print(f"y_infer requires_grad: {y_infer.requires_grad}, is_inference: {y_infer.is_inference()}")`,
            expectedOutput: `y_grad requires_grad: True, grad_fn: True
y_nograd requires_grad: False, grad_fn: None
y_infer requires_grad: False, is_inference: True`,
            explanation: 'Shows how no_grad() and inference_mode() eliminate graph creation and enable zero-overhead forward inference execution.'
          }
        ]
      },
      {
        id: 'numerical-gradcheck-verification',
        title: 'Numerical Gradient Verification with gradcheck',
        icon: 'CheckCircle2',
        summary: 'Rigidly test and verify analytical backward passes against finite-difference two-point approximations using torch.autograd.gradcheck.',
        markdownContent: `### Validating Analytical Derivatives with \`gradcheck\`

Handwritten backward passes are notorious for subtle calculus and indexing bugs (transposition errors, missing minus signs, incorrect chain rule factorings). \`torch.autograd.gradcheck\` numerically validates your analytical gradient against finite differences:

$$\\frac{\\partial f}{\\partial x_i} \\approx \\frac{f(x + \\epsilon e_i) - f(x - \\epsilon e_i)}{2\\epsilon}$$

#### Prerequisites for Running \`gradcheck\`:
1. **Double Precision (\`float64\`)**: Always cast inputs to \`torch.float64\` (\`torch.double\`). In single precision (\`float32\`), numerical subtraction $(f(x+\\epsilon) - f(x-\\epsilon))$ suffers from catastrophic floating-point cancellation.
2. **Small Tensors**: Finite difference perturbs every single element individually; running gradcheck on large tensors (e.g. $1024 \\times 1024$) will take hours. Use small shapes like $(2, 3)$ or $(3, 4)$.
3. **\`requires_grad=True\`**: All input tensors to be differentiated must have \`requires_grad=True\`.`,
        codeSnippets: [
          {
            id: 'snippet-gradcheck-verification',
            title: 'Verifying Custom Operator with torch.autograd.gradcheck',
            code: `import torch

class SwishExact(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x: torch.Tensor) -> torch.Tensor:
        sig = torch.sigmoid(x)
        ctx.save_for_backward(x, sig)
        return x * sig

    @staticmethod
    def backward(ctx, grad_output: torch.Tensor):
        x, sig = ctx.saved_tensors
        dx = sig * (1.0 + x * (1.0 - sig))
        return grad_output * dx

# Cast inputs to float64 for high-precision finite difference verification
test_input = torch.randn(3, 4, dtype=torch.float64, requires_grad=True)

# Run gradcheck
test_passed = torch.autograd.gradcheck(
    SwishExact.apply,
    (test_input,),
    eps=1e-6,
    atol=1e-4,
    rtol=1e-3,
    raise_exception=True
)

print(f"Gradcheck passed: {test_passed}")`,
            expectedOutput: `Gradcheck passed: True`,
            explanation: 'Uses double-precision float64 finite difference perturbation to verify the analytical Vector-Jacobian Product backward implementation.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'In-place modifications (x += 1 or x.add_()) corrupting saved forward tensors',
        badSnippet: `# Unsafe in-place mutation of tensor used in backward pass
x = torch.randn(4, 4, requires_grad=True)
y = x * 2.0
x.add_(1.0)  # Mutates x in-place! Increments x._version counter
loss = y.sum()
loss.backward()  # Crashes: RuntimeError: one of the variables needed for gradient computation has been modified by an inplace operation`,
        badExplanation: 'PyTorch tracks tensor mutation via internal _version counters. When backward() executes, it detects that x was mutated after being stashed for <MulBackward0>, throwing a fatal RuntimeError.',
        goodSnippet: `# Safe out-of-place functional transformation
x = torch.randn(4, 4, requires_grad=True)
y = x * 2.0
x_next = x + 1.0  # Creates a new tensor buffer, leaving original x intact
loss = y.sum()
loss.backward()  # Evaluates cleanly!`,
        goodExplanation: 'Out-of-place operations allocate fresh tensor buffers, preserving the original activation states required for exact backward gradient calculations.',
        perfImpact: 'Prevents silent gradient corruption or catastrophic training crashes.'
      },
      {
        title: 'Retaining computation graphs across training loops by keeping un-detached loss',
        badSnippet: `# Catastrophic memory leak across training epochs
total_loss = 0.0
for data, target in dataloader:
    output = model(data)
    loss = criterion(output, target)
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()
    total_loss += loss  # BAD: Keeps live reference to entire DAG & activations!`,
        badExplanation: 'Accumulating the raw loss tensor keeps a reference to the entire backward computational DAG and all saved intermediate activations across iterations, causing progressive VRAM exhaustion and CUDA OOM.',
        goodSnippet: `# Extract scalar primitive float to disconnect computation graph
total_loss = 0.0
for data, target in dataloader:
    output = model(data)
    loss = criterion(output, target)
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()
    total_loss += loss.item()  # GOOD: Extracts pure Python float, freeing DAG immediately`,
        goodExplanation: '.item() converts a 1-element tensor to a native Python float, allowing Python and PyTorch garbage collectors to reclaim all DAG nodes and activation memory immediately.',
        perfImpact: 'Eliminates fatal GPU Out-Of-Memory (OOM) memory leaks in training loops.'
      },
      {
        title: 'Saving full input tensors in ctx.save_for_backward when only intermediate scalars are needed',
        badSnippet: `class ExpMulFunction(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x, w):
        exp_x = torch.exp(x)
        out = exp_x * w
        # BAD: Stashing large raw input tensor x (N, D) when only exp_x and w are needed
        ctx.save_for_backward(x, w, exp_x)
        return out`,
        badExplanation: 'Storing redundant input tensors in ctx.save_for_backward unnecessarily inflates activation memory in GPU High Bandwidth Memory (HBM). Computing d/dx = w * exp(x) only requires w and exp_x.',
        goodSnippet: `class ExpMulFunction(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x, w):
        exp_x = torch.exp(x)
        out = exp_x * w
        # GOOD: Save only strictly necessary tensors for VJP computation
        ctx.save_for_backward(w, exp_x)
        return out`,
        goodExplanation: 'Prune stashed tensors to the minimal set required for the analytical derivative, reducing peak activation VRAM usage by 30% to 50% in custom layers.',
        perfImpact: 'Reduces activation VRAM overhead by 30% to 50%.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'torch.autograd.Function',
        category: 'Custom Autograd',
        signature: 'class torch.autograd.Function(*args, **kwargs)',
        summary: 'Base class for implementing custom autograd operations with forward and backward static methods.',
        parameters: [
          { name: 'ctx', type: 'Context', desc: 'Context object used to stash information and tensors for the backward pass.' },
          { name: '*args', type: 'Tensor | Any', desc: 'Forward arguments passed into the custom operator.' }
        ],
        returns: 'Tensor | tuple[Tensor, ...] computed forward result',
        exampleSnippet: `class Square(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x):
        ctx.save_for_backward(x)
        return x ** 2
    @staticmethod
    def backward(ctx, grad_output):
        x, = ctx.saved_tensors
        return grad_output * 2 * x`
      },
      {
        name: 'ctx.save_for_backward',
        category: 'Context Management',
        signature: 'ctx.save_for_backward(*tensors: torch.Tensor) -> None',
        summary: 'Saves given tensors for a future call to backward(). Retains tensors with version tracking to ensure safety.',
        parameters: [
          { name: '*tensors', type: 'torch.Tensor', desc: 'Tensors required by the backward pass to compute gradients.' }
        ],
        returns: 'None',
        exampleSnippet: `def forward(ctx, x, y):
    ctx.save_for_backward(x, y)
    return x * y`
      },
      {
        name: 'torch.no_grad()',
        category: 'Gradient Control',
        signature: 'torch.no_grad() -> ContextDecorator',
        summary: 'Context-manager or decorator that disables autograd calculation, reducing memory consumption for evaluation.',
        parameters: [],
        returns: 'ContextDecorator disabling gradient recording',
        exampleSnippet: `with torch.no_grad():
    predictions = model(eval_inputs)`
      },
      {
        name: 'torch.enable_grad()',
        category: 'Gradient Control',
        signature: 'torch.enable_grad() -> ContextDecorator',
        summary: 'Context-manager that enables gradient calculation. Useful for computing gradients inside a torch.no_grad() block.',
        parameters: [],
        returns: 'ContextDecorator enabling gradient tracking',
        exampleSnippet: `with torch.no_grad():
    with torch.enable_grad():
        loss = compute_adversarial_loss(model, x)`
      },
      {
        name: 'tensor.detach()',
        category: 'Graph Pruning',
        signature: 'Tensor.detach() -> torch.Tensor',
        summary: 'Returns a new Tensor detached from the current computational graph. Shares underlying storage with requires_grad=False.',
        parameters: [],
        returns: 'Tensor sharing memory buffer with requires_grad=False',
        exampleSnippet: `target_tensor = output.detach()  # Pruned from backward graph`
      },
      {
        name: 'torch.autograd.gradcheck',
        category: 'Gradient Verification',
        signature: 'torch.autograd.gradcheck(func, inputs, eps=1e-6, atol=1e-5, rtol=1e-3, raise_exception=True) -> bool',
        summary: 'Numerically checks gradients computed via analytical backward passes against finite difference approximations using double precision.',
        parameters: [
          { name: 'func', type: 'Callable', desc: 'Function or autograd Function.apply to check.' },
          { name: 'inputs', type: 'tuple[Tensor, ...]', desc: 'Tuple of float64 tensors with requires_grad=True.' },
          { name: 'eps', type: 'float', desc: 'Perturbation step size for finite differences (default 1e-6).' }
        ],
        returns: 'bool True if numerical and analytical gradients agree',
        exampleSnippet: `inputs = (torch.randn(2, 3, dtype=torch.float64, requires_grad=True),)
torch.autograd.gradcheck(MyOp.apply, inputs, eps=1e-6)`
      },
      {
        name: 'tensor.backward()',
        category: 'Backpropagation',
        signature: 'Tensor.backward(gradient=None, retain_graph=None, create_graph=False) -> None',
        summary: 'Computes the gradient of current tensor w.r.t. graph leaves using reverse-mode automatic differentiation.',
        parameters: [
          { name: 'gradient', type: 'Tensor | None', desc: 'Vector in Vector-Jacobian Product (defaults to 1.0 for scalar tensors).' },
          { name: 'retain_graph', type: 'bool', desc: 'If False, graph nodes are freed after backward to conserve memory.' },
          { name: 'create_graph', type: 'bool', desc: 'If True, graph of the derivative will be constructed for higher-order derivatives.' }
        ],
        returns: 'None (populates .grad on leaf tensors)',
        exampleSnippet: `loss = criterion(output, target)
loss.backward()`
      },
      {
        name: 'tensor.retain_grad()',
        category: 'Graph Inspection',
        signature: 'Tensor.retain_grad() -> None',
        summary: 'Enables .grad attribute accumulation on non-leaf intermediate tensors during backward pass.',
        parameters: [],
        returns: 'None',
        exampleSnippet: `z = x * w
z.retain_grad()  # Non-leaf tensor will now have z.grad populated
loss = z.sum()
loss.backward()`
      },
      {
        name: 'torch.is_grad_enabled()',
        category: 'Context Inspection',
        signature: 'torch.is_grad_enabled() -> bool',
        summary: 'Returns True if current context allows gradient recording; False inside torch.no_grad() or torch.inference_mode().',
        parameters: [],
        returns: 'bool current gradient tracking state',
        exampleSnippet: `if torch.is_grad_enabled():
    print("Autograd is actively tracking operations")`
      },
      {
        name: 'torch.autograd.grad',
        category: 'Higher-Order Derivatives',
        signature: 'torch.autograd.grad(outputs, inputs, grad_outputs=None, retain_graph=None, create_graph=False) -> tuple[Tensor, ...]',
        summary: 'Computes and returns the sum of gradients of outputs with respect to the inputs without accumulating into .grad.',
        parameters: [
          { name: 'outputs', type: 'Sequence[Tensor]', desc: 'Outputs of the differentiated function.' },
          { name: 'inputs', type: 'Sequence[Tensor]', desc: 'Inputs w.r.t. which gradients will be computed.' },
          { name: 'create_graph', type: 'bool', desc: 'If True, builds graph of derivative for computing Hessian-vector products.' }
        ],
        returns: 'tuple[Tensor, ...] computed analytical gradients',
        exampleSnippet: `grads = torch.autograd.grad(outputs=loss, inputs=[w1, w2], create_graph=True)`
      }
    ],
    interactiveWidgetType: 'pytorch-autograd'
  },
  challenges: [
    {
      id: 'd3-c1',
      dayId: 3,
      partId: 3,
      title: 'Custom Memory-Efficient SwiGLU with Exact Backward Pass',
      slug: 'custom-autograd-swiglu',
      difficulty: 'Advanced',
      category: 'PyTorch Autograd',
      summary: 'Implement the SwiGLU activation function with custom forward & backward passes saving minimal memory.',
      mentalModel5s: 'Standard Autograd stores 4 intermediate tensors and 4 backward nodes for SwiGLU. A custom torch.autograd.Function fuses the whole operation into 1 node, saves only minimal activations (x, y, sig(x)), and computes exact Vector-Jacobian Products.',
      visualAnalogy: 'Instead of recording every individual turn and gear shift in a separate log book, record the entire fused maneuver as one unified step with a single shortcut reverse formula.',
      pitfalls: [
        'Saving redundant tensors in ctx.save_for_backward (e.g. saving both x, sigmoid(x), and swish(x) when sigmoid can be reused).',
        'Forgetting that backward receives grad_output and must return gradients in the exact same argument order as forward (grad_x, grad_y).',
        'Not testing analytical gradients with torch.autograd.gradcheck using float64 tensors (float32 can cause false precision failures).',
        'Using in-place mutations inside forward or backward that invalidate PyTorch version counters.'
      ],
      progressiveHints: [
        'Tier 1 (Conceptual): SwiGLU is (x * sigmoid(x)) * y. In forward, compute sig_x = torch.sigmoid(x), swish_x = x * sig_x, and out = swish_x * y.',
        'Tier 2 (Activation Caching): Only save what is needed for analytical gradients: ctx.save_for_backward(x, y, sig_x).',
        'Tier 3 (Analytical Derivative): d/dx [x * sig(x)] = sig(x) * (1 + x * (1 - sig(x))). Thus grad_x = grad_output * y * (sig_x * (1 + x * (1 - sig_x))).',
        'Tier 4 (Grad Y): Since SwiGLU is linear in y, grad_y = grad_output * (x * sig_x). Return (grad_x, grad_y).'
      ],
      deepInternals: {
        title: 'PyTorch C++ c10::TensorImpl & Autograd Node VJPs',
        content: 'When .backward() executes, PyTorch Autograd traverses the DAG in reverse topological order, calling each Node\'s Vector-Jacobian Product (VJP). By authoring a custom autograd Function, we bypass multiple C++ graph node allocations and eliminate temporary VRAM buffers.',
        keyRule: 'Always verify custom autograd backward kernels with torch.autograd.gradcheck(..., eps=1e-6, atol=1e-4) in float64.'
      },
      instructions: `The SwiGLU activation function used in LLaMA 3 and modern LLMs is defined as:
$$\\text{SwiGLU}(x, y) = \\text{Swish}(x) \\odot y = (x \\cdot \\sigma(x)) \\odot y$$
where $\\sigma(x) = \\frac{1}{1 + e^{-x}}$ is the standard sigmoid function.

**Tasks:**
1. Implement \`SwiGLUFunction\` inheriting from \`torch.autograd.Function\`.
2. In \`forward(ctx, x, y)\`, compute $\\text{SwiGLU}(x, y)$ and save only necessary tensors in \`ctx.save_for_backward\`.
3. In \`backward(ctx, grad_output)\`, compute the exact analytical gradients $\\frac{\\partial L}{\\partial x}$ and $\\frac{\\partial L}{\\partial y}$ without calling autograd.
4. Verify gradient correctness against numerical gradients via \`torch.autograd.gradcheck\`.`,
      hints: [
        'Derivative of Swish: d/dx [x * sig(x)] = sig(x) + x * sig(x) * (1 - sig(x)) = sig(x) * (1 + x * (1 - sig(x)))',
        'd/dy [SwiGLU(x, y)] = Swish(x) = x * sig(x)',
        'grad_x = grad_output * y * (sigmoid(x) * (1.0 + x * (1.0 - sigmoid(x))))',
        'grad_y = grad_output * (x * sigmoid(x))'
      ],
      starterCode: `import torch

class SwiGLUFunction(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        """
        Forward pass for SwiGLU(x, y) = x * sigmoid(x) * y.
        """
        # TODO: Implement forward pass and save minimal tensors
        pass

    @staticmethod
    def backward(ctx, grad_output: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        """
        Exact analytical backward pass.
        Returns:
            (grad_x, grad_y)
        """
        # TODO: Implement analytical backward pass
        pass

def swiglu(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    return SwiGLUFunction.apply(x, y)
`,
      solutionCode: `import torch

class SwiGLUFunction(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        sig_x = torch.sigmoid(x)
        swish_x = x * sig_x
        out = swish_x * y
        ctx.save_for_backward(x, y, sig_x)
        return out

    @staticmethod
    def backward(ctx, grad_output: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        x, y, sig_x = ctx.saved_tensors
        # d/dx [x * sig(x)] = sig(x) * (1.0 + x * (1.0 - sig_x))
        d_swish_dx = sig_x * (1.0 + x * (1.0 - sig_x))
        grad_x = grad_output * y * d_swish_dx
        grad_y = grad_output * (x * sig_x)
        return grad_x, grad_y

def swiglu(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    return SwiGLUFunction.apply(x, y)
`,
      testCases: [
        { id: 't1', name: 'Gradcheck Numerical Verification', inputDescription: 'Float64 inputs with gradcheck()', expectedOutput: 'Gradcheck returned True' },
        { id: 't2', name: 'Identity Value Test', inputDescription: 'x=0, y=1 -> swiglu(0, 1) == 0.0', expectedOutput: 'Value == 0.0' }
      ],
      benchmarkTargetMs: 2.1,
      memoryTargetMb: 6.0,
      conceptPrimer: {
        title: 'Custom Autograd Engine & Fused Kernel Math',
        subtitle: 'Manual Jacobian-Vector Products (VJP) and Activation Graph Pruning',
        overview: 'PyTorch default autograd tracks every intermediate elementwise node (multiply, sigmoid, add), building a deep computation graph with high GPU memory overhead. A custom autograd function fuses the entire graph into a single node with an exact VJP formulation.',
        mentalModel5s: 'Custom autograd functions collapse composite ops into a single graph node with exact analytical VJPs.',
        visualAnalogy: 'A fused hardware circuit calculating both forward signal and feedback error in one chip.',
        pitfalls: [
          'Saving extra tensors in ctx.save_for_backward that could be recomputed cheaply.',
          'Missing gradient returns for all input arguments.'
        ],
        progressiveHints: [
          'Tier 1: Inherit from torch.autograd.Function.',
          'Tier 2: ctx.save_for_backward(x, y, sig_x)',
          'Tier 3: Analytical gradient for Swish derivative',
          'Tier 4: Return (grad_x, grad_y)'
        ],
        deepInternals: {
          title: 'Dynamic Computation Graph Nodes',
          content: 'Each custom Function represents a single autograd::Node in the C++ execution engine.',
          keyRule: 'Always use float64 when testing with torch.autograd.gradcheck.'
        },
        mathFormulas: [
          {
            title: 'SwiGLU Forward Equation',
            latex: 'f(x, y) = (x \\cdot \\sigma(x)) \\cdot y',
            explanation: 'Gated linear unit with continuous Swish gating.'
          },
          {
            title: 'Vector-Jacobian Product (VJP)',
            latex: '\\frac{\\partial \\mathcal{L}}{\\partial x} = \\bar{g} \\cdot y \\cdot \\left[ \\sigma(x) + x \\sigma(x)(1 - \\sigma(x)) \\right]',
            explanation: 'Analytical derivative with respect to gating input x.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Composite un-fused PyTorch operations
def naive_swiglu(x, y):
    # Builds 4 autograd graph nodes and stores 4 intermediate buffers
    sig = torch.sigmoid(x)
    swish = x * sig
    return swish * y`,
          naiveExplanation: 'Allocates memory for sig, swish, and graph backward closures.',
          idiomaticCode: `# Custom Fused Autograd Function
class SwiGLUFunction(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x, y):
        sig_x = torch.sigmoid(x)
        ctx.save_for_backward(x, y, sig_x)
        return x * sig_x * y
    @staticmethod
    def backward(ctx, grad_output):
        x, y, sig_x = ctx.saved_tensors
        return grad_output * y * (sig_x * (1 + x * (1 - sig_x))), grad_output * (x * sig_x)`,
          idiomaticExplanation: 'Fuses forward/backward graph into a single step, saving 50% activation memory.',
          speedupText: '2.4x faster forward/backward'
        },
        memoryLayout: {
          title: 'Computation Graph Nodes & Memory Sinks',
          content: 'Standard autograd retains intermediate tensors ctx.saved_tensors across forward pass until backward is called. Minimizing what you save drastically reduces VRAM footprint during LLM training.',
          diagramAscii: `Autograd Graph:
Input(x) ---> [Sigmoid] ---> [Mul(x)] ---> [Mul(y)] ---> Loss
Fused:
Input(x, y) ---------> [Custom SwiGLU Node] ---------> Loss`,
          keyRule: 'Always use analytical derivatives instead of automatic differentiation for custom activation layers.'
        },
        keyTakeaways: [
          'Custom autograd functions allow manual VJP math and memory pruning.',
          'Always test custom backward passes with torch.autograd.gradcheck using float64.',
          'Only save necessary tensors to ctx.save_for_backward.'
        ]
      },
      sampleDataFrame: {
        name: 'Autograd vs Fused SwiGLU Performance Benchmark',
        columns: ['Implementation', 'Batch_Size', 'Seq_Len', 'Fwd_Bwd_Latency_ms', 'Peak_VRAM_MB', 'Gradcheck_Pass'],
        dtypes: {
          Implementation: 'category',
          Batch_Size: 'int32',
          Seq_Len: 'int32',
          Fwd_Bwd_Latency_ms: 'float32',
          Peak_VRAM_MB: 'float32',
          Gradcheck_Pass: 'bool'
        },
        rows: [
          { Implementation: 'Naive Composite Operations', Batch_Size: 32, Seq_Len: 4096, Fwd_Bwd_Latency_ms: 5.12, Peak_VRAM_MB: 128.4, Gradcheck_Pass: true },
          { Implementation: 'Fused Custom Autograd Function', Batch_Size: 32, Seq_Len: 4096, Fwd_Bwd_Latency_ms: 2.14, Peak_VRAM_MB: 64.2, Gradcheck_Pass: true },
          { Implementation: 'TorchScript JIT Fused', Batch_Size: 32, Seq_Len: 4096, Fwd_Bwd_Latency_ms: 2.38, Peak_VRAM_MB: 68.0, Gradcheck_Pass: true }
        ],
        totalRows: 3,
        memoryUsageKb: 1.5
      },
      samplePlot: {
        id: 'p3-swiglu',
        title: 'SwiGLU Latency & Activation Memory: Composite vs Fused Autograd',
        type: 'svg',
        description: 'Comparison of forward/backward latency and peak activation VRAM across sequence lengths',
        svgContent: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="300" fill="#0f172a" rx="8"/>
          <line x1="60" y1="240" x2="560" y2="240" stroke="#334155" stroke-width="1.5"/>
          <line x1="60" y1="40" x2="60" y2="240" stroke="#334155" stroke-width="1.5"/>
          <line x1="60" y1="190" x2="560" y2="190" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="60" y1="140" x2="560" y2="140" stroke="#1e293b" stroke-dasharray="4"/>
          <line x1="60" y1="90" x2="560" y2="90" stroke="#1e293b" stroke-dasharray="4"/>
          <!-- Naive Composite Curve (Red) -->
          <path d="M 80 230 Q 200 200, 320 130 T 520 45" fill="none" stroke="#ef4444" stroke-width="3"/>
          <!-- Fused Custom Autograd (Green) -->
          <path d="M 80 235 Q 200 220, 320 180 T 520 110" fill="none" stroke="#22c55e" stroke-width="3.5"/>
          <!-- Labels -->
          <text x="530" y="50" fill="#ef4444" font-size="11" font-family="monospace">Composite (5.1ms, 128MB)</text>
          <text x="530" y="115" fill="#22c55e" font-weight="bold" font-size="11" font-family="monospace">Fused VJP (2.1ms, 64MB)</text>
          <text x="25" y="35" fill="#94a3b8" font-size="11">Time (ms)</text>
          <text x="510" y="260" fill="#94a3b8" font-size="11">Sequence Length</text>
        </svg>`
      },
      expectedTensors: [
        { name: 'x', shape: '(B, S, D)', dtype: 'float32' },
        { name: 'y', shape: '(B, S, D)', dtype: 'float32' },
        { name: 'out', shape: '(B, S, D)', dtype: 'float32' }
      ]
    }
  ]
};

export const PART03_TRACK = DAY03_TRACK;
export default DAY03_TRACK;
