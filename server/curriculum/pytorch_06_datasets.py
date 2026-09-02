"""
Part 6: Custom Datasets & DataLoaders
PyMastery Progressive Zero-to-Hero PyTorch Curriculum
"""

import torch
from torch.utils.data import Dataset, DataLoader
import numpy as np
from typing import Dict, Any, List, Optional, Tuple, Union

DAY_METADATA = {
    "day_id": "pytorch06",
    "day_number": 6,
    "title": "Part 6: Custom Datasets & DataLoaders",
    "tagline": "Build scalable data pipelines with torch.utils.data.Dataset, custom indexing, and high-throughput DataLoaders.",
    "estimated_time": "2-3 hours",
    "concepts_covered": [
        "torch.utils.data.Dataset interface: __init__, __len__, and __getitem__",
        "Converting NumPy arrays and lists to typed PyTorch Tensors (float32, int64)",
        "On-the-fly preprocessing transforms",
        "DataLoader mechanics: batching, shuffling, drop_last, and num_workers",
        "Mini-batch tensor geometry, collation, and boundary condition handling"
    ]
}

CONCEPT_PRIMER = r"""# Part 6 Concept Primer: Custom Datasets & DataLoaders

## 1. Decoupling Data Storage from Model Training
In real-world machine learning, data rarely fits cleanly in a single Python list. You might work with:
* Multi-gigabyte tabular CSVs or Parquet files.
* Hundreds of thousands of high-resolution images stored on disk.
* Audio clips of variable lengths.

PyTorch provides two fundamental classes that work together to make data loading scalable, modular, and parallelized:
1. **`torch.utils.data.Dataset`**: Represents an individual data sample and dataset size (defines *what* the data is).
2. **`torch.utils.data.DataLoader`**: An iterable engine that wraps a `Dataset` to handle batching, shuffling, multi-process prefetching, and collation (defines *how* data is fed to the model).

---

## 2. The `Dataset` Subclass Protocol
To create a map-style dataset, you subclass `torch.utils.data.Dataset` and implement three core methods:

```python
from torch.utils.data import Dataset
import torch

class CustomDataset(Dataset):
    def __init__(self, data_source):
        # 1. Store or initialize data references
        self.data = torch.tensor(data_source, dtype=torch.float32)

    def __len__(self) -> int:
        # 2. Return the total number of samples
        return len(self.data)

    def __getitem__(self, idx: int):
        # 3. Retrieve and return sample at integer index idx
        return self.data[idx]
```

### Data Types (dtypes) in PyTorch
When loading features and targets into PyTorch:
* **Features ($X$):** Always use `torch.float32` (single-precision float). Neural net weights are float32; passing float64 causes type mismatch errors (`RuntimeError: expected scalar type Float but got Double`).
* **Classification Labels ($y$):** Always use `torch.int64` (`torch.long`). Loss functions like `nn.CrossEntropyLoss` and `nn.NLLLoss` require class index targets to be 64-bit integers.
* **Regression Targets ($y$):** Use `torch.float32`.

---

## 3. The `DataLoader`: Batching, Shuffling & Workers
Once your `Dataset` is defined, wrapping it with a `DataLoader` gives you high-performance data delivery:

```python
loader = DataLoader(
    dataset=my_dataset,
    batch_size=32,      # Number of samples per batch
    shuffle=True,       # Shuffle sample indices every epoch to break correlation
    drop_last=False,    # If True, drops the final batch if size < batch_size
    num_workers=2,      # Subprocesses for asynchronous data prefetching
    pin_memory=True     # Speeds up CPU-to-GPU memory transfer via page-locked RAM
)
```

### The Collation Engine (`collate_fn`)
When you iterate over a `DataLoader`:
1. A **`Sampler`** generates a list of indices, e.g. `[14, 2, 89, 5]`.
2. The DataLoader retrieves each sample via `dataset[i]`.
3. The internal **`collate_fn`** stacks the individual samples along a new 0-th dimension:
   - 32 individual feature vectors of shape `(10,)` $\rightarrow$ one batch tensor of shape `(32, 10)`.
   - 32 scalar labels $\rightarrow$ one 1D label tensor of shape `(32,)`.

```
Individual Samples:
  dataset[0] -> (Tensor [x0], Tensor [y0])
  dataset[1] -> (Tensor [x1], Tensor [y1])
                     │
                     ▼ collate_fn (torch.stack)
Batched Output:
  (Tensor X_batch [32, 10], Tensor Y_batch [32])
```

### Dealing with Partial Batches: `drop_last`
If your dataset has 105 samples and `batch_size=20`:
* If `drop_last=False`: you get 5 full batches of 20 and 1 trailing batch of 5 samples.
* If `drop_last=True`: the final 5 samples are discarded, yielding exactly 5 batches of 20.
"""

