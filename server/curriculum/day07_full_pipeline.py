"""
Day 7: Capstone - End-to-End Autonomous AI System Pipeline
PyMastery 7-Day Curriculum
"""

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from typing import Dict, Any, List, Optional, Tuple

DAY_METADATA = {
    "day_id": "day07",
    "day_number": 7,
    "title": "Day 7: Capstone - End-to-End Autonomous AI System Pipeline",
    "tagline": "Synthesize NumPy internals, Pandas ETL, Scikit-Learn anti-leakage preprocessing, PyTorch deep architectures, and Matplotlib diagnostics into an end-to-end system.",
    "estimated_time": "4-5 hours",
    "concepts_covered": [
        "Full-stack AI Architecture: Ingestion -> Feature Engine -> Preprocessor -> PyTorch DNN -> Diagnostics",
        "Deterministic seeding across NumPy, PyTorch, and Python runtimes",
        "Zero-copy data interchange between Pandas DataFrames, NumPy ndarrays, and Torch Tensors",
        "Deep MLP with Residual skip connections & Dropout regularization",
        "Automated visual report generation from training history & evaluation sets",
        "Production inference serving interface from raw tabular DataFrames"
    ]
}

CONCEPT_PRIMER = r"""# Day 7 Concept Primer: Production AI Engineering & Capstone Architecture

## 1. The Unified 5-Stage AI Architecture
A production-grade machine learning system coordinates five distinct computational layers:

```
[ 1. Raw Tabular Ingestion (Pandas/NumPy) ]
                     │  (ETL, categorical dtypes, schema validation)
                     ▼
[ 2. Anti-Leakage Preprocessing (Scikit-Learn) ]
                     │  (ColumnTransformer, Target/OneHot Encoding, Scaling)
                     ▼
[ 3. Tensor Construction & DataLoaders (PyTorch) ]
                     │  (TensorDataset, Batching, Device Transfer)
                     ▼
[ 4. Deep Architecture Training & Checkpointing (PyTorch) ]
                     │  (Residual MLP, AdamW, Cosine Annealing, Early Stopping)
                     ▼
[ 5. Diagnostic Visual Reporting (Matplotlib OOP) ]
                     │  (Multi-panel Figures, Metrics, Confusion Matrix, Calibration)
                     ▼
[ Production Serving Interface (`pipeline.predict(df_raw)`) ]
```

---

## 2. Reproducibility & Determinism
In multi-framework systems, non-deterministic random seeds cause irreproducible results. Always initialize deterministic seeds simultaneously:

```python
import os, random, numpy as np, torch

def seed_everything(seed: int = 42):
    random.seed(seed)
    os.environ['PYTHONHASHSEED'] = str(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
```

---

## 3. The Seamless Inference Interface
A production model must accept **raw, un-preprocessed client DataFrames** during inference:
$$\mathbf{x}_{\text{raw}} \xrightarrow{\text{preprocessor.transform()}} \mathbf{x}_{\text{tensor}} \xrightarrow{\text{model.eval()}(x)} \hat{\mathbf{y}}_{\text{logits}} \xrightarrow{\sigma / \text{softmax}} \mathbf{p}$$
"""

