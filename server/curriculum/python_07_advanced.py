"""
Part 7: Modern Python Mastery, Types & Concurrency Capstone
PyMastery Progressive Zero-to-Hero Pure Python Curriculum
"""

import asyncio
import inspect
from collections import defaultdict
from typing import Dict, Any, List, Callable

DAY_METADATA = {
    "day_id": "python_07",
    "day_number": 7,
    "title": "Part 7: Modern Python Mastery, Types & Concurrency Capstone",
    "tagline": "Type hinting, dataclasses, pattern matching, asyncio concurrency, and production architecture.",
    "estimated_time": "1-2 hours",
    "concepts_covered": [
        "Modern typing with `typing.Protocol` and static duck-typing verification",
        "Boilerplate-free classes with `@dataclass(frozen=True, slots=True)`",
        "Structural pattern matching with `match / case` statements",
        "Asyncio event loops, coroutines, and semaphore-based rate limiting",
        "Enterprise event bus pub/sub patterns and fault-tolerant concurrency"
    ]
}

CONCEPT_PRIMER = r"""# Part 7: Modern Python Mastery, Types & Concurrency Capstone

Python 3.10+ combines the ease of a dynamic scripting language with the industrial robustness of a typed, asynchronous systems language.

---

## 1. Dataclasses: The Standard Record Container

```python
from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class Event:
    event_id: str
    topic: str
    payload: dict
```
- `frozen=True`: Generates `__setattr__` that raises `FrozenInstanceError` on mutation (immutable and hashable!).
- `slots=True`: Generates `__slots__` automatically for memory efficiency.

---

## 2. Asyncio & Cooperative Concurrency

CPython utilizes a Global Interpreter Lock (GIL). For I/O-bound tasks (HTTP calls, DB queries, file streams), `asyncio` allows thousands of concurrent operations on a single OS thread by pausing coroutines during I/O wait (`await`).

```python
import asyncio

async def fetch_item(item_id):
    await asyncio.sleep(0.01)  # Simulates non-blocking network I/O
    return f"Item {item_id}"

async def main():
    results = await asyncio.gather(*(fetch_item(i) for i in range(5)))
    print(results)
```
"""

WALKTHROUGH = r"""# Walkthrough: Bounded Async Concurrency with Semaphore

```python
import asyncio

async def bounded_worker(sem, item_id):
    async with sem:
        # At most 2 workers inside this block simultaneously
        await asyncio.sleep(0.05)
        return item_id * 2

async def run():
    sem = asyncio.Semaphore(2)
    coros = [bounded_worker(sem, i) for i in range(5)]
    return await asyncio.gather(*coros)

# asyncio.run(run())
```
"""

# -----------------------------------------------------------------------------
# Challenge 1: Type-Safe PubSub Event Dispatcher
# -----------------------------------------------------------------------------

