"""
Part 3: Functions, Scopes, Closures & First-Class Citizens
PyMastery Progressive Zero-to-Hero Pure Python Curriculum
"""

from functools import wraps
from typing import Dict, Any, List

DAY_METADATA = {
    "day_id": "python_03",
    "day_number": 3,
    "title": "Part 3: Functions, Scopes, Closures & First-Class Citizens",
    "tagline": "Argument unpacking, mutable defaults, LEGB scope resolution, and closure factories.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "First-class function semantics and higher-order functional patterns",
        "The LEGB lexical scope hierarchy and the `nonlocal` keyword",
        "CPython execution frames, code objects, and closure cell references",
        "Positional-only `/`, keyword-only `*`, `*args`, and `**kwargs` signatures",
        "State encapsulation via closure factories and function memoization"
    ]
}

CONCEPT_PRIMER = r"""# Part 3: Functions, Scopes, Closures & First-Class Citizens

In Python, functions are not merely code blocks; they are **first-class runtime objects**. You can pass them as arguments, return them from other functions, store them in data structures, and introspect their internal bytecode.

---

## 1. The LEGB Scope Resolution Hierarchy

When an identifier is looked up, Python scans four nested scopes:

1. **Local (L):** Assigned directly inside the active function frame (`x = 10`).
2. **Enclosing (E):** Found in the local namespace of any enclosing `def` blocks (closures).
3. **Global (G):** Assigned at module top-level (`__main__`).
4. **Built-in (B):** Preloaded language identifiers (`len`, `range`, `ValueError`).

```python
x = "global"

def outer():
    x = "enclosing"
    def inner():
        # Searches Local -> Enclosing (found!)
        print(x)  # prints 'enclosing'
    inner()
```

---

## 2. Closures & Cell Objects

When an inner function references a variable from an enclosing scope, CPython stores that variable inside a heap-allocated **`cell`** object.

Even after the outer function finishes executing and its frame is discarded, the inner function maintains an active pointer to the `cell` via its `__closure__` tuple.

```python
def make_multiplier(n):
    return lambda x: x * n

double = make_multiplier(2)
# The integer 2 is kept alive inside double.__closure__[0].cell_contents!
print(double(5))  # 10
```

---

## 3. The Dangerous Mutable Default Argument

Default arguments are evaluated **once** at compile/definition time:
```python
def bad_append(val, lst=[]):  # TRAP: lst is created ONCE!
    lst.append(val)
    return lst
```
Instead, always use sentinel defaults:
```python
def safe_append(val, lst=None):
    if lst is None:
        lst = []
    lst.append(val)
    return lst
```
"""

