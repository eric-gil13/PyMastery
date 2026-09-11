"""
Part 6: Decorators, Context Managers & Exception Architecture
PyMastery Progressive Zero-to-Hero Pure Python Curriculum
"""

import copy
import time
from functools import wraps
from typing import Dict, Any, List, Tuple, Type

DAY_METADATA = {
    "day_id": "python_06",
    "day_number": 6,
    "title": "Part 6: Decorators, Context Managers & Exception Architecture",
    "tagline": "Metaprogramming with decorators, resource lifecycles with with, and custom exception hierarchies.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Syntactic sugar and AST transformation of decorators (`@`)",
        "Preserving function metadata with `@functools.wraps`",
        "Parameterized decorator factories with exponential backoff",
        "The Context Manager protocol (`__enter__` and `__exit__`)",
        "Transactional rollback mechanisms and exception propagation"
    ]
}

CONCEPT_PRIMER = r"""# Part 6: Decorators, Context Managers & Exception Architecture

In professional software development, separating business logic from cross-cutting concerns (logging, retries, timing, transactions) is paramount.

Python provides two world-class metaprogramming constructs for this: **decorators** and **context managers**.

---

## 1. How Decorators Work

When you write:
```python
@my_decorator
def greet(): ...
```
Python transforms this at compile-time into:
```python
greet = my_decorator(greet)
```
Always apply `@functools.wraps(fn)` inside your wrapper function! Without it, `greet.__name__` becomes `'wrapper'`, breaking logging, serialization, and test frameworks.

---

## 2. The Context Manager Protocol (`with`)

The `with` statement encapsulates the setup and teardown lifecycle of resources (RAII pattern):

```python
with MyResource() as res:
    res.do_something()
```

1. **`__enter__()`**: Sets up the state and returns the object bound to `as res`.
2. **`__exit__(exc_type, exc_val, exc_tb)`**: Runs guaranteed cleanup.
   - If `exc_type is None`: no exception occurred.
   - If an exception occurred, returning `True` **swallows** the exception. Returning `False` (or `None`) allows the exception to bubble up.
"""

