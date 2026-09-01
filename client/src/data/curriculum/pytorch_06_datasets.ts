import type {
  DayTrack,
  Challenge,
  ConceptPrimerData,
  TestCase
} from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData, TestCase };

export const challenge1TestCases: TestCase[] = [
  {
    id: 'tc1-p6-c1',
    name: 'Tabular Features with Integer Classification Labels',
    inputDescription: 'features=np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]]), labels=np.array([0, 1, 0])',
    expectedOutput: 'len(ds) == 3, ds[0] returns (x, y) with x.dtype=torch.float32, y.dtype=torch.int64'
  },
  {
    id: 'tc2-p6-c1',
    name: 'Unlabeled Dataset (Inference Mode)',
    inputDescription: 'features=[[10.0, 20.0], [30.0, 40.0]], labels=None',
    expectedOutput: 'ds[1] returns single feature tensor of shape (2,) with float32'
  },
  {
    id: 'tc3-p6-c1',
    name: 'Length Mismatch Error Validation',
    inputDescription: 'features=[[1, 2], [3, 4]], labels=[0]',
    expectedOutput: 'Raises ValueError("Features and labels must have the same length")'
  },
  {
    id: 'tc4-p6-c1',
    name: 'Custom Preprocessing Transform',
    inputDescription: 'transform=lambda x: x + 10.0',
    expectedOutput: 'Retrieved feature values shifted by +10.0'
  }
];

export const challenge2TestCases: TestCase[] = [
  {
    id: 'tc1-p6-c2',
    name: 'Evenly Divisible Dataset Stream',
    inputDescription: 'dataset_size=100, batch_size=20, drop_last=False',
    expectedOutput: 'total_batches=5, has_partial_batch=False, first_batch_features_shape=(20, 8)'
  },
  {
    id: 'tc2-p6-c2',
    name: 'Partial Trailing Batch Detection',
    inputDescription: 'dataset_size=105, batch_size=20, drop_last=False',
    expectedOutput: 'total_batches=6, has_partial_batch=True, trailing batch size=5'
  },
  {
    id: 'tc3-p6-c2',
    name: 'Drop Last Partial Batch',
    inputDescription: 'dataset_size=105, batch_size=20, drop_last=True',
    expectedOutput: 'total_batches=5, has_partial_batch=False, all batch sizes=20'
  },
  {
    id: 'tc4-p6-c2',
    name: 'Invalid Batch Size Validation',
    inputDescription: 'batch_size=0 or -5',
    expectedOutput: 'Raises ValueError("batch_size must be positive")'
  }
];

export const testCases: TestCase[] = [
  ...challenge1TestCases,
  ...challenge2TestCases
];

