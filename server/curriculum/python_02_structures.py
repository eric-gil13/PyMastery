"""
Part 2: Built-in Data Structures & Collections
PyMastery Progressive Zero-to-Hero Pure Python Curriculum
"""

import re
from collections import defaultdict
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "python_02",
    "day_number": 2,
    "title": "Part 2: Built-in Data Structures & Collections",
    "tagline": "Lists, tuples, sets, dicts, comprehensions, unpacking, and collections mastery.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Internal CPython structures: PyListObject over-allocation and compact hash tables",
        "List, dict, and set comprehensions with conditional filtering",
        "Extended sequence unpacking with `*` rest syntax",
        "High-performance groupings with `collections.defaultdict` and `collections.Counter`",
        "Recursive dictionary traversals and set-based deduplication"
    ]
}

CONCEPT_PRIMER = r"""# Part 2: Built-in Data Structures & Collections

Selecting the appropriate data structure is the single most critical decision in algorithm design. Python provides four fundamental containers with radically different performance profiles.

---

## 1. Complexity Comparison

| Operation | `list` | `tuple` | `set` | `dict` |
| :--- | :---: | :---: | :---: | :---: |
| **Indexing `a[i]`** | $O(1)$ | $O(1)$ | N/A | N/A |
| **Lookup `k in a`** | $O(N)$ (Linear scan) | $O(N)$ | $O(1)$ (Hash) | $O(1)$ (Hash) |
| **Append / Insert** | Amortized $O(1)$ | N/A (Immutable) | $O(1)$ | $O(1)$ |
| **Delete** | $O(N)$ | N/A | $O(1)$ | $O(1)$ |
| **Memory** | Over-allocated array | Compact contiguous | Sparse hash table | Compact hash table |

---

## 2. Dynamic List Over-Allocation

When you call `lst.append()`, CPython does not allocate memory for just 1 additional element (which would require reallocating RAM on every single append!).

Instead, CPython utilizes an over-allocation growth formula:
$$\text{new\_allocated} \approx \text{size} + (\text{size} \gg 3) + (\text{size} < 9 \ ? \ 3 : 6)$$

This mathematical progression ensures that resizing occurs logarithmically, giving `.append()` amortized $O(1)$ performance.

---

## 3. Comprehensions vs For Loops

Comprehensions are not merely syntactic sugar; they emit dedicated CPython bytecode instructions like `LIST_APPEND` or `MAP_ADD` that run directly in C loops without invoking Python frame evaluation for each item.
"""

WALKTHROUGH = r"""# Walkthrough: Grouping with defaultdict

Using standard dictionaries requires defensive checks:
```python
# Naive approach
grouped = {}
for word in ["apple", "banana", "apricot", "berry"]:
    initial = word[0]
    if initial not in grouped:
        grouped[initial] = []
    grouped[initial].append(word)
```

With `collections.defaultdict`:
```python
from collections import defaultdict

grouped = defaultdict(list)
for word in ["apple", "banana", "apricot", "berry"]:
    grouped[word[0]].append(word)
```
The missing key is initialized automatically in C without any `KeyError` check.
"""

