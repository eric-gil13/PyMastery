import type {
  DayTrack,
  Challenge,
  ConceptPrimerData,
  TestCase
} from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData, TestCase };

export const challenge1TestCases: TestCase[] = [
  {
    id: 'tc1-p5-c1',
    name: 'Linear Regression Convergence',
    inputDescription: 'model=nn.Linear(2, 1), loader=DataLoader(TensorDataset(X, y), batch_size=16), num_epochs=6',
    expectedOutput: 'loss_history has length 6, values strictly decrease, final loss < 0.2, parameters updated'
  },
  {
    id: 'tc2-p5-c1',
    name: 'Training Mode State',
    inputDescription: 'model after train_model execution',
    expectedOutput: 'model.training is True'
  },
  {
    id: 'tc3-p5-c1',
    name: 'Single Epoch Execution',
    inputDescription: 'num_epochs=1',
    expectedOutput: 'loss_history has length 1 with float loss value'
  }
];

export const challenge2TestCases: TestCase[] = [
  {
    id: 'tc1-p5-c2',
    name: 'Standard Early Stopping Checkpoint',
    inputDescription: 'max_epochs=8, patience=2, delta=0.0',
    expectedOutput: 'dict with best_loss <= min(val_losses), best_state_dict matching model, stopped_epoch <= 8'
  },
  {
    id: 'tc2-p5-c2',
    name: 'Deepcopy State Isolation',
    inputDescription: 'Mutate model parameter weights in-place after train_with_early_stopping',
    expectedOutput: 'best_state_dict remains untainted and identical to best checkpoint'
  },
  {
    id: 'tc3-p5-c2',
    name: 'Patience Degradation Stop',
    inputDescription: 'ConstantModel with non-improving validation loss',
    expectedOutput: 'early_stopped is True, stopped_epoch <= patience + 1'
  }
];

export const testCases: TestCase[] = [
  ...challenge1TestCases,
  ...challenge2TestCases
];

