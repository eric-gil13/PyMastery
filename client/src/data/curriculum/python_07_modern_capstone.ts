import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY07_TRACK: DayTrack = {
  partNumber: 7,
  partId: 7,
  dayNumber: 7,
  id: 7,
  title: 'Part 7: Modern Python Mastery, Types & Concurrency Capstone',
  subtitle: 'Type hinting, dataclasses, pattern matching, asyncio concurrency, and production architecture',
  description: 'Complete your journey from Python zero to hero. Master modern typing protocols, compile-free dataclasses with slots, structural pattern matching (`match/case`), the Global Interpreter Lock (GIL), and concurrent execution with `asyncio`. Build an enterprise event bus and asynchronous task batcher.',
  iconName: 'Network',
  badge: 'Part 7 • Modern Mastery Capstone',
  libraryMechanics: {
    libraryName: 'Modern Python 3.10+ & Asyncio Runtime',
    tagline: 'Static typing, dataclasses, structural pattern matching, and concurrent event loops.',
    overview: `### 🚀 Welcome to Modern Python
Python 3.10+ has evolved into an exceptionally expressive, statically-analyzable language.

### 🌟 Four Pillars of Modern Python
1. **Structural Pattern Matching (\`match/case\`):** Destructure objects, match sequence lengths, and evaluate guard conditions with native compiler acceleration.
2. **Dataclasses (\`@dataclass\`):** Automatically generate boilerplate methods (\`__init__\`, \`__repr__\`, \`__eq__\`, \`__hash__\`) with optional immutability (\`frozen=True\`) and \`slots=True\`.
3. **Typing Protocols (\`typing.Protocol\`):** Structural subtyping (static duck typing) verified by tools like \`mypy\` or \`pyright\` without runtime inheritance overhead.
4. **Asynchronous I/O (\`asyncio\`):** Single-threaded cooperative multitasking utilizing an OS event loop to juggle thousands of concurrent network sockets without thread context-switching overhead.`,
    whyItExists: `Modern Python blends rapid prototyping with enterprise-grade type safety:
- **Type Annotations:** Enable auto-completion, static verification, and self-documenting APIs without impacting runtime speed.
- **The Global Interpreter Lock (GIL):** CPython's GIL restricts bytecode execution to one OS thread at a time. For I/O-bound tasks, \`asyncio\` provides cooperative concurrency with minimal memory overhead.
- **Structural Pattern Matching:** Replaces brittle cascades of \`if/isinstance/getattr\` checks with clean structural unpacking.`,
    coreAnatomy: {
      objectName: 'Asyncio Event Loop & Coroutine Object',
      description: 'The state machine governing modern async execution in Python.',
      fields: [
        {
          name: 'cr_frame',
          type: 'PyFrameObject*',
          role: 'The execution frame preserved during await suspension.'
        },
        {
          name: 'EventLoop',
          type: 'asyncio.AbstractEventLoop',
          role: 'The multiplexer monitoring file descriptors, timers, and scheduled tasks.'
        },
        {
          name: 'Semaphore',
          type: 'asyncio.Semaphore',
          role: 'Concurrency throttle limiting simultaneous in-flight coroutines.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               Asyncio Cooperative Event Loop                 |
|                                                             |
|   Ready Queue              Awaiting I/O (epoll/kqueue)      |
|   +---------------+        +----------------------------+   |
|   | Task A (run)  |        | Task B (awaiting network)  |   |
|   +---------------+        +----------------------------+   |
|           |                              |                  |
|           v                              v                  |
|   Event Loop Thread: executes Task A until 'await' is reached! |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-dataclasses-types',
        title: 'Modern Dataclasses & Type Hints',
        icon: 'ShieldCheck',
        summary: 'Eliminate class boilerplate using @dataclass.',
        markdownContent: `### Generating Classes with @dataclass

\`\`\`python
from dataclasses import dataclass, field
from typing import List, Optional

@dataclass(frozen=True, slots=True)
class ServiceConfig:
    host: str
    port: int = 8080
    tags: List[str] = field(default_factory=list)
    timeout: Optional[float] = 30.0

cfg = ServiceConfig(host="api.internal", tags=["prod", "v2"])
print(cfg)  # ServiceConfig(host='api.internal', port=8080, tags=['prod', 'v2'], timeout=30.0)
\`\`\`

With \`frozen=True\` and \`slots=True\`, the class is immutable, hashable, and uses minimal memory without a \`__dict__\`.`,
        codeSnippets: [
          {
            id: 'snip-pattern-matching',
            title: 'Structural Pattern Matching (match/case)',
            code: `def process_command(cmd):
    match cmd.split():
        case ["quit" | "exit"]:
            return "Exiting system"
        case ["get", key]:
            return f"Fetching {key}"
        case ["set", key, value]:
            return f"Setting {key} = {value}"
        case _:
            return "Unknown command"

print(process_command("set database postgres"))`,
            explanation: 'PEP 634 match/case evaluates structural patterns and binds sequence components at runtime.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Calling Synchronous Blocking Code in Async Functions',
        badSnippet: `import time\nasync def fetch_user(user_id):\n    time.sleep(2)  # TRAP: Freezes event loop for all users!\n    return {"id": user_id}`,
        badExplanation: 'time.sleep() blocks the OS thread running the single-threaded asyncio event loop, halting all concurrent tasks.',
        goodSnippet: `import asyncio\nasync def fetch_user(user_id):\n    await asyncio.sleep(2)  # Correct: yields control to loop\n    return {"id": user_id}`,
        goodExplanation: 'Use awaitable non-blocking calls like asyncio.sleep to yield control back to the event loop scheduler.',
        perfImpact: 'Prevents total event loop freezes and unlocks 10,000+ concurrent connections.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'dataclass',
        category: 'Data Model',
        signature: 'dataclasses.dataclass(frozen=False, slots=False)',
        summary: 'Decorator that adds generated special methods (__init__, __repr__, __eq__) to classes.',
        parameters: [
          { name: 'frozen', type: 'bool', desc: 'Emulate immutability and allow hashing.' },
          { name: 'slots', type: 'bool', desc: 'Generate __slots__ automatically.' }
        ],
        returns: 'Enhanced dataclass type.',
        exampleSnippet: '@dataclass(slots=True)\nclass Point: x: float; y: float'
      },
      {
        name: 'gather',
        category: 'Asyncio',
        signature: 'asyncio.gather(*aws, return_exceptions=False)',
        summary: 'Runs awaitable objects in the aws sequence concurrently and returns their aggregated results.',
        parameters: [
          { name: '*aws', type: 'Coroutine', desc: 'Awaitable tasks or coroutines.' }
        ],
        returns: 'List of results in input order.',
        exampleSnippet: 'results = await asyncio.gather(t1(), t2())'
      },
      {
        name: 'Semaphore',
        category: 'Concurrency',
        signature: 'asyncio.Semaphore(value=1)',
        summary: 'Synchronization primitive limiting the maximum number of concurrent tasks accessing a shared resource.',
        parameters: [
          { name: 'value', type: 'int', desc: 'Maximum concurrent tasks allowed.' }
        ],
        returns: 'Semaphore instance.',
        exampleSnippet: 'sem = asyncio.Semaphore(10)'
      }
    ],
    interactiveWidgetType: 'python-memory'
  },
  challenges: [
    {
      id: 'python-p7-c1',
      dayId: 7,
      partId: 7,
      title: 'Type-Safe PubSub Event Dispatcher',
      slug: 'type-safe-pubsub-event-dispatcher',
      difficulty: 'Advanced',
      category: 'System Architecture & Events',
      summary: 'Build an enterprise event bus with prioritized subscribers, isolated error boundaries, and telemetry metrics.',
      estimatedTime: '25 min',
      hints: [
        'Validate that the event type is a non-empty string and verify the handler is callable before registration.',
        'Organize listeners by event type, tracking an insertion counter alongside priority to ensure descending priority sorting with deterministic FIFO tie-breaking.',
        'Iterate through prioritized listeners within an error boundary during dispatch to capture subscriber exceptions without interrupting remaining handlers.',
        'Format execution reports as structured records tracking handler identity, priority level, success flag, returned output, and any error message.'
      ],
      instructions: `Implement an \`EventDispatcher\` class that manages prioritized subscribers with isolated error boundaries:
1. **Subscription Management**:
   - \`subscribe(self, event_type: str, handler: callable, priority: int = 0)\`:
     - Validate that the event type is a non-empty string (raise \`ValueError\` with message \`"event_type must be a non-empty string"\` otherwise).
     - Validate that the handler is a callable target (raise \`TypeError\` with message \`"handler must be callable"\` otherwise).
     - Register the handler under the designated event type. Higher priority values must execute before lower priority handlers. When priorities are equal, preserve chronological registration order.
   - \`unsubscribe(self, event_type: str, handler: callable) -> bool\`:
     - Remove the specified handler from the registered event type. Return \`True\` if the handler was found and removed, or \`False\` if it was not subscribed.
   - \`listener_count(self, event_type: str = None) -> int\`:
     - When an event type is provided, return the total count of subscribers registered for that event.
     - When omitted or set to \`None\`, return the cumulative count of subscribers across all event types.
2. **Event Dispatch & Error Isolation**:
   - \`dispatch(self, event_type: str, payload: dict = None) -> list[dict]\`:
     - Invoke all registered subscribers for the given event type in descending priority order, passing the provided payload dictionary (defaulting to an empty dictionary if None).
     - **Error Boundary**: Isolate each handler execution within a fault containment wrapper so that any runtime exception raised by a subscriber is safely captured without terminating remaining handlers.
     - Return a list of execution report dictionaries containing:
       - \`handler\`: String name or representation of the handler function.
       - \`priority\`: Integer priority level assigned to the handler.
       - \`success\`: Boolean indicating whether execution completed without error.
       - \`result\`: The return value of the handler on success, or \`None\` on failure.
       - \`error\`: String representation of the captured exception on failure, or \`None\` on success.`,
      starterCode: `class EventDispatcher:
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
`,
      solutionCode: `from collections import defaultdict

class EventDispatcher:
    def __init__(self):
        # Map event_type -> list of (priority, insertion_order, handler)
        self._listeners = defaultdict(list)
        self._counter = 0

    def subscribe(self, event_type: str, handler: callable, priority: int = 0):
        if not isinstance(event_type, str) or not event_type.strip():
            raise ValueError("event_type must be a non-empty string")
        if not callable(handler):
            raise TypeError("handler must be callable")
            
        self._counter += 1
        # Store (-priority, insertion_order, handler) for stable sorting
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Priority Dispatch Order',
          inputDescription: 'Subscribe h1 (prio=0), h2 (prio=10), h3 (prio=-5); dispatch event',
          expectedOutput: 'Execution order: h2 -> h1 -> h3'
        },
        {
          id: 't2',
          name: 'Error Boundary Isolation',
          inputDescription: 'Handler 1 throws exception, Handler 2 succeeds',
          expectedOutput: 'Both execute; h1 success=False with error, h2 success=True'
        },
        {
          id: 't3',
          name: 'Unsubscribe and Listener Count',
          inputDescription: 'Unsubscribe h1; check listener_count',
          expectedOutput: 'listener_count decrements by 1; h1 no longer executes'
        }
      ],
      benchmarkTargetMs: 0.1,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Event-Driven Architectures & Publish-Subscribe',
        subtitle: 'Decoupling producers from consumers with prioritized dispatchers',
        overview: 'Modern microservices and UI frameworks (React, Vue, Node.js EventEmitter) use event dispatchers to propagate state mutations without tight coupling.',
        mentalModel5s: 'Register handler in prioritized registry -> On dispatch: order by priority and sequence -> execute within fault-isolated boundary.',
        visualAnalogy: 'A radio broadcast station: listeners tune into frequencies without the broadcaster needing to know who is listening.',
        pitfalls: [
          'Allowing one crashing listener to kill the entire event broadcast.',
          'Sorting priorities without preserving stable insertion order.'
        ],
        progressiveHints: [
          'Step 1: Maintain a collection mapping event types to their subscriber registrations.',
          'Step 2: Store priority tuples combining inverted numerical rank with an incrementing insertion counter to ensure stable descending ordering.',
          'Step 3: In `dispatch()`, isolate each subscriber invocation inside an error containment boundary to trap exceptions.',
          'Step 4: Assemble and return structured telemetry dictionaries detailing execution outcome and diagnostics.'
        ],
        mathFormulas: [
          {
            title: 'Subscriber Priority Linearization',
            latex: '\\text{rank}(h_i) = (-p_i, \\tau_i)',
            explanation: 'Compound sorting key enforcing decreasing priority p with stable arrival timestamp tau.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Hardcoded coupling
def on_user_signup(user):
    send_email(user)
    charge_account(user)
    log_analytics(user)`,
          naiveExplanation: 'Monolithic and brittle: adding a new reaction requires editing the core signup function.',
          idiomaticCode: `bus.dispatch("user_signup", {"user": user})`,
          idiomaticExplanation: 'Modular and extensible: components independently subscribe and react to events.',
          speedupText: 'Maximum architectural modularity'
        },
        memoryLayout: {
          title: 'Subscriber Table',
          content: 'EventDispatcher stores tuples of (priority, sequence, handler_ref).',
          diagramAscii: `_listeners["user_signup"] -> [(-10, 1, audit_handler), (0, 2, email_handler)]`,
          keyRule: 'Handlers are referenced by pointer, executing eagerly upon dispatch.'
        },
        keyTakeaways: [
          'Use priority sorting with insertion counters to maintain determinism.',
          'Wrap external handler execution in error boundaries to preserve system availability.',
          'Provide unsubscribe mechanisms to avoid memory leaks.'
        ]
      }
    },
    {
      id: 'python-p7-c2',
      dayId: 7,
      partId: 7,
      title: 'Concurrent Async Task Batcher & Rate Limiter Capstone',
      slug: 'concurrent-async-task-batcher-rate-limiter-capstone',
      difficulty: 'Advanced',
      category: 'Asyncio & Concurrency',
      summary: 'Design an asynchronous task runner that bounds maximum concurrent tasks using an asyncio Semaphore and preserves result ordering.',
      estimatedTime: '25 min',
      hints: [
        'Validate that tasks is a list and max_concurrency is a positive non-boolean integer.',
        'Throttle concurrent executions using an asyncio semaphore synchronization primitive configured to the specified capacity.',
        'In worker coroutines, manage semaphore acquisition using an asynchronous context manager, inspecting whether tasks are coroutines or standard callables to resolve them correctly.',
        'Concurrently schedule all worker tasks with an awaitable aggregation primitive that maintains original input index order.',
        'Provide a synchronous helper that delegates execution to the event loop runtime.'
      ],
      instructions: `Write an asynchronous function \`async_task_batcher(tasks: list[callable], max_concurrency: int = 5) -> list[dict]\` that executes callables with bounded concurrency:
1. **Validation**:
   - Validate that \`tasks\` is a list (raise \`TypeError\` with message \`"tasks must be a list"\` otherwise).
   - Validate that \`max_concurrency\` is a strictly positive integer, explicitly rejecting non-integers and booleans (raise \`ValueError\` with message \`"max_concurrency must be a positive integer"\` otherwise).
2. **Concurrency Control**:
   - Throttle concurrent operations so that no more than \`max_concurrency\` tasks run simultaneously by bounding in-flight workers with an asyncio semaphore primitive.
3. **Callable Execution & Fault Tolerance**:
   - Support both asynchronous coroutine functions and synchronous callables, awaiting coroutine execution and directly invoking synchronous functions (awaiting if an awaitable is returned).
   - Enforce per-task error isolation so any exception raised by a task is caught and recorded without terminating or cancelling sibling tasks.
4. **Output Report**:
   - Return a list of report dictionaries corresponding to the input tasks preserved in their **exact original input index order**:
     - \`index\`: Zero-based original integer index of the task.
     - \`success\`: Boolean indicating whether execution completed without raising an exception.
     - \`result\`: The resolved return value of the callable on success, or \`None\` on failure.
     - \`error\`: String representation of the captured exception on failure, or \`None\` on success.
5. **Synchronous Runner Wrapper**:
   - Provide a companion function \`run_batcher_sync(tasks: list[callable], max_concurrency: int = 5) -> list[dict]\` that runs \`async_task_batcher\` to completion within a synchronous environment using the standard asyncio execution runner.`,
      starterCode: `import asyncio
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
`,
      solutionCode: `import asyncio
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Concurrent Task Execution with Result Ordering',
          inputDescription: 'tasks=[lambda: 10, lambda: 20, lambda: 30], max_concurrency=2',
          expectedOutput: 'results in order: index 0 (res=10), index 1 (res=20), index 2 (res=30)'
        },
        {
          id: 't2',
          name: 'Error Isolation Across Tasks',
          inputDescription: 'task 0 raises ValueError, task 1 returns 42',
          expectedOutput: 'task 0 has success=False, task 1 has success=True'
        },
        {
          id: 't3',
          name: 'Concurrency Throttle Active',
          inputDescription: 'max_concurrency=1 on multiple async sleep tasks',
          expectedOutput: 'Tasks execute through semaphore sequentially'
        }
      ],
      benchmarkTargetMs: 0.2,
      memoryTargetMb: 0.2,
      conceptPrimer: {
        title: 'Asyncio Semaphore & Coroutine Orchestration',
        subtitle: 'High-throughput concurrency without thread safety headaches',
        overview: 'Rate-limiting API clients (like web scrapers or cloud SDKs) use asyncio.Semaphore to throttle simultaneous requests and respect provider rate limits.',
        mentalModel5s: 'Throttle workers via concurrency semaphore -> Inspect callable type -> Gather coroutines preserving sequence index.',
        visualAnalogy: 'A nightclub velvet rope: only 5 patrons allowed inside simultaneously; as one exits, the next enters.',
        pitfalls: [
          'Using threads for I/O when asyncio delivers 10x higher concurrency with lower memory.',
          'Not awaiting coroutines returned by callable functions.'
        ],
        progressiveHints: [
          'Step 1: Validate input parameters, verifying positive integer concurrency bounds.',
          'Step 2: Initialize an asyncio semaphore primitive with the concurrency limit.',
          'Step 3: Build an asynchronous worker that acquires a semaphore slot, inspects whether the callable is a coroutine function or produces an awaitable, and catches any runtime errors.',
          'Step 4: Concurrently collect worker executions using an awaitable gather primitive that maintains original task ordering.'
        ],
        mathFormulas: [
          {
            title: "Little's Law Concurrency Bound",
            latex: 'L = \\lambda W \\le C_{\\max}',
            explanation: 'Guarantees the number of in-flight requests L never exceeds configured semaphore concurrency capacity C_max.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Unbounded task explosion
tasks = [asyncio.create_task(fetch(url)) for url in 10000_urls]
await asyncio.gather(*tasks)`,
          naiveExplanation: 'Opens 10,000 simultaneous sockets, crashing OS file limits and triggering API 429 rate limits.',
          idiomaticCode: `sem = asyncio.Semaphore(50)
async with sem:
    await fetch(url)`,
          idiomaticExplanation: 'Bounds in-flight concurrency to a controlled, steady throughput.',
          speedupText: 'Zero socket exhaustion risk'
        },
        memoryLayout: {
          title: 'Semaphore Counter',
          content: 'The semaphore decrements an integer value upon acquire and increments on release.',
          diagramAscii: `Semaphore(value=5): [Task 1..5 active, value=0] -> Task 6 waits on event queue`,
          keyRule: 'Tasks resume in FIFO order as slots become available.'
        },
        keyTakeaways: [
          'Use asyncio.Semaphore to bound concurrent throughput.',
          'asyncio.gather preserves the original input order of awaitables.',
          'Use inspect.iscoroutinefunction to support both sync and async callables.'
        ]
      }
    }
  ]
};

export const PYTHON_PART07_TRACK = DAY07_TRACK;
export const testCases = DAY07_TRACK.challenges.flatMap((c) => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY07_TRACK;