WALKTHROUGH = r"""# Part 6 Code Walkthrough: Custom Datasets and DataLoader Inspection

Let's build a custom tabular dataset, wrap it in a DataLoader, and inspect batch geometries:

```python
import torch
from torch.utils.data import Dataset, DataLoader
import numpy as np

# 1. Custom Dataset implementation
class IrisDataset(Dataset):
    def __init__(self, features, labels=None, transform=None):
        # Convert numpy arrays to PyTorch tensors with correct dtypes
        self.features = torch.as_tensor(features, dtype=torch.float32)
        if labels is not None:
            self.labels = torch.as_tensor(labels, dtype=torch.int64)
        else:
            self.labels = None
        self.transform = transform

    def __len__(self) -> int:
        return len(self.features)

    def __getitem__(self, idx: int):
        x = self.features[idx]
        if self.transform is not None:
            x = self.transform(x)
            
        if self.labels is not None:
            return x, self.labels[idx]
        return x

# 2. Instantiate with synthetic data
np.random.seed(42)
raw_X = np.random.randn(50, 4)
raw_y = np.random.randint(0, 3, size=50)

dataset = IrisDataset(raw_X, raw_y)
print("Dataset size:", len(dataset))
sample_x, sample_y = dataset[0]
print("Sample 0 features:", sample_x.shape, sample_x.dtype)
print("Sample 0 label:", sample_y, sample_y.dtype)

# 3. Stream batches with DataLoader
loader = DataLoader(dataset, batch_size=16, shuffle=True, drop_last=False)
print("Total batches in loader:", len(loader))

for batch_idx, (batch_x, batch_y) in enumerate(loader):
    print(f"Batch {batch_idx}: X shape = {batch_x.shape}, y shape = {batch_y.shape}")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Custom Tabular Dataset (torch-p6-c1)
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "torch-p6-c1",
    "title": "Custom Tabular Dataset",
    "difficulty": "Beginner",
    "category": "Data Pipelines",
    "description": (
        "Implement a custom dataset supporting indexed sample retrieval and length queries, "
        "with automatic floating-point and integer label casting, length validation, and optional transforms."
    ),
    "instructions": (
        "Implement the class `TabularDataset(torch.utils.data.Dataset)` with methods:\n"
        "1. `__init__(self, features, labels=None, transform=None)`:\n"
        "   - Accepts `features`: can be `numpy.ndarray`, Python list, or `torch.Tensor`. Store as a standard single-precision float32 tensor.\n"
        "   - Accepts `labels`: optional (`None` by default). If provided:\n"
        "     - Convert to `torch.Tensor`: if discrete/integer labels, cast to 64-bit integer type (int64); if continuous, cast to float32.\n"
        "     - Validate that features and labels contain the same number of samples. If not, raise `ValueError(\"Features and labels must have the same length\")`.\n"
        "   - Stores `self.transform = transform`.\n"
        "2. `__len__(self) -> int`:\n"
        "   - Returns the total number of samples in the dataset.\n"
        "3. `__getitem__(self, idx: int)`:\n"
        "   - Retrieves the feature sample at index `idx` as `x`.\n"
        "   - If `self.transform is not None`: applies `x = self.transform(x)`.\n"
        "   - If `self.labels is not None`: returns tuple `(x, self.labels[idx])`.\n"
        "   - If `self.labels is None`: returns `x` directly."
    ),
    "starter_code": r'''import torch
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
        # TODO: Convert features to single-precision float tensor, process optional labels, and store transform
        pass

    def __len__(self) -> int:
        # TODO: Return total number of samples
        pass

    def __getitem__(self, idx: int) -> Union[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        # TODO: Retrieve sample, apply transform if present, and return (x, y) or x
        pass
''',
    "reference_solution": r'''import torch
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
            # Determine appropriate tensor type for labels
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
''',
    "test_suite": r'''import torch
from torch.utils.data import Dataset
import numpy as np

def run_tests(candidate_func):
    """
    Automated test harness for Custom Tabular Dataset (torch-p6-c1).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard tabular features with integer classification labels
    raw_X = np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]], dtype=np.float64)
    raw_y = np.array([0, 1, 0], dtype=np.int32)
    ds = candidate_func(raw_X, raw_y)

    assert_test(isinstance(ds, Dataset), "Dataset must inherit from torch.utils.data.Dataset")
    assert_test(len(ds) == 3, f"Expected len 3, got {len(ds)}")

    item0 = ds[0]
    assert_test(isinstance(item0, tuple) and len(item0) == 2, "Expected (x, y) tuple return from __getitem__")
    x0, y0 = item0
    assert_test(isinstance(x0, torch.Tensor), "x must be a torch.Tensor")
    assert_test(isinstance(y0, torch.Tensor), "y must be a torch.Tensor")
    assert_test(x0.dtype == torch.float32, f"Expected float32 features, got {x0.dtype}")
    assert_test(y0.dtype == torch.int64, f"Expected int64 labels, got {y0.dtype}")
    assert_test(torch.equal(x0, torch.tensor([1.0, 2.0], dtype=torch.float32)), "Features mismatch on sample 0")
    assert_test(y0.item() == 0, f"Expected label 0, got {y0.item()}")

    # Test 2: Unlabeled dataset (labels=None)
    ds_unlabeled = candidate_func([[10.0, 20.0], [30.0, 40.0]])
    assert_test(len(ds_unlabeled) == 2, "Unlabeled dataset length mismatch")
    unlabeled_item = ds_unlabeled[1]
    assert_test(isinstance(unlabeled_item, torch.Tensor), "Unlabeled dataset should return tensor directly")
    assert_test(torch.equal(unlabeled_item, torch.tensor([30.0, 40.0], dtype=torch.float32)), "Feature mismatch")

    # Test 3: Length mismatch raises ValueError
    raised = False
    try:
        candidate_func([[1.0, 2.0], [3.0, 4.0]], [0])
    except ValueError:
        raised = True
    assert_test(raised, "Expected ValueError when feature and label lengths mismatch")

    # Test 4: Custom transformation function
    def add_ten(x):
        return x + 10.0

    ds_tf = candidate_func([[1.0, 2.0]], [1], transform=add_ten)
    tf_x, tf_y = ds_tf[0]
    assert_test(torch.equal(tf_x, torch.tensor([11.0, 12.0], dtype=torch.float32)), "Transform not applied correctly")

    # Test 5: Float regression labels
    ds_reg = candidate_func([[1.0]], [3.14])
    _, reg_y = ds_reg[0]
    assert_test(reg_y.dtype == torch.float32, "Regression targets should be float32")

    return report