CHALLENGE_1 = {
    "id": "python-p7-c1",
    "title": "Type-Safe PubSub Event Dispatcher",
    "difficulty": "Advanced",
    "category": "System Architecture & Events",
    "description": (
        "Build an enterprise event bus with prioritized subscribers, isolated error boundaries, and telemetry metrics."
    ),
    "instructions": (
        "Implement an `EventDispatcher` class:\n"
        "1. `subscribe(event_type: str, handler: callable, priority: int = 0)`: validates non-empty event_type and callable handler. Handlers with higher priority values execute first. Maintain insertion order for tied priorities.\n"
        "2. `unsubscribe(event_type: str, handler: callable) -> bool`: removes handler from event_type, returns True if removed, False otherwise.\n"
        "3. `listener_count(event_type: str = None) -> int`: returns count of listeners for specific event (or total if None).\n"
        "4. `dispatch(event_type: str, payload: dict = None) -> list[dict]`: invokes listeners in priority order passing payload. Catches any handler exception without interrupting subsequent handlers. Returns list of `{'handler': name, 'priority': prio, 'success': bool, 'result': res, 'error': err_str}`."
    ),
    "starter_code": r'''class EventDispatcher:
    """
    Enterprise event bus with prioritized subscribers and fault-tolerant dispatch.
    """
    def __init__(self):
        # TODO: Initialize subscriber registry
        pass

    def subscribe(self, event_type: str, handler: callable, priority: int = 0):
        # TODO: Register handler with priority
        pass

    def unsubscribe(self, event_type: str, handler: callable) -> bool:
        # TODO: Remove subscriber
        pass

    def listener_count(self, event_type: str = None) -> int:
        # TODO: Return subscriber count
        pass

    def dispatch(self, event_type: str, payload: dict = None) -> list:
        # TODO: Execute handlers in priority order with error isolation
        pass
''',
    "reference_solution": r'''from collections import defaultdict

class EventDispatcher:
    def __init__(self):
        self._listeners = defaultdict(list)
        self._counter = 0

    def subscribe(self, event_type: str, handler: callable, priority: int = 0):
        if not isinstance(event_type, str) or not event_type.strip():
            raise ValueError("event_type must be a non-empty string")
        if not callable(handler):
            raise TypeError("handler must be callable")
            
        self._counter += 1
        self._listeners[event_type.strip()].append((-int(priority), self._counter, handler))

    def unsubscribe(self, event_type: str, handler: callable) -> bool:
        clean_type = str(event_type).strip()
        if clean_type not in self._listeners:
            return False
            
        initial_len = len(self._listeners[clean_type])
        self._listeners[clean_type] = [
            item for item in self._listeners[clean_type] if item[2] != handler
        ]
        return len(self._listeners[clean_type]) < initial_len

    def listener_count(self, event_type: str = None) -> int:
        if event_type is not None:
            return len(self._listeners.get(str(event_type).strip(), []))
        return sum(len(v) for v in self._listeners.values())

    def dispatch(self, event_type: str, payload: dict = None) -> list:
        clean_type = str(event_type).strip()
        listeners = sorted(self._listeners.get(clean_type, []), key=lambda x: (x[0], x[1]))
        data = payload if isinstance(payload, dict) else {}
        reports = []

        for neg_prio, _, handler in listeners:
            fn_name = getattr(handler, "__name__", str(handler))
            prio = -neg_prio
            try:
                res = handler(data)
                reports.append({
                    "handler": fn_name,
                    "priority": prio,
                    "success": True,
                    "result": res,
                    "error": None,
                })
            except Exception as e:
                reports.append({
                    "handler": fn_name,
                    "priority": prio,
                    "success": False,
                    "result": None,
                    "error": str(e),
                })

        return reports
''',
    "test_suite": r'''def run_tests(candidate_target):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    EventDispatcher = candidate_target["EventDispatcher"] if isinstance(candidate_target, dict) else candidate_target

    bus = EventDispatcher()
    execution_order = []

    def low_priority(data):
        execution_order.append("low")
        return "low_res"

    def high_priority(data):
        execution_order.append("high")
        return "high_res"

    def faulty_handler(data):
        execution_order.append("faulty")
        raise RuntimeError("Handler exploded")

    # Subscribe with priorities
    bus.subscribe("order_created", low_priority, priority=1)
    bus.subscribe("order_created", high_priority, priority=10)
    bus.subscribe("order_created", faulty_handler, priority=5)

    assert_test(bus.listener_count("order_created") == 3, "Listener count mismatch")

    # Dispatch
    reports = bus.dispatch("order_created", {"order_id": 123})
    
    # Priority order check: high (10) -> faulty (5) -> low (1)
    assert_test(execution_order == ["high", "faulty", "low"], f"Execution order mismatch: {execution_order}")
    assert_test(len(reports) == 3, f"Expected 3 reports, got {len(reports)}")
    assert_test(reports[0]["success"] is True and reports[0]["result"] == "high_res", "High priority result mismatch")
    assert_test(reports[1]["success"] is False and "exploded" in reports[1]["error"], "Faulty handler error mismatch")
    assert_test(reports[2]["success"] is True and reports[2]["result"] == "low_res", "Low priority handler result mismatch")

    # Unsubscribe check
    unsub = bus.unsubscribe("order_created", faulty_handler)
    assert_test(unsub is True, "Failed to unsubscribe")
    assert_test(bus.listener_count("order_created") == 2, "Listener count did not decrement")

    return report
''',
    "hints": [
        "Store subscribers as `(-priority, insertion_order, handler)` to sort by priority descending.",
        "Catch `Exception as e` inside `dispatch` to maintain fault isolation.",
        "Return structured report dictionaries with `handler`, `priority`, `success`, `result`, `error`."
    ]
}

# -----------------------------------------------------------------------------
# Challenge 2: Concurrent Async Task Batcher & Rate Limiter Capstone
# -----------------------------------------------------------------------------

