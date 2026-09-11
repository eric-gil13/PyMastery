"""
Part 5: Iterators, Generators & Streaming Pipelines
PyMastery Progressive Zero-to-Hero Pure Python Curriculum
"""

import re
from collections import deque
from itertools import islice
from typing import Dict, Any, List, Generator

DAY_METADATA = {
    "day_id": "python_05",
    "day_number": 5,
    "title": "Part 5: Iterators, Generators & Streaming Pipelines",
    "tagline": "The iterator protocol, yield mechanics, infinite streams, and itertools mastery.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "The Iterator protocol: `__iter__()` and `__next__()` mechanics",
        "CPython generator state machines and CPU frame suspension (`YIELD_VALUE`)",
        "Memory-bounded streams and avoiding Out-Of-Memory (OOM) failures",
        "Bounded sliding window aggregation with `collections.deque`",
        "Streaming multi-stage pipeline composition with regex filtering"
    ]
}

CONCEPT_PRIMER = r"""# Part 5: Iterators, Generators & Streaming Pipelines

In computer science, memory is finite. Eager evaluation (building massive lists) fails when processing real-world data feeds like database dumps or web crawler logs.

Python solves this with **lazy evaluation**: compute values only when requested.

---

## 1. The Iterator Protocol

- **Iterable**: Implements `__iter__()` which returns an iterator.
- **Iterator**: Implements `__next__()` which produces the next value, or raises `StopIteration` when complete.

A `for` loop in Python is syntactic sugar for acquiring an iterator and repeatedly calling `next()` until `StopIteration` is caught.

---

## 2. The `yield` Keyword and Frame Suspension

When a function contains the `yield` keyword, calling it does not execute the function body! Instead, it returns a `generator` object.

When `next(gen)` is called:
1. Python executes bytecode until it hits `yield <val>`.
2. Python freezes the function's stack frame (`gi_frame`), preserving all local variables, register state, and the instruction pointer.
3. `<val>` is yielded back to the caller.
4. On the subsequent `next(gen)` call, execution resumes from the exact instruction where it was suspended!
"""