''',
    "hints": [
        "Use torch.as_tensor(features, dtype=torch.float32) for fast conversion without unnecessary copying.",
        "Check whether labels is None before indexing self.labels.",
        "Raise ValueError('Features and labels must have the same length') if len(features) != len(labels)."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Mini-Batch DataLoader Streamer (torch-p6-c2)
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "torch-p6-c2",
    "title": "Mini-Batch DataLoader Streamer",
    "difficulty": "Intermediate",
    "category": "Data Pipelines",
    "description": (
        "Construct and inspect a mini-batch DataLoader stream. Validate batch sizes, compute total batch counts, "
        "extract first-batch tensor dimensions, and detect partial trailing batches."
    ),
    "instructions": (
        "Write a function `create_and_inspect_dataloader(dataset: torch.utils.data.Dataset, "
        "batch_size: int = 32, shuffle: bool = False, drop_last: bool = False) -> dict` that:\n"
        "1. Validates `batch_size`: if `batch_size <= 0`, raise `ValueError(\"batch_size must be positive\")`.\n"
        "2. Instantiates a mini-batch data loader for the dataset configured with the given `batch_size`, `shuffle`, "
        "and `drop_last` parameters, storing it as `dataloader`.\n"
        "3. Computes:\n"
        "   - `total_batches`: total number of batches in the stream\n"
        "   - `dataset_size`: total number of samples in the dataset\n"
        "4. Inspects the first mini-batch yielded by the data loader: `first_batch = next(iter(dataloader))`.\n"
        "   - If `first_batch` is a tuple/list `(x_batch, y_batch)`:\n"
        "     - `first_batch_features_shape = tuple(x_batch.shape)`\n"
        "     - `first_batch_labels_shape = tuple(y_batch.shape)`\n"
        "   - Else:\n"
        "     - `first_batch_features_shape = tuple(first_batch.shape)`\n"
        "     - `first_batch_labels_shape = None`\n"
        "5. Iterates through all batches in the stream to collect individual batch sample sizes as a list of integers (`batch_sizes`).\n"
        "6. Determines whether any batch has fewer samples than the specified batch size, recording boolean `has_partial_batch`.\n"
        "7. Returns a dictionary:\n"
        "   `{\"dataloader\": dataloader, \"total_batches\": int(total_batches), \"dataset_size\": int(dataset_size), "
        "\"batch_size\": int(batch_size), \"first_batch_features_shape\": first_batch_features_shape, "
        "\"first_batch_labels_shape\": first_batch_labels_shape, \"has_partial_batch\": bool(has_partial_batch), "
        "\"batch_sizes\": batch_sizes}`"
    ),
    "starter_code": r'''import torch
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
''',
    "reference_solution": r'''import torch