WALKTHROUGH = r"""# Walkthrough: Timing Decorator

```python
import time
from functools import wraps

def benchmark(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        result = fn(*args, **kwargs)
        duration = time.perf_counter() - t0
        print(f"{fn.__name__} executed in {duration:.4f}s")
        return result
    return wrapper
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Retry with Exponential Backoff & Call Limiter Decorator
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "python-p6-c1",
    "title": "Retry with Exponential Backoff & Call Limiter Decorator",
    "difficulty": "Intermediate",
    "category": "Decorators & Resilience",
    "description": (
        "Build a production-grade parameterized retry decorator that catches transient errors and retries with exponential backoff."
    ),
    "instructions": (
        "Write a decorator factory `retry_with_backoff(max_retries: int = 3, initial_delay: float = 0.01, backoff_factor: float = 2.0, exceptions=(Exception,))` that equips callables with resilient retry semantics:\n"
        "1. Validation & Configuration:\n"
        "   - Ensure `max_retries` and `initial_delay` are non-negative, and `backoff_factor` is at least 1.0. Raise ValueError('Invalid retry configuration') if any parameter violates these constraints.\n"
        "   - Accept either a single exception type or a tuple of exception types to intercept.\n"
        "2. Retry Execution & Geometric Backoff:\n"
        "   - Decorate callable targets while preserving original function metadata and signature introspection.\n"
        "   - Execute the target with all supplied positional and keyword arguments.\n"
        "   - If an intercepted exception is raised, pause execution for the active delay duration before retrying.\n"
        "   - Scale the delay interval geometrically after each failed attempt by multiplying it by the backoff factor.\n"
        "   - Continue retrying until the target succeeds or the maximum retry quota is exhausted, at which point the final caught exception must propagate.\n"
        "   - Any exception type not specified in `exceptions` must bubble up immediately without triggering retries.\n"
        "3. Execution Statistics:\n"
        "   - Expose a `.total_attempts` attribute on the decorated wrapper that tracks the cumulative count of target invocations across all calls."
    ),
    "starter_code": r'''from functools import wraps
import time
from typing import Tuple, Type

def retry_with_backoff(
    max_retries: int = 3,
    initial_delay: float = 0.01,
    backoff_factor: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,)
):
    """
    Decorator factory that retries a function with exponential backoff on exceptions.
    
    Args:
        max_retries: Maximum number of retry attempts after initial failure.
        initial_delay: Initial sleep seconds.
        backoff_factor: Multiplier applied to delay after each failure.
        exceptions: Tuple of exception types to intercept.
    """
    # TODO: Validate arguments, implement retry loop with sleep and backoff, track total_attempts
    pass
''',
    "reference_solution": r'''from functools import wraps
import time
from typing import Tuple, Type

def retry_with_backoff(
    max_retries: int = 3,
    initial_delay: float = 0.01,
    backoff_factor: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,)
):
    if max_retries < 0 or initial_delay < 0 or backoff_factor < 1.0:
        raise ValueError("Invalid retry configuration")
        
    def decorator(fn):
        total_attempts = 0
        
        @wraps(fn)
        def wrapper(*args, **kwargs):
            nonlocal total_attempts
            delay = initial_delay
            retries_left = max_retries
            
            while True:
                total_attempts += 1
                try:
                    return fn(*args, **kwargs)
                except exceptions as e:
                    if retries_left <= 0:
                        raise e
                    retries_left -= 1
                    if delay > 0:
                        time.sleep(delay)
                    delay *= backoff_factor
                    
        def get_total_attempts():
            return total_attempts
            
        class WrapperCallable:
            def __init__(self, wrapped_func):
                self._fn = wrapped_func
                
            def __call__(self, *args, **kwargs):
                return self._fn(*args, **kwargs)
                
            @property
            def total_attempts(self):
                return get_total_attempts()
                
            @property
            def __name__(self):
                return getattr(self._fn, "__name__", "wrapper")
                
            @property
            def __doc__(self):
                return getattr(self._fn, "__doc__", "")
                
        return WrapperCallable(wrapper)
        
    return decorator
''',
    "test_suite": r'''def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Flaky function succeeds on retry 2
    call_count = 0
    @candidate_func(max_retries=3, initial_delay=0.001, backoff_factor=1.5, exceptions=(ConnectionError,))
    def flaky_network():
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise ConnectionError("Network blip")
        return "SUCCESS"

    res = flaky_network()
    assert_test(res == "SUCCESS", f"Expected 'SUCCESS', got {res}")
    assert_test(flaky_network.total_attempts == 3, f"Expected 3 attempts, got {flaky_network.total_attempts}")

    # Test 2: Unmatched exception propagates immediately
    @candidate_func(max_retries=3, initial_delay=0.001, exceptions=(ConnectionError,))
    def fail_with_type_error():
        raise TypeError("Fatal type error")

    try:
        fail_with_type_error()
        assert_test(False, "Should not retry unmatched exception")
    except TypeError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Validate configuration boundaries upfront, ensuring retry counts and initial delays are non-negative and the backoff multiplier is at least 1.0.",
        "Normalize intercepted exceptions so single exception classes and tuples of exceptions are handled uniformly.",
        "Maintain an invocation counter across calls, exposing it through an attribute or property on the outer wrapper object.",
        "Structure the retry loop to intercept designated exceptions, pause using the current backoff interval, scale the wait duration geometrically by the backoff factor, and re-raise once retries are exhausted."
    ],
    "progressive_hints": [
        "Step 1: Guard against invalid inputs by asserting non-negative retry limits/delays and a backoff multiplier of 1.0 or greater.",
        "Step 2: Maintain cumulative attempt telemetry within the decorator closure or wrapper object.",
        "Step 3: Wrap invocation in an execution loop guarded by exception handling for the target error classes.",
        "Step 4: On failure, pause execution for the active delay, geometrically scale the wait duration, decrement available retries, or re-raise if exhausted."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Atomic State Transaction Rollback Context Manager
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "python-p6-c2",
    "title": "Atomic State Transaction Rollback Context Manager",
    "difficulty": "Intermediate",
    "category": "Context Managers",
    "description": (
        "Implement a transactional context manager that creates a snapshot of a dictionary and rolls back all mutations if an error occurs."
    ),
    "instructions": (
        "Create a context manager class `AtomicTransaction` that provides all-or-nothing transactional guarantees for dictionary mutations:\n"
        "1. Initialization:\n"
        "   - `__init__(self, target_dict: dict)`: Validate that `target_dict` is a dictionary instance; raise TypeError('target_dict must be a dictionary') if an invalid type is supplied.\n"
        "   - Retain a reference to the underlying dictionary target.\n"
        "2. Context Entry (`__enter__`):\n"
        "   - Capture an isolated deep snapshot of the dictionary state so nested structures are safeguarded against in-flight mutation.\n"
        "   - Return the original target dictionary reference to allow binding via `with AtomicTransaction(d) as state:`.\n"
        "3. Context Exit (`__exit__`):\n"
        "   - Commit on Success: When the block completes without error, finalize the transaction by retaining all mutations.\n"
        "   - Rollback on Failure: When an exception occurs within the block, restore the dictionary to its pre-transaction state in-place, ensuring the original container object retains its identity while reverting all changes.\n"
        "   - Exception Propagation: Allow the triggering exception to bubble up naturally rather than suppressing it."
    ),
    "starter_code": r'''import copy

class AtomicTransaction:
    """
    Context manager that snapshots a dictionary and rolls back on exception.
    """
    def __init__(self, target_dict: dict):
        # TODO: Validate target_dict
        pass

    def __enter__(self) -> dict:
        # TODO: Snapshot dictionary, return target_dict
        pass

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        # TODO: Commit if success, roll back if exception, allow exception to propagate
        pass
''',
    "reference_solution": r'''import copy

class AtomicTransaction:
    def __init__(self, target_dict: dict):
        if not isinstance(target_dict, dict):
            raise TypeError("target_dict must be a dictionary")
        self.target = target_dict
        self._snapshot = None

    def __enter__(self) -> dict:
        self._snapshot = copy.deepcopy(self.target)
        return self.target

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        if exc_type is not None:
            self.target.clear()
            self.target.update(self._snapshot)
        self._snapshot = None
        return False
''',
    "test_suite": r'''def run_tests(candidate_target):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    AtomicTransaction = candidate_target["AtomicTransaction"] if isinstance(candidate_target, dict) else candidate_target

    # Test 1: Successful commit
    d1 = {"a": 1, "nested": [10]}
    with AtomicTransaction(d1):
        d1["a"] = 99
        d1["nested"].append(20)
    assert_test(d1["a"] == 99 and d1["nested"] == [10, 20], "Committed values mismatch")

    # Test 2: Exception triggers rollback
    d2 = {"x": 100, "meta": {"role": "admin"}}
    try:
        with AtomicTransaction(d2):
            d2["x"] = 0
            d2["meta"]["role"] = "guest"
            raise RuntimeError("Database write error")
    except RuntimeError:
        report["tests_run"] += 1

    assert_test(d2["x"] == 100, "Rollback failed for top-level key")
    assert_test(d2["meta"]["role"] == "admin", "Rollback failed for nested dict")

    # Test 3: Type error on non-dict
    try:
        AtomicTransaction([1, 2])
        assert_test(False, "Should raise TypeError for non-dict")
    except TypeError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Verify the target argument type during initialization and raise TypeError for non-dictionary instances.",
        "During context entry, create an isolated deep copy of the target mapping so modifications to nested collections do not taint the snapshot.",
        "During context exit on error, revert the target mapping in-place to preserve object identity while restoring previous key-value mappings.",
        "Ensure the exit hook signals that exceptions should bubble up rather than being suppressed."
    ],
    "progressive_hints": [
        "Step 1: Validate that the incoming target object is a dictionary mapping, raising a TypeError if an incompatible type is provided.",
        "Step 2: During context entry, capture a deep copy snapshot of the target dictionary to isolate nested structures from mutation, and return the dictionary instance.",
        "Step 3: In the exit hook, detect whether an exception occurred; if so, clear the modified state and restore snapshot entries in-place without replacing the dictionary object reference.",
        "Step 4: Explicitly signal to Python context manager protocol that exceptions must propagate by returning a falsy value from the exit handler."
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
