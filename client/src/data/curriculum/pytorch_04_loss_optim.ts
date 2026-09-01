import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const CHALLENGE_1: Challenge = {
  id: 'torch-p4-c1',
  dayId: 4,
  partId: 4,
  title: 'Classification & Regression Loss Evaluator',
  slug: 'classification-regression-loss-evaluator',
  difficulty: 'Intermediate',
  category: 'Loss Functions & Optimizers',
  summary: 'Compute Mean Squared Error (MSE) for regression targets and Cross-Entropy loss on raw logits for multi-class classification, extracting probabilities and discrete predictions.',
  mentalModel5s: 'MSE measures distance between continuous numbers; Cross-Entropy evaluates probabilities against discrete class indices using raw unnormalized logits.',
  visualAnalogy: 'MSE is like measuring how many inches an arrow missed the bullseye; Cross-Entropy is a strict grading rubric that gives a high score only when the model places maximum probability on the correct multiple-choice letter.',
  pitfalls: [
    'Applying softmax to logits before passing them to nn.CrossEntropyLoss (PyTorch fuses LogSoftmax and NLLLoss internally!).',
    'Passing one-hot encoded vectors into nn.CrossEntropyLoss when integer class indices are expected.',
    'Mismatched shapes between continuous regression predictions and ground-truth targets.'
  ],
  progressiveHints: [
    'Tier 1: Check pred_reg.shape == target_reg.shape and logits_cls.shape[0] == target_cls.shape[0].',
    'Tier 2: Instantiate mse_criterion = nn.MSELoss() and ce_criterion = nn.CrossEntropyLoss().',
    'Tier 3: Pass logits directly into ce_criterion(logits_cls, target_cls)—do not apply softmax beforehand!',
    'Tier 4: Compute probabilities with torch.softmax(logits_cls, dim=-1) and predictions with torch.argmax(logits_cls, dim=-1).'
  ],
  deepInternals: {
    title: 'Numerical Stability & Log-Sum-Exp Trick',
    content: 'nn.CrossEntropyLoss fuses log-softmax and negative log-likelihood into a single C++ kernel. Subtracting max(z) before exponentiation prevents catastrophic floating-point overflow and underflow.',
    keyRule: 'Always feed raw logits directly into nn.CrossEntropyLoss.'
  },
  instructions: `Deep learning tasks divide fundamentally into regression (continuous numerical values) and classification (discrete categorical choices).

Write a function \`evaluate_losses(pred_reg: torch.Tensor, target_reg: torch.Tensor, logits_cls: torch.Tensor, target_cls: torch.Tensor) -> dict\` that:
1. Validates regression shape compatibility: \`pred_reg.shape == target_reg.shape\`. If mismatched, raise \`ValueError("Regression predictions and targets must have matching shapes")\`.
2. Validates classification batch dimensions: \`logits_cls.shape[0] == target_cls.shape[0]\`. If mismatched, raise \`ValueError("Classification batch dimensions must match")\`.
3. Computes regression loss using \`nn.MSELoss()(pred_reg, target_reg)\`.
4. Computes classification loss using \`nn.CrossEntropyLoss()(logits_cls, target_cls)\`.
5. Computes predicted class probabilities using softmax: \`probs = torch.softmax(logits_cls, dim=-1)\`.
6. Computes predicted discrete classes using argmax: \`preds = torch.argmax(logits_cls, dim=-1)\`.
7. Returns a dictionary containing:
   \`{"mse_loss": float(mse_loss.item()), "ce_loss": float(ce_loss.item()), "probabilities": probs, "predicted_classes": preds}\``,
  hints: [
    'Use nn.MSELoss() for regression predictions and targets.',
    'Pass raw logits directly into nn.CrossEntropyLoss().',
    'Compute probabilities with torch.softmax(logits_cls, dim=-1).',
    'Compute class indices with torch.argmax(logits_cls, dim=-1).'
  ],
  starterCode: `import torch
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
    # TODO: Validate shapes, compute MSE and CrossEntropy, extract probs and preds
    pass
`,
  solutionCode: `import torch
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
`,
  testCases: [
    {
      id: 't1',
      name: 'Regression & Multi-Class Evaluation',
      inputDescription: 'pred_reg: [[1], [3]], target_reg: [[1], [5]], logits: [[5, 1, 0], [0.1, 4, 0.2]], labels: [0, 1]',
      expectedOutput: 'mse_loss=2.0, ce_loss > 0, probabilities sum to 1.0, predicted_classes=[0, 1]'
    },
    {
      id: 't2',
      name: 'Regression Shape Mismatch Guard',
      inputDescription: 'pred_reg (1,) and target_reg (2,)',
      expectedOutput: 'Raises ValueError("Regression predictions and targets must have matching shapes")'
    },
    {
      id: 't3',
      name: 'Classification Batch Dimension Guard',
      inputDescription: 'logits batch size 2, labels batch size 3',
      expectedOutput: 'Raises ValueError("Classification batch dimensions must match")'
    }
  ],
  benchmarkTargetMs: 0.2,
  memoryTargetMb: 0.2,
  conceptPrimer: {
    title: 'Loss Functions: Quantifying Model Performance',
    subtitle: 'Mean Squared Error, Cross-Entropy with Logits, and Softmax',
    overview: 'Loss functions provide the scalar target that guides backpropagation. Regression uses Mean Squared Error (MSE), while multi-class classification uses Cross-Entropy on unnormalized logits.',
    mentalModel5s: 'MSE for continuous numbers; CrossEntropy on raw logits for discrete classes.',
    visualAnalogy: 'MSE is calculating the distance between a target point and where your dart landed; Cross-Entropy is a multiple-choice grading scanner checking which circle was filled in.',
    pitfalls: [
      'Applying softmax before nn.CrossEntropyLoss, which causes double-softmax distortion and numerical instability.'
    ],
    progressiveHints: [
      'Step 1: Check shape equality for regression.',
      'Step 2: Check batch size equality for classification.',
      'Step 3: Call nn.MSELoss and nn.CrossEntropyLoss.',
      'Step 4: Use torch.softmax and torch.argmax along dim=-1.'
    ],
    mathFormulas: [
      {
        title: 'Cross-Entropy Loss with Softmax Formulation',
        latex: '\\mathcal{L}_{\\text{CE}} = -\\log \\left( \\frac{e^{z_y}}{\\sum_j e^{z_j}} \\right)',
        explanation: 'Minimizing cross-entropy maximizes the predicted probability of the true target class y.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Manual numerically unstable cross entropy
probs = torch.exp(logits) / torch.exp(logits).sum(dim=-1, keepdim=True)
loss = -torch.log(probs[range(len(labels)), labels]).mean()  # Overflow on large logits!`,
      naiveExplanation: 'Computing exp() directly on large logits can overflow to infinity or underflow to zero.',
      idiomaticCode: `# PyTorch fused CrossEntropyLoss
loss_fn = nn.CrossEntropyLoss()
loss = loss_fn(logits, labels)`,
      idiomaticExplanation: 'Fuses log-sum-exp in compiled C++, guaranteeing numerical stability.',
      speedupText: 'Numerically stable & fast'
    },
    memoryLayout: {
      title: 'Logits vs Probability Tensors',
      content: 'Logits are unconstrained real values in (-inf, +inf). Softmax squashes them into [0, 1] summing to 1.',
      diagramAscii: `[Logits: 2.5, 0.1, -1.2] ──► [Softmax] ──► [Probs: 0.88, 0.09, 0.03]`,
      keyRule: 'Only feed unnormalized logits into nn.CrossEntropyLoss.'
    },
    keyTakeaways: [
      'Use nn.MSELoss for continuous regressions.',
      'Never pass softmax outputs to nn.CrossEntropyLoss—pass raw logits.',
      'Use torch.argmax(logits, dim=-1) to retrieve the top predicted class index.'
    ]
  },
  expectedTensors: [
    { name: 'probabilities', shape: '(B, C)', dtype: 'float32' },
    { name: 'predicted_classes', shape: '(B,)', dtype: 'int64' }
  ]
};

export const CHALLENGE_2: Challenge = {
  id: 'torch-p4-c2',
  dayId: 4,
  partId: 4,
  title: 'Single-Step Parameter Update Optimizer',
  slug: 'single-step-parameter-update-optimizer',
  difficulty: 'Advanced',
  category: 'Loss Functions & Optimizers',
  summary: 'Execute the canonical 5-step PyTorch training update (zero_grad, forward, loss, backward, step) using the Adam optimizer, and verify weight parameter mutations.',
  mentalModel5s: 'The 5-step training rhythm: zero_grad() -> forward() -> loss() -> backward() -> step(). Every PyTorch model trains on this loop.',
  visualAnalogy: 'A rowing team: clear the oar splash (zero_grad), pull forward through the water (forward + loss), feel the water resistance (backward gradients), and kick the sliding seat forward (optimizer step).',
  pitfalls: [
    'Forgetting optimizer.zero_grad(), causing gradients to pile up from previous iterations.',
    'Calling optimizer.step() before loss.backward(), which attempts to update parameters with missing or stale gradients.',
    'Setting non-positive or negative learning rates.'
  ],
  progressiveHints: [
    'Tier 1: Check lr > 0 and raise ValueError if false.',
    'Tier 2: Instantiate optimizer = torch.optim.Adam(model.parameters(), lr=lr).',
    'Tier 3: Snapshot initial parameters: [p.clone().detach() for p in model.parameters()].',
    'Tier 4: Execute zero_grad() -> model(x) -> MSELoss -> loss.backward() -> optimizer.step() -> return results.'
  ],
  deepInternals: {
    title: 'Adam Moment Tracking & Weight Mutation',
    content: 'Adam tracks running exponentially weighted moving averages of gradient first moments (m) and second moments (v). optimizer.step() applies weight updates in-place directly on param.data buffers.',
    keyRule: 'Always perform optimizer.step() after loss.backward() and before the next optimizer.zero_grad().'
  },
  instructions: `Training neural networks consists of repeating a 5-step optimization cycle over batches of data.

Write a function \`single_step_adam_update(model: nn.Module, x: torch.Tensor, target: torch.Tensor, lr: float = 0.01) -> dict\` that:
1. Validates that \`lr > 0\`. If not, raise \`ValueError("Learning rate must be positive")\`.
2. Instantiates an Adam optimizer: \`optimizer = torch.optim.Adam(model.parameters(), lr=lr)\`.
3. Captures a detached clone of all initial model parameters:
   \`initial_params = [p.clone().detach() for p in model.parameters()]\`
4. Executes the canonical 5-step training update:
   a. \`optimizer.zero_grad()\`
   b. \`output = model(x)\`
   c. \`loss = nn.MSELoss()(output, target)\`
   d. \`loss.backward()\`
   e. Captures gradient norms: \`grad_norms = [float(p.grad.norm().item()) for p in model.parameters() if p.grad is not None]\`
   f. \`optimizer.step()\`
5. Checks whether parameters were modified by testing if any parameter differs from its initial clone:
   \`params_updated = any(not torch.equal(p, init_p) for p, init_p in zip(model.parameters(), initial_params))\`
6. Returns a dictionary containing:
   \`{"initial_loss": float(loss.item()), "optimizer": optimizer, "params_updated": bool(params_updated), "grad_norms": grad_norms}\``,
  hints: [
    'Verify lr > 0 before proceeding.',
    'Create the optimizer with torch.optim.Adam(model.parameters(), lr=lr).',
    'Follow the sequence: zero_grad -> model(x) -> loss -> backward -> step.',
    'Capture initial parameter clones before calling optimizer.step().'
  ],
  starterCode: `import torch
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
    # TODO: Validate lr, configure Adam, execute 5-step loop, verify weight updates
    pass
`,
  solutionCode: `import torch
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
`,
  testCases: [
    {
      id: 't1',
      name: 'Adam Step & Weight Mutation',
      inputDescription: 'Linear(3, 1) model, random inputs, lr=0.05',
      expectedOutput: 'params_updated is True, optimizer is Adam, grad_norms are positive'
    },
    {
      id: 't2',
      name: 'Invalid Negative Learning Rate',
      inputDescription: 'lr=-0.01',
      expectedOutput: 'Raises ValueError("Learning rate must be positive")'
    },
    {
      id: 't3',
      name: 'Zero Learning Rate Guard',
      inputDescription: 'lr=0.0',
      expectedOutput: 'Raises ValueError("Learning rate must be positive")'
    }
  ],
  benchmarkTargetMs: 0.3,
  memoryTargetMb: 0.2,
  conceptPrimer: {
    title: 'Optimizers & The 5-Step Training Loop',
    subtitle: 'Adaptive moment estimation, gradient zeroing, and parameter updates',
    overview: 'Optimizers adjust network parameters to minimize loss. Adam tracks running averages of past gradients to adaptively scale learning rates for each parameter.',
    mentalModel5s: 'zero_grad() -> forward -> loss -> backward() -> step(). Repeat across epochs.',
    visualAnalogy: 'Navigating downhill in thick fog: zero_grad checks your compass, forward and loss feel the incline, backward calculates the downhill slope, and step moves your feet in that direction.',
    pitfalls: [
      'Calling step() without calling backward(), meaning parameters never receive gradient information.'
    ],
    progressiveHints: [
      'Step 1: Check lr > 0.',
      'Step 2: Configure Adam optimizer.',
      'Step 3: Save clone of initial parameters.',
      'Step 4: Execute zero_grad, model(x), loss, backward, step.'
    ],
    mathFormulas: [
      {
        title: 'Adam Parameter Update Rule',
        latex: '\\theta_{t+1} = \\theta_t - \\frac{\\eta}{\\sqrt{\\hat{v}_t} + \\epsilon} \\hat{m}_t',
        explanation: 'Parameters are updated using bias-corrected first (m) and second (v) gradient moments.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Manual parameter update loop
for p in model.parameters():
    p.data -= lr * p.grad  # Vanilla SGD without momentum or adaptive learning rate`,
      naiveExplanation: 'Requires manual loop and lacks adaptive momentum or learning rate scheduling.',
      idiomaticCode: `# PyTorch optimizer.step()
optimizer.step()`,
      idiomaticExplanation: 'Dispatches compiled CUDA/C++ routines that update parameters and maintain optimizer state.',
      speedupText: 'Standardized & robust'
    },
    memoryLayout: {
      title: 'Optimizer State Storage',
      content: 'Optimizers maintain internal state dictionaries storing momentum and variance tensors for each parameter.',
      diagramAscii: `[Adam Optimizer] ──► state[param]: {"step": 1, "exp_avg": Tensor, "exp_avg_sq": Tensor}`,
      keyRule: 'optimizer.state_dict() serializes optimizer momentum buffers alongside model weights.'
    },
    keyTakeaways: [
      'Always call optimizer.zero_grad() before loss.backward().',
      'Adam adapts learning rates automatically for sparse features.',
      'Call optimizer.step() to apply the computed gradients to model weights.'
    ]
  },
  expectedTensors: []
};

export const DAY04_TRACK: DayTrack = {
  partNumber: 4,
  partId: 4,
  dayNumber: 4,
  id: 4,
  title: 'Part 4: Loss Functions & Optimizers',
  subtitle: 'Master MSE, Cross-Entropy with logits, gradient descent mechanics, and Adam parameter updates',
  description: 'Complete the core PyTorch training loop foundation. Master objective loss functions (nn.MSELoss for continuous targets, nn.CrossEntropyLoss on raw logits for multi-class classification), gradient descent algorithms, Adam optimizers, and the canonical 5-step optimization update loop.',
  iconName: 'Flame',
  badge: 'Part 4 • Loss & Optimizers',
  libraryMechanics: {
    libraryName: 'PyTorch Loss & Optimizer Architecture',
    tagline: 'Objective quantification and parameter optimization algorithms.',
    overview: `### 🌟 Guiding Models with Losses and Optimizers
Training deep neural networks is an optimization game guided by two critical components:
1. **Loss Function (Criterion):** Formulates the objective by quantifying error between model predictions and true targets.
2. **Optimizer:** Updates model weights in the direction that minimizes loss.

PyTorch provides industry-standard loss functions (MSE, Cross-Entropy, Huber, BCEWithLogits) and optimizers (SGD, Adam, AdamW, RMSprop) designed for high numerical stability and parallel throughput.`,
    whyItExists: `Hand-crafting numerical loss routines and optimizer updates introduces floating point bugs and instability.

PyTorch ensures:
- **Numerically Fused Kernels:** CrossEntropyLoss combines LogSoftmax with NLLLoss, completely avoiding numerical underflow or overflow.
- **Adaptive Learning Rates:** Optimizers like Adam scale step sizes adaptively for each individual parameter.
- **Unified Interface:** All optimizers share identical \`zero_grad()\` and \`step()\` methods.`,
    coreAnatomy: {
      objectName: 'torch.optim.Optimizer',
      description: 'Base class for all PyTorch optimizers managing parameter groups, state buffers, and update rules.',
      fields: [
        {
          name: 'param_groups',
          type: 'list[dict]',
          role: 'List of parameter groups allowing different learning rates or weight decay for different layers.'
        },
        {
          name: 'state',
          type: 'dict[Parameter, dict]',
          role: 'Dictionary storing optimizer state (e.g. running momentum and variance buffers).'
        }
      ],
      memoryDiagramAscii: `+=============================================================+
|                 CANONICAL 5-STEP TRAINING STEP              |
+=============================================================+
  1. optimizer.zero_grad()  ──► Clears stale .grad buffers
  2. y_pred = model(x)       ──► Forward inference pass
  3. loss = criterion(y_pred, target) ──► Computes scalar objective
  4. loss.backward()         ──► Populates parameter .grad via Autograd
  5. optimizer.step()        ──► Mutates parameter weights in-place`
    },
    chapters: [
      {
        id: 'ch1-loss-functions',
        title: 'Regression vs Classification Losses',
        icon: 'Target',
        summary: 'Choosing between MSELoss and CrossEntropyLoss with unnormalized logits.',
        markdownContent: `### Loss Objectives

- **\`nn.MSELoss\`:** For continuous outputs: $\\mathcal{L} = \\frac{1}{N}\\sum (\\hat{y} - y)^2$.
- **\`nn.CrossEntropyLoss\`:** For multi-class classification: pass raw **unnormalized logits** directly.

\`\`\`python
import torch
import torch.nn as nn

# Classification loss with raw logits
criterion = nn.CrossEntropyLoss()
logits = torch.tensor([[2.0, 0.5, 0.1]], requires_grad=True)
label = torch.tensor([0])
loss = criterion(logits, label)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-loss-eval',
            title: 'Evaluating MSE and CrossEntropy',
            code: `import torch
import torch.nn as nn

mse = nn.MSELoss()
ce = nn.CrossEntropyLoss()

pred_reg = torch.tensor([2.0, 3.0])
target_reg = torch.tensor([2.0, 5.0])
print("MSE Loss:", mse(pred_reg, target_reg).item())

logits = torch.tensor([[10.0, 1.0]])
target_cls = torch.tensor([0])
print("CE Loss:", ce(logits, target_cls).item())`,
            expectedOutput: `MSE Loss: 2.0
CE Loss: 0.0001233816146850586`,
            explanation: 'Demonstrates both continuous distance and categorical classification errors.'
          }
        ]
      },
      {
        id: 'ch2-optimizers-adam',
        title: 'The Adam Optimizer & Step Rhythm',
        icon: 'Zap',
        summary: 'Adaptive momentum parameter updates and the 5-step training cadence.',
        markdownContent: `### The 5-Step Training Update

\`\`\`python
optimizer.zero_grad()   # 1. Clear old gradients
output = model(inputs)  # 2. Forward pass
loss = loss_fn(output, targets) # 3. Loss calculation
loss.backward()         # 4. Backward pass
optimizer.step()        # 5. Update weights
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-adam-step',
            title: 'Single optimizer step',
            code: `import torch
import torch.nn as nn
import torch.optim as optim

model = nn.Linear(2, 1)
optimizer = optim.Adam(model.parameters(), lr=0.1)

x = torch.randn(4, 2)
y = torch.randn(4, 1)

optimizer.zero_grad()
loss = nn.MSELoss()(model(x), y)
loss.backward()
optimizer.step()
print("Optimization step completed successfully.")`,
            expectedOutput: `Optimization step completed successfully.`,
            explanation: 'Updates all linear layer weights and biases in-place.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Applying Softmax Before nn.CrossEntropyLoss',
        badSnippet: `# Redundant and unstable softmax
probs = torch.softmax(logits, dim=-1)
loss = criterion(probs, labels)`,
        badExplanation: 'nn.CrossEntropyLoss expects raw unnormalized logits and applies LogSoftmax internally.',
        goodSnippet: `# Feed raw logits directly
loss = criterion(logits, labels)`,
        goodExplanation: 'Allows PyTorch to use the fused log-sum-exp kernel for maximum numerical stability.',
        perfImpact: 'Prevents NaN losses and catastrophic float cancellation.'
      },
      {
        title: 'Calling optimizer.step() Before loss.backward()',
        badSnippet: `loss = criterion(model(x), y)
optimizer.step()  # Weights do not update!
loss.backward()`,
        badExplanation: 'optimizer.step() uses parameter .grad attributes, which are only populated by .backward().',
        goodSnippet: `loss = criterion(model(x), y)
loss.backward()
optimizer.step()`,
        goodExplanation: 'Always compute gradients before stepping the optimizer.',
        perfImpact: 'Ensures correct parameter updates.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'nn.MSELoss',
        category: 'Loss',
        signature: 'torch.nn.MSELoss(reduction="mean")',
        summary: 'Measures element-wise mean squared error.',
        parameters: [
          { name: 'reduction', type: 'str', desc: 'Specifies reduction to apply to output: "none" | "mean" | "sum".' }
        ],
        returns: 'Loss module.',
        exampleSnippet: 'criterion = nn.MSELoss()'
      },
      {
        name: 'nn.CrossEntropyLoss',
        category: 'Loss',
        signature: 'torch.nn.CrossEntropyLoss(weight=None, reduction="mean")',
        summary: 'Computes cross entropy loss between input logits and target class indices.',
        parameters: [
          { name: 'weight', type: 'Tensor, optional', desc: 'Manual rescaling weight given to each class.' }
        ],
        returns: 'Loss module.',
        exampleSnippet: 'criterion = nn.CrossEntropyLoss()'
      },
      {
        name: 'optim.Adam',
        category: 'Optim',
        signature: 'torch.optim.Adam(params, lr=0.001, betas=(0.9, 0.999), eps=1e-8)',
        summary: 'Implements Adam adaptive moment estimation algorithm.',
        parameters: [
          { name: 'params', type: 'iterable', desc: 'Iterable of parameters to optimize or dicts defining parameter groups.' },
          { name: 'lr', type: 'float', desc: 'Learning rate (default: 1e-3).' }
        ],
        returns: 'Adam optimizer instance.',
        exampleSnippet: 'optimizer = optim.Adam(model.parameters(), lr=0.001)'
      },
      {
        name: 'optimizer.zero_grad',
        category: 'Optim',
        signature: 'optimizer.zero_grad(set_to_none=True)',
        summary: 'Resets the gradients of all optimized torch.Tensor s.',
        parameters: [
          { name: 'set_to_none', type: 'bool', desc: 'Instead of setting to zero, set grads to None for lower memory overhead.' }
        ],
        returns: 'None.',
        exampleSnippet: 'optimizer.zero_grad()'
      }
    ],
    interactiveWidgetType: 'production-pipeline'
  },
  challenges: [CHALLENGE_1, CHALLENGE_2]
};

export const PYTORCH_PART04_TRACK = DAY04_TRACK;
export const testCases = [...CHALLENGE_1.testCases, ...CHALLENGE_2.testCases];
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY04_TRACK;
