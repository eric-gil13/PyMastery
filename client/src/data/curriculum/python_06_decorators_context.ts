import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY06_TRACK: DayTrack = {
  partNumber: 6,
  partId: 6,
  dayNumber: 6,
  id: 6,
  title: 'Part 6: Decorators, Context Managers & Exception Architecture',
  subtitle: 'Metaprogramming with decorators, resource lifecycles with with, and custom exception hierarchies',
  description: 'Master Python’s premier metaprogramming and resource management features. Learn how decorators wrap callables via syntactic sugar, preserve function signatures with `@wraps`, manage database and file lifecycles using the `with` statement and context manager protocol, and build atomic transaction rollback guards.',
  iconName: 'Sparkles',
  badge: 'Part 6 • Decorators & Contexts',
  libraryMechanics: {
    libraryName: 'Python Decorators & Context Protocols',
    tagline: 'AST decoration syntax, RAII resource lifecycles, and exception stack unwinding.',
    overview: `### ⚡ 1. The Decorator Metaprogramming Pattern
A **decorator** is a higher-order callable that takes a function (or class) as an input, adds behavior, and returns a replacement callable.
The \`@decorator\` syntax is direct syntactic sugar:
\`\`\`python
@my_decorator
def calculate(x): ...

# Exactly equivalent to:
calculate = my_decorator(calculate)
\`\`\`

### 🛡️ 2. The Context Manager Protocol (\`with\`)
Python’s \`with\` statement implements deterministic cleanup (similar to RAII in C++ or try-with-resources in Java):
1. Calls \`mgr.__enter__()\`: initializes resources (locks, files, transactions).
2. Runs the inner code block.
3. Calls \`mgr.__exit__(exc_type, exc_val, exc_tb)\`: releases resources regardless of whether the block succeeded or raised an exception! If \`__exit__\` returns \`True\`, the exception is suppressed; if \`False\`, it propagates.`,
    whyItExists: `Robust production software must handle transient failures and ensure cleanup:
- **Zero Resource Leaks:** Context managers ensure file descriptors, database connections, and hardware locks are released even during unexpected crashes.
- **Cross-Cutting Concerns:** Decorators cleanly decouple logging, authentication, caching, and retries from core business logic without repeating boilerplate code.
- **Exception Chaining:** Custom exceptions inheriting from \`Exception\` structure failure domains into clear, handleable hierarchies.`,
    coreAnatomy: {
      objectName: 'Context Manager & Decorator Wrapper',
      description: 'The execution hooks invoked by with and @.',
      fields: [
        {
          name: '__enter__',
          type: 'method(self) -> Any',
          role: 'Prepares resource and returns target bound to the "as" identifier.'
        },
        {
          name: '__exit__',
          type: 'method(self, exc_type, exc_val, exc_tb) -> bool',
          role: 'Performs guaranteed cleanup and decides whether to swallow exceptions.'
        },
        {
          name: '__wrapped__',
          type: 'PyFunctionObject*',
          role: 'Reference to the original undecorated function stashed by functools.wraps.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               The with Statement Lifecycle                   |
|                                                             |
|  with ContextManager() as res:                              |
|         |                                                   |
|         v                                                   |
|  1. __enter__() called -> allocates resource                |
|  2. [BLOCK EXECUTES]                                        |
|         |                                                   |
|         +---> If Success: __exit__(None, None, None)        |
|         +---> If Exception: __exit__(exc_type, val, tb)     |
|                   |                                         |
|                   v                                         |
|  Return True: Suppresses exception                          |
|  Return False: Propagates exception up the stack            |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-decorator-wraps',
        title: 'Parameterized Decorators & @wraps',
        icon: 'Layers',
        summary: 'Building three-layer decorator factories that preserve introspection.',
        markdownContent: `### Why @functools.wraps is Essential

Without \`@wraps\`, decorating a function wipes out its \`__name__\`, docstrings, and parameter annotations:

\`\`\`python
from functools import wraps

def audit(action_name):
    def decorator(fn):
        @wraps(fn)  # Copies __name__, __doc__, __annotations__
        def wrapper(*args, **kwargs):
            print(f"Executing {action_name} on {fn.__name__}")
            return fn(*args, **kwargs)
        return wrapper
    return decorator

@audit("billing")
def charge_card(amount):
    """Charges customer card."""
    pass

print(charge_card.__name__)  # 'charge_card' (not 'wrapper'!)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-dec-timer',
            title: 'Timing Decorator',
            code: `import time
from functools import wraps

def timeit(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        result = fn(*args, **kwargs)
        dt = time.perf_counter() - t0
        print(f"{fn.__name__} took {dt*1000:.2f} ms")
        return result
    return wrapper

@timeit
def work():
    return sum(x**2 for x in range(10000))

work()`,
            explanation: 'Decorators wrap existing functions to intercept execution before and after invocation.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Accidentally Suppressing Fatal Exceptions in __exit__',
        badSnippet: `def __exit__(self, exc_type, exc_val, exc_tb):\n    clean_up()\n    return True  # TRAP: Silently swallows KeyboardInterrupt and SystemExit!`,
        badExplanation: 'Returning True from __exit__ suppresses all exceptions inside the block, hiding critical bugs.',
        goodSnippet: `def __exit__(self, exc_type, exc_val, exc_tb):\n    clean_up()\n    return False  # Correct: allow exceptions to bubble up`,
        goodExplanation: 'Return False (or None) to let unexpected exceptions bubble up to caller error handlers.',
        perfImpact: 'Prevents masked deadlocks, crashed pipelines, and silent failure states.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'wraps',
        category: 'Decorators',
        signature: 'functools.wraps(wrapped, assigned=..., updated=...)',
        summary: 'Decorator factory which copies function metadata (__name__, __doc__, __module__) to the wrapper.',
        parameters: [
          { name: 'wrapped', type: 'callable', desc: 'Target function to mirror metadata from.' }
        ],
        returns: 'Decorator function.',
        exampleSnippet: '@wraps(fn)\ndef wrapper(*args): ...'
      },
      {
        name: 'contextmanager',
        category: 'Contextlib',
        signature: 'contextlib.contextmanager(func)',
        summary: 'Converts a generator yielding a resource into a full-fledged context manager without writing a class.',
        parameters: [
          { name: 'func', type: 'callable', desc: 'Generator function with a single yield.' }
        ],
        returns: 'Context manager callable.',
        exampleSnippet: '@contextmanager\ndef tag(name): ...'
      },
      {
        name: 'raise from',
        category: 'Exceptions',
        signature: 'raise CustomError("msg") from original_err',
        summary: 'Chains exceptions to preserve original traceback causes.',
        parameters: [
          { name: 'original_err', type: 'Exception', desc: 'Preceding exception cause.' }
        ],
        returns: 'None.',
        exampleSnippet: 'raise RuntimeError("Failed") from err'
      }
    ],
    interactiveWidgetType: 'python-memory'
  },
  challenges: [
    {
      id: 'python-p6-c1',
      dayId: 6,
      partId: 6,
      title: 'Retry with Exponential Backoff & Call Limiter Decorator',
      slug: 'retry-with-exponential-backoff-call-limiter-decorator',
      difficulty: 'Intermediate',
      category: 'Decorators & Resilience',
      summary: 'Build a production-grade parameterized retry decorator that catches transient errors and retries with exponential backoff.',
      estimatedTime: '20 min',
      hints: [
        'Validate `max_retries >= 0`, `initial_delay >= 0`, and `backoff_factor >= 1.0`.',
        'Check `isinstance(exceptions, tuple)` or convert a single exception class into a tuple.',
        'Track `total_attempts = 0` and expose it as a property or attribute on the wrapper.',
        'Catch specified exceptions, sleep for current delay, multiply delay by `backoff_factor`, and retry.'
      ],
      instructions: `Write a decorator factory \`retry_with_backoff(max_retries: int = 3, initial_delay: float = 0.01, backoff_factor: float = 2.0, exceptions=(Exception,))\` that:
1. **Validation**:
   - If \`max_retries < 0\` or \`initial_delay < 0\` or \`backoff_factor < 1.0\`, raise \`ValueError("Invalid retry configuration")\`.
   - \`exceptions\` must be an exception class or tuple of exception classes.
2. **Retry Execution**:
   - Decorates callable \`fn\`. Preserves metadata using \`@functools.wraps(fn)\`.
   - Attempts to call \`fn(*args, **kwargs)\`.
   - If an exception matching \`exceptions\` is raised:
     - If remaining retries > 0, sleep for \`current_delay\` (using \`time.sleep(current_delay)\`), update \`current_delay = current_delay * backoff_factor\`, and retry.
     - If retries are exhausted, re-raise the final caught exception.
3. **Execution Statistics**:
   - The wrapped function must expose a counter attribute \`.total_attempts\` tracking how many times the underlying function was invoked across all calls.`,
      starterCode: `from functools import wraps
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
`,
      solutionCode: `from functools import wraps
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
            
        wrapper.total_attempts = 0
        
        # Override wrapper to sync total_attempts property
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Flaky Function Succeeds on Second Retry',
          inputDescription: 'Function fails twice with ConnectionError, succeeds on 3rd attempt',
          expectedOutput: 'Succeeds; total_attempts == 3'
        },
        {
          id: 't2',
          name: 'Exhausted Retries Re-raises Exception',
          inputDescription: 'Function always fails; max_retries=2',
          expectedOutput: 'Raises ConnectionError; total_attempts == 3 (1 initial + 2 retries)'
        },
        {
          id: 't3',
          name: 'Unintercepted Exception Not Retried',
          inputDescription: 'exceptions=(ValueError,), function raises TypeError',
          expectedOutput: 'Immediately raises TypeError without retrying; total_attempts == 1'
        }
      ],
      benchmarkTargetMs: 0.1,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'Transient Failure Handling & Exponential Backoff',
        subtitle: 'Resilient network requests with parameterized decorators',
        overview: 'Network calls to remote databases, APIs, and microservices encounter blips. Exponential backoff prevents thundering herd collisions while recovering from glitches.',
        mentalModel5s: 'Loop up to max_retries -> On error: sleep(delay) -> delay *= factor -> re-raise on final exhaustion.',
        visualAnalogy: 'Knocking on a door: knock, wait 1 second, knock again, wait 2 seconds, knock, wait 4 seconds before walking away.',
        pitfalls: [
          'Setting backoff factor to less than 1.0 which would decrease delay over time.',
          'Not preserving the original exception traceback when re-raising.'
        ],
        progressiveHints: [
          'Step 1: Validate parameters (`max_retries >= 0`, `backoff_factor >= 1.0`).',
          'Step 2: Track `total_attempts` in closure.',
          'Step 3: Loop while `True`: try `fn()`, except `exceptions as e:` check `retries_left`.',
          'Step 4: Sleep for `delay`, update `delay *= backoff_factor`, decrement retries.'
        ],
        mathFormulas: [
          {
            title: 'Exponential Backoff Formula',
            latex: 'd_k = d_0 \\cdot \\beta^k',
            explanation: 'Delay after attempt k given initial delay d_0 and backoff factor beta.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Inline retry boilerplate around every network call
for attempt in range(3):
    try: ...
    except ...: time.sleep(1)`,
          naiveExplanation: 'Scatters repetitive retry logic across every business module.',
          idiomaticCode: `@retry_with_backoff(max_retries=3)
def call_api(): ...`,
          idiomaticExplanation: 'Single declarative line equips any function with robust retry semantics.',
          speedupText: 'Decoupled, reusable reliability'
        },
        memoryLayout: {
          title: 'Callable Wrapper Object',
          content: 'The decorator returns a callable holding closure state for delay configurations and attempt metrics.',
          diagramAscii: `wrapper -> closure: [total_attempts, max_retries, initial_delay, backoff_factor]`,
          keyRule: 'Closure retains attempt statistics across multiple invocations.'
        },
        keyTakeaways: [
          'Use parameterized decorator factories with 3 nested functions.',
          'Exponential backoff prevents overloading downstream services during recovery.',
          'Always preserve original function identity with functools.wraps.'
        ]
      }
    },
    {
      id: 'python-p6-c2',
      dayId: 6,
      partId: 6,
      title: 'Atomic State Transaction Rollback Context Manager',
      slug: 'atomic-state-transaction-rollback-context-manager',
      difficulty: 'Intermediate',
      category: 'Context Managers',
      summary: 'Implement a transactional context manager that creates a snapshot of a dictionary and rolls back all mutations if an error occurs.',
      estimatedTime: '20 min',
      hints: [
        'In `__init__`, check `if not isinstance(target_dict, dict): raise TypeError()`.',
        'In `__enter__`, store `self._snapshot = copy.deepcopy(self.target_dict)` and return `self.target_dict`.',
        'In `__exit__`, check `if exc_type is not None: self.target_dict.clear(); self.target_dict.update(self._snapshot)`.',
        'Return `False` from `__exit__` so exceptions continue bubbling up.'
      ],
      instructions: `Create a context manager class \`AtomicTransaction\`:
1. **Initialization**:
   - \`__init__(self, target_dict: dict)\`: If \`not isinstance(target_dict, dict)\`, raise \`TypeError("target_dict must be a dictionary")\`.
   - Stores a reference to \`target_dict\`.
2. **Context Entry (\`__enter__\`)**:
   - Creates a deep backup snapshot of \`target_dict\` (using \`copy.deepcopy\`).
   - Returns \`target_dict\` so it can be bound using \`with AtomicTransaction(d) as state:\`.
3. **Context Exit (\`__exit__\`)**:
   - If no exception occurred (\`exc_type is None\`):
     - The transaction **commits** (the mutations made inside the block are kept).
     - Returns \`None\` (or \`False\`).
   - If an exception occurred (\`exc_type is not None\`):
     - The transaction **aborts & rolls back**: clears \`target_dict\` and restores the exact key-value pairs from the backup snapshot!
     - Returns \`False\` so the original exception is re-raised and propagates naturally.`,
      starterCode: `import copy

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
`,
      solutionCode: `import copy

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
            # Roll back mutations
            self.target.clear()
            self.target.update(self._snapshot)
        self._snapshot = None
        # Return False to let exception propagate
        return False
`,
      testCases: [
        {
          id: 't1',
          name: 'Successful Transaction Commits Changes',
          inputDescription: 'd = {"a": 1}; with AtomicTransaction(d): d["a"] = 99; d["b"] = 2',
          expectedOutput: 'd == {"a": 99, "b": 2}'
        },
        {
          id: 't2',
          name: 'Aborted Transaction Rolls Back to Snapshot',
          inputDescription: 'd = {"a": 1, "nested": [10]}; with AtomicTransaction(d): d["nested"].append(20); raise ValueError()',
          expectedOutput: 'd == {"a": 1, "nested": [10]}'
        },
        {
          id: 't3',
          name: 'Invalid Target Type Error',
          inputDescription: 'AtomicTransaction([1, 2, 3])',
          expectedOutput: 'Raises TypeError'
        }
      ],
      benchmarkTargetMs: 0.1,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'ACID Transactions with Context Managers',
        subtitle: 'The Atomicity invariant: all changes succeed, or none do',
        overview: 'Databases use write-ahead logs (WAL) to ensure that if a server dies mid-transaction, dirty writes are rolled back. You can apply this exact pattern in Python using context managers.',
        mentalModel5s: 'Snapshot in `__enter__` -> If exception in `__exit__`: `target.clear()` and `target.update(snapshot)`.',
        visualAnalogy: 'A computer undo stack: creating a restore point before attempting risky system updates.',
        pitfalls: [
          'Using shallow copy (`dict.copy()`) which fails to roll back mutations to nested lists or dictionaries.',
          'Returning `True` from `__exit__`, which would silently swallow the transaction failure exception.'
        ],
        progressiveHints: [
          'Step 1: Check `isinstance(target_dict, dict)`.',
          'Step 2: In `__enter__`, do `self._snapshot = copy.deepcopy(self.target)`.',
          'Step 3: In `__exit__`, if `exc_type is not None`, restore: `self.target.clear(); self.target.update(self._snapshot)`.',
          'Step 4: Return `False` to ensure exceptions propagate.'
        ],
        mathFormulas: [
          {
            title: 'State Transition Invariant',
            latex: 'S_{t+1} = \\begin{cases} S_{\\text{mutated}} & \\text{if } e = \\emptyset \\\\ S_t & \\text{if } e \\ne \\emptyset \\end{cases}',
            explanation: 'Guarantees that state either transitions to mutated state or reverts to initial state on error.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual try/finally with restore logic
orig = copy.deepcopy(d)
try: ...
except:
    d = orig`,
          naiveExplanation: 'Rebinding `d = orig` breaks references held by external callers.',
          idiomaticCode: `with AtomicTransaction(config):
    modify_config(config)`,
          idiomaticExplanation: 'In-place state rollback guarantees all object references stay intact.',
          speedupText: 'Zero data corruption risk'
        },
        memoryLayout: {
          title: 'Deepcopy Graph Duplication',
          content: 'copy.deepcopy duplicates all nested structures into an independent heap graph.',
          diagramAscii: `target: [dict -> list@0x1] <---> snapshot: [dict -> list@0x2]`,
          keyRule: 'Mutating target has zero impact on snapshot.'
        },
        keyTakeaways: [
          'Use deepcopy when rolling back nested mutable structures.',
          'Return False from __exit__ so callers are alerted to the transaction failure.',
          'Mutate the original dictionary in-place (.clear() and .update()) to preserve existing object references.'
        ]
      }
    }
  ]
};

export const PYTHON_PART06_TRACK = DAY06_TRACK;
export const testCases = DAY06_TRACK.challenges.flatMap((c) => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY06_TRACK;