CHALLENGE_2 = {
    "id": "python-p7-c2",
    "title": "Concurrent Async Task Batcher & Rate Limiter Capstone",
    "difficulty": "Advanced",
    "category": "Asyncio & Concurrency",
    "description": (
        "Design an asynchronous task runner that bounds maximum concurrent tasks using an asyncio Semaphore "
        "and preserves result ordering."
    ),
    "instructions": (
        "Write an async function `async_task_batcher(tasks: list[callable], max_concurrency: int = 5) -> list[dict]` that:\n"
        "1. Validates `tasks` is a list and `max_concurrency` is an int > 0 (else ValueError/TypeError).\n"
        "2. Uses an `asyncio.Semaphore(max_concurrency)` to throttle concurrent executions.\n"
        "3. Concurrently calls each task (supporting both `async def` and synchronous callables).\n"
        "4. Catches exceptions per task without cancelling other tasks.\n"
        "5. Returns result dicts in the exact original task order: `{'index': i, 'success': bool, 'result': res, 'error': err_str}`.\n"
        "6. Provide `run_batcher_sync(tasks, max_concurrency=5)` helper wrapping the async function."
    ),
    "starter_code": r'''import asyncio
import inspect
from typing import List, Callable

async def async_task_batcher(tasks: List[Callable], max_concurrency: int = 5) -> List[dict]:
    """
    Execute a batch of callable tasks concurrently with bounded concurrency.
    
    Args:
        tasks: List of sync or async callable functions.
        max_concurrency: Maximum number of simultaneous running tasks.
        
    Returns:
        List of execution report dicts in original task order.
    """
    # TODO: Implement bounded concurrent execution with asyncio.Semaphore
    pass

def run_batcher_sync(tasks: List[Callable], max_concurrency: int = 5) -> List[dict]:
    """Synchronous entrypoint for async_task_batcher."""
    return asyncio.run(async_task_batcher(tasks, max_concurrency))
''',
    "reference_solution": r'''import asyncio
import inspect
from typing import List, Callable

async def async_task_batcher(tasks: List[Callable], max_concurrency: int = 5) -> List[dict]:
    if not isinstance(tasks, list):
        raise TypeError("tasks must be a list")
    if not isinstance(max_concurrency, int) or isinstance(max_concurrency, bool) or max_concurrency <= 0:
        raise ValueError("max_concurrency must be a positive integer")
        
    sem = asyncio.Semaphore(max_concurrency)
    
    async def worker(index: int, task: Callable) -> dict:
        async with sem:
            try:
                if inspect.iscoroutinefunction(task):
                    res = await task()
                else:
                    res = task()
                    if inspect.isawaitable(res):
                        res = await res
                return {
                    "index": index,
                    "success": True,
                    "result": res,
                    "error": None,
                }
            except Exception as e:
                return {
                    "index": index,
                    "success": False,
                    "result": None,
                    "error": str(e),
                }
                
    coros = [worker(i, t) for i, t in enumerate(tasks)]
    return await asyncio.gather(*coros)

def run_batcher_sync(tasks: List[Callable], max_concurrency: int = 5) -> List[dict]:
    return asyncio.run(async_task_batcher(tasks, max_concurrency))
''',
    "test_suite": r'''import asyncio

def run_tests(candidate_target):
    report = {"passed": True, "tests_run": 0, "errors": []}
    
    def assert_test(condition, msg):
        report["tests_run"] += 1
        if not condition:
            report["passed"] = False
            report["errors"].append(msg)
            raise AssertionError(msg)

    scope = candidate_target if isinstance(candidate_target, dict) else {
        "async_task_batcher": getattr(candidate_target, "async_task_batcher", candidate_target),
        "run_batcher_sync": getattr(candidate_target, "run_batcher_sync", None)
    }

    run_sync = scope.get("run_batcher_sync")
    batcher = scope.get("async_task_batcher")

    if run_sync is None:
        def run_sync(tasks, max_concurrency=5):
            return asyncio.run(batcher(tasks, max_concurrency))

    # Test 1: Mixed sync and async tasks with ordered outputs
    async def async_task_1():
        await asyncio.sleep(0.001)
        return "async_1"

    def sync_task_2():
        return "sync_2"

    async def failing_task_3():
        await asyncio.sleep(0.001)
        raise ValueError("Simulated network timeout")

    tasks = [async_task_1, sync_task_2, failing_task_3]
    results = run_sync(tasks, max_concurrency=2)

    assert_test(len(results) == 3, f"Expected 3 results, got {len(results)}")
    assert_test(results[0]["index"] == 0 and results[0]["result"] == "async_1", "Result 0 mismatch")
    assert_test(results[1]["index"] == 1 and results[1]["result"] == "sync_2", "Result 1 mismatch")
    assert_test(results[2]["index"] == 2 and results[2]["success"] is False, "Result 2 error capture mismatch")
    assert_test("timeout" in results[2]["error"], f"Expected error message, got {results[2]['error']}")

    return report
''',
    "hints": [
        "Create `sem = asyncio.Semaphore(max_concurrency)`.",
        "In a worker function, use `async with sem:` and check `inspect.iscoroutinefunction(task)`.",
        "Use `await asyncio.gather(*coros)` which preserves the original task order."
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