# -----------------------------------------------------------------------------
# Challenge 1: Inverted Index & Token Frequency Analyzer
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "python-p2-c1",
    "title": "Inverted Index & Token Frequency Analyzer",
    "difficulty": "Intermediate",
    "category": "Dictionaries & Sets",
    "description": (
        "Process raw documents, tokenize text, and construct a full inverted search index with term frequencies."
    ),
    "instructions": (
        "Write a function `build_inverted_index(documents: list[dict]) -> dict` that:\n"
        "1. Validates `documents` is a list. If not, raise `TypeError(\"documents must be a list\")`.\n"
        "2. Validates each doc is a dict with integer 'id' and string 'text'. If invalid, raise `ValueError(\"Invalid document entry\")`.\n"
        "3. Cleans text: converts to lowercase, strips non-alphanumeric chars (replacing with space), splits into non-empty tokens.\n"
        "4. For each unique token, produces a dict with:\n"
        "   - 'doc_ids': sorted list of unique document IDs where the token occurs.\n"
        "   - 'total_count': total count of this token across all documents.\n"
        "   - 'term_freq': dict mapping doc_id -> count in that document.\n"
        "5. Returns the dictionary sorted alphabetically by token key."
    ),
    "starter_code": r'''def build_inverted_index(documents: list[dict]) -> dict:
    """
    Construct an inverted index mapping tokens to document occurrences and frequencies.
    
    Args:
        documents: List of dicts with 'id' (int) and 'text' (str).
        
    Returns:
        Alphabetically sorted dict of token -> {doc_ids, total_count, term_freq}.
    """
    # TODO: Validate documents, tokenize text, accumulate occurrences, return sorted index
    pass
''',
    "reference_solution": r'''import re
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
            
        cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", doc["text"].lower())
        tokens = [t for t in cleaned.split() if t]
        
        for t in tokens:
            entry = token_stats[t]
            entry["doc_ids"].add(doc_id)
            entry["total_count"] += 1
            entry["term_freq"][doc_id] += 1
            
    result = {}
    for token in sorted(token_stats.keys()):
        stats = token_stats[token]
        result[token] = {
            "doc_ids": sorted(list(stats["doc_ids"])),
            "total_count": stats["total_count"],
            "term_freq": dict(stats["term_freq"]),
        }
        
    return result
''',
    "test_suite": r'''def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Multi-document indexing
    docs = [
        {"id": 1, "text": "Python is fast."},
        {"id": 2, "text": "Python is readable and Python is clean."}
    ]
    res = candidate_func(docs)
    assert_test(isinstance(res, dict), "Result must be a dict")
    assert_test("python" in res, "Missing 'python' token in index")
    p_stat = res["python"]
    assert_test(p_stat["doc_ids"] == [1, 2], f"doc_ids mismatch: {p_stat['doc_ids']}")
    assert_test(p_stat["total_count"] == 3, f"total_count mismatch: {p_stat['total_count']}")
    assert_test(p_stat["term_freq"] == {1: 1, 2: 2}, f"term_freq mismatch: {p_stat['term_freq']}")

    # Test 2: Punctuation normalization
    res2 = candidate_func([{"id": 10, "text": "Hello, world! HELLO?"}])
    assert_test(res2["hello"]["total_count"] == 2, "Failed to normalize case & punctuation")

    # Test 3: Type errors
    try:
        candidate_func("not a list")
        assert_test(False, "Should raise TypeError for non-list input")
    except TypeError:
        report["tests_run"] += 1

    # Test 4: Document validation
    try:
        candidate_func([{"id": "invalid_id", "text": "foo"}])
        assert_test(False, "Should raise ValueError for non-int id")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Use `re.sub(r'[^a-zA-Z0-9\\s]', ' ', text.lower()).split()` to tokenize.",
        "Store document IDs in a `set` to guarantee uniqueness before converting to a sorted list.",
        "Use `collections.defaultdict` for both the outer stats and the inner `term_freq`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Nested Record Flattener & Deduplicator
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "python-p2-c2",
    "title": "Nested Record Flattener & Deduplicator",
    "difficulty": "Intermediate",
    "category": "Recursive Structures & Unpacking",
    "description": (
        "Recursively flatten nested dictionary hierarchies into dot-delimited key paths and deduplicate records based on a unique identifier."
    ),
    "instructions": (
        "Write a function `flatten_and_deduplicate(records: list[dict], unique_key: str) -> list[dict]` that:\n"
        "1. If `records` is not a list, raise `TypeError(\"records must be a list\")`.\n"
        "2. If `unique_key` is not a non-empty string, raise `ValueError(\"unique_key must be a non-empty string\")`.\n"
        "3. Recursively flattens any nested dictionaries, joining keys with '.' (e.g. {'a': {'b': 1}} -> {'a.b': 1}).\n"
        "4. If `unique_key` is not present in a flattened record, raise `KeyError(f\"Missing unique key '{unique_key}' in record\")`.\n"
        "5. Deduplicates records based on `record[unique_key]`, keeping the first seen occurrence and preserving original order.\n"
        "6. Returns the list of flattened, deduplicated dictionaries."
    ),
    "starter_code": r'''def flatten_and_deduplicate(records: list[dict], unique_key: str) -> list[dict]:
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
''',
    "reference_solution": r'''def _flatten_dict(d: dict, parent_key: str = "", sep: str = ".") -> dict:
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
        hash_val = repr(val) if isinstance(val, (list, dict, set)) else val
        
        if hash_val not in seen_keys:
            seen_keys.add(hash_val)
            result.append(flat)
            
    return result
''',
    "test_suite": r'''def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Deduplication and flattening
    records = [
        {"id": 1, "user": {"name": "Alice"}},
        {"id": 1, "user": {"name": "Alice Duplicate"}},
        {"id": 2, "user": {"name": "Bob"}}
    ]
    res = candidate_func(records, "id")
    assert_test(len(res) == 2, f"Expected 2 records, got {len(res)}")
    assert_test(res[0]["user.name"] == "Alice", f"Key flattening mismatch: {res[0]}")
    assert_test(res[1]["id"] == 2, "Deduplication order mismatch")

    # Test 2: Deep nested unique_key
    records2 = [
        {"meta": {"uuid": "abc"}, "val": 10},
        {"meta": {"uuid": "def"}, "val": 20},
        {"meta": {"uuid": "abc"}, "val": 30}
    ]
    res2 = candidate_func(records2, "meta.uuid")
    assert_test(len(res2) == 2, f"Expected 2 records for nested key, got {len(res2)}")
    assert_test(res2[0]["val"] == 10 and res2[1]["val"] == 20, "Incorrect deduplicated retained elements")

    # Test 3: Missing unique key error
    try:
        candidate_func([{"id": 1}], "non_existent_key")
        assert_test(False, "Should raise KeyError for missing unique_key")
    except KeyError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Write a recursive helper `_flatten(d, prefix='')` that loops over `d.items()`.",
        "If a value is a dict, recurse with `f'{prefix}.{k}'`.",
        "Track seen identifiers in a `set()` to maintain $O(1)$ deduplication checks."
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