WALKTHROUGH = r"""# Day 7 Walkthrough: Orchestrating an End-to-End System

```python
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer

# 1. Simulate Raw Data
def generate_sample_data(n_samples=500):
    np.random.seed(42)
    df = pd.DataFrame({
        'feature1': np.random.randn(n_samples),
        'feature2': np.random.uniform(10, 50, size=n_samples),
        'category': np.random.choice(['A', 'B', 'C'], size=n_samples)
    })
    y = ((df['feature1'] * 1.5 + df['feature2'] * 0.1 > 3.0)).astype(int)
    return df, y

# 2. Pipeline Interface Pattern
class ModularAIPipeline:
    def __init__(self):
        self.preprocessor = None
        self.model = None
        
    def fit(self, df_x: pd.DataFrame, y: np.ndarray):
        # Fit preprocessor & train neural network
        pass
        
    def predict(self, df_x: pd.DataFrame) -> np.ndarray:
        # Preprocess raw dataframe and run inference in eval mode
        pass
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Full-Stack End-to-End ML Pipeline Capstone
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "day07_ch01_full_pipeline_capstone",
    "title": "End-to-End Autonomous AI System Pipeline Capstone",
    "difficulty": "Expert",
    "category": "Full System Synthesis",
    "description": (
        "Architect and implement `EndToEndMLPipeline`, a self-contained production machine learning system "
        "synthesizing Pandas ETL, Scikit-Learn anti-leakage ColumnTransformers, PyTorch Deep Residual MLP, "
        "training loop with early stopping, Matplotlib diagnostic dashboard generation, and raw DataFrame inference."
    ),
    "instructions": (
        "1. Implement `EndToEndMLPipeline` with the following methods:\n"
        "2. `fit(self, df_raw: pd.DataFrame, y: np.ndarray, numeric_cols: list, categorical_cols: list, epochs: int = 20, batch_size: int = 32, lr: float = 0.005) -> Dict[str, Any]`:\n"
        "   - Splits raw data into train (80%) and validation (20%) using `train_test_split(stratify=y, random_state=42)`.\n"
        "   - Preprocesses numeric features with `StandardScaler` and categorical features with `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` using `ColumnTransformer`.\n"
        "   - Constructs PyTorch `DeepMLP` with architecture: `InputDim -> Linear(64) -> BatchNorm1d -> ReLU -> Dropout(0.2) -> Linear(32) -> ReLU -> Linear(2)`.\n"
        "   - Trains model with `AdamW`, `CrossEntropyLoss`, and validation monitoring.\n"
        "   - Generates and stores a Matplotlib `Figure` diagnostic report with training curves and validation confusion matrix.\n"
        "3. `predict(self, df_raw: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]`:\n"
        "   - Takes raw DataFrame, applies `self.preprocessor.transform(df_raw)`, runs model in `eval()` mode with `torch.no_grad()`.\n"
        "   - Returns `(predicted_classes, predicted_probabilities)` as NumPy arrays.\n"
        "4. `get_diagnostic_plot(self) -> plt.Figure`:\n"
        "   - Returns the generated diagnostic Matplotlib figure."
    ),
    "starter_code": r'''import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
from typing import Dict, Any, List, Tuple

class EndToEndMLPipeline:
    def __init__(self):
        self.preprocessor = None
        self.model = None
        self.diagnostic_fig = None
        self.history = None

    def fit(
        self,
        df_raw: pd.DataFrame,
        y: np.ndarray,
        numeric_cols: List[str],
        categorical_cols: List[str],
        epochs: int = 20,
        batch_size: int = 32,
        lr: float = 0.005
    ) -> Dict[str, Any]:
        """
        Execute full ETL, preprocessing, PyTorch model training, and diagnostic visualization.
        """
        # TODO: Implement end-to-end fit
        pass

    def predict(self, df_raw: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Inference interface accepting raw client DataFrame.
        Returns (predicted_labels, predicted_probabilities).
        """
        # TODO: Implement raw dataframe inference
        pass

    def get_diagnostic_plot(self) -> plt.Figure:
        return self.diagnostic_fig
''',
    "reference_solution": r'''import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from typing import Dict, Any, List, Tuple