export const CHALLENGE_1: Challenge = {
  id: 'torch-p5-c1',
  dayId: 5,
  partId: 5,
  title: 'Canonical 5-Step Training Loop',
  slug: 'canonical-5-step-training-loop',
  difficulty: 'Beginner',
  category: 'Training Loop',
  summary: 'Implement the canonical PyTorch optimization loop across multiple epochs: execute the complete update cycle, track sample-weighted running loss, and return the loss history.',
  mentalModel5s: 'Zero gradients -> forward pass -> measure error -> backpropagate gradients -> nudge weights.',
  visualAnalogy: 'Like an archer firing an arrow (forward), measuring the distance from bullseye (loss), analyzing wind/angles (backward), and adjusting stance before the next shot (optimizer step). Always clear the whiteboard before measuring new forces (zero_grad)!',
  pitfalls: [
    'Forgetting optimizer.zero_grad(): gradients accumulate by default, causing loss and parameter updates to explode.',
    'Accumulating running_loss += loss instead of loss.item(): keeps the entire autograd computational graph alive in VRAM, causing an Out-Of-Memory (OOM) crash.',
    'Calling model.forward(inputs) directly instead of model(inputs): skips critical PyTorch forward hooks and internal state dispatch.',
    'Averaging batch losses without accounting for partial batch sizes at the tail of an epoch.'
  ],
  progressiveHints: [
    'Tier 1: At the start of each epoch, set model.train() and initialize running_loss = 0.0 and total_samples = 0.',
    'Tier 2: Inside the batch loop, run the 5 steps: optimizer.zero_grad(), outputs = model(inputs), loss = criterion(outputs, targets), loss.backward(), optimizer.step().',
    'Tier 3: Accumulate loss weighted by batch size: running_loss += loss.item() * inputs.size(0), and increment total_samples += inputs.size(0).',
    'Tier 4: Calculate epoch_loss = running_loss / total_samples and append float(epoch_loss) to loss_history.'
  ],
  deepInternals: {
    title: 'Why PyTorch Accumulates Gradients',
    content: 'Unlike static graph frameworks, PyTorch does not automatically zero gradients on backward(). Instead, param.grad += grad. This deliberate design enables gradient accumulation across multiple micro-batches (simulating huge batch sizes on memory-constrained GPUs) and recurrent graph unrolling.',
    keyRule: 'Always call optimizer.zero_grad() at the beginning of each training step.'
  },
  instructions: `Implement the canonical optimization update loop that powers deep neural network training in PyTorch.

Write a function:
\`train_model(model: torch.nn.Module, dataloader: torch.utils.data.DataLoader, criterion: torch.nn.Module, optimizer: torch.optim.Optimizer, num_epochs: int = 5) -> list[float]\`

Requirements:
1. Loop over \`num_epochs\` (from 0 to \`num_epochs - 1\`).
2. Set the model into training mode (\`model.train()\`) at the start of each epoch.
3. Track running sample-weighted loss: initialize \`running_loss = 0.0\` and \`total_samples = 0\`.
4. Iterate over \`(inputs, targets)\` from \`dataloader\`, executing the canonical optimization update cycle:
   - Clear previous parameter gradients
   - Compute model predictions from \`inputs\` as \`outputs\`
   - Compute scalar loss against \`targets\` using \`criterion\`
   - Backpropagate error to compute gradients
   - Update model parameters via \`optimizer\`
   - Accumulate sample-weighted loss using batch size \`inputs.size(0)\`
   - Increment total sample count by batch size
5. Compute average epoch loss: \`epoch_loss = running_loss / total_samples\` (or 0.0 if empty).
6. Return \`loss_history\` containing the float loss value for each epoch.`,
  hints: [
    'Execute the 5 steps in exact canonical order.',
    'Always use loss.item() to extract the scalar float without attaching the autograd graph.',
    'Multiply loss.item() by inputs.size(0) to account for varying batch sizes.'
  ],
  starterCode: `import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import List

def train_model(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    num_epochs: int = 5
) -> List[float]:
    """
    Execute standard PyTorch training loop across epochs using the canonical optimization update cycle.
    
    Args:
        model: PyTorch nn.Module to train
        dataloader: DataLoader providing (inputs, targets) batches
        criterion: Loss function module (e.g. nn.MSELoss)
        optimizer: PyTorch optimizer (e.g. optim.SGD, optim.Adam)
        num_epochs: Total number of training epochs
        
    Returns:
        List of average loss values per epoch
    """
    # TODO: Implement canonical training update cycle per batch across epochs
    pass
`,
  solutionCode: `import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import List

def train_model(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    num_epochs: int = 5
) -> List[float]:
    """
    Execute standard 5-step PyTorch training loop across epochs.
    """
    loss_history: List[float] = []
    
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        total_samples = 0
        
        for inputs, targets in dataloader:
            # 1. Clear gradients
            optimizer.zero_grad()
            
            # 2. Forward pass
            outputs = model(inputs)
            
            # 3. Compute loss
            loss = criterion(outputs, targets)
            
            # 4. Backward pass
            loss.backward()
            
            # 5. Parameter update
            optimizer.step()
            
            batch_size = inputs.size(0)
            running_loss += loss.item() * batch_size
            total_samples += batch_size
            
        epoch_loss = running_loss / total_samples if total_samples > 0 else 0.0
        loss_history.append(float(epoch_loss))
        
    return loss_history
`,
  testCases: challenge1TestCases,
  benchmarkTargetMs: 50.0,
  memoryTargetMb: 10.0,
  conceptPrimer: {
    title: 'The 5 Canonical Steps of Optimization',
    subtitle: 'From forward activations to backpropagation and gradient descent updates',
    overview: 'Every deep learning model in PyTorch is trained using an iterative optimization loop composed of 5 canonical steps: clearing previous gradients, computing predictions, measuring scalar loss, backpropagating gradients through the dynamic computation graph, and updating parameter weights.',
    mentalModel5s: 'Zero gradients -> Forward pass -> Loss evaluation -> Backward differentiation -> Parameter update.',
    visualAnalogy: 'Cleaning your paint brushes (zero_grad), painting the canvas (forward), measuring symmetry errors against the reference photo (loss), discovering which brush strokes caused errors (backward), and refining your technique (step).',
    pitfalls: [
      'Omitting optimizer.zero_grad(): causes gradients to accumulate uncontrollably.',
      'Accumulating loss tensors instead of scalars: leaks GPU memory.',
      'Neglecting model.train(): leaves Dropout and BatchNorm in inference mode.'
    ],
    progressiveHints: [
      'Call optimizer.zero_grad() before model(inputs).',
      'Compute loss with criterion(outputs, targets).',
      'Call loss.backward() to populate param.grad.',
      'Call optimizer.step() to adjust weights.'
    ],
    mathFormulas: [
      {
        title: 'Gradient Descent Weight Update Rule',
        latex: '\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta \\mathcal{L}(\\theta_t)',
        explanation: 'Weights theta are adjusted in the opposite direction of the loss gradient scaled by learning rate eta.'
      },
      {
        title: 'Sample-Weighted Epoch Loss',
        latex: '\\mathcal{L}_{\\text{epoch}} = \\frac{\\sum_{b=1}^{B} N_b \\cdot \\mathcal{L}_b}{\\sum_{b=1}^{B} N_b}',
        explanation: 'Accounts for differing batch sizes by weighting each batch loss by its sample count Nb.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Naive batch loss accumulation (VRAM memory leak & bias)
running_loss = 0.0
for x, y in loader:
    out = model(x)
    loss = criterion(out, y)
    loss.backward()
    optimizer.step()
    running_loss += loss  # LEAKS COMPUTATIONAL GRAPH TO MEMORY!`,
      naiveExplanation: 'Keeps the entire computational graph in memory and fails to zero gradients.',
      idiomaticCode: `# Clean, memory-safe, sample-weighted 5-step loop
model.train()
running_loss = 0.0
total = 0
for x, y in loader:
    optimizer.zero_grad()
    loss = criterion(model(x), y)
    loss.backward()
    optimizer.step()
    running_loss += loss.item() * x.size(0)
    total += x.size(0)
epoch_loss = running_loss / total`,
      idiomaticExplanation: 'Frees autograd graph immediately and calculates exact per-sample loss.',
      speedupText: 'Prevents OOM crashes'
    },
    memoryLayout: {
      title: 'Gradient Graph Lifecycles',
      content: 'Calling loss.backward() evaluates the backward DAG and writes gradients into leaf .grad buffers. By default, intermediate graph nodes are freed immediately after backward().',
      diagramAscii: `Inputs ──► [Forward DAG] ──► Loss
              ▲                   │
              │ (optimizer.step)  │ (loss.backward)
              ▼                   ▼
           Weights ◄─── [.grad Buffers]`,
      keyRule: 'loss.item() converts a 1-element Tensor to a standard Python float, detaching it from autograd.'
    },
    keyTakeaways: [
      'Gradients accumulate by default; always call optimizer.zero_grad().',
      'Call model(inputs), never model.forward(inputs).',
      'Use loss.item() to avoid leaking memory.',
      'Weight batch losses by inputs.size(0) for accurate epoch averages.'
    ]
  },
  expectedTensors: [
    { name: 'inputs', shape: '(B, D_in)', dtype: 'float32' },
    { name: 'targets', shape: '(B, D_out)', dtype: 'float32' },
    { name: 'outputs', shape: '(B, D_out)', dtype: 'float32' }
  ]
};

export const CHALLENGE_2: Challenge = {
  id: 'torch-p5-c2',
  dayId: 5,
  partId: 5,
  title: 'Early Stopping & Model Checkpointer',
  slug: 'early-stopping-model-checkpointer',
  difficulty: 'Intermediate',
  category: 'Training & Regularization',
  summary: 'Track validation loss across training epochs, prevent overfitting with early stopping patience, and checkpoint optimal weights.',
  mentalModel5s: 'Train on train_loader, validate with no_grad on val_loader, and stop when validation loss stops improving.',
  visualAnalogy: 'Like baking cookies: checking the oven every 2 minutes. When they reach golden-brown perfection, take them out immediately before they burn! Save a polaroid snapshot (state_dict) of the exact moment they peaked.',
  pitfalls: [
    'Forgetting copy.deepcopy() when saving model.state_dict(): subsequent optimizer steps mutate internal tensors, corrupting the saved checkpoint.',
    'Leaving model in training mode during validation: causes Dropout to inject random noise into validation scores.',
    'Forgetting torch.no_grad() during validation: wastes GPU memory and compute by tracking gradients during inference.'
  ],
  progressiveHints: [
    'Tier 1: Initialize best_loss = float("inf"), patience_counter = 0, and best_state_dict = copy.deepcopy(model.state_dict()).',
    'Tier 2: In the training phase, set model.train() and run the 5 canonical steps.',
    'Tier 3: In the validation phase, set model.eval() and evaluate loss inside a `with torch.no_grad():` block.',
    'Tier 4: If val_loss < best_loss - delta, update best_loss, update best_state_dict, and reset patience_counter = 0. Else increment patience_counter and break if it reaches patience.',
    'Tier 5: Call model.load_state_dict(best_state_dict) before returning the metrics dictionary.'
  ],
  deepInternals: {
    title: 'state_dict Reference Traps',
    content: 'model.state_dict() returns a dictionary of tensor references, not copies. If you execute optimizer.step() after assigning best_weights = model.state_dict(), the tensor values inside best_weights will change in-place. You must use copy.deepcopy(model.state_dict()) to decouple your checkpoint from live parameters.',
    keyRule: 'Always use copy.deepcopy(model.state_dict()) to store historical weight checkpoints.'
  },
  instructions: `Build a production-grade training pipeline equipped with validation monitoring, early stopping, and state checkpointing.

Write a function:
\`train_with_early_stopping(model: torch.nn.Module, train_loader: torch.utils.data.DataLoader, val_loader: torch.utils.data.DataLoader, criterion: torch.nn.Module, optimizer: torch.optim.Optimizer, max_epochs: int = 10, patience: int = 3, delta: float = 0.0) -> dict\`

Specifications:
1. Initialize \`best_loss = float('inf')\`, \`patience_counter = 0\`, an isolated deep copy snapshot of the model initial state dictionary (\`best_state_dict\`), and empty loss tracking lists (\`train_losses\` and \`val_losses\`).
2. Iterate \`epoch\` from \`1\` to \`max_epochs\` (inclusive):
   a. **Training Phase:**
      - Set \`model.train()\`.
      - Loop over \`train_loader\`, execute the canonical optimization update cycle, and compute weighted average \`epoch_train_loss\`.
      - Append to \`train_losses\`.
   b. **Validation Phase:**
      - Set \`model.eval()\`.
      - Disable gradient tracking during evaluation to prevent computation graph accumulation, loop over \`val_loader\`, and compute weighted average \`epoch_val_loss\`.
      - Append to \`val_losses\`.
   c. **Early Stopping Check:**
      - If \`epoch_val_loss < best_loss - delta\`:
        - Update \`best_loss = epoch_val_loss\`.
        - Save an isolated deep copy snapshot of the model parameter state as \`best_state_dict\`.
        - Reset \`patience_counter = 0\`.
      - Else:
        - Increment \`patience_counter += 1\`.
        - If \`patience_counter >= patience\`: trigger early stopping! Set \`early_stopped = True\`, record \`stopped_epoch = epoch\`, and break out of the epoch loop.
3. If max_epochs is reached without early stopping, set \`early_stopped = False\` and \`stopped_epoch = max_epochs\`.
4. Restore the best model weights from the saved checkpoint before returning.
5. Return a dictionary:
   \`{"best_loss": float(best_loss), "stopped_epoch": int(stopped_epoch), "best_state_dict": best_state_dict, "train_losses": train_losses, "val_losses": val_losses, "early_stopped": bool(early_stopped)}\``,
  hints: [
    'Toggle model.train() before training and model.eval() before validation.',
    'Wrap validation in with torch.no_grad(): to disable autograd overhead.',
    'Always use copy.deepcopy(model.state_dict()) when caching best weights.',
    'Restore model.load_state_dict(best_state_dict) before returning.'
  ],
  starterCode: `import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import Dict, Any

def train_with_early_stopping(
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    max_epochs: int = 10,
    patience: int = 3,
    delta: float = 0.0
) -> Dict[str, Any]:
    """
    Train model with validation tracking, early stopping, and state_dict restoration.
    
    Args:
        model: PyTorch nn.Module to train
        train_loader: DataLoader for training set
        val_loader: DataLoader for validation set
        criterion: Loss module
        optimizer: Optimization algorithm
        max_epochs: Maximum allowable training epochs
        patience: Epochs without improvement before stopping
        delta: Minimum change in loss to qualify as improvement
        
    Returns:
        Dictionary with best_loss, stopped_epoch, best_state_dict, train_losses, val_losses, early_stopped
    """
    # TODO: Implement complete training loop with early stopping checkpointer and state restoration
    pass
`,
  solutionCode: `import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import Dict, Any

def train_with_early_stopping(
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    max_epochs: int = 10,
    patience: int = 3,
    delta: float = 0.0
) -> Dict[str, Any]:
    """
    Train model with validation tracking, early stopping, and state_dict restoration.
    """
    best_loss = float("inf")
    patience_counter = 0
    best_state_dict = copy.deepcopy(model.state_dict())
    train_losses = []
    val_losses = []
    early_stopped = False
    stopped_epoch = max_epochs

    for epoch in range(1, max_epochs + 1):
        # 1. Training Phase
        model.train()
        running_train_loss = 0.0
        train_samples = 0
        
        for inputs, targets in train_loader:
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            b_size = inputs.size(0)
            running_train_loss += loss.item() * b_size
            train_samples += b_size
            
        epoch_train_loss = running_train_loss / train_samples if train_samples > 0 else 0.0
        train_losses.append(float(epoch_train_loss))

        # 2. Validation Phase
        model.eval()
        running_val_loss = 0.0
        val_samples = 0
        
        with torch.no_grad():
            for val_inputs, val_targets in val_loader:
                val_outputs = model(val_inputs)
                val_loss = criterion(val_outputs, val_targets)
                b_size = val_inputs.size(0)
                running_val_loss += val_loss.item() * b_size
                val_samples += b_size
                
        epoch_val_loss = running_val_loss / val_samples if val_samples > 0 else 0.0
        val_losses.append(float(epoch_val_loss))

        # 3. Early Stopping Evaluation
        if epoch_val_loss < best_loss - delta:
            best_loss = epoch_val_loss
            best_state_dict = copy.deepcopy(model.state_dict())
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                early_stopped = True
                stopped_epoch = epoch
                break

    # Restore best checkpoint
    model.load_state_dict(best_state_dict)

    return {
        "best_loss": float(best_loss),
        "stopped_epoch": int(stopped_epoch),
        "best_state_dict": best_state_dict,
        "train_losses": train_losses,
        "val_losses": val_losses,
        "early_stopped": early_stopped,
    }
`,
  testCases: challenge2TestCases,
  benchmarkTargetMs: 100.0,
  memoryTargetMb: 15.0,
  conceptPrimer: {
    title: 'Early Stopping and Checkpointing Architecture',
    subtitle: 'Halting training before overfitting degrades generalization',
    overview: 'As neural networks train, training loss steadily declines. However, validation loss eventually reaches a minimum and begins to climb due to overfitting. Early stopping halts training when validation loss stops improving for a configured patience period.',
    mentalModel5s: 'Track validation loss. If it fails to improve for patience epochs, halt and revert to the best snapshot.',
    visualAnalogy: 'An athlete climbing a mountain: they take photos at each plateau. If the next 3 steps lead downhill into a fog bank, they step back to the highest clear viewpoint photograph.',
    pitfalls: [
      'Saving state_dict without deepcopy: mutates historical checkpoint as training continues.',
      'Forgetting to reload best_state_dict before returning: leaves model with degraded final weights.'
    ],
    progressiveHints: [
      'Initialize best_loss to float("inf").',
      'Use model.train() in training loop and model.eval() in validation loop.',
      'Wrap validation in with torch.no_grad():.',
      'Use copy.deepcopy(model.state_dict()) to store weights.',
      'Restore weights with model.load_state_dict(best_state_dict).'
    ],
    mathFormulas: [
      {
        title: 'Improvement Condition with Delta Threshold',
        latex: '\\mathcal{L}_{\\text{val}}^{(t)} < \\mathcal{L}_{\\text{best}} - \\delta',
        explanation: 'Training is considered improved only if validation loss drops by at least delta.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Naive shallow copy checkpoint
best_state = model.state_dict()  # MUTATES AS TRAINING PROCEEDS!`,
      naiveExplanation: 'Shallow dictionary reference shares underlying weight tensors with the active model.',
      idiomaticCode: `# Idiomatic deepcopy checkpoint
import copy
best_state = copy.deepcopy(model.state_dict())`,
      idiomaticExplanation: 'Creates a fully isolated snapshot of all weight and buffer tensors in memory.',
      speedupText: 'Prevents corrupted checkpoints'
    },
    memoryLayout: {
      title: 'state_dict Memory Structure',
      content: 'state_dict is an OrderedDict mapping strings like "weight" and "bias" to torch.Tensor instances. deepcopy duplicates each storage buffer into a separate memory allocation.',
      diagramAscii: `model.state_dict():  {'linear.weight': [0x1000], 'linear.bias': [0x2000]}
                               ▲
                               │ copy.deepcopy()
best_state_dict:    {'linear.weight': [0x9000], 'linear.bias': [0xA000]}`,
      keyRule: 'Always use copy.deepcopy(model.state_dict()) to freeze checkpoints in memory.'
    },
    keyTakeaways: [
      'model.eval() disables Dropout and freezes BatchNorm running stats.',
      'torch.no_grad() disables Autograd tape recording to save VRAM.',
      'copy.deepcopy is essential when storing state_dict in memory.',
      'Always restore best_state_dict before deploying or returning the trained model.'
    ]
  },
  expectedTensors: [
    { name: 'train_features', shape: '(B, D)', dtype: 'float32' },
    { name: 'val_features', shape: '(B, D)', dtype: 'float32' }
  ]
};

export const DAY05_TRACK: DayTrack = {
  partNumber: 5,
  partId: 5,
  dayNumber: 5,
  id: 5,
  title: 'Part 5: The PyTorch Training Loop & Checkpointing',
  subtitle: 'Master the 5 fundamental steps, epoch loss accumulation, train/eval modes, and early stopping',
  description: 'Master the complete deep learning training lifecycle. Learn the exact order of the 5 canonical steps, proper sample-weighted loss tracking without memory leaks, model.train() vs model.eval() toggling, and early stopping checkpointers.',
  iconName: 'RefreshCw',
  badge: 'Part 5 • Training Loop',
  libraryMechanics: {
    libraryName: 'PyTorch Training Loop & Optimization Engine',
    tagline: 'Master the 5 canonical steps of gradient descent, train/eval modes, and early stopping checkpointers.',
    overview: `Every modern deep neural network—from simple perceptrons to multi-billion parameter foundation models—trains using an iterative optimization loop.
    
In PyTorch, this lifecycle is explicit and transparent. There are no hidden abstractions: you control every step of gradient calculation, memory tracking, and parameter updates. Understanding the 5 fundamental steps, how to avoid memory leaks with \`loss.item()\`, and how to prevent overfitting via early stopping is what distinguishes beginner practitioners from expert engineers.`,
    whyItExists: `Frameworks that hide the training loop inside black-box fit() methods make custom training paradigms (like GANs, reinforcement learning, contrastive learning, and gradient accumulation) painful to implement.

PyTorch gives you direct, imperative control over the execution flow:
- Explicit gradient clearing: Enables gradient accumulation across multiple micro-batches.
- Manual forward and backward passes: Allows custom loss weighting and gradient clipping.
- Decoupled optimizers: Switch seamlessly between SGD, Adam, and AdamW without touching model definitions.`,
    coreAnatomy: {
      objectName: 'Training Loop Lifecycle',
      description: 'The core components of the training loop: the model (nn.Module), loss criterion (nn.Module), optimizer (torch.optim.Optimizer), and data stream (DataLoader).',
      fields: [
        {
          name: 'optimizer.zero_grad()',
          type: 'method',
          role: 'Resets accumulated parameter gradients to zero before backpropagation.'
        },
        {
          name: 'model(inputs)',
          type: 'forward callable',
          role: 'Executes the forward pass through layers and registered hooks.'
        },
        {
          name: 'loss.backward()',
          type: 'autograd engine',
          role: 'Traverses the dynamic computation DAG in reverse to calculate gradients.'
        },
        {
          name: 'optimizer.step()',
          type: 'optimization step',
          role: 'Updates parameter tensors in-place using their accumulated .grad attributes.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                       The 5 Canonical Optimization Steps                      |
+-------------------------------------------------------------------------------+
  Step 1: optimizer.zero_grad()  ──► Clears param.grad buffers to 0.0
  Step 2: outputs = model(inputs)──► Dynamic forward graph construction
  Step 3: loss = criterion(out, y)─► Evaluates scalar objective loss
  Step 4: loss.backward()        ──► Reverse-mode AD writes to param.grad
  Step 5: optimizer.step()       ──► In-place parameter updates: w -= lr * grad`
    },
    chapters: [
      {
        id: 'ch1-canonical-steps',
        title: 'The 5 Canonical Steps of Optimization',
        icon: 'PlayCircle',
        summary: 'Deconstruct why zero_grad, forward, loss, backward, and step must be called in exact order.',
        markdownContent: `### Why PyTorch Accumulates Gradients
In PyTorch, gradients are not overwritten on each backward pass; they are added:
\`\`\`python
param.grad += dLoss / dParam
\`\`\`

This deliberate design lets you train models with huge effective batch sizes by accumulating gradients across multiple smaller batches before calling \`optimizer.step()\`.

However, in standard training, if you forget \`optimizer.zero_grad()\`, gradients explode within a few batches!`,
        codeSnippets: [
          {
            id: 'snip-5-steps',
            title: 'Standard Mini-Batch Step',
            code: `import torch
import torch.nn as nn
import torch.optim as optim

model = nn.Linear(4, 1)
criterion = nn.MSELoss()
optimizer = optim.SGD(model.parameters(), lr=0.01)

x = torch.randn(8, 4)
y = torch.randn(8, 1)

# The 5 Canonical Steps:
optimizer.zero_grad()
preds = model(x)
loss = criterion(preds, y)
loss.backward()
optimizer.step()

print("Loss:", round(loss.item(), 4))`,
            expectedOutput: `Loss: 1.2345`,
            explanation: 'Executes the complete 5-step optimization sequence on a single mini-batch.'
          }
        ]
      },
      {
        id: 'ch2-train-vs-eval',
        title: 'Train vs Eval Mode & torch.no_grad()',
        icon: 'Sliders',
        summary: 'How Dropout and BatchNorm behave differently during training vs evaluation.',
        markdownContent: `### The Dual Persona of Deep Models
- **\`model.train()\`:** Activates Dropout (random mask sampling) and BatchNorm running statistics updates.
- **\`model.eval()\`:** Freezes BatchNorm running statistics and disables Dropout.
- **\`torch.no_grad()\`:** Disables the Autograd tape engine during validation, cutting memory usage in half!`,
        codeSnippets: [
          {
            id: 'snip-eval-mode',
            title: 'Toggling Eval Mode',
            code: `import torch
import torch.nn as nn

model = nn.Sequential(nn.Dropout(p=0.5), nn.Linear(4, 1))

# Training mode: Dropout is active
model.train()
x = torch.ones(2, 4)
print("Training output (some zeros):", model(x).detach())

# Eval mode: Dropout is disabled
model.eval()
with torch.no_grad():
    print("Eval output (deterministic):", model(x))`,
            expectedOutput: `Eval output (deterministic): tensor([[...], [...]])`,
            explanation: 'model.eval() ensures deterministic inference without dropout perturbations.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Memory Leak via Running Loss Accumulation',
        badSnippet: 'running_loss += loss',
        badExplanation: 'Accumulating the loss Tensor directly keeps the entire dynamic computation graph in GPU RAM, leading to an Out-Of-Memory crash.',
        goodSnippet: 'running_loss += loss.item() * batch_size',
        goodExplanation: 'loss.item() extracts a raw Python float scalar, allowing PyTorch to free the intermediate autograd tensors immediately.',
        perfImpact: 'Prevents Out-Of-Memory (OOM) fatal crashes on large datasets.'
      },
      {
        title: 'Corrupted Checkpoint via Shallow state_dict Copy',
        badSnippet: 'best_state = model.state_dict()',
        badExplanation: 'model.state_dict() returns references to the active weight tensors. Later optimizer steps alter the weights inside best_state!',
        goodSnippet: 'best_state = copy.deepcopy(model.state_dict())',
        goodExplanation: 'deepcopy completely decouples the saved snapshot from subsequent weight mutations.',
        perfImpact: 'Guarantees the best checkpoint retains its true historical weights.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'optimizer.zero_grad',
        category: 'Optimization',
        signature: 'optimizer.zero_grad(set_to_none=True)',
        summary: 'Sets gradients of all model parameters to zero or None.',
        parameters: [
          { name: 'set_to_none', type: 'bool', desc: 'If True, sets param.grad = None for lower memory footprint.' }
        ],
        returns: 'None',
        exampleSnippet: 'optimizer.zero_grad(set_to_none=True)'
      },
      {
        name: 'loss.backward',
        category: 'Autograd',
        signature: 'loss.backward()',
        summary: 'Computes gradients of loss with respect to all graph leaves.',
        parameters: [],
        returns: 'None',
        exampleSnippet: 'loss.backward()'
      },
      {
        name: 'torch.no_grad',
        category: 'Context Manager',
        signature: 'with torch.no_grad():',
        summary: 'Context manager that disables gradient calculation to save memory during evaluation.',
        parameters: [],
        returns: 'ContextManager',
        exampleSnippet: 'with torch.no_grad():\n    val_preds = model(val_x)'
      }
    ],
    interactiveWidgetType: 'pytorch-nn'
  },
  challenges: [CHALLENGE_1, CHALLENGE_2]
};

export const PYTORCH_PART05_TRACK = DAY05_TRACK;
export default DAY05_TRACK;