from torch.utils.data import Dataset, DataLoader
from typing import Dict, Any, List, Tuple

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
''',
    "test_suite": r'''import torch
from torch.utils.data import DataLoader, TensorDataset

def run_tests(candidate_func):
    """
    Automated test harness for Mini-Batch DataLoader Streamer (torch-p6-c2).
    """
    report = {"passed": True, "tests_run": 0, "errors": []}

    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Evenly divisible dataset (100 samples, batch_size=20)
    X_even = torch.randn(100, 8)
    y_even = torch.randint(0, 2, (100,))
    ds_even = TensorDataset(X_even, y_even)

    res_even = candidate_func(ds_even, batch_size=20, shuffle=False, drop_last=False)
    assert_test(isinstance(res_even, dict), "Result must be a dictionary")
    expected_keys = {
        "dataloader", "total_batches", "dataset_size", "batch_size",
        "first_batch_features_shape", "first_batch_labels_shape",
        "has_partial_batch", "batch_sizes"
    }
    assert_test(expected_keys.issubset(res_even.keys()), f"Missing keys: {expected_keys - set(res_even.keys())}")
    assert_test(res_even["total_batches"] == 5, f"Expected 5 batches, got {res_even['total_batches']}")
    assert_test(res_even["dataset_size"] == 100, f"Expected dataset size 100, got {res_even['dataset_size']}")
    assert_test(res_even["first_batch_features_shape"] == (20, 8), f"Expected (20, 8), got {res_even['first_batch_features_shape']}")
    assert_test(res_even["first_batch_labels_shape"] == (20,), f"Expected (20,), got {res_even['first_batch_labels_shape']}")
    assert_test(res_even["has_partial_batch"] is False, "Even dataset should not have partial batch")
    assert_test(res_even["batch_sizes"] == [20, 20, 20, 20, 20], f"Unexpected batch sizes: {res_even['batch_sizes']}")

    # Test 2: Non-divisible dataset (105 samples, batch_size=20, drop_last=False)
    X_odd = torch.randn(105, 5)
    y_odd = torch.zeros(105)
    ds_odd = TensorDataset(X_odd, y_odd)

    res_odd = candidate_func(ds_odd, batch_size=20, shuffle=False, drop_last=False)
    assert_test(res_odd["total_batches"] == 6, f"Expected 6 batches, got {res_odd['total_batches']}")
    assert_test(res_odd["has_partial_batch"] is True, "Expected partial batch to be True")
    assert_test(res_odd["batch_sizes"] == [20, 20, 20, 20, 20, 5], f"Unexpected batch sizes: {res_odd['batch_sizes']}")

    # Test 3: Non-divisible with drop_last=True
    res_drop = candidate_func(ds_odd, batch_size=20, shuffle=False, drop_last=True)
    assert_test(res_drop["total_batches"] == 5, f"Expected 5 batches with drop_last=True, got {res_drop['total_batches']}")
    assert_test(res_drop["has_partial_batch"] is False, "drop_last=True should eliminate partial batch")
    assert_test(res_drop["batch_sizes"] == [20, 20, 20, 20, 20], "All batches should be size 20")

    # Test 4: Invalid batch_size
    raised = False
    try:
        candidate_func(ds_even, batch_size=0)
    except ValueError:
        raised = True
    assert_test(raised, "batch_size <= 0 should raise ValueError")

    return report
''',
    "hints": [
        "Validate batch_size > 0 before constructing DataLoader.",
        "Inspect the first batch using `first_batch = next(iter(dataloader))`.",
        "Check each batch's sample count by reading batch[0].shape[0] to determine whether any batch has fewer items than batch_size."
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