class DeepMLP(nn.Module):
    def __init__(self, in_features: int, hidden_dim: int = 64, num_classes: int = 2, dropout: float = 0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

class EndToEndMLPipeline:
    def __init__(self):
        self.preprocessor = None
        self.model = None
        self.diagnostic_fig = None
        self.history = None

    def fit(
        self,
        df_raw: pd.DataFrame,
        y: np.ndarray,
        numeric_cols: List[str],
        categorical_cols: List[str],
        epochs: int = 20,
        batch_size: int = 32,
        lr: float = 0.005
    ) -> Dict[str, Any]:
        # 1. Train-Val Split
        X_train_df, X_val_df, y_train, y_val = train_test_split(
            df_raw, y, test_size=0.2, stratify=y, random_state=42
        )
        
        # 2. Anti-Leakage Preprocessing (Fitted ONLY on X_train_df)
        transformers = []
        if numeric_cols:
            transformers.append(("num", StandardScaler(), numeric_cols))
        if categorical_cols:
            transformers.append(("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols))
            
        self.preprocessor = ColumnTransformer(transformers=transformers)
        X_train_arr = self.preprocessor.fit_transform(X_train_df)
        X_val_arr = self.preprocessor.transform(X_val_df)
        
        in_features = X_train_arr.shape[1]
        
        # 3. DataLoaders
        t_x_train = torch.tensor(X_train_arr, dtype=torch.float32)
        t_y_train = torch.tensor(np.asarray(y_train), dtype=torch.long)
        t_x_val = torch.tensor(X_val_arr, dtype=torch.float32)
        t_y_val = torch.tensor(np.asarray(y_val), dtype=torch.long)
        
        train_loader = DataLoader(TensorDataset(t_x_train, t_y_train), batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(TensorDataset(t_x_val, t_y_val), batch_size=batch_size, shuffle=False)
        
        # 4. Model Architecture & Optimization
        self.model = DeepMLP(in_features=in_features, hidden_dim=64, num_classes=2, dropout=0.2)
        optimizer = torch.optim.AdamW(self.model.parameters(), lr=lr, weight_decay=1e-4)
        criterion = nn.CrossEntropyLoss()
        
        self.history = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}
        
        for epoch in range(1, epochs + 1):
            # Training phase
            self.model.train()
            total_loss = 0.0
            correct = 0
            total = 0
            
            for xb, yb in train_loader:
                optimizer.zero_grad()
                out = self.model(xb)
                loss = criterion(out, yb)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                optimizer.step()
                
                total_loss += loss.item() * len(yb)
                correct += (out.argmax(dim=-1) == yb).sum().item()
                total += len(yb)
                
            self.history["train_loss"].append(total_loss / total)
            self.history["train_acc"].append(correct / total)
            
            # Validation phase
            self.model.eval()
            val_loss = 0.0
            val_correct = 0
            val_total = 0
            with torch.no_grad():
                for xb, yb in val_loader:
                    out = self.model(xb)
                    loss = criterion(out, yb)
                    val_loss += loss.item() * len(yb)
                    val_correct += (out.argmax(dim=-1) == yb).sum().item()
                    val_total += len(yb)
                    
            self.history["val_loss"].append(val_loss / val_total)
            self.history["val_acc"].append(val_correct / val_total)
            
        # 5. Generate Matplotlib Diagnostic Dashboard
        self.diagnostic_fig = self._build_diagnostics(t_x_val, y_val)
        
        return {
            "final_train_loss": self.history["train_loss"][-1],
            "final_val_loss": self.history["val_loss"][-1],
            "final_val_acc": self.history["val_acc"][-1],
            "history": self.history
        }

    def _build_diagnostics(self, t_x_val: torch.Tensor, y_val: np.ndarray) -> plt.Figure:
        fig = plt.figure(figsize=(12, 5), dpi=150)
        gs = gridspec.GridSpec(1, 2, figure=fig, wspace=0.3)
        
        # Left Panel: Learning curves
        ax1 = fig.add_subplot(gs[0, 0])
        epochs = range(1, len(self.history["train_loss"]) + 1)
        ax1.plot(epochs, self.history["train_loss"], label="Train Loss", color="#2563eb", lw=2)
        ax1.plot(epochs, self.history["val_loss"], label="Val Loss", color="#dc2626", lw=2, linestyle="--")
        ax1.set_xlabel("Epoch", fontweight="semibold")
        ax1.set_ylabel("Cross Entropy Loss", fontweight="semibold")
        ax1.set_title("Training & Validation Loss", fontweight="bold")
        ax1.grid(True, linestyle=":", alpha=0.6)
        ax1.legend()
        
        # Right Panel: Validation Confusion Matrix
        ax2 = fig.add_subplot(gs[0, 1])
        self.model.eval()
        with torch.no_grad():
            logits = self.model(t_x_val)
            preds = logits.argmax(dim=-1).cpu().numpy()
            
        cm = np.zeros((2, 2), dtype=int)
        for t, p in zip(y_val, preds):
            cm[int(t), int(p)] += 1
            
        im = ax2.imshow(cm, cmap="Blues")
        plt.colorbar(im, ax=ax2, fraction=0.046, pad=0.04)
        for i in range(2):
            for j in range(2):
                txt_color = "white" if cm[i, j] > (cm.max() / 2) else "black"
                ax2.text(j, i, str(cm[i, j]), ha="center", va="center", color=txt_color, fontweight="bold")
                
        ax2.set_xticks([0, 1])
        ax2.set_yticks([0, 1])
        ax2.set_xticklabels(["Negative", "Positive"])
        ax2.set_yticklabels(["Negative", "Positive"])
        ax2.set_xlabel("Predicted")
        ax2.set_ylabel("True")
        ax2.set_title("Validation Confusion Matrix", fontweight="bold")
        
        fig.tight_layout()
        return fig

    def predict(self, df_raw: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        if self.preprocessor is None or self.model is None:
            raise RuntimeError("Pipeline must be fitted before calling predict.")
            
        X_arr = self.preprocessor.transform(df_raw)
        t_x = torch.tensor(X_arr, dtype=torch.float32)
        
        self.model.eval()
        with torch.no_grad():
            logits = self.model(t_x)
            probs = F.softmax(logits, dim=-1).cpu().numpy()
            preds = np.argmax(probs, axis=-1)
            
        return preds, probs

    def get_diagnostic_plot(self) -> plt.Figure:
        return self.diagnostic_fig
''',
    "test_suite": r'''import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def run_tests(candidate_class):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # 1. Synthesize Tabular Dataset
    np.random.seed(42)
    N = 600
    df = pd.DataFrame({
        "num_f1": np.random.normal(0, 1, size=N),
        "num_f2": np.random.exponential(2.0, size=N),
        "cat_f1": np.random.choice(["Tier1", "Tier2", "Tier3"], size=N),
        "cat_f2": np.random.choice(["RegionA", "RegionB"], size=N)
    })
    
    # Ground truth formula
    signal = (
        df["num_f1"] * 2.0 -
        df["num_f2"] * 0.8 +
        (df["cat_f1"] == "Tier1").astype(float) * 2.5
    )
    probs = 1.0 / (1.0 + np.exp(-signal))
    y = (probs >= 0.5).astype(int)
    
    pipeline = candidate_class()
    fit_summary = pipeline.fit(
        df_raw=df,
        y=y,
        numeric_cols=["num_f1", "num_f2"],
        categorical_cols=["cat_f1", "cat_f2"],
        epochs=15,
        batch_size=32,
        lr=0.01
    )
    
    assert_test(isinstance(fit_summary, dict), "fit() must return summary dictionary")
    assert_test(fit_summary["final_val_acc"] > 0.80, f"Expected validation accuracy > 80%, got {fit_summary['final_val_acc']*100:.1f}%")
    
    # 2. Raw DataFrame Inference Test
    test_df = df.iloc[:10].copy()
    preds, probs_out = pipeline.predict(test_df)
    assert_test(preds.shape == (10,), f"Predictions shape mismatch: {preds.shape}")
    assert_test(probs_out.shape == (10, 2), f"Probabilities shape mismatch: {probs_out.shape}")
    assert_test(np.allclose(probs_out.sum(axis=-1), 1.0, atol=1e-5), "Softmax probabilities must sum to 1.0")
    
    # 3. Diagnostic Figure Verification
    fig = pipeline.get_diagnostic_plot()
    assert_test(isinstance(fig, plt.Figure), "get_diagnostic_plot must return a plt.Figure")
    plt.close(fig)

    return report
''',
    "hints": [
        "Fit `ColumnTransformer` with `StandardScaler()` for numeric features and `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` for categorical features on `X_train_df` only.",
        "Construct a PyTorch `DataLoader` with `TensorDataset(t_x, t_y)`.",
        "In `predict(df_raw)`, apply `self.preprocessor.transform(df_raw)`, convert to tensor, run `model.eval()`, and apply `F.softmax`."
    ]
}

CURRICULUM_DATA = {
    **DAY_METADATA,
    "concept_primer": CONCEPT_PRIMER,
    "walkthrough": WALKTHROUGH,
    "challenges": [CHALLENGE_1]
}

def get_curriculum() -> Dict[str, Any]:
    return CURRICULUM_DATA
