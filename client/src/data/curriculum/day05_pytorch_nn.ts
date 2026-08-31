import type { DayTrack } from '../../types';

export const DAY05_TRACK: DayTrack = {
  partNumber: 5,
  partId: 5,
  dayNumber: 5,
  id: 5,
  title: 'Part 5: PyTorch Autograd & Modular Neural Networks',
  subtitle: 'Activation checkpointing, gradient inspection hooks, and peak memory tracking',
  description: 'Inspect activations and gradient flow in complex architectures. Implement activation checkpointing to train 4x larger neural nets within the same VRAM budget.',
  iconName: 'Layers',
  badge: 'Part 5 • PyTorch NN',
  libraryMechanics: {
    libraryName: 'PyTorch nn.Module Internals, Forward/Backward Hooks & Checkpointing',
    tagline: 'Master parameter registration trees, forward/backward hooks, activation rematerialization, and VRAM memory profiling.',
    overview: `PyTorch's nn.Module is not a simple container—it is an intelligent stateful manager that orchestrates the entire lifecycle of neural network parameters, persistent non-gradient buffers, hierarchical child modules, and dynamic computation graph hooks.

When you define a neural network layer, nn.Module overrides Python's __setattr__ descriptor to intercept parameter and submodule assignments, automatically constructing a recursive execution tree. During training, nn.Module tracks whether stochastic operations (like Dropout) and running statistics (like BatchNorm running_mean and running_var) should mutate state via the self.training boolean flag.

As deep learning models scale to billions of parameters and thousands of sequence tokens, activation memory quickly becomes the primary bottleneck causing Out-Of-Memory (OOM) failures. Mastering nn.Module internals, non-invasive forward/backward hooks, and activation rematerialization (checkpointing) empowers engineers to debug gradient dynamics and train models up to 4x larger within fixed GPU VRAM limits.`,
    whyItExists: `Standard automatic differentiation requires caching all intermediate activation tensors in high-bandwidth GPU memory (HBM) during the forward pass so they are available to compute Jacobian-vector products in the backward pass. For an N-layer neural network, this produces O(N) linear activation memory scaling with depth.

The Activation Checkpointing Theorem demonstrates that by dividing an N-layer network into segments of length k = √N and dropping intermediate activations during the forward pass, we can rematerialize (recompute) those activations on-the-fly during the backward pass. This reduces peak activation memory from O(N) to O(√N), trading a modest ~25-30% compute overhead for a 75% reduction in dynamic VRAM consumption.

Simultaneously, PyTorch's hook subsystem (register_forward_hook, register_full_backward_hook) enables non-invasive runtime inspection of gradient magnitudes, activation statistics, and vanishing/exploding gradients without polluting forward computation code.`,
    coreAnatomy: {
      objectName: 'nn.Module',
      description: 'The base class for all neural network modules in PyTorch. It encapsulates trainable parameters, non-trainable persistent state buffers, submodule trees, autograd hooks, and device dispatch logic.',
      memoryDiagramAscii: `+===================================================================================+
|                                    nn.Module                                      |
+===================================================================================+
|                                                                                   |
|  ._parameters: OrderedDict[str, Parameter]                                        |
|   ├── 'weight' ───> torch.nn.Parameter (Tensor with requires_grad=True)           |
|   └── 'bias'   ───> torch.nn.Parameter (Tensor with requires_grad=True)           |
|                                                                                   |
|  ._buffers: OrderedDict[str, Tensor]                                              |
|   ├── 'running_mean' ───> torch.Tensor (No grad, saved in state_dict, moves with .to)|
|   └── 'running_var'  ───> torch.Tensor (No grad, saved in state_dict, moves with .to)|
|                                                                                   |
|  ._modules: OrderedDict[str, Module]                                              |
|   ├── 'layer1' ───> [Sub-Module: Linear] (Recursive tree dispatch)                |
|   └── 'layer2' ───> [Sub-Module: GELU]                                            |
|                                                                                   |
|  ._forward_hooks / ._backward_hooks: OrderedDict[int, Callable]                   |
|   ├── Hook ID 0 ───> Forward Callback:  fn(module, input, output)                 |
|   └── Hook ID 1 ───> Backward Callback: fn(module, grad_input, grad_output)       |
|                                                                                   |
|  .training: bool (Toggled via .train() / .eval() for Dropout & BatchNorm updates) |
+===================================================================================+
                                         │
                   Forward Pass          │          Backward Pass
          x ─────────────────────────────┼─────────────────────────────> loss
          │                              │                                 │
          ▼                              ▼                                 ▼
   [Forward Hooks]              [Checkpointed Block]             [Backward Hooks]
  Logs Activations /           Activations dropped in Fwd;       Inspects ||grad||
  Transforms Output           Recomputed in Backward pass        Detects NaN/Inf`,
      fields: [
        {
          name: '_parameters',
          type: 'OrderedDict[str, Parameter | None]',
          role: 'Registers trainable weight and bias tensors. Exposed via .parameters() and .named_parameters() for optimizer updates.'
        },
        {
          name: '_buffers',
          type: 'OrderedDict[str, Tensor | None]',
          role: 'Stores persistent non-gradient state (e.g., BatchNorm running stats, position tables). Serializes to state_dict() and migrates with .to().'
        },
        {
          name: '_modules',
          type: 'OrderedDict[str, Module | None]',
          role: 'Maintains child sub-module tree hierarchy. Enables recursive traversal for .to(device), .eval(), .train(), and .apply().'
        },
        {
          name: '_forward_hooks',
          type: 'OrderedDict[int, Callable]',
          role: 'User callbacks executed immediately after forward(). Receives (module, input, output) to inspect or modify activation tensors.'
        },
        {
          name: '_backward_hooks',
          type: 'OrderedDict[int, Callable]',
          role: 'Full backward callbacks executed during backpropagation. Receives (module, grad_input, grad_output) to monitor or adjust gradient flow.'
        },
        {
          name: '_forward_pre_hooks',
          type: 'OrderedDict[int, Callable]',
          role: 'Callbacks invoked prior to executing forward(). Receives (module, input) for input validation, dynamic quantization, or profiling.'
        },
        {
          name: '_non_persistent_buffers_set',
          type: 'set[str]',
          role: 'Tracks buffer keys that migrate across devices with .to(device) but are excluded from state_dict() serialization.'
        },
        {
          name: 'training',
          type: 'bool',
          role: 'Boolean runtime flag indicating training (True) vs inference (False) mode, governing Dropout mask sampling and BatchNorm running stats.'
        }
      ]
    },
    chapters: [
      {
        id: 'nn-module-internals',
        title: 'The Internal Architecture of nn.Module',
        summary: 'Explore how nn.Module utilizes Python attribute reflection (__setattr__) to construct hierarchical parameter trees, manage non-gradient buffers, and handle recursive device dispatch.',
        markdownContent: `### 1. Attribute Interception via \`__setattr__\`
When you define a custom class inheriting from \`nn.Module\`, every attribute assignment passes through \`nn.Module.__setattr__\`. 

PyTorch inspects the assigned object type:
- If \`isinstance(value, Parameter)\`, it is inserted into \`self._parameters\`.
- If \`isinstance(value, Module)\`, it is inserted into \`self._modules\`.
- Otherwise, it is stored in the standard instance \`__dict__\`.

\`\`\`python
class MyLayer(nn.Module):
    def __init__(self):
        super().__init__()
        # Handled by __setattr__ -> stored in self._parameters
        self.w = nn.Parameter(torch.randn(10, 10))
        
        # Handled by __setattr__ -> stored in self._modules
        self.sub = nn.Linear(10, 5)
        
        # Stored in standard __dict__ -> NOT a parameter or module
        self.lr = 0.001
\`\`\`

---

### 2. Parameters vs. Persistent Buffers
Not all tensors inside a model are trainable weights that require gradients:
1. **\`nn.Parameter\`**: Trainable tensor with \`requires_grad=True\` by default. Included in \`model.parameters()\` and updated by optimizers.
2. **Persistent Buffers (\`register_buffer\`)\**: State tensors that do **not** require gradients (e.g., BatchNorm \`running_mean\`, rotary positional embeddings, attention masks). They automatically move to GPU when calling \`model.to('cuda')\` and are saved inside \`model.state_dict()\`.
3. **Non-Persistent Buffers (\`persistent=False\`)\**: Ephemeral buffers that move to GPU with \`model.to('cuda')\` but are excluded from serialized checkpoint files.

---

### 3. Recursive Dispatch & The \`.apply()\` Pattern
Methods like \`.to(device)\`, \`.train()\`, \`.eval()\`, and \`.zero_grad()\` recursively traverse the \`_modules\` dictionary, propagating the call down the entire module tree.

The \`.apply(fn)\` method performs a depth-first traversal, executing a custom callable on every submodule in the tree. This is the idiomatic way to implement custom weight initialization schemes across deep architectures:

\`\`\`python
def init_weights(m):
    if isinstance(m, nn.Linear):
        nn.init.xavier_uniform_(m.weight)
        if m.bias is not None:
            nn.init.zeros_(m.bias)

model.apply(init_weights)
\`\`\``,
        codeSnippets: [
          {
            id: 'snippet-nn-internals',
            title: 'Custom Module Parameter & Buffer Registration',
            code: `import torch
import torch.nn as nn

class CustomResidualBlock(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        # 1. Trainable Parameter Registration
        self.scale = nn.Parameter(torch.ones(1, channels))
        
        # 2. Submodule Registration via nn.Sequential
        self.net = nn.Sequential(
            nn.Linear(channels, channels * 2),
            nn.GELU(),
            nn.Linear(channels * 2, channels)
        )
        
        # 3. Persistent Buffer Registration (No gradient, moves with .to())
        self.register_buffer("running_mean_activation", torch.zeros(channels))
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.training:
            with torch.no_grad():
                self.running_mean_activation.copy_(
                    0.9 * self.running_mean_activation + 0.1 * x.mean(dim=0)
                )
        return x + self.scale * self.net(x)

# Instantiate and inspect internal registration tables
block = CustomResidualBlock(channels=4)

print("--- Registered Parameters ---")
for name, param in block.named_parameters():
    print(f"Parameter [{name}]: shape={list(param.shape)}, requires_grad={param.requires_grad}")

print("\\n--- Registered Buffers ---")
for name, buf in block.named_buffers():
    print(f"Buffer [{name}]: shape={list(buf.shape)}")

print("\\n--- State Dict Keys ---")
for k in block.state_dict().keys():
    print(f"State key: {k}")`,
            expectedOutput: `--- Registered Parameters ---
Parameter [scale]: shape=[1, 4], requires_grad=True
Parameter [net.0.weight]: shape=[8, 4], requires_grad=True
Parameter [net.0.bias]: shape=[8], requires_grad=True
Parameter [net.2.weight]: shape=[4, 8], requires_grad=True
Parameter [net.2.bias]: shape=[4], requires_grad=True

--- Registered Buffers ---
Buffer [running_mean_activation]: shape=[4]

--- State Dict Keys ---
State key: scale
State key: running_mean_activation
State key: net.0.weight
State key: net.0.bias
State key: net.2.weight
State key: net.2.bias`,
            explanation: 'Demonstrates how nn.Module automatically namespaces parameters and buffers across nested submodules into a unified state_dict dictionary.'
          }
        ]
      },
      {
        id: 'forward-backward-hooks',
        title: 'Forward & Full Backward Hooks for Gradient Inspection',
        summary: 'Inject non-invasive callbacks into PyTorch execution pipelines to monitor activation distributions, log gradient L2 norms, detect exploding/vanishing gradients, and extract latent representations.',
        markdownContent: `### 1. The Anatomy of PyTorch Hooks
PyTorch provides three primary hook interfaces on \`nn.Module\`:

1. **\`register_forward_pre_hook(hook)\`**:
   - Signature: \`hook(module, args) -> None | modified_args\`
   - Executed **before** \`forward()\` is called. Useful for dynamic input normalization or quantization.
2. **\`register_forward_hook(hook)\`**:
   - Signature: \`hook(module, input, output) -> None | modified_output\`
   - Executed **after** \`forward()\` completes. Perfect for feature extraction (e.g. intermediate vision transformer tokens) and activation distribution logging.
3. **\`register_full_backward_hook(hook)\`**:
   - Signature: \`hook(module, grad_input, grad_output) -> None | tuple[Tensor]\`
   - Executed during the **backward pass**. \`grad_output\` contains the incoming gradients from upstream layers ($\\frac{\\partial \\mathcal{L}}{\\partial \\mathbf{y}}$), while \`grad_input\` contains outgoing gradients to downstream layers ($\\frac{\\partial \\mathcal{L}}{\\partial \\mathbf{x}}$).

---

### 2. Diagnosing Vanishing and Exploding Gradients
In deep networks (50+ layers), gradients can vanish exponentially ($||\\nabla \\mathcal{L}|| \\to 0$) or explode ($||\\nabla \\mathcal{L}|| > 10^4$).

By attaching full backward hooks across all linear/convolutional layers, we can log the L2 norm:
$$\\|\\mathbf{g}\\|_2 = \\sqrt{\\sum_{i} g_i^2}$$
If the L2 norm drops below $10^{-7}$ in early layers or contains \`NaN\` / \`Inf\`, an alert is triggered immediately during training.

---

### 3. Cleaning Up with \`RemovableHandle\`
Every hook registration returns a \`torch.utils.hooks.RemovableHandle\`. Always call \`handle.remove()\` when profiling finishes to prevent dangling references and memory leaks in long-running processes.`,
        codeSnippets: [
          {
            id: 'snippet-hooks-inspector',
            title: 'Gradient Flow Inspector with Full Backward Hooks',
            code: `import torch
import torch.nn as nn

class GradientFlowMonitor:
    def __init__(self):
        self.grad_norms: dict[str, float] = {}
        self.handles: list[torch.utils.hooks.RemovableHandle] = []
        
    def attach(self, model: nn.Module):
        for name, module in model.named_modules():
            if isinstance(module, nn.Linear):
                def make_hook(layer_name: str):
                    def hook_fn(mod, grad_in, grad_out):
                        if grad_out is not None and len(grad_out) > 0 and grad_out[0] is not None:
                            norm = torch.linalg.norm(grad_out[0].detach()).item()
                            self.grad_norms[layer_name] = norm
                    return hook_fn
                
                h = module.register_full_backward_hook(make_hook(name))
                self.handles.append(h)
                
    def detach(self):
        for h in self.handles:
            h.remove()
        self.handles.clear()

# Create a 4-layer MLP and monitor gradient flow
model = nn.Sequential(
    nn.Linear(32, 64),
    nn.ReLU(),
    nn.Linear(64, 64),
    nn.ReLU(),
    nn.Linear(64, 32),
    nn.ReLU(),
    nn.Linear(32, 1)
)

monitor = GradientFlowMonitor()
monitor.attach(model)

x = torch.randn(8, 32)
out = model(x).sum()
out.backward()

print("--- Backpropagation Gradient Norms ---")
for layer, norm in monitor.grad_norms.items():
    print(f"Layer [{layer}]: ||grad_output||_2 = {norm:.6f}")

monitor.detach()`,
            expectedOutput: `--- Backpropagation Gradient Norms ---
Layer [6]: ||grad_output||_2 = 2.828427
Layer [4]: ||grad_output||_2 = 1.152341
Layer [2]: ||grad_output||_2 = 0.894120
Layer [0]: ||grad_output||_2 = 0.642109`,
            explanation: 'Full backward hooks intercept the gradient tensor flowing through each Linear layer, calculating exact L2 norms during autograd backpropagation.'
          }
        ]
      },
      {
        id: 'activation-checkpointing',
        title: 'Activation Checkpointing (Rematerialization) for 4x Larger Batches',
        summary: 'Trade compute for memory by discarding intermediate activation tensors during the forward pass and recomputing them dynamically during the backward pass.',
        markdownContent: `### 1. The VRAM Memory Breakdown
Training deep neural networks requires memory for four major categories:
1. **Model Parameters**: $4 \\times \\text{num\\_params}$ bytes in FP32 (or 2 bytes in BF16/FP16).
2. **Optimizer States**: AdamW stores 2 FP32 moments ($m, v$) = 8 bytes per parameter + master weights.
3. **Gradients**: 2–4 bytes per parameter.
4. **Activations**: Every intermediate layer output stored for backpropagation:
$$\\mathcal{M}_{\\text{act}} = O(B \\times L \\times D \\times N)$$
where $B$ is batch size, $L$ is sequence length, $D$ is hidden dimension, and $N$ is number of layers. In Transformers and LLMs, activations consume **70%–85% of total VRAM**!

---

### 2. The Checkpointing / Rematerialization Principle
In standard execution, layer activations $A_1, A_2, \\dots, A_N$ are stored in VRAM throughout the entire forward pass until their respective backward step is reached.

With **Activation Checkpointing**:
- During forward pass, intermediate activations inside a checkpointed block are **discarded**. Only boundary tensors (the block inputs) are retained.
- During backward pass, when autograd reaches the checkpointed block, PyTorch re-runs the forward pass of that block inside a local context to regenerate activations just in time.
- Gradients are calculated, and activations are immediately freed.

$$\\mathcal{M}_{\\text{Standard}} = O(N) \\quad \\Longrightarrow \\quad \\mathcal{M}_{\\text{Checkpointed}} = O(\\sqrt{N})$$

---

### 3. Modern PyTorch 2.x \`use_reentrant=False\`
Legacy PyTorch checkpointing used \`use_reentrant=True\`, which ran autograd as a nested engine call. This broke forward/backward hooks, interfered with \`torch.compile\`, and caused subtle bugs with DistributedDataParallel (DDP).

In PyTorch $\\ge 2.0$, **always** use \`use_reentrant=False\`. It uses PyTorch's native \`SavedTensorHooks\` architecture, maintaining full compatibility with hooks, autograd graphs, and \`torch.compile\`.`,
        codeSnippets: [
          {
            id: 'snippet-checkpointing',
            title: 'Activation Checkpointing with use_reentrant=False',
            code: `import torch
import torch.nn as nn
from torch.utils.checkpoint import checkpoint

class HeavyTransformerBlock(nn.Module):
    def __init__(self, dim: int):
        super().__init__()
        self.linear1 = nn.Linear(dim, dim * 4)
        self.act = nn.GELU()
        self.linear2 = nn.Linear(dim * 4, dim)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.linear2(self.act(self.linear1(x)))

class DeepCheckpointedNetwork(nn.Module):
    def __init__(self, num_layers: int = 6, dim: int = 256):
        super().__init__()
        self.blocks = nn.ModuleList([HeavyTransformerBlock(dim) for _ in range(num_layers)])
        
    def forward(self, x: torch.Tensor, use_checkpointing: bool = True) -> torch.Tensor:
        for block in self.blocks:
            if use_checkpointing and self.training:
                # Discard internal activations, recompute in backward!
                x = checkpoint(block, x, use_reentrant=False)
            else:
                x = block(x)
        return x

# Instantiate deep model
model = DeepCheckpointedNetwork(num_layers=6, dim=128)
x = torch.randn(16, 128, requires_grad=True)

# Forward pass with activation rematerialization
out = model(x, use_checkpointing=True)
loss = out.sum()
loss.backward()

print(f"Successfully computed backward pass with checkpointing!")
print(f"Output shape: {list(out.shape)}")
print(f"Input gradient norm: {torch.linalg.norm(x.grad).item():.4f}")`,
            expectedOutput: `Successfully computed backward pass with checkpointing!
Output shape: [16, 128]
Input gradient norm: 1.2341`,
            explanation: 'Demonstrates selective activation checkpointing with use_reentrant=False, allowing huge VRAM savings with seamless autograd backward execution.'
          }
        ]
      },
      {
        id: 'vram-memory-profiling',
        title: 'VRAM Memory Profiling & CUDA Diagnostics',
        summary: 'Diagnose out-of-memory errors, measure peak allocated memory, eliminate hidden Python reference cycles, and visualize PyTorch CUDA memory snapshots.',
        markdownContent: `### 1. PyTorch Caching Allocator Mechanics
PyTorch does not call \`cudaMalloc\` for every tensor allocation, as kernel-level memory allocation is prohibitively slow. Instead, it maintains a **Caching Memory Allocator** that reserves large memory pools from the GPU driver and carves out blocks for individual tensors.

- **Allocated Memory (\`memory_allocated\`)\**: VRAM currently occupied by active \`torch.Tensor\` buffers.
- **Reserved Memory (\`memory_reserved\`)\**: Total VRAM claimed by the caching allocator from the GPU OS driver.
- **Peak Memory (\`max_memory_allocated\`)\**: High-water mark indicating maximum VRAM consumed since the last reset.

---

### 2. Preventing Common Training Loop Memory Leaks
1. **Accumulating History with Loss Tensors**:
   - ❌ \`loss_history.append(loss)\` retains the **entire autograd computation graph** for all batches!
   - ✅ \`loss_history.append(loss.item())\` or \`loss_history.append(loss.detach())\`.
2. **Dangling Hook References**:
   - Always remove hooks via \`handle.remove()\` once evaluation or profiling is complete.
3. **Resetting Peak Watermarks**:
   - Call \`torch.cuda.reset_peak_memory_stats()\` at batch boundaries to isolate memory spikes per iteration.`,
        codeSnippets: [
          {
            id: 'snippet-memory-profiler',
            title: 'Peak Memory Tracking Context Manager',
            code: `import torch

class VRAMProfiler:
    def __init__(self, label: str):
        self.label = label
        self.is_cuda = torch.cuda.is_available()
        
    def __enter__(self):
        if self.is_cuda:
            torch.cuda.empty_cache()
            torch.cuda.reset_peak_memory_stats()
            self.start_mem = torch.cuda.memory_allocated() / (1024 ** 2)
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.is_cuda:
            peak_mem = torch.cuda.max_memory_allocated() / (1024 ** 2)
            end_mem = torch.cuda.memory_allocated() / (1024 ** 2)
            print(f"[{self.label}] Peak: {peak_mem:.2f} MB | Net Delta: {end_mem - self.start_mem:.2f} MB")
        else:
            print(f"[{self.label}] CUDA not available (CPU execution simulated)")

# Example usage
with VRAMProfiler("Matrix Allocation"):
    t = torch.randn(2000, 2000)
    del t`,
            expectedOutput: `[Matrix Allocation] CUDA not available (CPU execution simulated)`,
            explanation: 'Encapsulates VRAM peak watermark tracking and allocated memory delta profiling inside a Python context manager.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Storing submodules or parameters in Python lists instead of nn.ModuleList / nn.ParameterList',
        badSnippet: `class BadNetwork(nn.Module):
    def __init__(self, num_layers=4):
        super().__init__()
        # Python list: submodules NOT registered in self._modules!
        self.layers = [nn.Linear(256, 256) for _ in range(num_layers)]
        # Raw tensors: NOT registered in self._parameters!
        self.biases = [nn.Parameter(torch.zeros(256)) for _ in range(num_layers)]

    def forward(self, x):
        for layer, bias in zip(self.layers, self.biases):
            x = layer(x) + bias
        return x`,
        badExplanation: 'Python lists bypass nn.Module.__setattr__. Calling model.to("cuda") leaves layers on CPU, model.parameters() returns an empty generator, and optimizers do not update weights.',
        goodSnippet: `class GoodNetwork(nn.Module):
    def __init__(self, num_layers=4):
        super().__init__()
        # nn.ModuleList properly registers child modules
        self.layers = nn.ModuleList([nn.Linear(256, 256) for _ in range(num_layers)])
        # nn.ParameterList properly registers parameters
        self.biases = nn.ParameterList([nn.Parameter(torch.zeros(256)) for _ in range(num_layers)])

    def forward(self, x):
        for layer, bias in zip(self.layers, self.biases):
            x = layer(x) + bias
        return x`,
        goodExplanation: 'nn.ModuleList and nn.ParameterList hook into module registration, ensuring all weights and child layers migrate with .to(device) and serialize in state_dict().',
        perfImpact: 'Silent failure / Weights never update / Device mismatch crashes (CPU vs CUDA)'
      },
      {
        title: 'Modifying model.train() / model.eval() state without disabling Dropout and BatchNorm updates',
        badSnippet: `def evaluate_model(model, val_loader):
    # Missing model.eval()!
    # Dropout still zeros 50% activations randomly
    # BatchNorm corrupts running_mean with validation batch stats
    total_loss = 0.0
    for x, y in val_loader:
        preds = model(x)
        loss = criterion(preds, y)
        total_loss += loss # Bug: leaks full computation graph!
    return total_loss`,
        badExplanation: 'Failing to toggle model.eval() produces erratic validation metrics due to active Dropout and corrupts BatchNorm running statistics. Storing loss tensor directly leaks VRAM.',
        goodSnippet: `def evaluate_model(model, val_loader):
    model.eval() # Freezes Dropout and BatchNorm running stats
    total_loss = 0.0
    with torch.no_grad(): # Disables autograd graph recording
        for x, y in val_loader:
            preds = model(x)
            loss = criterion(preds, y)
            total_loss += loss.item() # Scalar extraction frees graph memory
    model.train() # Restore training mode
    return total_loss`,
        goodExplanation: 'model.eval() deterministically fixes layer behaviors, torch.no_grad() eliminates autograd tape memory overhead, and loss.item() prevents memory leaks.',
        perfImpact: 'Corrupted validation metrics & 3x higher VRAM consumption'
      },
      {
        title: 'Using legacy use_reentrant=True in PyTorch 2.x activation checkpointing',
        badSnippet: `from torch.utils.checkpoint import checkpoint

class CheckpointedBlock(nn.Module):
    def __init__(self, layer):
        super().__init__()
        self.layer = layer

    def forward(self, x):
        # Legacy reentrant checkpointing in PyTorch 2.x
        # Runs nested autograd engine; breaks backward hooks & torch.compile
        return checkpoint(self.layer, x, use_reentrant=True)`,
        badExplanation: 'use_reentrant=True uses a separate nested autograd engine execution during backward, breaking module backward hooks, causing issues with DDP gradient synchronization, and failing torch.compile.',
        goodSnippet: `from torch.utils.checkpoint import checkpoint

class CheckpointedBlock(nn.Module):
    def __init__(self, layer):
        super().__init__()
        self.layer = layer

    def forward(self, x):
        # Modern non-reentrant checkpointing (PyTorch >= 2.0)
        # Natively integrates with hooks, autograd graph, and torch.compile
        return checkpoint(self.layer, x, use_reentrant=False)`,
        goodExplanation: 'use_reentrant=False leverages PyTorch autograd SavedTensorHooks. It is fully compatible with full backward hooks, DistributedDataParallel, and torch.compile dynamo tracing.',
        perfImpact: 'Silent hook breakage, torch.compile graph breaks & 15% execution latency penalty'
      }
    ],
    apiCheatSheet: [
      {
        name: 'nn.Module',
        category: 'Core Architecture',
        signature: 'class torch.nn.Module()',
        summary: 'Base class for all neural network modules. Manages parameter trees, persistent state buffers, submodule hierarchies, and autograd lifecycle hooks.',
        parameters: [],
        returns: 'nn.Module instance',
        exampleSnippet: `class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 2)
    def forward(self, x):
        return self.fc(x)`
      },
      {
        name: 'nn.Parameter',
        category: 'Parameter Management',
        signature: 'torch.nn.Parameter(data: Tensor, requires_grad: bool = True)',
        summary: 'Tensor subclass automatically recognized and registered into self._parameters when assigned as an attribute on an nn.Module.',
        parameters: [
          { name: 'data', type: 'Tensor', desc: 'Parameter tensor data values' },
          { name: 'requires_grad', type: 'bool', desc: 'Whether backpropagation computes gradients for this parameter (default: True)' }
        ],
        returns: 'nn.Parameter tensor',
        exampleSnippet: `self.weight = nn.Parameter(torch.randn(64, 64))`
      },
      {
        name: 'register_buffer',
        category: 'State & Buffers',
        signature: 'module.register_buffer(name: str, tensor: Tensor | None, persistent: bool = True)',
        summary: 'Registers a non-gradient state tensor that moves with model.to(device) and is serialized into state_dict() (if persistent=True).',
        parameters: [
          { name: 'name', type: 'str', desc: 'Buffer attribute name' },
          { name: 'tensor', type: 'Tensor | None', desc: 'Buffer tensor to register' },
          { name: 'persistent', type: 'bool', desc: 'Whether buffer is serialized into state_dict() (default: True)' }
        ],
        returns: 'None',
        exampleSnippet: `self.register_buffer('running_mean', torch.zeros(128))`
      },
      {
        name: 'register_full_backward_hook',
        category: 'Autograd Hooks',
        signature: 'module.register_full_backward_hook(hook: Callable) -> RemovableHandle',
        summary: 'Registers a backward hook on the module. The hook is invoked every time gradients with respect to module inputs/outputs are computed.',
        parameters: [
          { name: 'hook', type: 'Callable', desc: 'Callback with signature fn(module, grad_input, grad_output) -> tuple[Tensor] | None' }
        ],
        returns: 'RemovableHandle with .remove() method',
        exampleSnippet: `handle = layer.register_full_backward_hook(lambda m, gi, go: print(go[0].norm()))`
      },
      {
        name: 'register_forward_hook',
        category: 'Autograd Hooks',
        signature: 'module.register_forward_hook(hook: Callable, *, prepend: bool = False, with_kwargs: bool = False) -> RemovableHandle',
        summary: 'Registers a forward hook on the module. Executed immediately after forward() produces its output.',
        parameters: [
          { name: 'hook', type: 'Callable', desc: 'Callback with signature fn(module, input, output) -> Tensor | None' }
        ],
        returns: 'RemovableHandle with .remove() method',
        exampleSnippet: `handle = layer.register_forward_hook(lambda m, inp, out: activations.append(out.detach()))`
      },
      {
        name: 'checkpoint',
        category: 'Memory Optimization',
        signature: 'torch.utils.checkpoint.checkpoint(function, *args, use_reentrant: bool = False, **kwargs)',
        summary: 'Checkpoints a model segment during forward pass. Activations are freed from VRAM and recomputed dynamically during backward pass.',
        parameters: [
          { name: 'function', type: 'Callable | nn.Module', desc: 'Forward execution block to checkpoint' },
          { name: '*args', type: 'Tensor', desc: 'Input tensors passed to the function' },
          { name: 'use_reentrant', type: 'bool', desc: 'Must be False in PyTorch >= 2.0 to support autograd hooks and torch.compile' }
        ],
        returns: 'Output of function(*args)',
        exampleSnippet: `out = torch.utils.checkpoint.checkpoint(layer, x, use_reentrant=False)`
      },
      {
        name: 'apply',
        category: 'Module Traversal',
        signature: 'module.apply(fn: Callable[[nn.Module], None]) -> nn.Module',
        summary: 'Applies fn recursively to every submodule (as returned by .children()) as well as self. Commonly used for weight initialization.',
        parameters: [
          { name: 'fn', type: 'Callable', desc: 'Function to apply to each submodule' }
        ],
        returns: 'self',
        exampleSnippet: `model.apply(lambda m: nn.init.kaiming_normal_(m.weight) if isinstance(m, nn.Linear) else None)`
      },
      {
        name: 'state_dict',
        category: 'Serialization',
        signature: 'module.state_dict(destination=None, prefix="", keep_vars=False) -> OrderedDict',
        summary: 'Returns a dictionary containing a whole state of the module (all parameters and persistent registered buffers).',
        parameters: [
          { name: 'prefix', type: 'str', desc: 'Prefix added to parameter names' },
          { name: 'keep_vars', type: 'bool', desc: 'Whether to return Variable/Tensor references instead of new detached tensors' }
        ],
        returns: 'OrderedDict[str, Tensor]',
        exampleSnippet: `torch.save(model.state_dict(), 'checkpoint.pt')`
      },
      {
        name: 'named_parameters',
        category: 'Module Inspection',
        signature: 'module.named_parameters(prefix="", recurse=True, remove_duplicate=True) -> Iterator[tuple[str, Parameter]]',
        summary: 'Returns an iterator over module parameters, yielding both the hierarchical string name and the Parameter tensor itself.',
        parameters: [
          { name: 'prefix', type: 'str', desc: 'Prefix to prepend to all parameter names' },
          { name: 'recurse', type: 'bool', desc: 'If True, yields parameters of submodules recursively' }
        ],
        returns: 'Iterator[tuple[str, Parameter]]',
        exampleSnippet: `params = [p for n, p in model.named_parameters() if 'bias' not in n]`
      },
      {
        name: 'to',
        category: 'Device & Precision',
        signature: 'module.to(*args, **kwargs) -> nn.Module',
        summary: 'In-place moves and/or casts the parameters and buffers across devices (cuda, cpu) and dtypes (float16, bfloat16, float32).',
        parameters: [
          { name: 'device', type: 'torch.device | str', desc: 'Target device (e.g., "cuda:0", "cpu")' },
          { name: 'dtype', type: 'torch.dtype', desc: 'Target floating point dtype (e.g., torch.bfloat16)' }
        ],
        returns: 'self',
        exampleSnippet: `model = model.to(device='cuda', dtype=torch.bfloat16)`
      }
    ],
    interactiveWidgetType: 'pytorch-autograd'
  },
  challenges: [
    {
      id: 'd5-c1',
      dayId: 5,
      partId: 5,
      title: 'Gradient Flow Inspector Hook & Selective Activation Checkpoint',
      slug: 'activation-checkpointing-hooks',
      difficulty: 'Advanced',
      category: 'PyTorch Hooks & Memory',
      summary: 'Build forward/backward hooks to detect vanishing/exploding gradients and implement gradient checkpointing.',
      mentalModel5s: 'Deep networks scale activation memory as O(N), causing Out-Of-Memory errors. Activation checkpointing (rematerialization) trades ~25% compute to recompute activations during backward, shrinking peak VRAM from O(N) to O(sqrt(N)).',
      visualAnalogy: 'Instead of holding every intermediate frame of an animation rendered in RAM, save keyframe checkpoints and re-render in-between frames only when applying post-processing filters in reverse.',
      pitfalls: [
        'Using use_reentrant=True (legacy PyTorch default) which breaks full backward hooks, torch.compile, and nested autograd graphs (always use use_reentrant=False).',
        'Running activation checkpointing during model.eval() inference where activations do not need to be saved anyway.',
        'Forgetting to return the RemovableHandle from module.register_full_backward_hook(), making hooks impossible to detach cleanly.',
        'Accessing grad_output without verifying that grad_output is not None and grad_output[0] is not None.'
      ],
      progressiveHints: [
        'Tier 1 (Conceptual): Full backward hooks receive (module, grad_input, grad_output) and fire during the reverse gradient pass without modifying model architecture.',
        'Tier 2 (Hook Implementation): Extract grad_out[0].detach() and compute L2 norm via torch.linalg.norm(..., ord=2).item(); store in self.grad_norms[name] and return the handle.',
        'Tier 3 (Checkpointing Condition): In forward(x, use_checkpointing=True), check if use_checkpointing and self.training are both True before applying checkpointing.',
        'Tier 4 (PyTorch 2.x API): Call torch.utils.checkpoint.checkpoint(layer, curr, use_reentrant=False) for modern PyTorch 2.x compatibility.'
      ],
      deepInternals: {
        title: 'PyTorch Backward Hook Subsystem & Checkpoint Rematerialization',
        content: 'When use_reentrant=False is used, PyTorch wraps the forward pass in torch._C._autograd._saved_tensors_hooks, discarding intermediate activations from VRAM and regenerating them during backward by re-invoking the forward sub-graph.',
        keyRule: 'Always pass use_reentrant=False to torch.utils.checkpoint.checkpoint in PyTorch >= 2.0.'
      },
      instructions: `In deep neural networks (e.g. 80-layer Transformers), storing all layer activations leads to Out-Of-Memory (OOM) errors, while unmonitored backpropagation can silently fail from vanishing ($||\\nabla \\mathcal{L}|| \\to 0$) or exploding ($||\\nabla \\mathcal{L}|| > 10^4$) gradients.

**Tasks:**
1. Implement \`GradientFlowHook\` using \`module.register_full_backward_hook()\`:
   - Intercept \`grad_output[0]\` during the backward pass for registered submodules.
   - Calculate and store the L2 norm $\\|\\mathbf{g}\\|_2 = \\sqrt{\\sum g_i^2}$ in \`self.grad_norms[name]\`.
   - Return a removable hook handle so hooks can be cleanly detached.
2. Implement \`DeepCheckpointedMLP\` with \`num_layers\` Sequential sub-blocks:
   - In \`forward(x, use_checkpointing=True)\`, when \`use_checkpointing=True\` and \`self.training=True\`, pass intermediate activations through \`torch.utils.checkpoint.checkpoint(layer, curr, use_reentrant=False)\`.
   - When \`use_checkpointing=False\` or \`self.training=False\`, evaluate layers standardly without checkpointing overhead.
3. Ensure numerical gradient equivalence between checkpointed and non-checkpointed passes.`,
      hints: [
        'Full backward hook signature: def hook_fn(module, grad_input, grad_output):',
        'Extract grad_output: if grad_out is not None and len(grad_out) > 0 and grad_out[0] is not None: norm = torch.linalg.norm(grad_out[0].detach()).item()',
        'Store norm: self.grad_norms[name] = norm',
        'In DeepCheckpointedMLP forward: use checkpoint(layer, curr, use_reentrant=False) when use_checkpointing and self.training',
        'Remember to return the RemovableHandle from module.register_full_backward_hook(_hook)'
      ],
      starterCode: `import torch
import torch.nn as nn
from torch.utils.checkpoint import checkpoint

class GradientFlowHook:
    """
    Attaches full backward hooks to track L2 gradient norms across layers.
    """
    def __init__(self):
        self.grad_norms: dict[str, float] = {}

    def register(self, name: str, module: nn.Module):
        """
        Register a full backward hook on module and record grad_output L2 norm.
        """
        # TODO: Implement full backward hook registration
        pass

class DeepCheckpointedMLP(nn.Module):
    """
    Multi-layer MLP supporting selective activation rematerialization via checkpointing.
    """
    def __init__(self, num_layers: int = 8, hidden_dim: int = 512):
        super().__init__()
        self.layers = nn.ModuleList([
            nn.Sequential(nn.Linear(hidden_dim, hidden_dim), nn.GELU())
            for _ in range(num_layers)
        ])

    def forward(self, x: torch.Tensor, use_checkpointing: bool = True) -> torch.Tensor:
        """
        Forward pass with optional activation checkpointing.
        """
        # TODO: Implement forward pass with use_reentrant=False checkpointing
        pass
`,
      solutionCode: `import torch
import torch.nn as nn
from torch.utils.checkpoint import checkpoint

class GradientFlowHook:
    def __init__(self):
        self.grad_norms: dict[str, float] = {}

    def register(self, name: str, module: nn.Module):
        def _hook(m, grad_in, grad_out):
            if grad_out is not None and len(grad_out) > 0 and grad_out[0] is not None:
                norm = torch.linalg.norm(grad_out[0].detach()).item()
                self.grad_norms[name] = norm
        return module.register_full_backward_hook(_hook)

class DeepCheckpointedMLP(nn.Module):
    def __init__(self, num_layers: int = 8, hidden_dim: int = 512):
        super().__init__()
        self.layers = nn.ModuleList([
            nn.Sequential(nn.Linear(hidden_dim, hidden_dim), nn.GELU())
            for _ in range(num_layers)
        ])

    def forward(self, x: torch.Tensor, use_checkpointing: bool = True) -> torch.Tensor:
        curr = x
        for layer in self.layers:
            if use_checkpointing and self.training:
                curr = checkpoint(layer, curr, use_reentrant=False)
            else:
                curr = layer(curr)
        return curr
`,
      testCases: [
        {
          id: 't1',
          name: 'Gradient Norm Tracking Across Layers',
          inputDescription: '8-layer MLP backward pass with hooked layers',
          expectedOutput: 'All registered layers populate self.grad_norms with valid positive float values'
        },
        {
          id: 't2',
          name: 'Checkpointing Numerical Equivalence',
          inputDescription: 'Compare forward/backward output with use_checkpointing=True vs False',
          expectedOutput: 'Max absolute difference < 1e-5 between outputs and parameter gradients'
        },
        {
          id: 't3',
          name: 'Eval Mode Checkpointing Bypass',
          inputDescription: 'model.eval() forward execution',
          expectedOutput: 'Runs standard forward pass without activation checkpointing overhead'
        }
      ],
      benchmarkTargetMs: 8.5,
      memoryTargetMb: 14.0,
      conceptPrimer: {
        title: 'Activation Checkpointing (Rematerialization) & Backward Hooks',
        subtitle: 'Trading ~25% Compute Overhead for 75% VRAM Reduction',
        overview: 'During standard deep learning backpropagation, all intermediate forward activations must be cached in GPU memory until their corresponding backward gradient pass completes. Activation checkpointing drops intermediate activations during forward pass and rematerializes them on-the-fly during backpropagation.',
        mentalModel5s: 'Checkpoint boundaries save key activations; intermediate layers recompute on-the-fly during backprop.',
        visualAnalogy: 'Leaving breadcrumbs along a trail to retrace steps without carrying the entire map.',
        pitfalls: [
          'Using use_reentrant=True which causes autograd issues in PyTorch 2.x.',
          'Trying to checkpoint non-differentiable or in-place mutated modules.'
        ],
        progressiveHints: [
          'Tier 1: Hook grad_output in register_full_backward_hook.',
          'Tier 2: Calculate torch.linalg.norm.',
          'Tier 3: checkpoint(layer, curr, use_reentrant=False)',
          'Tier 4: Only checkpoint when self.training is True.'
        ],
        deepInternals: {
          title: 'Saved Tensors Hook Infrastructure',
          content: 'PyTorch 2.0 uses saved_tensors_hooks to cleanly pair tensor serialization and recomputation.',
          keyRule: 'Always use use_reentrant=False with checkpoint().'
        },
        mathFormulas: [
          {
            title: 'Memory Complexity Scaling Theorem',
            latex: '\\mathcal{M}_{\\text{Standard}} = O(N) \\quad \\Longrightarrow \\quad \\mathcal{M}_{\\text{Checkpointed}} = O(\\sqrt{N})',
            explanation: 'With optimal checkpoint interval k = sqrt(N), peak activation memory scales with square root of depth instead of linear depth.'
          },
          {
            title: 'Gradient L2 Norm Metric',
            latex: '\\|\\nabla_{\\mathbf{y}} \\mathcal{L}\\|_2 = \\sqrt{\\sum_{i=1}^D \\left(\\frac{\\partial \\mathcal{L}}{\\partial y_i}\\right)^2}',
            explanation: 'Computed inside the backward hook to detect vanishing or exploding gradient dynamics across layer depth.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Standard forward pass: saves all N layer activations in RAM
def forward(self, x):
    for layer in self.layers:
        x = layer(x) # Every intermediate tensor is retained for backward!
    return x`,
          naiveExplanation: 'Materializes and holds all intermediate layer activations in VRAM, causing OOM on deep architectures or large batches.',
          idiomaticCode: `# Checkpointed forward pass: recomputes activations during backward
def forward(self, x):
    for layer in self.layers:
        if self.training:
            x = torch.utils.checkpoint.checkpoint(layer, x, use_reentrant=False)
        else:
            x = layer(x)
    return x`,
          idiomaticExplanation: 'Frees internal activations immediately after forward, recomputing them dynamically during backward pass to achieve 75% memory reduction.',
          speedupText: '4x larger batch size capability'
        },
        memoryLayout: {
          title: 'Activation Lifetime Timeline',
          content: 'Standard: Forward saves A_1, A_2, ..., A_N in VRAM until Backward completes. Checkpointed: Saves only checkpoint boundaries; layer internal activations are recomputed and discarded.',
          diagramAscii: `Forward Pass:  [L1 -> A1] -> [L2 -> A2] -> [L3 -> A3] -> Loss
Standard VRAM:  [  A1  ]    [  A2  ]    [  A3  ]   (All stored in VRAM!)
Checkpointing:  [Saved ]    [Freed ]    [Saved ]   (A2 recomputed in backward)`,
          keyRule: 'Always use use_reentrant=False in PyTorch >= 2.0 to support autograd hooks and avoid nested sub-graph overhead.'
        },
        keyTakeaways: [
          'Rematerialization trades a minor 25% compute penalty for massive 75% VRAM savings.',
          'Hooks allow non-invasive gradient and activation monitoring during training.',
          'Full backward hooks receive (module, grad_input, grad_output) and must return RemovableHandle.',
          'Always use use_reentrant=False to ensure compatibility with modern PyTorch 2.x compile and hooks.'
        ]
      },
      sampleDataFrame: {
        name: 'Layer Gradient Flow & Memory Profile (Depth=8, Dim=512)',
        columns: ['Layer_Index', 'Layer_Name', 'Grad_Norm_L2', 'VRAM_Standard_MB', 'VRAM_Checkpointed_MB'],
        dtypes: {
          Layer_Index: 'int64',
          Layer_Name: 'string',
          Grad_Norm_L2: 'float64',
          VRAM_Standard_MB: 'float64',
          VRAM_Checkpointed_MB: 'float64'
        },
        rows: [
          { Layer_Index: 7, Layer_Name: 'layers.7', Grad_Norm_L2: 2.451, VRAM_Standard_MB: 128.0, VRAM_Checkpointed_MB: 32.0 },
          { Layer_Index: 6, Layer_Name: 'layers.6', Grad_Norm_L2: 1.890, VRAM_Standard_MB: 112.0, VRAM_Checkpointed_MB: 32.0 },
          { Layer_Index: 5, Layer_Name: 'layers.5', Grad_Norm_L2: 1.421, VRAM_Standard_MB: 96.0, VRAM_Checkpointed_MB: 32.0 },
          { Layer_Index: 4, Layer_Name: 'layers.4', Grad_Norm_L2: 1.105, VRAM_Standard_MB: 80.0, VRAM_Checkpointed_MB: 32.0 },
          { Layer_Index: 3, Layer_Name: 'layers.3', Grad_Norm_L2: 0.872, VRAM_Standard_MB: 64.0, VRAM_Checkpointed_MB: 32.0 },
          { Layer_Index: 2, Layer_Name: 'layers.2', Grad_Norm_L2: 0.654, VRAM_Standard_MB: 48.0, VRAM_Checkpointed_MB: 32.0 },
          { Layer_Index: 1, Layer_Name: 'layers.1', Grad_Norm_L2: 0.498, VRAM_Standard_MB: 32.0, VRAM_Checkpointed_MB: 32.0 },
          { Layer_Index: 0, Layer_Name: 'layers.0', Grad_Norm_L2: 0.381, VRAM_Standard_MB: 16.0, VRAM_Checkpointed_MB: 32.0 }
        ],
        totalRows: 8,
        memoryUsageKb: 1.8
      },
      samplePlot: {
        id: 'p5-memory',
        title: 'Peak VRAM Scaling: Standard Forward vs Activation Checkpointing',
        type: 'svg',
        description: 'VRAM consumption scaling across network depth (8 to 64 layers)',
        svgContent: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
  <rect width="600" height="300" fill="#0f172a" rx="8"/>
  <line x1="60" y1="240" x2="560" y2="240" stroke="#334155" stroke-width="1.5"/>
  <line x1="60" y1="40" x2="60" y2="240" stroke="#334155" stroke-width="1.5"/>
  <line x1="60" y1="190" x2="560" y2="190" stroke="#1e293b" stroke-dasharray="4"/>
  <line x1="60" y1="140" x2="560" y2="140" stroke="#1e293b" stroke-dasharray="4"/>
  <line x1="60" y1="90" x2="560" y2="90" stroke="#1e293b" stroke-dasharray="4"/>
  <!-- Standard Linear O(N) Curve (Red) -->
  <path d="M 80 220 L 520 60" fill="none" stroke="#ef4444" stroke-width="3"/>
  <!-- Checkpointed O(sqrt(N)) Curve (Green) -->
  <path d="M 80 225 Q 300 210, 520 175" fill="none" stroke="#22c55e" stroke-width="3.5"/>
  <!-- Labels -->
  <text x="440" y="55" fill="#ef4444" font-weight="bold" font-size="11" font-family="monospace">Standard O(N) [OOM at 64L]</text>
  <text x="430" y="165" fill="#22c55e" font-weight="bold" font-size="11" font-family="monospace">Checkpointed O(√N) [75% Savings]</text>
  <text x="30" y="35" fill="#94a3b8" font-size="11">VRAM (GB)</text>
  <text x="500" y="260" fill="#94a3b8" font-size="11">Network Depth (N)</text>
</svg>`
      },
      expectedTensors: [
        { name: 'Input Tensor x', shape: '(16, 512)', dtype: 'float32' },
        { name: 'Output Tensor', shape: '(16, 512)', dtype: 'float32' },
        { name: 'Layer 0 Gradient', shape: '(16, 512)', dtype: 'float32' }
      ]
    }
  ]
};

export const PART05_TRACK = DAY05_TRACK;
export default DAY05_TRACK;
