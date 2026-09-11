import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY03_TRACK: DayTrack = {
  partNumber: 3,
  partId: 3,
  dayNumber: 3,
  id: 3,
  title: 'Part 3: Functions, Scopes, Closures & First-Class Citizens',
  subtitle: 'Argument unpacking, mutable defaults, LEGB scope resolution, and closure factories',
  description: 'Master the mechanics of Python functions as first-class objects. Dissect stack frames, understand lexical scope via the LEGB rule, master `*args` and `**kwargs`, avoid the dangerous mutable default argument pitfall, and build configurable pipeline composers and memoizing closures.',
  iconName: 'Zap',
  badge: 'Part 3 • Functions & Scopes',
  libraryMechanics: {
    libraryName: 'Python Execution Frames & Closures',
    tagline: 'Stack frames, lexical scopes, closure cell objects, and first-class function dispatch.',
    overview: `### ⚡ Functions are First-Class Objects
In Python, functions are runtime objects of type \`function\`. They can be:
- Passed as arguments to other functions (\`map\`, \`filter\`, \`sorted\`).
- Returned dynamically from functions (higher-order functions / function factories).
- Assigned to variables, placed in lists, and stored in dictionaries.
- Inspected at runtime via attributes like \`__name__\`, \`__code__\`, \`__defaults__\`, and \`__closure__\`.

### 🔍 The LEGB Scope Resolution Rule
When Python evaluates a variable name inside a function, it traverses four lexical scopes in strict order:
1. **Local (L):** Names defined inside the currently executing function frame.
2. **Enclosing (E):** Names in enclosing nested function definitions (closures).
3. **Global (G):** Names defined at module-level scope (\`__main__\` or file top-level).
4. **Built-in (B):** Preloaded Python identifiers (\`len\`, \`range\`, \`ValueError\`, \`print\`).`,
    whyItExists: `Functions are the atomic units of logic and abstraction:
- **Closures:** A function that retains access to variables from its enclosing scope even after that outer function has finished executing. CPython wraps these in \`cell\` objects.
- **Parametric Flexibility:** Combining positional-only (\`/\`), keyword-only (\`*\`), variable positional (\`*args\`), and keyword arguments (\`**kwargs\`) enables authoring extensible APIs.
- **No Hidden Re-evaluation:** Default arguments in Python are evaluated **once** at function definition time, NOT at every call! Understanding this prevents catastrophic bugs with mutable defaults like \`def f(x=[])\`.`,
    coreAnatomy: {
      objectName: 'CPython PyFrameObject & PyFunctionObject',
      description: 'The internal state machine for function execution and closure variables.',
      fields: [
        {
          name: 'co_varnames',
          type: 'tuple[str]',
          role: 'Names of local variables and arguments.'
        },
        {
          name: 'co_freevars',
          type: 'tuple[str]',
          role: 'Names of variables captured from enclosing scopes (closure variables).'
        },
        {
          name: '__closure__',
          type: 'tuple[cell]',
          role: 'Tuple of cell objects holding pointers to captured lexical variables.'
        },
        {
          name: '__defaults__',
          type: 'tuple[Any]',
          role: 'Evaluated default argument objects preserved on the function object.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               Python Closure & Cell Memory Model            |
|                                                             |
|  Outer Function Frame (Closed)                              |
|  +---------------------------+                              |
|  | Cell Object (0xCAFE)      | <---+                        |
|  | payload: count = 0        |     |                        |
|  +---------------------------+     |                        |
|                                    |                        |
|  Inner Returned Function Object    |                        |
|  +-------------------------------+ |                        |
|  | __closure__ = (Cell@0xCAFE,) -+ |                        |
|  | f() -> mutates Cell@0xCAFE      |                        |
|  +-------------------------------+                          |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-args-kwargs',
        title: 'Modern Argument Signatures: *, /, *args, **kwargs',
        icon: 'Layers',
        summary: 'Control parameter semantics with positional-only and keyword-only boundaries.',
        markdownContent: `### Strict Signature Boundaries

Python 3.8+ introduced full control over argument binding:

\`\`\`python
def configure(host, port=8080, /, debug=False, *, timeout=30, **extra):
    pass
\`\`\`

- **Before \`/\`**: **Positional-only**. Callers *must* pass \`host\` and \`port\` positionally (cannot write \`host="localhost"\`).
- **Between \`/\` and \`*\`**: Positional or keyword.
- **After \`*\`**: **Keyword-only**. Callers *must* pass \`timeout=...\` explicitly.
- **\`*args\`**: Captures any excess positional arguments as a \`tuple\`.
- **\`**kwargs\`**: Captures any excess keyword arguments as a \`dict\`.`,
        codeSnippets: [
          {
            id: 'snip-args-kwargs',
            title: 'Variable Arguments Forwarding',
            code: `def logger(prefix, *args, **kwargs):
    print(f"[{prefix.upper()}]", *args)
    if kwargs:
        print(" Extra:", kwargs)

logger("audit", "User logged in", "IP: 127.0.0.1", user_id=42)`,
            explanation: '*args captures positional arguments as a tuple; **kwargs captures keyword arguments as a dict.'
          }
        ]
      },
      {
        id: 'ch2-closures',
        title: 'Closures and the `nonlocal` Keyword',
        icon: 'Sparkles',
        summary: 'Enclosing scopes and state encapsulation without classes.',
        markdownContent: `### Encapsulating State in Closures

A closure allows creating lightweight stateful objects using pure functions:

\`\`\`python
def make_counter(start: int = 0):
    count = start  # Enclosed variable in cell
    
    def increment():
        nonlocal count  # Declares that count lives in enclosing scope
        count += 1
        return count
        
    return increment

counter = make_counter(10)
print(counter())  # 11
print(counter())  # 12
\`\`\`

Without \`nonlocal\`, assigning \`count += 1\` would cause Python to treat \`count\` as an uninitialized local variable, raising \`UnboundLocalError\`!`,
        codeSnippets: [
          {
            id: 'snip-closure-inspection',
            title: 'Inspecting Closure Cells',
            code: `def factory(factor):
    return lambda x: x * factor

times3 = factory(3)
print("times3(10):", times3(10))
print("Cell content:", times3.__closure__[0].cell_contents)`,
            explanation: 'Functions carry a __closure__ tuple of cell objects retaining variables from enclosing lexical scopes.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'The Mutable Default Parameter Trap',
        badSnippet: `def append_item(item, target_list=[]):\n    target_list.append(item)\n    return target_list`,
        badExplanation: 'Default argument expressions are evaluated once at function definition time, making mutable defaults persistent across all invocations.',
        goodSnippet: `def append_item(item, target_list=None):\n    if target_list is None:\n        target_list = []\n    target_list.append(item)\n    return target_list`,
        goodExplanation: 'Use None as default sentinel and instantiate a fresh list inside the function call.',
        perfImpact: 'Prevents insidious cross-invocation memory corruption and unintended data leaks.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'partial',
        category: 'Higher-Order',
        signature: 'functools.partial(func, /, *args, **keywords)',
        summary: 'Returns a new partial object which when called behaves like func called with positional and keyword arguments pre-filled.',
        parameters: [
          { name: 'func', type: 'callable', desc: 'Function to partially apply.' },
          { name: '*args', type: 'tuple', desc: 'Pre-filled positional arguments.' }
        ],
        returns: 'Partial callable object.',
        exampleSnippet: 'base2 = partial(int, base=2)'
      },
      {
        name: 'callable',
        category: 'Inspection',
        signature: 'callable(obj) -> bool',
        summary: 'Returns True if the object appears callable (functions, methods, classes, objects with __call__).',
        parameters: [
          { name: 'obj', type: 'object', desc: 'Object to test.' }
        ],
        returns: 'bool indicating if callable.',
        exampleSnippet: 'if callable(handler): handler()'
      },
      {
        name: 'wraps',
        category: 'Decorators',
        signature: 'functools.wraps(wrapped)',
        summary: 'Decorator factory that copies __name__, __doc__, and other introspection metadata to wrapper functions.',
        parameters: [
          { name: 'wrapped', type: 'callable', desc: 'Original target function.' }
        ],
        returns: 'Decorator updating wrapper metadata.',
        exampleSnippet: '@wraps(func)'
      }
    ],
    interactiveWidgetType: 'python-memory'
  },
  challenges: [
    {
      id: 'python-p3-c1',
      dayId: 3,
      partId: 3,
      title: 'Configurable Pipeline Function Composer',
      slug: 'configurable-pipeline-function-composer',
      difficulty: 'Intermediate',
      category: 'Higher-Order Functions',
      summary: 'Compose an arbitrary sequence of callable transformation stages into a single callable execution pipeline with optional debugging traces.',
      estimatedTime: '20 min',
      hints: [
        'Verify that the variable positional arguments sequence is non-empty, and check that each supplied function satisfies Python\'s callable interface.',
        'Construct an inner closure that receives the initial argument and iterates sequentially through each function, updating an accumulator with each stage\'s result.',
        'When debug mode is requested, track execution by recording the zero-based step index, resolving the callable name (with fallback handling for anonymous or callable objects), and storing the stage output.',
        'Wrap each stage invocation in an exception handler and use explicit exception chaining to preserve the original exception while raising a informative RuntimeError.'
      ],
      instructions: `Write a function \`compose_pipeline(*funcs: callable, debug: bool = False) -> callable\` that:
1. **Validation**:
   - If no functions are provided, raise a \`ValueError\` indicating that at least one function is required.
   - Ensure every argument provided is callable; if any is not, raise a \`TypeError\`.
2. **Composed Function Execution**:
   - The returned pipeline function must accept an initial input value.
   - It executes the functions sequentially from left to right, threading the output of each stage as the input to the next.
   - If any stage raises an exception during execution, catch it and raise a \`RuntimeError\` with the original exception explicitly chained. The error message should convey the failed stage index, the function's name (with a fallback name if unnamed), and the underlying error message.
3. **Debug Mode**:
   - If \`debug=False\` (default): Returns the final transformed output value directly.
   - If \`debug=True\`: Returns a dictionary containing:
     - \`"result"\`: The final transformed output value.
     - \`"trace"\`: A list of dictionaries documenting each step, where each entry contains:
       - \`"step"\`: The zero-based integer index of the stage.
       - \`"func"\`: The string identifier/name of the function.
       - \`"output"\`: The intermediate value produced by that stage.`,
      starterCode: `def compose_pipeline(*funcs: callable, debug: bool = False) -> callable:
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
`,
      solutionCode: `def compose_pipeline(*funcs: callable, debug: bool = False) -> callable:
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Standard Three-Stage Pipeline',
          inputDescription: 'funcs=[str.strip, str.lower, len], val="  Hello World  ", debug=False',
          expectedOutput: '11 (length of "hello world")'
        },
        {
          id: 't2',
          name: 'Debug Trace Mode',
          inputDescription: 'funcs=[lambda x: x + 1, lambda x: x * 2], val=5, debug=True',
          expectedOutput: "{result: 12, trace: [{step: 0, func: '<lambda>', output: 6}, {step: 1, func: '<lambda>', output: 12}]}"
        },
        {
          id: 't3',
          name: 'Pipeline Stage Failure Handling',
          inputDescription: 'funcs=[lambda x: x / 0], val=10',
          expectedOutput: 'Raises RuntimeError with stage index and original error'
        }
      ],
      benchmarkTargetMs: 0.05,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'Function Composition & Pipeline Architecture',
        subtitle: 'Chaining pure transformations into clean, testable data workflows',
        overview: 'Pipelines in machine learning, data engineering, and web middleware are built by composing small pure functions.',
        mentalModel5s: 'Loop through `funcs`, updating `val = f(val)` -> Wrap in a try/except for diagnostic traceability.',
        visualAnalogy: 'An assembly line where each worker applies a specialized polish before handing the object to the next station.',
        pitfalls: [
          'Forgetting that `getattr(f, "__name__", ...)` is needed for anonymous lambdas or callable objects.',
          'Not chaining exceptions using `from e`.'
        ],
        progressiveHints: [
          'Step 1: Check `if not funcs:` and verify `all(callable(f) for f in funcs)`.',
          'Step 2: Define the inner `pipeline(initial_val)` closure.',
          'Step 3: Accumulate steps in a `trace` list if `debug=True`.',
          'Step 4: Return `pipeline` callable.'
        ],
        mathFormulas: [
          {
            title: 'Function Composition Pipeline',
            latex: '(f_n \\circ \\dots \\circ f_2 \\circ f_1)(x) = f_n(\\dots(f_2(f_1(x))))',
            explanation: 'Sequential unary composition where the output of each function feeds into the next.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Hardcoded nested function calls
res = f3(f2(f1(x)))`,
          naiveExplanation: 'Inflexible, unconfigurable, and cannot dynamically add or remove processing stages.',
          idiomaticCode: `pipeline = compose_pipeline(f1, f2, f3)
res = pipeline(x)`,
          idiomaticExplanation: 'Declarative, dynamic, reusable, and self-documenting.',
          speedupText: 'Infinite architectural flexibility'
        },
        memoryLayout: {
          title: 'Stack Frame Unwinding',
          content: 'The composed closure maintains a reference to the `funcs` tuple in its `__closure__` cell.',
          diagramAscii: `pipeline.__closure__[0] -> tuple of [f1, f2, f3]`,
          keyRule: 'Captured functions are never copied; only pointer references are retained in the closure.'
        },
        keyTakeaways: [
          'Functions in Python can be composed dynamically.',
          'Use `callable()` to validate parameters.',
          'Provide debug instrumentation for observable execution in production systems.'
        ]
      }
    },
    {
      id: 'python-p3-c2',
      dayId: 3,
      partId: 3,
      title: 'State-Preserving Bounded Memoizer Closure',
      slug: 'state-preserving-bounded-memoizer-closure',
      difficulty: 'Intermediate',
      category: 'Closures & Cache Design',
      summary: 'Build a closure-based function decorator that caches expensive computation results with FIFO eviction and statistics tracking.',
      estimatedTime: '20 min',
      hints: [
        'Validate `isinstance(maxsize, int) and maxsize > 0`.',
        'Inside `make_bounded_memoizer`, declare `cache = {}`, `hits = 0`, `misses = 0`.',
        'In wrapper(*args), check `if args in cache: hits += 1; return cache[args]`.',
        'If evicting, use `del cache[next(iter(cache))]` to remove the oldest FIFO entry.',
        'Attach `cache_info` and `cache_clear` to wrapper, and decorate with `@wraps(fn)`.'
      ],
      instructions: `Write a function \`make_bounded_memoizer(maxsize: int = 128) -> callable\` that:
1. **Validation**:
   - If \`not isinstance(maxsize, int) or maxsize <= 0\`, raise \`ValueError("maxsize must be a positive integer")\`.
2. **Decorator Factory**:
   - Returns a decorator function \`memoize(fn: callable) -> callable\`.
   - The returned wrapped function caches results based on the tuple of arguments \`(*args,)\` passed to \`fn\`.
3. **Eviction Policy**:
   - If a new computation must be cached and the cache size has reached \`maxsize\`, evict the **oldest** inserted cache entry (FIFO eviction).
4. **Cache Metrics & Management**:
   - The wrapped function must expose two callable helper attributes:
     - \`.cache_info() -> dict\`: returns \`{"hits": int, "misses": int, "size": int, "maxsize": int}\`.
     - \`.cache_clear() -> None\`: clears the cache dictionary and resets \`hits\` and \`misses\` to \`0\`.
5. **Metadata Preservation**:
   - The wrapper function must preserve the original function's \`__name__\` and \`__doc__\` (using \`functools.wraps\`).`,
      starterCode: `def make_bounded_memoizer(maxsize: int = 128) -> callable:
    """
    Factory creating a memoization decorator with bounded FIFO cache size and metrics.
    
    Args:
        maxsize: Maximum number of results to cache (default 128).
        
    Returns:
        Decorator function.
    """
    # TODO: Implement bounded memoizer closure with cache_info and cache_clear
    pass
`,
      solutionCode: `from functools import wraps

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
                # Evict oldest entry (FIFO using dict order in Python 3.7+)
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Fibonacci Memoization & Hit Tracking',
          inputDescription: 'maxsize=10, compute fib(5) multiple times',
          expectedOutput: 'hits=4, misses=6, size=6'
        },
        {
          id: 't2',
          name: 'FIFO Cache Eviction on Capacity Limit',
          inputDescription: 'maxsize=2, insert keys 1, 2, then 3',
          expectedOutput: 'Key 1 evicted; cache size remains 2'
        },
        {
          id: 't3',
          name: 'Cache Clear Functionality',
          inputDescription: 'wrapper.cache_clear()',
          expectedOutput: 'hits=0, misses=0, size=0'
        }
      ],
      benchmarkTargetMs: 0.05,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'Stateful Closures & Memoization Mechanics',
        subtitle: 'Trading space for time with function caches',
        overview: 'Expensive calculations (dynamic programming, database reads, API lookups) use memoization caches to return previously computed results in $O(1)$ time.',
        mentalModel5s: 'Encapsulate `cache`, `hits`, `misses` inside closure -> Attach `.cache_info` and `.cache_clear` to `wrapper`.',
        visualAnalogy: 'A desk drawer containing answered letters: if the same question arrives, read the drawer answer instead of recalculating.',
        pitfalls: [
          'Forgetting `nonlocal hits, misses` when reassigning counters in wrapper.',
          'Not preserving `__name__` and `__doc__` with `@functools.wraps`.'
        ],
        progressiveHints: [
          'Step 1: Check `maxsize > 0`.',
          'Step 2: Define `cache = {}`, `hits = 0`, `misses = 0` inside the decorator.',
          'Step 3: In `wrapper(*args)`, use `args` as the cache key.',
          'Step 4: If `len(cache) >= maxsize`, pop the oldest key: `del cache[next(iter(cache))]`.',
          'Step 5: Attach `wrapper.cache_info` and `wrapper.cache_clear`.'
        ],
        mathFormulas: [
          {
            title: 'Cache Hit Ratio',
            latex: '\\text{Hit Ratio} = \\frac{\\text{hits}}{\\text{hits} + \\text{misses}}',
            explanation: 'Quantifies cache efficiency and latency savings over repeated invocations.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Global cache variable
GLOBAL_CACHE = {}
def calc(x):
    if x in GLOBAL_CACHE: ...`,
          naiveExplanation: 'Pollutes global namespace, prevents multiple isolated instances, and risks concurrency collisions.',
          idiomaticCode: `@make_bounded_memoizer(maxsize=100)
def calc(x): ...`,
          idiomaticExplanation: 'Each decorated function owns an isolated, private closure cache with introspection hooks.',
          speedupText: '100x speedup on recursive algorithms'
        },
        memoryLayout: {
          title: 'Closure Cell References',
          content: 'The wrapper holds cells referencing `cache`, `hits`, `misses`, and `maxsize`.',
          diagramAscii: `wrapper.__closure__ -> [cell(cache), cell(hits), cell(misses), cell(maxsize)]`,
          keyRule: 'Cells remain alive in RAM as long as wrapper exists, independent of outer scope lifecycle.'
        },
        keyTakeaways: [
          'Closures retain private encapsulated state without requiring explicit classes.',
          'Use `next(iter(dict))` to access the oldest inserted key in Python 3.7+.',
          'Always use `@functools.wraps` on decorators to keep introspection intact.'
        ]
      }
    }
  ]
};

export const PYTHON_PART03_TRACK = DAY03_TRACK;
export const testCases = DAY03_TRACK.challenges.flatMap((c) => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY03_TRACK;
