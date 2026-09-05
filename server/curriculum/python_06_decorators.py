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
        "Write a decorator factory `retry_with_backoff(max_retries=3, initial_delay=0.01, backoff_factor=2.0, exceptions=(Exception,))` that:\n"
        "1. Validates `max_retries >= 0`, `initial_delay >= 0`, and `backoff_factor >= 1.0` (else ValueError).\n"
        "2. Intercepts calls to `fn(*args, **kwargs)`.\n"
        "3. If an exception matching `exceptions` is raised, sleeps for `current_delay`, multiplies delay by `backoff_factor`, and retries up to `max_retries`.\n"
        "4. If retries are exhausted, re-raises the final caught exception.\n"
        "5. Preserves function metadata via `@wraps(fn)`.\n"
        "6. Exposes a `.total_attempts` attribute tracking total invocations across calls."
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
        "Check `max_retries >= 0`, `initial_delay >= 0`, and `backoff_factor >= 1.0`.",
        "Catch `exceptions as e` in a `while True:` loop.",
        "Wrap the function with a callable object or expose a property for `total_attempts`."
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
        "Create a context manager class `AtomicTransaction`:\n"
        "1. In `__init__(target_dict)`, validate `isinstance(target_dict, dict)` (else TypeError).\n"
        "2. In `__enter__()`, create a deep backup of `target_dict` using `copy.deepcopy`, and return `target_dict`.\n"
        "3. In `__exit__(exc_type, exc_val, exc_tb)`:\n"
        "   - If `exc_type is not None`, clear `target_dict` and restore the snapshot.\n"
        "   - Return `False` so the exception bubbles up.\n"
        "   - If no exception occurred, keep the changes."
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
        "Use `self._snapshot = copy.deepcopy(self.target)` in `__enter__`.",
        "In `__exit__`, restore using `self.target.clear(); self.target.update(self._snapshot)`.",
        "Always return `False` from `__exit__` to allow exceptions to propagate."
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
