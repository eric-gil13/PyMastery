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
        'Normalize characters by converting the text to lowercase and replacing non-alphanumeric punctuation with whitespace before token splitting.',
        'Consider utilizing a grouping structure or default factory mapping to aggregate statistics per token without manual key presence checks.',
        'Collect document occurrences within unique sets per term to prevent duplicate IDs before producing sorted lists.',
        'Sort the resulting dictionary keys alphabetically when constructing the final inverted index.'
      ],
      instructions: `Write a function \`build_inverted_index(documents: list[dict]) -> dict\` that:
1. **Input Validation**:
   - Verify that \`documents\` is a list; if not, raise \`TypeError("documents must be a list")\`.
   - Ensure every document record is a dictionary containing an integer \`"id"\` and string \`"text"\`. If any entry is invalid, missing required keys, or contains invalid types, raise \`ValueError("Invalid document entry")\`.
2. **Text Normalization & Tokenization**:
   - For each document, normalize the content by converting text to lowercase and filtering out all non-alphanumeric punctuation (retaining only alphanumeric characters and whitespace).
   - Segment the sanitized text on whitespace boundaries into individual token terms, ignoring empty strings.
3. **Index Construction**:
   - Construct a mapping where each unique token maps to its statistical record:
     - \`"doc_ids"\`: a sorted list of unique document IDs where the token appears.
     - \`"total_count"\`: aggregate occurrence count of the token across all documents.
     - \`"term_freq"\`: a dictionary mapping each document ID to the occurrence count of the token in that specific document.
4. **Ordering**:
   - Return the resulting dictionary with its token keys sorted alphabetically.`,
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
        mentalModel5s: 'Tokenize documents -> Group occurrences in hash structures -> Sort and return.',
        visualAnalogy: 'The index in the back of a textbook: words mapped to specific page numbers.',
        pitfalls: [
          'Using linear list lookups for uniqueness checks which makes indexing quadratic $O(N^2)$. Use sets for $O(1)$ additions.',
          'Not stripping punctuation before tokenizing.'
        ],
        progressiveHints: [
          'Step 1: Validate the input container type and verify each document satisfies the required field schema.',
          'Step 2: Normalize character casing and filter out non-alphanumeric punctuation before isolating word tokens.',
          'Step 3: Track document occurrences using unique sets per term and tally document-level frequencies.',
          'Step 4: Convert unique ID sets to sorted lists, and assemble the final dictionary with alphabetically sorted keys.'
        ],
        mathFormulas: [
          {
            title: 'Term Frequency Representation',
            latex: '\\text{tf}(t, d) = f_{t, d}',
            explanation: 'The raw frequency of term t appearing in document d.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual dictionary key initialization
grouped = {}
for term, val in occurrences:
    if term not in grouped:
        grouped[term] = []
    grouped[term].append(val)`,
          naiveExplanation: 'Requires defensive existence checks and manual list allocation on missing keys.',
          idiomaticCode: `# Idiomatic grouping with defaultdict
from collections import defaultdict
grouped = defaultdict(list)
for term, val in occurrences:
    grouped[term].append(val)`,
          idiomaticExplanation: 'defaultdict automatically initializes missing collection entries in compiled C bytecode.',
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
        'Employ a recursive traversal strategy that visits nested dictionaries while accumulating hierarchical key paths.',
        'Form flattened compound keys by joining accumulated parent prefixes with current keys using a dot separator.',
        'Ensure the designated unique identifier exists in each flattened record, raising a key error if absent.',
        'Maintain a set of observed identifier values to eliminate duplicate records while preserving sequence order in the output list.'
      ],
      instructions: `Write a function \`flatten_and_deduplicate(records: list[dict], unique_key: str) -> list[dict]\` that:
1. **Validation**:
   - Ensure \`records\` is a list, raising \`TypeError("records must be a list")\` if invalid.
   - Ensure \`unique_key\` is provided as a non-empty string, raising \`ValueError("unique_key must be a non-empty string")\` if invalid or empty.
   - Ensure each individual record is a dictionary mapping, raising \`ValueError("Each record must be a dict")\` otherwise.
2. **Hierarchical Flattening**:
   - Traverse each dictionary record recursively to collapse nested sub-dictionaries into a single flat structure.
   - Form flattened keys by chaining parent and child path segments delimited by a dot separator (e.g., mapping nested property paths such as \`{"user": {"profile": {"name": "Alice"}}}\` to \`{"user.profile.name": "Alice"}\`).
   - Treat non-dictionary values (such as lists, scalars, or nulls) as terminal leaf entries.
3. **Order-Preserving Deduplication**:
   - Check that each flattened record contains the designated \`unique_key\`. If absent, raise \`KeyError(f"Missing unique key '{unique_key}' in record")\`.
   - Filter out subsequent duplicate records having an identical value for the specified identifier, retaining solely the first occurrence while preserving the original sequence order.
4. **Return**: Return a list containing the resulting flattened, deduplicated dictionaries.`,
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
        mentalModel5s: 'Recursive traversal accumulates path prefixes -> Track observed identifiers in a set.',
        visualAnalogy: 'Flattening cardboard boxes: collapsing 3D depth into a flat 2D sheet.',
        pitfalls: [
          'Using a list for duplicate checks causes $O(N^2)$ quadratic slowdowns. Use a set for $O(1)$ constant-time membership lookups.'
        ],
        progressiveHints: [
          'Step 1: Design a recursive traversal function that tracks accumulated key prefixes as it navigates nested mappings.',
          'Step 2: When encountering a nested dictionary, recurse downward and append child keys to the prefix path using dot notation.',
          'Step 3: Confirm that the required unique key is present in each flattened record before processing, raising KeyError if missing.',
          'Step 4: Maintain a set of encountered identifier values to discard subsequent duplicates while preserving initial insertion order.'
        ],
        mathFormulas: [
          {
            title: 'Hierarchical Key Path Flattening',
            latex: 'K_{\\text{flat}} = \\{ k_1 . k_2 . \\dots . k_m \\mid k_i \\in \\text{Keys}(D) \\}',
            explanation: 'Concatenates path segments along dictionary branches into a single string identifier.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Checking uniqueness via list scan
seen_items = []
if item not in seen_items:
    seen_items.append(item)`,
          naiveExplanation: 'Linear scan on every record makes processing slow for large lists ($O(N^2)$).',
          idiomaticCode: `# Checking uniqueness via hash set
seen_items = set()
if item not in seen_items:
    seen_items.add(item)`,
          idiomaticExplanation: 'Set membership testing achieves $O(1)$ average time complexity via hash indexing.',
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