WALKTHROUGH = r"""# Walkthrough: Building a Simple Timer Closure

```python
import time

def make_timer():
    t_start = time.perf_counter()
    
    def elapsed():
        return time.perf_counter() - t_start
        
    return elapsed

timer = make_timer()
time.sleep(0.05)
print(f"Elapsed: {timer():.4f} seconds")
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Configurable Pipeline Function Composer
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "python-p3-c1",
    "title": "Configurable Pipeline Function Composer",
    "difficulty": "Intermediate",
    "category": "Higher-Order Functions",
    "description": (
        "Compose an arbitrary sequence of callable transformation stages into a single callable execution pipeline "
        "with optional debugging traces."
    ),
    "instructions": (
        "Write a function `compose_pipeline(*funcs: callable, debug: bool = False) -> callable` that:\n"
        "1. Validates that at least one function argument is provided; if empty, raises a `ValueError`.\n"
        "2. Ensures every supplied argument is callable; if any is not, raises a `TypeError`.\n"
        "3. Returns a pipeline callable that accepts an initial input value and executes the functions sequentially from left to right, threading the output of each stage into the next.\n"
        "4. If any stage raises an exception, catches it and raises a `RuntimeError` explicitly chained from the original exception, conveying the stage index, function name (with a fallback name if unnamed), and error message.\n"
        "5. If `debug=False` (default), returns the final transformed value directly.\n"
        "6. If `debug=True`, returns a dictionary with 'result' (the final transformed output) and 'trace' (a list of dictionaries documenting each step with 'step' index, 'func' name, and 'output' value)."
    ),
    "starter_code": r'''def compose_pipeline(*funcs: callable, debug: bool = False) -> callable:
    """
    Compose multiple callable functions into a single left-to-right execution pipeline.
    
    Args:
        *funcs: Variable number of callable transformation functions.
        debug: If True, returned pipeline outputs an execution trace.
        
    Returns:
        Composed callable function.
    """
    # TODO: Validate functions, return composed callable with optional trace
    pass
''',
    "reference_solution": r'''def compose_pipeline(*funcs: callable, debug: bool = False) -> callable:
    if not funcs:
        raise ValueError("At least one function must be provided")
        
    for f in funcs:
        if not callable(f):
            raise TypeError("All pipeline stages must be callable")
            
    def pipeline(initial_val):
        current = initial_val
        trace = []
        
        for idx, f in enumerate(funcs):
            fn_name = getattr(f, "__name__", f"stage_{idx}")
            try:
                current = f(current)
            except Exception as e:
                raise RuntimeError(f"Pipeline failed at stage {idx} ({fn_name}): {e}") from e
                
            if debug:
                trace.append({
                    "step": idx,
                    "func": fn_name,
                    "output": current,
                })
                
        if debug:
            return {"result": current, "trace": trace}
        return current
        
    return pipeline
''',
    "test_suite": r'''def run_tests(candidate_func):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    # Test 1: Standard composition
    pipe = candidate_func(str.strip, str.lower, len)
    res = pipe("  Hello World  ")
    assert_test(res == 11, f"Expected 11, got {res}")

    # Test 2: Debug mode trace
    pipe_debug = candidate_func(lambda x: x + 1, lambda x: x * 2, debug=True)
    res_debug = pipe_debug(5)
    assert_test(isinstance(res_debug, dict), "Debug output must be a dict")
    assert_test(res_debug["result"] == 12, f"Debug result mismatch: {res_debug['result']}")
    assert_test(len(res_debug["trace"]) == 2, f"Trace length mismatch: {len(res_debug['trace'])}")

    # Test 3: Exception handling in stage
    pipe_err = candidate_func(lambda x: x / 0)
    try:
        pipe_err(10)
        assert_test(False, "Should raise RuntimeError on stage division by zero")
    except RuntimeError:
        report["tests_run"] += 1

    # Test 4: Empty funcs validation
    try:
        candidate_func()
        assert_test(False, "Should raise ValueError for no funcs")
    except ValueError:
        report["tests_run"] += 1

    return report
''',
    "hints": [
        "Verify that the variable positional arguments sequence is non-empty, and check that each supplied function satisfies Python's callable interface.",
        "Construct an inner closure that receives the initial argument and iterates sequentially through each function, updating an accumulator with each stage's result while safely resolving callable names with fallbacks for anonymous lambdas.",
        "Wrap each stage invocation in an exception handler and use explicit exception chaining to preserve the original exception while raising an informative RuntimeError."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: State-Preserving Bounded Memoizer Closure
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "python-p3-c2",
    "title": "State-Preserving Bounded Memoizer Closure",
    "difficulty": "Intermediate",
    "category": "Closures & Cache Design",
    "description": (
        "Build a closure-based function decorator that caches expensive computation results with FIFO eviction "
        "and statistics tracking."
    ),
    "instructions": (
        "Write a function `make_bounded_memoizer(maxsize: int = 128) -> callable` that:\n"
        "1. Validates that `maxsize` is a positive integer (rejecting non-integers, booleans, and non-positive numbers), raising a `ValueError` if invalid.\n"
        "2. Acts as a decorator factory returning a decorator that wraps any target callable.\n"
        "3. Caches computation results in the wrapper closure using the arguments tuple as the lookup key.\n"
        "4. Checks cache containment before evaluating the target function, tracking hit and miss telemetry accordingly.\n"
        "5. Implements a bounded FIFO eviction policy: when cache capacity reaches `maxsize` prior to inserting a new result, the oldest inserted entry is evicted.\n"
        "6. Exposes a `.cache_info()` helper method on the wrapped function that returns a dictionary containing 'hits', 'misses', 'size', and 'maxsize'.\n"
        "7. Exposes a `.cache_clear()` helper method on the wrapped function that clears the cached results and resets telemetry counters to zero.\n"
        "8. Preserves the target function's introspection metadata (such as name and docstrings)."
    ),
    "starter_code": r'''def make_bounded_memoizer(maxsize: int = 128) -> callable:
    """
    Factory creating a memoization decorator with bounded FIFO cache size and metrics.
    
    Args:
        maxsize: Maximum number of results to cache (default 128).
        
    Returns:
        Decorator function.
    """
    # TODO: Implement bounded memoizer closure with cache_info and cache_clear
    pass
''',
    "reference_solution": r'''from functools import wraps

def make_bounded_memoizer(maxsize: int = 128) -> callable:
    if not isinstance(maxsize, int) or isinstance(maxsize, bool) or maxsize <= 0:
        raise ValueError("maxsize must be a positive integer")
        
    def decorator(fn: callable) -> callable:
        if not callable(fn):
            raise TypeError("fn must be callable")
            
        cache = {}
        hits = 0
        misses = 0
        
        @wraps(fn)
        def wrapper(*args):
            nonlocal hits, misses
            key = args
            
            if key in cache:
                hits += 1
                return cache[key]
                
            misses += 1
            result = fn(*args)
            
            if len(cache) >= maxsize:
                oldest_key = next(iter(cache))
                del cache[oldest_key]
                
            cache[key] = result
            return result
            
        def cache_info():
            return {
                "hits": hits,
                "misses": misses,
                "size": len(cache),
                "maxsize": maxsize,
            }
            
        def cache_clear():
            nonlocal hits, misses
            cache.clear()
            hits = 0
            misses = 0
            
        wrapper.cache_info = cache_info
        wrapper.cache_clear = cache_clear
        return wrapper
        
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

    # Test 1: Hit and miss tracking
    call_counts = 0
    memo = candidate_func(maxsize=10)
    
    @memo
    def compute(x):
        nonlocal call_counts
        call_counts += 1
        return x * 10

    assert_test(compute(2) == 20, "Incorrect computation result")
    assert_test(compute(2) == 20, "Incorrect computation result on cache hit")
    assert_test(compute(3) == 30, "Incorrect computation result")
    
    info = compute.cache_info()
    assert_test(info["hits"] == 1, f"Expected 1 hit, got {info['hits']}")
    assert_test(info["misses"] == 2, f"Expected 2 misses, got {info['misses']}")
    assert_test(info["size"] == 2, f"Expected size 2, got {info['size']}")

    # Test 2: FIFO eviction on maxsize
    memo2 = candidate_func(maxsize=2)
    @memo2
    def square(x):
        return x * x

    square(1)  # cached: 1
    square(2)  # cached: 1, 2
    square(3)  # evicts 1, caches: 2, 3
    
    info2 = square.cache_info()
    assert_test(info2["size"] == 2, f"Cache exceeded maxsize: {info2['size']}")
    
    # Test 3: Cache clear
    compute.cache_clear()
    cleared_info = compute.cache_info()
    assert_test(cleared_info["hits"] == 0 and cleared_info["size"] == 0, "Failed to clear cache")

    return report
''',
    "hints": [
        "Maintain cache storage alongside hit and miss counters in the decorator's closure, declaring closure variables as nonlocal when modifying them in inner scopes.",
        "Check cache containment prior to evaluating the target function to return cached results and update hit or miss telemetry.",
        "When cache capacity is reached, evict the oldest inserted key relying on standard dictionary insertion order before storing new results.",
        "Attach inspection and clearance helper functions directly as callable attributes on the returned wrapper, and preserve the target function's metadata."
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