WALKTHROUGH = r"""# Walkthrough: Streaming Line Reader

```python
def stream_non_empty_lines(file_stream):
    for line in file_stream:
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            yield stripped

lines = [
    "# Comment header",
    "host=localhost",
    "",
    "port=5432"
]

for cfg in stream_non_empty_lines(lines):
    print("Config item:", cfg)
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Streaming Sliding Window Batch Generator
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "python-p5-c1",
    "title": "Streaming Sliding Window Batch Generator",
    "difficulty": "Intermediate",
    "category": "Generators & Itertools",
    "description": (
        "Implement a memory-bounded sliding window generator that streams windows of elements from any finite or infinite iterable."
    ),
    "instructions": (
        "Write a generator function `stream_sliding_window(iterable, window_size: int, step: int = 1)` that:\n"
        "1. Validates that `window_size` and `step` are positive integers (> 0, rejecting booleans). Raise ValueError if invalid.\n"
        "2. Lazily consumes from `iterable` on demand without loading the full stream or collection into memory.\n"
        "3. Yields tuples of length `window_size` representing each sliding window.\n"
        "4. Advances the window forward by `step` elements between successive yields.\n"
        "5. Halts cleanly when the stream is exhausted and fewer than `window_size` elements remain to form a complete window."
    ),
    "starter_code": r'''from typing import Generator

def stream_sliding_window(iterable, window_size: int, step: int = 1) -> Generator[tuple, None, None]:
    """
    Yield sliding window tuples of size window_size advancing by step.
    
    Args:
        iterable: Any finite or infinite iterable stream.
        window_size: Length of each sliding window tuple.
        step: Number of elements to advance between windows (default 1).
        
    Yields:
        Tuples of length window_size.
    """
    # TODO: Validate inputs, stream elements with bounded memory, yield window tuples
    pass
''',
    "reference_solution": r'''from collections import deque
from itertools import islice
from typing import Generator

def stream_sliding_window(iterable, window_size: int, step: int = 1) -> Generator[tuple, None, None]:
    if not isinstance(window_size, int) or isinstance(window_size, bool) or window_size <= 0:
        raise ValueError("window_size must be a positive integer")
    if not isinstance(step, int) or isinstance(step, bool) or step <= 0:
        raise ValueError("step must be a positive integer")
        
    iterator = iter(iterable)
    window = deque(islice(iterator, window_size), maxlen=window_size)
    
    if len(window) < window_size:
        return
        
    yield tuple(window)
    
    while True:
        exhausted = False
        for _ in range(step):
            try:
                nxt = next(iterator)
                window.append(nxt)
            except StopIteration:
                exhausted = True
                break
                
        if exhausted:
            break
            
        yield tuple(window)
''',
    "test_suite": r'''def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard sequence
    res1 = list(candidate_func([1, 2, 3, 4, 5], 3, 1))
    assert_test(res1 == [(1, 2, 3), (2, 3, 4), (3, 4, 5)], f"Window mismatch: {res1}")

    # Test 2: Stepped window
    res2 = list(candidate_func(range(6), 2, 2))
    assert_test(res2 == [(0, 1), (2, 3), (4, 5)], f"Stepped window mismatch: {res2}")

    # Test 3: Short input
    res3 = list(candidate_func([1, 2], 5, 1))
    assert_test(res3 == [], "Short input should produce no windows")

    # Test 4: Validation
    try:
        list(candidate_func([1, 2], 0))
        assert_test(False, "Should raise ValueError for window_size <= 0")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Obtain an iterator from the input stream to consume items sequentially on demand.",
        "Maintain a bounded FIFO queue sized to the window capacity to hold active window elements.",
        "Prime the buffer with the first window of elements, and emit it only if the buffer reaches the required size.",
        "In a streaming loop, emit the current window contents as a tuple, then advance the iterator by pulling up to step new items.",
        "Terminate the generator gracefully when the input iterator is exhausted and cannot supply further items."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Memory-Bounded Log Event Filter Pipeline
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "python-p5-c2",
    "title": "Memory-Bounded Log Event Filter Pipeline",
    "difficulty": "Intermediate",
    "category": "Generator Pipelines",
    "description": (
        "Build a multi-stage generator pipeline that lazily parses streaming log lines, "
        "filters by severity thresholds, and selects specific services."
    ),
    "instructions": (
        "Write a generator function `pipeline_log_stream(log_lines, min_level: str = \"WARNING\", service: str = None)` that:\n"
        "1. Validates that `min_level` represents a recognized severity level: DEBUG, INFO, WARNING, ERROR, or CRITICAL (case-insensitive). Raise ValueError for invalid levels.\n"
        "2. Lazily consumes line strings from `log_lines` without buffering the entire input.\n"
        "3. Parses lines formatted with bracketed timestamp, level, and service tokens followed by a message: `[TIMESTAMP] [LEVEL] [SERVICE] MESSAGE`. Silently skips malformed lines.\n"
        "4. Filters events so only records meeting or exceeding the `min_level` severity threshold are retained.\n"
        "5. If `service` is specified, filters for events matching that service name (case-insensitive).\n"
        "6. Yields structured dictionaries containing trimmed 'timestamp', uppercase 'level', lowercase 'service', and trimmed 'message'."
    ),
    "starter_code": r'''from typing import Generator

def pipeline_log_stream(log_lines, min_level: str = "WARNING", service: str = None) -> Generator[dict, None, None]:
    """
    Lazily parse, filter, and yield structured log event records.
    
    Args:
        log_lines: Iterable stream of raw log line strings.
        min_level: Minimum severity level to include (default 'WARNING').
        service: Optional service name filter.
        
    Yields:
        Parsed log record dictionaries.
    """
    # TODO: Validate level, lazily parse with regex, filter by severity and service, yield dicts
    pass
''',
    "reference_solution": r'''import re
from typing import Generator

LEVEL_HIERARCHY = {
    "DEBUG": 10,
    "INFO": 20,
    "WARNING": 30,
    "ERROR": 40,
    "CRITICAL": 50,
}

LOG_PATTERN = re.compile(
    r"^\[(?P<timestamp>[^\]]+)\]\s+\[(?P<level>[^\]]+)\]\s+\[(?P<service>[^\]]+)\]\s+(?P<message>.*)$"
)

def pipeline_log_stream(log_lines, min_level: str = "WARNING", service: str = None) -> Generator[dict, None, None]:
    clean_min_level = str(min_level).strip().upper()
    if clean_min_level not in LEVEL_HIERARCHY:
        raise ValueError(f"Invalid min_level: {min_level}")
        
    min_rank = LEVEL_HIERARCHY[clean_min_level]
    target_service = service.strip().lower() if service is not None else None
    
    for line in log_lines:
        if not isinstance(line, str):
            continue
            
        m = LOG_PATTERN.match(line.strip())
        if not m:
            continue
            
        evt_level = m.group("level").strip().upper()
        if evt_level not in LEVEL_HIERARCHY:
            continue
            
        evt_rank = LEVEL_HIERARCHY[evt_level]
        if evt_rank < min_rank:
            continue
            
        evt_service = m.group("service").strip().lower()
        if target_service is not None and evt_service != target_service:
            continue
            
        yield {
            "timestamp": m.group("timestamp").strip(),
            "level": evt_level,
            "service": evt_service,
            "message": m.group("message").strip(),
        }
''',
    "test_suite": r'''def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    lines = [
        "[2026-01-01 10:00:00] [INFO] [web] Server started",
        "[2026-01-01 10:00:05] [WARNING] [db] High latency on query",
        "[2026-01-01 10:00:10] [ERROR] [auth] Invalid signature token",
        "MALFORMED_LINE_WITHOUT_BRACKETS",
        "[2026-01-01 10:00:15] [CRITICAL] [db] Replica disconnected"
    ]

    # Test 1: Severity filtering (>= WARNING)
    res1 = list(candidate_func(lines, min_level="WARNING"))
    assert_test(len(res1) == 3, f"Expected 3 warning+ events, got {len(res1)}")
    assert_test(res1[0]["level"] == "WARNING", "Level mismatch on event 0")
    assert_test(res1[1]["level"] == "ERROR", "Level mismatch on event 1")

    # Test 2: Service filtering (db only)
    res2 = list(candidate_func(lines, min_level="DEBUG", service="db"))
    assert_test(len(res2) == 2, f"Expected 2 db events, got {len(res2)}")
    assert_test(all(r["service"] == "db" for r in res2), "Service filter mismatch")

    # Test 3: Invalid level error
    try:
        list(candidate_func(lines, min_level="UNKNOWN_LEVEL"))
        assert_test(False, "Should raise ValueError for invalid min_level")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Map standard log severity names to an ascending integer scale to easily compare priority thresholds.",
        "Compile a regular expression pattern once upfront that captures bracketed fields and the trailing message text.",
        "Use named capture groups in the regex to extract timestamp, level, service, and message cleanly.",
        "Iterate over the incoming lines lazily, ignoring non-string inputs and lines that fail pattern matching.",
        "Normalize severity levels to uppercase and service names to lowercase for consistent filtering comparisons."
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