export const CHALLENGE_1: Challenge = {
  id: 'torch-p6-c1',
  dayId: 6,
  partId: 6,
  title: 'Custom Tabular Dataset',
  slug: 'custom-tabular-dataset',
  difficulty: 'Beginner',
  category: 'Data Pipelines',
  summary: 'Implement a custom PyTorch Dataset subclass with __len__, __getitem__, automatic float32/int64 dtype casting, length validation, and optional transforms.',
  mentalModel5s: 'Dataset defines the recipe for fetching one sample at index i: X[i] as float32 and optional y[i] as int64.',
  visualAnalogy: 'Think of a Dataset like a deck of flashcards: __len__ tells you how many cards are in the deck, and __getitem__(i) pulls out card number i, reading the question (feature tensor) and answer (label tensor).',
  pitfalls: [
    'Leaving features as float64 (np.float64): causes PyTorch to throw "RuntimeError: expected scalar type Float but got Double".',
    'Leaving classification labels as float32: CrossEntropyLoss requires torch.int64 (torch.long) targets.',
    'Not validating that features and labels have the same length.',
    'Converting lists to tensors inside __getitem__: repeatedly allocating tensors on every index call creates severe CPU bottlenecks.'
  ],
  progressiveHints: [
    'Tier 1: Subclass torch.utils.data.Dataset and store self.features = torch.as_tensor(features, dtype=torch.float32).',
    'Tier 2: In __init__, if labels is not None, convert discrete labels to torch.int64 and check len(features) == len(labels).',
    'Tier 3: Implement __len__(self) returning len(self.features).',
    'Tier 4: In __getitem__(self, idx), retrieve x = self.features[idx], apply transform if present, and return (x, self.labels[idx]) or x.'
  ],
  deepInternals: {
    title: 'Zero-Copy Tensor Construction with torch.as_tensor',
    content: 'torch.as_tensor(data, dtype=...) shares underlying memory with existing NumPy ndarrays if the dtype already matches, avoiding redundant allocations. For tabular matrices with millions of rows, this dramatically reduces dataset initialization time and peak memory consumption.',
    keyRule: 'Always ensure feature tensors are torch.float32 before passing to neural network layers.'
  },
  instructions: `Implement a production-grade tabular Dataset subclass that seamlessly bridges NumPy matrices and raw Python collections to typed PyTorch tensors.

Write a class:
\`\`\`python
class TabularDataset(torch.utils.data.Dataset):
    def __init__(self, features, labels=None, transform=None):
        ...
    def __len__(self) -> int:
        ...
    def __getitem__(self, idx: int):
        ...
\`\`\`

Specifications:
1. \`__init__(self, features, labels=None, transform=None)\`:
   - Store \`features\` as a \`torch.float32\` tensor (\`torch.as_tensor(features, dtype=torch.float32)\`).
   - If \`labels\` is provided (not \`None\`):
     - Convert to \`torch.Tensor\`. If discrete/integer, convert to \`torch.int64\`; if floating, convert to \`torch.float32\`.
     - Validate length: if \`len(self.features) != len(self.labels)\`, raise \`ValueError("Features and labels must have the same length")\`.
   - Store \`self.transform = transform\`.
2. \`__len__(self) -> int\`:
   - Return the total number of samples (\`len(self.features)\`).
3. \`__getitem__(self, idx: int)\`:
   - Retrieve feature item \`x = self.features[idx]\`.
   - If \`self.transform is not None\`, apply \`x = self.transform(x)\`.
   - If \`self.labels is not None\`, return tuple \`(x, self.labels[idx])\`.
   - If \`self.labels is None\`, return \`x\` directly.`,
  hints: [
    'Use torch.as_tensor() for efficient tensor conversion.',
    'Check np.issubdtype(arr.dtype, np.integer) or tensor dtype to cast discrete targets to torch.int64.',
    'Raise ValueError if len(features) != len(labels).'
  ],
  starterCode: `import torch
from torch.utils.data import Dataset
from typing import Optional, Callable, Any, Tuple, Union

class TabularDataset(Dataset):
    """
    Custom Dataset subclass for tabular feature matrices and optional targets.
    """
    def __init__(
        self,
        features: Any,
        labels: Optional[Any] = None,
        transform: Optional[Callable[[torch.Tensor], torch.Tensor]] = None
    ):
        # TODO: Convert features to float32, process labels, and store transform
        pass

    def __len__(self) -> int:
        # TODO: Return total number of samples
        pass

    def __getitem__(self, idx: int) -> Union[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        # TODO: Retrieve sample, apply transform, and return (x, y) or x
        pass
`,
  solutionCode: `import torch
from torch.utils.data import Dataset
import numpy as np
from typing import Optional, Callable, Any, Tuple, Union

class TabularDataset(Dataset):
    """
    Custom Dataset subclass for tabular feature matrices and optional targets.
    """
    def __init__(
        self,
        features: Any,
        labels: Optional[Any] = None,
        transform: Optional[Callable[[torch.Tensor], torch.Tensor]] = None
    ):
        self.features = torch.as_tensor(features, dtype=torch.float32)
        self.transform = transform
        
        if labels is not None:
            if isinstance(labels, (np.ndarray, list, tuple)):
                arr = np.asarray(labels)
                if np.issubdtype(arr.dtype, np.integer):
                    self.labels = torch.as_tensor(labels, dtype=torch.int64)
                else:
                    self.labels = torch.as_tensor(labels, dtype=torch.float32)
            elif isinstance(labels, torch.Tensor):
                if labels.dtype in (torch.int32, torch.int64, torch.int16, torch.int8):
                    self.labels = labels.to(dtype=torch.int64)
                else:
                    self.labels = labels.to(dtype=torch.float32)
            else:
                self.labels = torch.as_tensor(labels)

            if len(self.features) != len(self.labels):
                raise ValueError("Features and labels must have the same length")
        else:
            self.labels = None

    def __len__(self) -> int:
        return len(self.features)

    def __getitem__(self, idx: int) -> Union[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        x = self.features[idx]
        if self.transform is not None:
            x = self.transform(x)
            
        if self.labels is not None:
            return x, self.labels[idx]
        return x
`,
  testCases: challenge1TestCases,
  benchmarkTargetMs: 20.0,
  memoryTargetMb: 5.0,
  conceptPrimer: {
    title: 'The Dataset Protocol & Type Contracts',
    subtitle: 'Structuring tabular inputs for high-performance PyTorch models',
    overview: 'The Dataset class in PyTorch encapsulates data access logic. Subclassing torch.utils.data.Dataset requires implementing __len__ to return sample count and __getitem__ to return individual samples.',
    mentalModel5s: 'Map-style dataset: len(dataset) gives size, dataset[i] returns sample i as typed tensors.',
    visualAnalogy: 'A library card catalog: __len__ tells you the catalog has 10,000 books. __getitem__(42) fetches book #42 from the shelf and hands it to you in reading format.',
    pitfalls: [
      'Performing slow disk I/O or conversions repeatedly inside __getitem__.',
      'Passing double-precision float64 arrays to neural net layers expecting float32.'
    ],
    progressiveHints: [
      'Convert features upfront in __init__ using torch.as_tensor(..., dtype=torch.float32).',
      'Handle optional labels and check length equality.',
      'Return (x, y) if labels are present, otherwise return x.'
    ],
    mathFormulas: [
      {
        title: 'Feature Matrix Geometry',
        latex: 'X \\in \\mathbb{R}^{N \\times D}, \\quad y \\in \\{0, \\dots, C-1\\}^N',
        explanation: 'Tabular dataset of N samples with D feature dimensions and discrete class indices.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Slow on-the-fly conversion inside __getitem__
def __getitem__(self, idx):
    return torch.tensor(self.raw_data[idx], dtype=torch.float32)`,
      naiveExplanation: 'Allocates a new tensor object on every single sample lookup, bottlenecking the DataLoader.',
      idiomaticCode: `# Pre-allocated contiguous tensor
def __init__(self, raw_data):
    self.features = torch.as_tensor(raw_data, dtype=torch.float32)
def __getitem__(self, idx):
    return self.features[idx]`,
      idiomaticExplanation: 'Creates a single unified tensor upfront; indexing is a fast O(1) slice view.',
      speedupText: '50x faster iteration'
    },
    memoryLayout: {
      title: 'Contiguous Row-Major 2D Feature Storage',
      content: 'All N rows are stored sequentially in row-major order. Indexing self.features[idx] returns a strided view over row idx.',
      diagramAscii: `Row 0: [ f0, f1, f2 ... fD-1 ]
Row 1: [ f0, f1, f2 ... fD-1 ]
...
Row N-1: [ f0, f1, f2 ... fD-1 ]`,
      keyRule: 'Pre-allocate the entire feature matrix in memory for tabular datasets.'
    },
    keyTakeaways: [
      'Subclass torch.utils.data.Dataset and implement __len__ and __getitem__.',
      'Use torch.float32 for features and torch.int64 for classification labels.',
      'Pre-convert data into tensors in __init__ to avoid per-item allocation latency.',
      'Raise ValueError if feature and label lengths mismatch.'
    ]
  },
  expectedTensors: [
    { name: 'features', shape: '(N, D)', dtype: 'float32' },
    { name: 'sample_x', shape: '(D,)', dtype: 'float32' }
  ]
};

export const CHALLENGE_2: Challenge = {
  id: 'torch-p6-c2',
  dayId: 6,
  partId: 6,
  title: 'Mini-Batch DataLoader Streamer',
  slug: 'mini-batch-dataloader-streamer',
  difficulty: 'Intermediate',
  category: 'Data Pipelines',
  summary: 'Construct and inspect a PyTorch DataLoader stream: evaluate batch counts, inspect tensor dimensions, and detect partial trailing batches.',
  mentalModel5s: 'DataLoader wraps Dataset with batching, shuffling, and collation into (B, D) tensors.',
  visualAnalogy: 'A conveyor belt factory: Dataset supplies individual parts. DataLoader packages them into boxes of 32 (batches), shuffles the delivery order, and sends them to the assembly worker (model). If the last box is only partially full, drop_last decides whether to pack it or recycle it.',
  pitfalls: [
    'Not accounting for drop_last: when drop_last=False and N is not divisible by batch_size, the final batch has fewer than batch_size samples.',
    'Passing batch_size <= 0: invalid configuration that must be caught early.',
    'Attempting to read batch dimensions assuming batches are always single tensors rather than (x, y) tuples.'
  ],
  progressiveHints: [
    'Tier 1: Validate batch_size > 0, raising ValueError if <= 0.',
    'Tier 2: Instantiate DataLoader(dataset, batch_size=batch_size, shuffle=shuffle, drop_last=drop_last).',
    'Tier 3: Inspect the first batch using first_batch = next(iter(dataloader)) to record feature and label shapes.',
    'Tier 4: Loop over dataloader to collect batch sizes: [batch[0].shape[0] for batch in dataloader].',
    'Tier 5: Calculate has_partial_batch = any(size < batch_size for size in batch_sizes) and return metrics dict.'
  ],
  deepInternals: {
    title: 'How collate_fn Stacks Tensors',
    content: 'When DataLoader pulls B samples from a Dataset, its default collate_fn inspects sample types. For tuples (x, y), it stacks all x tensors along dimension 0 using torch.stack(), producing a single batched tensor of shape (B, ...).',
    keyRule: 'len(dataloader) equals ceil(N / batch_size) if drop_last=False, or floor(N / batch_size) if drop_last=True.'
  },
  instructions: `Construct a PyTorch DataLoader, stream through mini-batches, and inspect tensor geometries and boundary conditions.

Write a function:
\`create_and_inspect_dataloader(dataset: torch.utils.data.Dataset, batch_size: int = 32, shuffle: bool = False, drop_last: bool = False) -> dict\`

Specifications:
1. Validate \`batch_size\`: if \`batch_size <= 0\`, raise \`ValueError("batch_size must be positive")\`.
2. Instantiate \`dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=shuffle, drop_last=drop_last)\`.
3. Compute:
   - \`total_batches = len(dataloader)\`
   - \`dataset_size = len(dataset)\`
4. Inspect the first batch: \`first_batch = next(iter(dataloader))\`.
   - If \`first_batch\` is a tuple/list:
     - \`first_batch_features_shape = tuple(first_batch[0].shape)\`
     - \`first_batch_labels_shape = tuple(first_batch[1].shape)\` if labels exist, else \`None\`
   - Else:
     - \`first_batch_features_shape = tuple(first_batch.shape)\`
     - \`first_batch_labels_shape = None\`
5. Iterate through all batches in \`dataloader\` to collect individual batch sample counts: \`batch_sizes = [int(batch[0].shape[0]) for batch in dataloader]\` (or \`batch.shape[0]\`).
6. Calculate \`has_partial_batch = any(s < batch_size for s in batch_sizes)\`.
7. Return a dictionary:
   \`{"dataloader": dataloader, "total_batches": int(total_batches), "dataset_size": int(dataset_size), "batch_size": int(batch_size), "first_batch_features_shape": first_batch_features_shape, "first_batch_labels_shape": first_batch_labels_shape, "has_partial_batch": bool(has_partial_batch), "batch_sizes": batch_sizes}\``,
  hints: [
    'Validate batch_size > 0 before creating DataLoader.',
    'Use next(iter(dataloader)) to inspect the first yielded batch.',
    'Examine batch[0].shape[0] for each mini-batch to identify trailing partial batches.'
  ],
  starterCode: `import torch
from torch.utils.data import Dataset, DataLoader
from typing import Dict, Any

def create_and_inspect_dataloader(
    dataset: Dataset,
    batch_size: int = 32,
    shuffle: bool = False,
    drop_last: bool = False
) -> Dict[str, Any]:
    """
    Instantiate a DataLoader and inspect stream metrics and batch geometries.
    
    Args:
        dataset: Source PyTorch Dataset
        batch_size: Mini-batch size
        shuffle: Whether to shuffle sample order
        drop_last: Whether to drop final partial batch
        
    Returns:
        Dictionary with dataloader, total_batches, dataset_size, batch_size,
        first_batch_features_shape, first_batch_labels_shape, has_partial_batch, batch_sizes
    """
    # TODO: Validate batch_size, create DataLoader, inspect shapes, and return metrics
    pass
`,
  solutionCode: `import torch
from torch.utils.data import Dataset, DataLoader
from typing import Dict, Any, List

def create_and_inspect_dataloader(
    dataset: Dataset,
    batch_size: int = 32,
    shuffle: bool = False,
    drop_last: bool = False
) -> Dict[str, Any]:
    """
    Instantiate a DataLoader and inspect stream metrics and batch geometries.
    """
    if batch_size <= 0:
        raise ValueError("batch_size must be positive")
        
    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        drop_last=drop_last
    )
    
    total_batches = len(dataloader)
    dataset_size = len(dataset)
    
    # Inspect first batch
    first_batch = next(iter(dataloader))
    if isinstance(first_batch, (tuple, list)):
        first_batch_features_shape = tuple(first_batch[0].shape)
        first_batch_labels_shape = tuple(first_batch[1].shape) if len(first_batch) > 1 and first_batch[1] is not None else None
    else:
        first_batch_features_shape = tuple(first_batch.shape)
        first_batch_labels_shape = None
        
    # Inspect all batch sizes
    batch_sizes: List[int] = []
    for batch in dataloader:
        if isinstance(batch, (tuple, list)):
            batch_sizes.append(int(batch[0].shape[0]))
        else:
            batch_sizes.append(int(batch.shape[0]))
            
    has_partial_batch = any(s < batch_size for s in batch_sizes)
    
    return {
        "dataloader": dataloader,
        "total_batches": int(total_batches),
        "dataset_size": int(dataset_size),
        "batch_size": int(batch_size),
        "first_batch_features_shape": first_batch_features_shape,
        "first_batch_labels_shape": first_batch_labels_shape,
        "has_partial_batch": bool(has_partial_batch),
        "batch_sizes": batch_sizes,
    }
`,
  testCases: challenge2TestCases,
  benchmarkTargetMs: 30.0,
  memoryTargetMb: 10.0,
  conceptPrimer: {
    title: 'DataLoader Batching Mechanics & Collation',
    subtitle: 'From individual dataset items to stacked mini-batch tensors',
    overview: 'The DataLoader combines a dataset and a sampler to produce an iterable of mini-batches. It handles batch aggregation, optional shuffling per epoch, and dropping incomplete trailing batches.',
    mentalModel5s: 'Sampler generates index subsets -> Dataset loads items -> Collate stacks into batch tensors.',
    visualAnalogy: 'Packing items into shipping crates: If you have 105 widgets and crates hold 20, you fill 5 full crates and have 5 widgets left in a 6th crate. If drop_last=True, you discard that 6th crate.',
    pitfalls: [
      'Assuming all batches have shape (batch_size, ...): the last batch will be smaller unless drop_last=True.',
      'Using shuffle=True on validation or test sets: unnecessary and prevents deterministic metric debugging.'
    ],
    progressiveHints: [
      'Check batch_size > 0 first.',
      'Initialize DataLoader with batch_size, shuffle, and drop_last.',
      'Extract first_batch using next(iter(dataloader)).',
      'Collect batch sizes across the entire loader.'
    ],
    mathFormulas: [
      {
        title: 'Number of Batches (drop_last=False)',
        latex: 'B_{\\text{total}} = \\left\\lceil \\frac{N}{\\text{batch\\_size}} \\right\\rceil',
        explanation: 'Rounds up to include any trailing partial batch.'
      },
      {
        title: 'Number of Batches (drop_last=True)',
        latex: 'B_{\\text{total}} = \\left\\lfloor \\frac{N}{\\text{batch\\_size}} \\right\\rfloor',
        explanation: 'Discards trailing samples that cannot fill a complete batch.'
      }
    ],
    naiveVsIdiomatic: {
      naiveCode: `# Manual slice batching loop
for i in range(0, len(X), batch_size):
    batch_x = X[i:i+batch_size]
    batch_y = y[i:i+batch_size]`,
      naiveExplanation: 'Lacks multi-processing workers, memory pinning, and shuffling integration.',
      idiomaticCode: `# PyTorch DataLoader iterator
loader = DataLoader(dataset, batch_size=32, shuffle=True, num_workers=4)
for batch_x, batch_y in loader:
    ...`,
      idiomaticExplanation: 'Asynchronously pre-fetches batches in background processes and pins memory for fast GPU DMA.',
      speedupText: '4x pipeline throughput'
    },
    memoryLayout: {
      title: 'Mini-Batch Collation Memory Layout',
      content: 'collate_fn stacks individual 1D sample tensors into a contiguous 2D batch tensor of shape (B, D).',
      diagramAscii: `Sample 0: [x0, x1, x2]
Sample 1: [x3, x4, x5]  ──► collate_fn ──► Batch Tensor [2, 3]:
                                           [[x0, x1, x2],
                                            [x3, x4, x5]]`,
      keyRule: 'DataLoader output tensors always have batch_size as dimension 0.'
    },
    keyTakeaways: [
      'DataLoader wraps Dataset to manage batching, shuffling, and multi-process loading.',
      'next(iter(loader)) retrieves the first batch from the stream.',
      'drop_last=True eliminates partial trailing batches.',
      'batch[0].shape[0] gives the actual sample count of a yielded batch.'
    ]
  },
  expectedTensors: [
    { name: 'batch_features', shape: '(B, D)', dtype: 'float32' },
    { name: 'batch_labels', shape: '(B,)', dtype: 'int64' }
  ]
};

export const DAY06_TRACK: DayTrack = {
  partNumber: 6,
  partId: 6,
  dayNumber: 6,
  id: 6,
  title: 'Part 6: Custom Datasets & DataLoaders',
  subtitle: 'Master torch.utils.data.Dataset, custom indexing, DataLoader streaming, and batch collation',
  description: 'Construct scalable data loading pipelines. Implement custom Dataset subclasses with __len__ and __getitem__, perform automatic type conversions to float32 and int64, configure DataLoaders for batching and shuffling, and master partial batch handling.',
  iconName: 'Database',
  badge: 'Part 6 • Datasets',
  libraryMechanics: {
    libraryName: 'PyTorch Data Loading Pipeline: Dataset & DataLoader',
    tagline: 'Decouple data storage from model execution with high-throughput streaming and custom indexing.',
    overview: `In production machine learning, datasets are too large to fit in memory all at once, or require complex preprocessing pipelines (like normalization, augmentations, tokenization, or reading from disk).
    
PyTorch solves this with a clean two-stage architecture:
1. **\`torch.utils.data.Dataset\`:** Defines the sample-level data access contract.
2. **\`torch.utils.data.DataLoader\`:** Orchestrates batching, shuffling, multi-process pre-fetching, and tensor collation.`,
    whyItExists: `Without a standardized data interface, training loops would be tightly coupled with dataset formats. Switching from CSV files to an image directory or streaming web dataset would require rewriting the entire training pipeline.

The Dataset + DataLoader pattern provides:
- Clean modularity: The model and training loop only care about batched tensors.
- Parallel throughput: num_workers prefetches batches on CPU cores while the GPU trains.
- Automatic collation: Stacks disparate data samples into clean multi-dimensional batch tensors.`,
    coreAnatomy: {
      objectName: 'Dataset and DataLoader Hierarchy',
      description: 'The relationship between Dataset, Sampler, collate_fn, and DataLoader.',
      fields: [
        {
          name: '__len__',
          type: 'method',
          role: 'Returns the total sample count in the dataset.'
        },
        {
          name: '__getitem__',
          type: 'method',
          role: 'Retrieves a single sample at integer index idx as typed tensors.'
        },
        {
          name: 'DataLoader.collate_fn',
          type: 'collation callable',
          role: 'Stacks a list of individual samples into batched tensors along axis 0.'
        },
        {
          name: 'drop_last',
          type: 'bool',
          role: 'Determines whether to drop the trailing partial batch if len(dataset) % batch_size != 0.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                      PyTorch Data Pipeline Flow Architecture                  |
+-------------------------------------------------------------------------------+
  [Raw Data (Disk/RAM)] ──► Custom Dataset (__getitem__)
                                     │
                                     ▼ (Individual Tensors)
                              [Batch Sampler]
                                     │
                                     ▼ (Indices: [4, 12, 88...])
                            [DataLoader Workers]
                                     │
                                     ▼ (collate_fn)
  [Training Loop] ◄─────── Mini-Batch Tensor (B, D)`
    },
    chapters: [
      {
        id: 'ch1-dataset-protocol',
        title: 'The Dataset Subclass Protocol',
        icon: 'FileText',
        summary: 'Implementing __init__, __len__, and __getitem__ with proper PyTorch dtypes.',
        markdownContent: `### The Three Sacred Methods
1. **\`__init__\`:** Store data sources and transforms. Convert arrays to tensors upfront.
2. **\`__len__\`:** Return \`len(self.data)\`.
3. **\`__getitem__\`:** Return sample at index \`idx\`.`,
        codeSnippets: [
          {
            id: 'snip-dataset-def',
            title: 'Simple Custom Dataset',
            code: `import torch
from torch.utils.data import Dataset

class SimpleDataset(Dataset):
    def __init__(self, data):
        self.data = torch.as_tensor(data, dtype=torch.float32)
    def __len__(self):
        return len(self.data)
    def __getitem__(self, idx):
        return self.data[idx]

ds = SimpleDataset([[1.0, 2.0], [3.0, 4.0]])
print("Length:", len(ds))
print("Item 0:", ds[0])`,
            expectedOutput: `Length: 2\nItem 0: tensor([1., 2.])`,
            explanation: 'Subclasses Dataset and returns float32 tensor samples.'
          }
        ]
      },
      {
        id: 'ch2-dataloader-batching',
        title: 'DataLoader Streaming & Batch Shapes',
        icon: 'Truck',
        summary: 'How DataLoader packages samples into mini-batch tensors of shape (B, D).',
        markdownContent: `### Batch Geometry
When you set \`batch_size=B\`, DataLoader pulls $B$ samples and stacks them:
- Feature vector \`(D,)\` $\\rightarrow$ Batch tensor \`(B, D)\`
- Target label scalar $\\rightarrow$ Batch label tensor \`(B,)\``,
        codeSnippets: [
          {
            id: 'snip-dataloader-stream',
            title: 'Streaming Mini-Batches',
            code: `import torch
from torch.utils.data import DataLoader, TensorDataset

X = torch.randn(10, 4)
y = torch.zeros(10)
loader = DataLoader(TensorDataset(X, y), batch_size=4, drop_last=False)

for i, (bx, by) in enumerate(loader):
    print(f"Batch {i}: X={tuple(bx.shape)}, y={tuple(by.shape)}")`,
            expectedOutput: `Batch 0: X=(4, 4), y=(4,)\nBatch 1: X=(4, 4), y=(4,)\nBatch 2: X=(2, 4), y=(2,)`,
            explanation: 'Notice how the final batch has size 2 because 10 is not divisible by 4.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Float64 vs Float32 Tensor Mismatch',
        badSnippet: 'self.features = torch.tensor(raw_numpy_arr)  # Defaults to float64!',
        badExplanation: 'NumPy floats are float64 by default. PyTorch layers expect float32, raising type mismatch runtime errors.',
        goodSnippet: 'self.features = torch.as_tensor(raw_numpy_arr, dtype=torch.float32)',
        goodExplanation: 'Explicitly casts to float32, ensuring compatibility with all nn.Module layers.',
        perfImpact: 'Prevents fatal runtime type mismatches and reduces memory consumption by 50%.'
      },
      {
        title: 'In-Loop Tensor Re-allocation in __getitem__',
        badSnippet: 'def __getitem__(self, idx):\n    return torch.tensor(self.list_data[idx])',
        badExplanation: 'Constructing brand new tensors on every single sample lookup overwhelms the Python garbage collector.',
        goodSnippet: 'def __init__(self, data):\n    self.data = torch.tensor(data, dtype=torch.float32)',
        goodExplanation: 'Allocates the unified tensor buffer once in memory; __getitem__ performs zero-copy slicing.',
        perfImpact: 'Up to 30x faster data streaming.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'torch.utils.data.Dataset',
        category: 'Data',
        signature: 'class Dataset:',
        summary: 'Abstract class representing a dataset. Subclasses must override __len__ and __getitem__.',
        parameters: [],
        returns: 'Dataset',
        exampleSnippet: 'class MyDataset(Dataset):\n    def __len__(self): return 100\n    def __getitem__(self, i): return self.x[i]'
      },
      {
        name: 'torch.utils.data.DataLoader',
        category: 'Data',
        signature: 'DataLoader(dataset, batch_size=1, shuffle=False, drop_last=False, num_workers=0)',
        summary: 'Data loader combining a dataset and a sampler, providing single- or multi-process iterators.',
        parameters: [
          { name: 'dataset', type: 'Dataset', desc: 'Dataset from which to load data.' },
          { name: 'batch_size', type: 'int', desc: 'How many samples per batch to load.' },
          { name: 'shuffle', type: 'bool', desc: 'Set to True to have the data reshuffled at every epoch.' },
          { name: 'drop_last', type: 'bool', desc: 'Set to True to drop the last incomplete batch.' }
        ],
        returns: 'DataLoader',
        exampleSnippet: 'loader = DataLoader(ds, batch_size=32, shuffle=True)'
      }
    ],
    interactiveWidgetType: 'pytorch-nn'
  },
  challenges: [CHALLENGE_1, CHALLENGE_2]
};

export const PYTORCH_PART06_TRACK = DAY06_TRACK;
export default DAY06_TRACK;
