import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export type { DayTrack, Challenge, ConceptPrimerData };

export const SKLEARN_PART06_TRACK: DayTrack = {
  partNumber: 6,
  partId: 6,
  dayNumber: 6,
  id: 6,
  title: 'Part 6: End-to-End Scikit-Learn Pipelines',
  subtitle: 'Combine feature transformers, encoders, and estimators into robust production-ready pipelines',
  description: 'Harness the full power of Scikit-Learn pipelines. Encapsulate multi-type data imputation, numerical scaling, categorical encoding, and model fitting into a unified Pipeline using ColumnTransformer. Guarantee leak-free training, seamless deployment, and unified inference with a single .predict() call.',
  iconName: 'Network',
  badge: 'Part 6 • Pipelines Capstone',
  libraryMechanics: {
    libraryName: 'Scikit-Learn Production Pipeline Architecture',
    tagline: 'Package imputation, encoding, scaling, and classification into an atomic production artifact.',
    overview: `### 🏭 The Production Machine Learning Gap
Training a machine learning model inside an interactive notebook is only 10% of engineering. The remaining 90% is data plumbing:
handling missing fields, normalizing numbers, encoding text categories, and ensuring test inference receives the exact same transformations.

### 🛡️ The Scikit-Learn Pipeline Solution
A \`Pipeline\` chains transformers and a terminal estimator into a single atomic Python object:
- **Zero Leakage:** Calling cross-validation on a Pipeline ensures imputers and scalers are refit inside every single fold independently.
- **Single-Call Inference:** Raw dictionaries or DataFrames pass into \`pipeline.predict(X_new)\`, executing all preprocessing automatically.
- **Atomic Serialization:** Save the entire lifecycle in one pickle file (\`joblib.dump(pipeline, 'model.joblib')\`).`,
    whyItExists: `Ad-hoc pandas preprocessing scripts break constantly in production:
- Columns in test data are ordered differently than training data.
- Unseen categorical values throw unexpected exceptions.
- Missing values during inference crash estimators that require dense numeric matrices.

Scikit-Learn \`Pipeline\` and \`ColumnTransformer\` eliminate these failure modes by binding preprocessing and modeling into an immutable directed acyclic graph.`,
    coreAnatomy: {
      objectName: 'Pipeline & ColumnTransformer',
      description: 'Chains sequential transformation steps with a terminal predictive estimator.',
      fields: [
        {
          name: 'steps',
          type: 'list of (name, transform/estimator) tuples',
          role: 'Defines the ordered execution pipeline.'
        },
        {
          name: 'named_steps',
          type: 'Bunch (dict-like)',
          role: 'Provides direct access to individual steps by name (e.g. pipe.named_steps["classifier"]).'
        },
        {
          name: 'ColumnTransformer',
          type: 'Transformer',
          role: 'Applies specialized sub-pipelines across distinct subsets of tabular columns in parallel.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|              Raw Production Inference DataFrame             |
|   [ Age: NaN | Income: 85k ]        [ Department: 'Ops' ]   |
+-----------------------------+-------------------------------+
               |                               |
       Numeric Sub-Pipeline          Categorical Sub-Pipeline
               |                               |
     SimpleImputer(median)          SimpleImputer(most_frequent)
               v                               v
         StandardScaler              OneHotEncoder(ignore)
               |                               |
               +---------------+---------------+
                               |
                               v
               +-------------------------------+
               |  Concatenated Dense Feature   |
               +-------------------------------+
                               |
                               v
               +-------------------------------+
               | Classifier (RandomForest/Log) |
               +-------------------------------+
                               |
                               v
                     Final Prediction [1]`
    },
    chapters: [
      {
        id: 'ch1-why-pipelines',
        title: 'Why Ad-Hoc Preprocessing Breaks in Production',
        icon: 'AlertTriangle',
        summary: 'The vulnerabilities of manual DataFrame cleaning.',
        markdownContent: `### The Fragility of Manual Cleaning

\`\`\`python
# DANGEROUS MANUAL WORKFLOW:
df['age'].fillna(df['age'].mean(), inplace=True)
df_scaled = scaler.transform(df[['age', 'income']])
# In production:
# What if the user submits missing income?
# What if a category was never seen before?
\`\`\`
A Pipeline encapsulates these transformations so they are reproduced identically during inference.`
      },
      {
        id: 'ch2-sub-pipelines',
        title: 'Nested Pipelines in ColumnTransformer',
        icon: 'Layers',
        summary: 'Imputing and scaling numbers while imputing and encoding categories.',
        markdownContent: `### Multi-Type Heterogeneous Preprocessing

\`\`\`python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

num_pipe = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

cat_pipe = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('encoder', OneHotEncoder(sparse_output=False, handle_unknown='ignore'))
])

preprocessor = ColumnTransformer([
    ('num', num_pipe, ['age', 'income']),
    ('cat', cat_pipe, ['department'])
])
\`\`\``
      },
      {
        id: 'ch3-end-to-end',
        title: 'The Unified fit() and predict() Contract',
        icon: 'CheckCircle',
        summary: 'Deploying a complete model as a single executable object.',
        markdownContent: `### Assembling the Full Architecture

\`\`\`python
from sklearn.ensemble import RandomForestClassifier

full_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Single fit trains imputers, scalers, encoders, and trees:
full_pipeline.fit(X_train, y_train)

# Single predict processes raw DataFrame inputs:
predictions = full_pipeline.predict(X_test)
\`\`\``
      }
    ],
    commonTraps: [
      {
        title: 'Imputing Before Cross-Validation Split',
        badSnippet: `df_imputed = imputer.fit_transform(df)\nscores = cross_val_score(model, df_imputed, y)`,
        badExplanation: 'Global imputation computes medians across train and validation sets, causing subtle target distribution leakage.',
        goodSnippet: `pipe = Pipeline([('imputer', SimpleImputer()), ('model', model)])\nscores = cross_val_score(pipe, df, y)`,
        goodExplanation: 'Placing the imputer inside the Pipeline forces re-imputation on each training fold exclusively.',
        perfImpact: 'Eliminates hidden data leakage in cross-validation benchmarks.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'Pipeline',
        category: 'Pipeline',
        signature: 'Pipeline(steps, *, memory=None, verbose=False)',
        summary: 'Pipeline of transforms with a final estimator.',
        parameters: [
          { name: 'steps', type: 'list of (name, transform) tuples', desc: 'Ordered sequence of transformers and final estimator.' }
        ],
        returns: 'Pipeline instance.',
        exampleSnippet: `pipe = Pipeline([('scaler', StandardScaler()), ('clf', LogisticRegression())])`
      }
    ],
    interactiveWidgetType: 'production-pipeline'
  },
  challenges: [
    {
      id: 'sk-p6-c1',
      dayId: 6,
      partId: 6,
      title: 'Production Preprocessing & Model Pipeline',
      slug: 'production-preprocessing-classifier-pipeline',
      difficulty: 'Intermediate',
      category: 'Pipelines',
      summary: 'Assemble preprocessing transformers and a linear classifier into a single unified production pipeline.',
      mentalModel5s: 'One master pipeline that standardizes numbers, encodes categories, and classifies in a unified pass.',
      visualAnalogy: 'An automated car assembly line: raw chassis enters, body panels and engine are installed at specialized stations, and a finished car drives off the line.',
      pitfalls: [
        'Passing an empty list of features for both numeric and categorical columns.',
        'Misnaming pipeline steps or forgetting sparse_output=False on OneHotEncoder.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check that numeric_cols and categorical_cols are not both empty.',
        'Tier 2 (ColumnTransformer): Build preprocessor with ("num", StandardScaler(), numeric_cols) and ("cat", OneHotEncoder(sparse_output=False, handle_unknown="ignore"), categorical_cols).',
        'Tier 3 (Pipeline): Wrap into Pipeline([("preprocessor", preprocessor), ("classifier", LogisticRegression(random_state=random_state, max_iter=1000))]).',
        'Tier 4 (Return): Return the configured, unfitted Pipeline instance.'
      ],
      deepInternals: {
        title: 'Sequential Transform Forwarding',
        content: 'Pipeline intercepts calls to .fit(), sequentially calls .fit_transform() on all transformers, and passes the output matrix to the final estimator.',
        keyRule: 'All intermediate steps in a Pipeline must be transformers; only the final step can be a pure estimator.'
      },
      instructions: `Write a function \`build_preprocessing_classifier_pipeline(numeric_cols: list[str], categorical_cols: list[str], random_state: int = 42) -> Pipeline\` that:
1. Validates inputs:
   - If \`len(numeric_cols) == 0 and len(categorical_cols) == 0\`, raise \`ValueError("At least one numeric or categorical column required")\`.
2. Constructs a composite column preprocessor named \`"preprocessor"\`:
   - Continuous feature standardizer named \`"num"\` targeting \`numeric_cols\` (when \`numeric_cols\` is non-empty).
   - Dense one-hot categorical encoder named \`"cat"\` targeting \`categorical_cols\` configured to ignore unseen categories during inference (when \`categorical_cols\` is non-empty).
3. Assembles preprocessing transformers and the final estimator into a single unified pipeline containing:
   - Step \`"preprocessor"\`: the constructed column preprocessor
   - Step \`"classifier"\`: a logistic regression classifier configured with \`random_state=random_state\` and \`max_iter=1000\`.
4. Returns the configured, unfitted pipeline instance.`,
      hints: [
        'Import Pipeline from sklearn.pipeline and ColumnTransformer from sklearn.compose.',
        'Use OneHotEncoder(sparse_output=False, handle_unknown="ignore").',
        'Return the Pipeline instance directly.'
      ],
      starterCode: `from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression

def build_preprocessing_classifier_pipeline(numeric_cols: list[str], categorical_cols: list[str], random_state: int = 42) -> Pipeline:
    """
    Assemble preprocessing transformers and a classifier into a unified pipeline.

    Args:
        numeric_cols: List of numerical column names
        categorical_cols: List of categorical column names
        random_state: Seed for classifier reproducibility

    Returns:
        Configured, unfitted Pipeline instance
    """
    # TODO: Validate inputs, construct column preprocessor, assemble pipeline, return pipeline
    pass
`,
      solutionCode: `from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression

def build_preprocessing_classifier_pipeline(numeric_cols: list[str], categorical_cols: list[str], random_state: int = 42) -> Pipeline:
    if len(numeric_cols) == 0 and len(categorical_cols) == 0:
        raise ValueError("At least one numeric or categorical column required")

    transformers = []
    if numeric_cols:
        transformers.append(("num", StandardScaler(), numeric_cols))
    if categorical_cols:
        transformers.append(("cat", OneHotEncoder(sparse_output=False, handle_unknown="ignore"), categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers)
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(random_state=random_state, max_iter=1000))
    ])

    return pipeline
`,
      testCases: [
        {
          id: 't1',
          name: 'Pipeline Execution with Unseen Category',
          inputDescription: 'Train DataFrame with age, balance, job; Test DataFrame with unseen job category',
          expectedOutput: 'Pipeline fits and predicts test DataFrame without errors'
        },
        {
          id: 't2',
          name: 'Empty Columns Validation',
          inputDescription: 'numeric_cols=[], categorical_cols=[]',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 2.0,
      memoryTargetMb: 1.0,
      conceptPrimer: {
        title: 'Production Pipeline Architecture',
        subtitle: 'Chaining column transformations and linear classification',
        overview: 'Pipelines bind data transformation and predictive estimation into one cohesive structure, guaranteeing consistent execution from development to production.',
        mentalModel5s: 'Raw data goes in; final predictions come out. All cleaning happens under the hood.',
        visualAnalogy: 'An automated car wash: water spray, soap, scrubbing brushes, and blower dryer run in an exact, unvarying sequence.',
        pitfalls: [
          'Attempting to put a pure estimator in an intermediate step of a Pipeline.'
        ],
        progressiveHints: [
          'Create ColumnTransformer with numeric and categorical steps.',
          'Pass into Pipeline([("preprocessor", preprocessor), ("classifier", LogisticRegression(...))]).'
        ],
        mathFormulas: [
          {
            title: 'Pipeline Composition',
            latex: '\\hat{y} = f_{\\text{estimator}}(T_{\\text{preprocess}}(X))',
            explanation: 'The pipeline executes mathematical function composition.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual intermediate variables
X_tr_proc = ct.fit_transform(X_tr)
model.fit(X_tr_proc, y_tr)
X_te_proc = ct.transform(X_te)
y_pred = model.predict(X_te_proc)`,
          naiveExplanation: 'Scattered code prone to forgetting a step in production.',
          idiomaticCode: `# Clean Scikit-Learn Pipeline
pipe.fit(X_tr, y_tr)
y_pred = pipe.predict(X_te)`,
          idiomaticExplanation: 'Atomic, single-statement execution for training and inference.',
          speedupText: 'Production standard'
        },
        memoryLayout: {
          title: 'Named Steps Mapping',
          content: 'Stores each step in a ordered dictionary accessible via pipe.named_steps.',
          keyRule: 'Intermediate steps must implement fit and transform.'
        },
        keyTakeaways: [
          'Pipeline packages preprocessing and modeling into one object.',
          'ColumnTransformer processes multi-type tables in parallel.',
          'Calling .predict() handles all feature cleaning automatically.'
        ]
      },
      expectedTensors: []
    },
    {
      id: 'sk-p6-c2',
      dayId: 6,
      partId: 6,
      title: 'Full ML Capstone Pipeline',
      slug: 'full-ml-capstone-pipeline',
      difficulty: 'Intermediate',
      category: 'Pipelines',
      summary: 'Build and evaluate an end-to-end machine learning pipeline that imputes missing values, scales continuous features, encodes categories, and trains an ensemble forest classifier.',
      mentalModel5s: 'The complete enterprise ML stack: Impute -> Scale/Encode -> Random Forest -> Evaluate.',
      visualAnalogy: 'A comprehensive medical triage system: missing chart values are estimated, vital signs are normalized, symptoms are categorized, and a panel of specialist doctors makes a diagnosis.',
      pitfalls: [
        'Target column missing from either train or test DataFrame.',
        'Not handling missing values in test data.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check target_col in both train_df and test_df, and verify feature columns exist.',
        'Tier 2 (Sub-pipelines): Numeric: SimpleImputer(median) -> StandardScaler(). Categorical: SimpleImputer(most_frequent) -> OneHotEncoder(ignore).',
        'Tier 3 (ColumnTransformer & Pipeline): Combine sub-pipelines into preprocessor, chain with RandomForestClassifier(n_estimators=50, random_state=random_state).',
        'Tier 4 (Fit & Score): Fit on (X_train, y_train), predict on X_test, evaluate accuracy and weighted F1.'
      ],
      deepInternals: {
        title: 'Nested Pipeline Execution Graph',
        content: 'ColumnTransformer executes sub-pipelines in parallel branches. Imputers learn replacement statistics (median, mode) from training folds and fill missing entries without lookahead leakage.',
        keyRule: 'SimpleImputer inside a Pipeline guarantees missing test values are imputed using training medians.'
      },
      instructions: `Write a function \`build_and_evaluate_capstone_pipeline(train_df: pd.DataFrame, test_df: pd.DataFrame, numeric_cols: list[str], categorical_cols: list[str], target_col: str, random_state: int = 42) -> dict\` that:
1. Validates inputs:
   - If \`target_col not in train_df.columns or target_col not in test_df.columns\`, raise \`ValueError("target_col must be present in both train_df and test_df")\`.
   - If \`len(numeric_cols) == 0 and len(categorical_cols) == 0\`, raise \`ValueError("At least one feature column required")\`.
   - Check that all columns in \`numeric_cols\` and \`categorical_cols\` exist in both DataFrames; if not, raise \`ValueError("Specified feature column missing in DataFrame")\`.
2. Builds specialized transformation sub-pipelines:
   - Numeric sub-pipeline: imputes missing numeric values using median statistics, then applies standard feature scaling.
   - Categorical sub-pipeline: imputes missing categorical values using the most frequent value, then applies dense one-hot encoding ignoring unseen test categories.
3. Combines the sub-pipelines into a column preprocessor named \`"preprocessor"\` targeting the respective numeric and categorical column subsets (when non-empty).
4. Assembles preprocessing transformers and the final estimator into a single unified pipeline with steps:
   - \`"preprocessor"\`: the composite column transformer
   - \`"classifier"\`: a random forest classifier configured with 50 estimators and \`random_state=random_state\`
5. Separates features and target columns across both training and testing datasets (target column specified by \`target_col\`).
6. Fits the complete unified pipeline on the training split and generates discrete predictions (\`y_pred\`) on the testing split.
7. Evaluates test set generalization performance:
   - \`test_accuracy\`: float overall accuracy score
   - \`test_f1\`: float weighted-average F1 score (handling zero-division gracefully by setting to 0)
8. Returns a dictionary:
   \`{"pipeline": pipeline, "y_pred": y_pred, "test_accuracy": test_accuracy, "test_f1": test_f1}\`.`,
      hints: [
        'Import SimpleImputer from sklearn.impute and RandomForestClassifier from sklearn.ensemble.',
        'Use average="weighted" and zero_division=0 in f1_score.',
        'Fit the pipeline on X_train, y_train and predict on X_test.'
      ],
      starterCode: `import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

def build_and_evaluate_capstone_pipeline(train_df: pd.DataFrame, test_df: pd.DataFrame, numeric_cols: list[str], categorical_cols: list[str], target_col: str, random_state: int = 42) -> dict:
    """
    Build and evaluate an end-to-end imputation, scaling, categorical encoding, and random forest classifier pipeline.

    Args:
        train_df: Training DataFrame including target column
        test_df: Testing DataFrame including target column
        numeric_cols: List of numeric column names
        categorical_cols: List of categorical column names
        target_col: Name of the target label column
        random_state: Random seed for model reproducibility

    Returns:
        dict with pipeline, y_pred, test_accuracy, test_f1
    """
    # TODO: Validate inputs, build sub-pipelines and preprocessor, train unified pipeline, evaluate, return dict
    pass
`,
      solutionCode: `import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

def build_and_evaluate_capstone_pipeline(train_df: pd.DataFrame, test_df: pd.DataFrame, numeric_cols: list[str], categorical_cols: list[str], target_col: str, random_state: int = 42) -> dict:
    if target_col not in train_df.columns or target_col not in test_df.columns:
        raise ValueError("target_col must be present in both train_df and test_df")
    if len(numeric_cols) == 0 and len(categorical_cols) == 0:
        raise ValueError("At least one feature column required")

    for col in numeric_cols + categorical_cols:
        if col not in train_df.columns or col not in test_df.columns:
            raise ValueError("Specified feature column missing in DataFrame")

    transformers = []
    if numeric_cols:
        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])
        transformers.append(("num", num_pipeline, numeric_cols))

    if categorical_cols:
        cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(sparse_output=False, handle_unknown="ignore"))
        ])
        transformers.append(("cat", cat_pipeline, categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers)
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(n_estimators=50, random_state=random_state))
    ])

    X_train = train_df.drop(columns=[target_col])
    y_train = train_df[target_col]
    X_test = test_df.drop(columns=[target_col])
    y_test = test_df[target_col]

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    test_accuracy = float(accuracy_score(y_test, y_pred))
    test_f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    return {
        "pipeline": pipeline,
        "y_pred": y_pred,
        "test_accuracy": test_accuracy,
        "test_f1": test_f1,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Full Pipeline with NaNs and Unseen Categories',
          inputDescription: 'train_df with missing age, income, tier; test_df with missing values and new category',
          expectedOutput: 'y_pred length 2, test_accuracy and test_f1 in [0, 1]'
        },
        {
          id: 't2',
          name: 'Missing Target Column Validation',
          inputDescription: 'train_df lacks target column',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 15.0,
      memoryTargetMb: 2.0,
      conceptPrimer: {
        title: 'Full Capstone ML Pipeline',
        subtitle: 'Enterprise-grade end-to-end machine learning engineering',
        overview: 'Real-world data contains missing entries, continuous variables, and categorical text. Combining nested imputers, scalers, encoders, and tree ensembles builds an unbreakable production model.',
        mentalModel5s: 'Impute missing values -> Scale & Encode -> Predict with Random Forest ensemble.',
        visualAnalogy: 'A water filtration plant: coarse filter, chemical treatment, UV sterilization, and final mineral balancing before safe distribution.',
        pitfalls: [
          'Dropping missing rows instead of imputing, which discards valuable data and crashes in production when incoming requests contain NaNs.'
        ],
        progressiveHints: [
          'Construct num_pipeline with SimpleImputer(median) and StandardScaler.',
          'Construct cat_pipeline with SimpleImputer(most_frequent) and OneHotEncoder(ignore).',
          'Combine in ColumnTransformer and assemble with RandomForestClassifier.'
        ],
        mathFormulas: [
          {
            title: 'Median Imputation',
            latex: '\\hat{x} = \\text{median}(X_{\\text{train}, j})',
            explanation: 'Missing values are replaced by the robust training median.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Ad-hoc manual filling and one-hot encoding
df.fillna(df.mean())
# Missing test handling breaks in deployment`,
          naiveExplanation: 'Fails when unseen categories or NaNs arrive at inference.',
          idiomaticCode: `# Resilient Nested Pipeline
pipe = Pipeline([
    ('preprocessor', ColumnTransformer([...])),
    ('classifier', RandomForestClassifier())
])`,
          idiomaticExplanation: 'Fully handles missing values and unseen categories with zero manual intervention.',
          speedupText: 'Production ready'
        },
        memoryLayout: {
          title: 'Composite Estimator Hierarchy',
          content: 'Stores nested pipelines and ensemble trees in unified object hierarchy.',
          keyRule: 'Fit on train features; predict on test features.'
        },
        keyTakeaways: [
          'SimpleImputer replaces missing entries with robust medians or modes.',
          'Nested sub-pipelines cleanly separate numerical and categorical logic.',
          'Random Forest ensembles deliver high non-linear predictive power.'
        ]
      },
      expectedTensors: []
    }
  ]
};

export const DAY06_TRACK = SKLEARN_PART06_TRACK;
export const testCases: TestCase[] = SKLEARN_PART06_TRACK.challenges.flatMap(c => c.testCases);
export default SKLEARN_PART06_TRACK;
