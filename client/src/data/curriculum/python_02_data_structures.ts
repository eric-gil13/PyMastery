import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY02_TRACK: DayTrack = {
  partNumber: 2,
  partId: 2,
  dayNumber: 2,
  id: 2,
  title: 'Part 2: Built-in Data Structures & Collections',
  subtitle: 'Lists, tuples, sets, dicts, comprehensions, unpacking, and collections mastery',
  description: 'Dive deep into Python’s four core collections. Explore how CPython implements dynamic list over-allocation and hash tables, master concise list/dict/set comprehensions, harness starred unpacking, and build real-world text indexers and record flatteners.',
  iconName: 'Layers',
  badge: 'Part 2 • Collections Mastery',
  libraryMechanics: {
    libraryName: 'Python Collections & Memory Layout',
    tagline: 'Dynamic array growth, open-addressing hash maps, and zero-overhead unpacking.',
    overview: `### ⚡ Python’s Four Primary Containers
1. **\`list\`**: Contiguous dynamic array of pointer references (\`PyObject**\`). Fast $O(1)$ random access by index and amortized $O(1)$ append; $O(N)$ insertion/deletion at arbitrary positions.
2. **\`tuple\`**: Immutable contiguous array of pointer references. Fixed size, lower memory footprint, and hashable if all its items are hashable.
3. **\`dict\`**: High-performance key-value hash table implemented in CPython with compact indices and collision-resistant probing. Average $O(1)$ lookup, insertion, and deletion. Preserves insertion order (Python 3.7+ guarantee).
4. **\`set\`**: Unordered collection of unique hashable elements implemented as a keys-only hash table. Instant $O(1)$ membership testing (\`x in s\`) and set algebra (\`|\`, \`&\`, \`-\`, \`^\`).`,
    whyItExists: `Choosing the right container fundamentally dictates computational complexity:
- Searching a 1,000,000-item \`list\` via \`x in lst\` takes thousands of microseconds because it performs an $O(N)$ linear scan.
- Searching a 1,000,000-item \`set\` or \`dict\` takes ~50 nanoseconds ($O(1)$ hash lookup)!
- Comprehensions (\`[x for x in seq if cond]\`) execute via dedicated \`LIST_APPEND\` bytecode instructions in C, running significantly faster than manual \`.append()\` in Python \`for\` loops.`,
    coreAnatomy: {
      objectName: 'CPython PyListObject & PyDictObject',
      description: 'The internal layout of dynamic arrays and compact hash tables in CPython.',
      fields: [
        {
          name: 'ob_item',
          type: 'PyObject**',
          role: 'Contiguous buffer of pointers in C holding memory addresses to items.'
        },
        {
          name: 'allocated',
          type: 'Py_ssize_t',
          role: 'Total capacity reserved in memory before next reallocation (over-allocation).'
        },
        {
          name: 'ma_keys / ma_values',
          type: 'PyDictKeysObject*',
          role: 'Compact hash map table preserving insertion order with 8-byte entry indices.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               CPython PyListObject Structure                |
|                                                             |
|  PyListObject                                               |
|  +---------------------+                                    |
|  | ob_refcnt : 1       |                                    |
|  | ob_size   : 3       |  (active length: len(lst))         |
|  | allocated : 6       |  (pre-allocated capacity)          |
|  | ob_item   : ----+   |                                    |
|  +-----------------+---+                                    |
|                    |                                        |
|                    v                                        |
|  Contiguous C Array: [ ->0x101 | ->0x102 | ->0x103 | NULL | NULL | NULL ]
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-comprehensions',
        title: 'Comprehensions & Unpacking Syntax',
        icon: 'Zap',
        summary: 'Write declarative, high-speed data transformations without boilerplate loops.',
        markdownContent: `### List, Dict, and Set Comprehensions

Comprehensions allow constructing collections in a single declarative expression:

\`\`\`python
# List comprehension with filtering
squares = [x**2 for x in range(10) if x % 2 == 0]

# Dict comprehension
word_lengths = {word: len(word) for word in ["python", "rocks", "fast"]}

# Set comprehension
unique_initials = {name[0] for name in ["Alice", "Bob", "Alan", "Ada"]}
\`\`\`

### Extended Unpacking (PEP 3132)
Use the starred operator (\`*\`) to unpack sequences cleanly:
\`\`\`python
first, *middle, last = [10, 20, 30, 40, 50]
print(first)   # 10
print(middle)  # [20, 30, 40]
print(last)    # 50
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-comprehension-demo',
            title: 'Benchmarking Comprehension vs Append',
            code: `data = list(range(1000))

# Comprehension (Fast, compiled instruction)
evens_comp = [x * 2 for x in data if x % 2 == 0]

# Unpacking dictionary merge (Python 3.9+)
dict1 = {"a": 1, "b": 2}
dict2 = {"b": 99, "c": 3}
merged = dict1 | dict2
print("Merged:", merged)`,
            explanation: 'List comprehensions run in optimized C bytecode (LIST_APPEND) without python function call overhead.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Multiplying Lists with Nested Containers',
        badSnippet: `grid = [[0] * 3] * 3\ngrid[0][0] = 99  # TRAP: Modifies all 3 rows simultaneously!`,
        badExplanation: '`[[0] * 3] * 3` copies the outer list pointer 3 times. All 3 rows point to the exact same inner list in memory!',
        goodSnippet: `grid = [[0] * 3 for _ in range(3)]\ngrid[0][0] = 99  # Correct: 3 distinct row instances`,
        goodExplanation: 'Use a list comprehension to allocate independent list instances for each row.',
        perfImpact: 'Eliminates subtle shared-memory mutations across nested data structures.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'defaultdict',
        category: 'Collections',
        signature: 'collections.defaultdict(default_factory)',
        summary: 'Dictionary subclass that calls a factory function to supply missing values without raising KeyError.',
        parameters: [
          { name: 'default_factory', type: 'callable', desc: 'Factory function supplying missing default values.' }
        ],
        returns: 'defaultdict instance.',
        exampleSnippet: 'idx = defaultdict(list)'
      },
      {
        name: 'Counter',
        category: 'Collections',
        signature: 'collections.Counter([iterable-or-mapping])',
        summary: 'Dict subclass for counting hashable objects with .most_common(n) support.',
        parameters: [
          { name: 'iterable', type: 'Iterable, optional', desc: 'Elements to count.' }
        ],
        returns: 'Counter instance.',
        exampleSnippet: 'counts = Counter(["a", "b", "a"])'
      },
      {
        name: 'dict.get',
        category: 'Mapping',
        signature: 'dict.get(key, default=None)',
        summary: 'Returns value for key if key is in the dictionary, else default.',
        parameters: [
          { name: 'key', type: 'Hashable', desc: 'Key to look up.' },
          { name: 'default', type: 'object, optional', desc: 'Value returned if key is absent.' }
        ],
        returns: 'Value mapped to key or default.',
        exampleSnippet: 'val = counts.get("key", 0)'
      },
      {
        name: 'set.intersection',
        category: 'Sets',
        signature: 'set.intersection(*others) / s1 & s2',
        summary: 'Returns a new set with elements common to all sets.',
        parameters: [
          { name: '*others', type: 'Iterable', desc: 'Sets or iterables to intersect with.' }
        ],
        returns: 'New set containing shared elements.',
        exampleSnippet: 'common = set1 & set2'
      }
    ],
    interactiveWidgetType: 'python-memory'
  },
  challenges: [
    {
      id: 'python-p2-c1',
      dayId: 2,
      partId: 2,
      title: 'Inverted Index & Token Frequency Analyzer',
      slug: 'inverted-index-token-frequency-analyzer',
      difficulty: 'Intermediate',
      category: 'Dictionaries & Sets',
      summary: 'Process raw documents, tokenize text, and construct a full inverted search index with term frequencies.',
      estimatedTime: '20 min',
      hints: [
        'Use `re.sub(r"[^a-zA-Z0-9\\s]", " ", text.lower())` to extract alphanumeric tokens.',
        'Use `collections.defaultdict` to track `doc_ids`, `total_count`, and `term_freq`.',
        'Use a `set` to collect unique doc_ids, then sort with `sorted(list(...))` before returning.',
        'Sort dictionary keys alphabetically with `sorted(index.keys())`.'
      ],
      instructions: `Write a function \`build_inverted_index(documents: list[dict]) -> dict\` that:
1. **Input Validation**:
   - If \`documents\` is not a list, raise \`TypeError("documents must be a list")\`.
   - Each item in \`documents\` must be a dictionary with integer \`"id"\` and string \`"text"\`. If invalid or missing, raise \`ValueError("Invalid document entry")\`.
2. **Tokenization Rules**:
   - For each document, extract words from \`text\`.
   - Normalize: convert to lowercase, strip punctuation (strip characters not in letters, digits, or whitespace: keep alphanumeric tokens).
   - Split on whitespace into tokens (ignore empty strings).
3. **Index Construction**:
   - Return a dictionary where each key is a unique token string mapped to:
     - \`"doc_ids"\`: a sorted list of unique document IDs where this token appears.
     - \`"total_count"\`: total number of times the token appears across all documents.
     - \`"term_freq"\`: dictionary mapping \`doc_id\` (int) to the occurrence count of the token in that document.
4. **Ordering**:
   - The returned dictionary keys should be sorted alphabetically.`,
      starterCode: `def build_inverted_index(documents: list[dict]) -> dict:
    """
    Construct an inverted index mapping tokens to document occurrences and frequencies.
    
    Args:
        documents: List of dicts with 'id' (int) and 'text' (str).
        
    Returns:
        Alphabetically sorted dict of token -> {doc_ids, total_count, term_freq}.
    """
    # TODO: Validate documents, tokenize text, accumulate occurrences, return sorted index
    pass
`,
      solutionCode: `import re
from collections import defaultdict

def build_inverted_index(documents: list[dict]) -> dict:
    if not isinstance(documents, list):
        raise TypeError("documents must be a list")
        
    token_stats = defaultdict(lambda: {"doc_ids": set(), "total_count": 0, "term_freq": defaultdict(int)})
    
    for doc in documents:
        if not isinstance(doc, dict) or "id" not in doc or "text" not in doc:
            raise ValueError("Invalid document entry")
        doc_id = doc["id"]
        if not isinstance(doc_id, int) or isinstance(doc_id, bool) or not isinstance(doc["text"], str):
            raise ValueError("Invalid document entry")
            
        # Clean text: keep only alphanumeric and spaces
        cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", doc["text"].lower())
        tokens = [t for t in cleaned.split() if t]
        
        for t in tokens:
            entry = token_stats[t]
            entry["doc_ids"].add(doc_id)
            entry["total_count"] += 1
            entry["term_freq"][doc_id] += 1
            
    # Format and sort index alphabetically
    result = {}
    for token in sorted(token_stats.keys()):
        stats = token_stats[token]
        result[token] = {
            "doc_ids": sorted(list(stats["doc_ids"])),
            "total_count": stats["total_count"],
            "term_freq": dict(stats["term_freq"]),
        }
        
    return result
`,
      testCases: [
        {
          id: 't1',
          name: 'Multi-Document Inverted Index',
          inputDescription: "docs=[{id: 1, text: 'Python is fast.'}, {id: 2, text: 'Python is readable and Python is clean.'}]",
          expectedOutput: "python: doc_ids=[1, 2], total_count=3, term_freq={1: 1, 2: 2}"
        },
        {
          id: 't2',
          name: 'Punctuation and Case Normalization',
          inputDescription: "docs=[{id: 10, text: 'Hello, world! HELLO?'}]",
          expectedOutput: "hello: total_count=2, world: total_count=1"
        },
        {
          id: 't3',
          name: 'Invalid Document Entry Validation',
          inputDescription: "docs=[{id: 'not_an_int', text: 'data'}]",
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 0.15,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Building Inverted Indices with Hash Tables',
        subtitle: 'The foundational data structure behind full-text search engines',
        overview: 'Search engines like Lucene, Elasticsearch, and Google use inverted indices to instantly find documents containing query terms without reading all files.',
        mentalModel5s: 'Tokenize documents -> Group occurrences in a defaultdict(lambda: ...) -> Sort and return.',
        visualAnalogy: 'The index in the back of a textbook: words mapped to specific page numbers.',
        pitfalls: [
          'Using linear list lookups (`doc_id not in doc_ids`) which makes indexing quadratic $O(N^2)$. Use sets for $O(1)$ additions.',
          'Not stripping punctuation before tokenizing.'
        ],
        progressiveHints: [
          'Step 1: Validate input types and required fields.',
          'Step 2: Use regex `re.sub(r"[^a-zA-Z0-9\\s]", " ", text.lower())` to extract clean words.',
          'Step 3: Track doc_ids with a `set` for $O(1)$ uniqueness.',
          'Step 4: Sort token keys using `sorted(token_stats.keys())`.'
        ],
        mathFormulas: [
          {
            title: 'Term Frequency Representation',
            latex: '\\text{tf}(t, d) = f_{t, d}',
            explanation: 'The raw frequency of term t appearing in document d.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual dict lookup and key initialization
if token not in index:
    index[token] = {"doc_ids": [], "count": 0}
index[token]["count"] += 1`,
          naiveExplanation: 'Requires constant key existence checks and branch branching in Python.',
          idiomaticCode: `from collections import defaultdict
stats = defaultdict(lambda: {"doc_ids": set(), "total_count": 0, "term_freq": defaultdict(int)})`,
          idiomaticExplanation: 'defaultdict initializes nested structures in compiled C routines.',
          speedupText: '3x cleaner & faster'
        },
        memoryLayout: {
          title: 'Dictionary Hash Table Buckets',
          content: 'CPython dicts use a sparse index array pointing to a dense entries array.',
          diagramAscii: `indices: [-1, 0, -1, 1, -1] -> entries: [{hash, key="python", val}, {hash, key="fast", val}]`,
          keyRule: 'Dict lookups have O(1) time complexity by calculating hash(key) & (size - 1).'
        },
        keyTakeaways: [
          'Use defaultdict to eliminate defensive key checks.',
          'Store intermediate unique collections in sets before sorting.',
          'Always normalize tokens (case and punctuation) for consistent search.'
        ]
      }
    },
    {
      id: 'python-p2-c2',
      dayId: 2,
      partId: 2,
      title: 'Nested Record Flattener & Deduplicator',
      slug: 'nested-record-flattener-deduplicator',
      difficulty: 'Intermediate',
      category: 'Recursive Structures & Unpacking',
      summary: 'Recursively flatten nested dictionary hierarchies into dot-delimited key paths and deduplicate records based on a unique identifier.',
      estimatedTime: '20 min',
      hints: [
        'Define an inner recursive function `_flatten(current_dict, prefix)` to walk nested dictionaries.',
        'Combine parent prefix and child key as `f"{prefix}.{k}" if prefix else k`.',
        'Verify `unique_key in flat_record`, otherwise raise `KeyError`.',
        'Maintain a `seen = set()` of unique key values to deduplicate while preserving list order.'
      ],
      instructions: `Write a function \`flatten_and_deduplicate(records: list[dict], unique_key: str) -> list[dict]\` that:
1. **Validation**:
   - If \`records\` is not a list, raise \`TypeError("records must be a list")\`.
   - If \`not isinstance(unique_key, str) or not unique_key\`, raise \`ValueError("unique_key must be a non-empty string")\`.
2. **Recursive Flattening**:
   - For every dictionary record, recursively flatten any nested dictionaries.
   - Join nested keys with a dot \`"."\`. For example, \`{"user": {"profile": {"name": "Alice"}}}\` becomes \`{"user.profile.name": "Alice"}\`.
   - Non-dictionary values (lists, primitives, None) remain unflattened leaf values.
3. **Deduplication**:
   - Inspect the flattened \`unique_key\` field on each record.
   - If a record does not contain the \`unique_key\` after flattening, raise \`KeyError(f"Missing unique key '{unique_key}' in record")\`.
   - Retain only the **first** occurrence of each unique key value, discarding duplicates while preserving insertion order.
4. **Return**: A list of the flattened, deduplicated dictionaries.`,
      starterCode: `def flatten_and_deduplicate(records: list[dict], unique_key: str) -> list[dict]:
    """
    Flatten nested dictionary records and deduplicate based on unique_key.
    
    Args:
        records: List of nested dictionary records.
        unique_key: Flattened key used to identify uniqueness.
        
    Returns:
        List of flattened dictionaries with duplicates removed in original order.
    """
    # TODO: Implement recursive flattening and order-preserving deduplication
    pass
`,
      solutionCode: `def _flatten_dict(d: dict, parent_key: str = "", sep: str = ".") -> dict:
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else str(k)
        if isinstance(v, dict) and v:
            items.extend(_flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def flatten_and_deduplicate(records: list[dict], unique_key: str) -> list[dict]:
    if not isinstance(records, list):
        raise TypeError("records must be a list")
    if not isinstance(unique_key, str) or not unique_key:
        raise ValueError("unique_key must be a non-empty string")
        
    seen_keys = set()
    result = []
    
    for rec in records:
        if not isinstance(rec, dict):
            raise ValueError("Each record must be a dict")
            
        flat = _flatten_dict(rec)
        if unique_key not in flat:
            raise KeyError(f"Missing unique key '{unique_key}' in record")
            
        val = flat[unique_key]
        # Allow unhashable types to be compared via repr if needed
        hash_val = repr(val) if isinstance(val, (list, dict, set)) else val
        
        if hash_val not in seen_keys:
            seen_keys.add(hash_val)
            result.append(flat)
            
    return result
`,
      testCases: [
        {
          id: 't1',
          name: 'Nested Customer Records with Duplicates',
          inputDescription: "records=[{id: 1, user: {name: 'Alice'}}, {id: 1, user: {name: 'Alice Dup'}}, {id: 2, user: {name: 'Bob'}}], unique_key='id'",
          expectedOutput: "2 records: [{id: 1, 'user.name': 'Alice'}, {id: 2, 'user.name': 'Bob'}]"
        },
        {
          id: 't2',
          name: 'Deep Nested Key Uniqueness',
          inputDescription: "records=[{meta: {uuid: 'abc'}, val: 10}, {meta: {uuid: 'def'}, val: 20}, {meta: {uuid: 'abc'}, val: 30}], unique_key='meta.uuid'",
          expectedOutput: "2 records: uuid 'abc' (val: 10) and 'def' (val: 20)"
        },
        {
          id: 't3',
          name: 'Missing Key Error',
          inputDescription: "records=[{id: 1}], unique_key='email'",
          expectedOutput: 'Raises KeyError'
        }
      ],
      benchmarkTargetMs: 0.1,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Recursive Tree Flattening & Order-Preserving Sets',
        subtitle: 'Converting nested document structures into flat records',
        overview: 'Document databases (like MongoDB) and APIs return deeply nested JSON. Machine learning feature stores and SQL databases require flat columns.',
        mentalModel5s: 'Recursive helper accumulates prefix + "." + key -> Track seen unique IDs in a set.',
        visualAnalogy: 'Flattening cardboard boxes: collapsing 3D depth into a flat 2D sheet.',
        pitfalls: [
          'Using a list to check `val not in seen` which degrades performance to $O(N^2)$. Always use a `set` for $O(1)$ seen checks.'
        ],
        progressiveHints: [
          'Step 1: Write a recursive `_flatten_dict(d, parent_key)` helper.',
          'Step 2: If a value is a dict, recurse with `new_key = f"{parent_key}.{k}"`.',
          'Step 3: Check `unique_key in flat` and raise KeyError if absent.',
          'Step 4: Use a `set()` to remember previously seen values while appending to `result`.'
        ],
        mathFormulas: [
          {
            title: 'Hierarchical Key Path Flattening',
            latex: 'K_{\\text{flat}} = \\{ k_1 . k_2 . \\dots . k_m \\mid k_i \\in \\text{Keys}(D) \\}',
            explanation: 'Concatenates path segments along dictionary branches into a single string identifier.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Checking uniqueness via list
seen = []
if val not in seen:
    seen.append(val)`,
          naiveExplanation: 'Linear scan on every record makes processing slow for large lists ($O(N^2)$).',
          idiomaticCode: `seen = set()
if val not in seen:
    seen.add(val)`,
          idiomaticExplanation: 'Set membership test is $O(1)$ average time complexity.',
          speedupText: '50x faster on large datasets'
        },
        memoryLayout: {
          title: 'Hash Set Open Addressing',
          content: 'Python sets are hash tables storing only pointers to keys.',
          diagramAscii: `set.add(val) -> hash(val) -> slot index -> stores pointer`,
          keyRule: 'Lookup is O(1) because the hash directly computes the memory offset.'
        },
        keyTakeaways: [
          'Use recursion to explore arbitrary tree depths.',
          'Always use a set for tracking duplicates to maintain $O(N)$ total throughput.',
          'Preserve insertion order by appending first-seen items to a list.'
        ]
      }
    }
  ]
};

export const PYTHON_PART02_TRACK = DAY02_TRACK;
export const testCases = DAY02_TRACK.challenges.flatMap((c) => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY02_TRACK;
