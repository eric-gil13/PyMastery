import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY05_TRACK: DayTrack = {
  partNumber: 5,
  partId: 5,
  dayNumber: 5,
  id: 5,
  title: 'Part 5: Iterators, Generators & Streaming Pipelines',
  subtitle: 'The iterator protocol, yield mechanics, infinite streams, and itertools mastery',
  description: 'Master lazy evaluation and streaming data processing. Understand the formal Iterator protocol (`__iter__` and `__next__`), build zero-memory generator pipelines using `yield` and `yield from`, harness the power of `itertools`, and process multi-gigabyte datasets without exceeding memory bounds.',
  iconName: 'Sparkles',
  badge: 'Part 5 • Generators & Streams',
  libraryMechanics: {
    libraryName: 'Python Generators & Streaming Protocol',
    tagline: 'Lazy evaluation, frame suspension, and memory-bounded data pipelines.',
    overview: `### ⚡ The Problem with Eager Collections
When you load 10,000,000 rows from a database or CSV into a Python \`list\`, Python must allocate gigabytes of RAM upfront to hold every single \`PyObject\`. If your server only has 2 GB of memory, your process crashes with an Out-of-Memory (OOM) error.

### 🌟 The Solution: Lazy Streaming with Generators
A **Generator** produces items on-demand, one at a time.
Instead of storing all elements in memory, a generator function suspends its execution frame using the \`yield\` keyword, keeping only the current element in RAM!

### 🔄 The Iterator Protocol
1. **Iterable:** An object that returns an iterator via \`iter(obj)\` (implements \`__iter__()\`).
2. **Iterator:** An object that produces the next value via \`next(iterator)\` (implements \`__next__()\`). When no elements remain, it raises \`StopIteration\`.`,
    whyItExists: `Streaming architecture is the standard for high-throughput backend services:
- **Constant Memory Footprint ($O(1)$):** Processing 10 billion records consumes the exact same memory as processing 10 records.
- **Immediate First-Token / First-Record Latency:** The consumer begins processing the first row instantly without waiting for the entire query or file to finish loading.
- **Pipelining:** You can chain generators like Unix pipes: \`stream -> parse -> filter -> aggregate\`.`,
    coreAnatomy: {
      objectName: 'CPython PyGenObject',
      description: 'The internal generator state machine in CPython.',
      fields: [
        {
          name: 'gi_frame',
          type: 'PyFrameObject*',
          role: 'The suspended CPU execution frame holding local variables and instruction pointer.'
        },
        {
          name: 'gi_running',
          type: 'int',
          role: 'Boolean flag indicating if the generator is currently active in the bytecode loop.'
        },
        {
          name: 'gi_code',
          type: 'PyCodeObject*',
          role: 'The compiled bytecode containing YIELD_VALUE instructions.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|               Generator Frame Suspension (yield)             |
|                                                             |
|  Active Execution                                           |
|  line 1: x = 1                                              |
|  line 2: yield x  -----> Suspends Frame! Return to Caller   |
|                          gi_frame preserves x = 1 in RAM    |
|                                                             |
|  Caller calls next(gen)                                     |
|  line 3: x = x + 1 <--- Resumes right where it paused!      |
|  line 4: yield x  -----> Suspends Frame again!              |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-iter-protocol',
        title: 'The Formal Iterator Protocol',
        icon: 'Layers',
        summary: 'How Python loops under the hood with __iter__ and __next__.',
        markdownContent: `### Deconstructing the \`for\` Loop

When you write \`for item in collection:\`, Python performs:

\`\`\`python
# 1. Obtain iterator
it = iter(collection)

# 2. Repeatedly call next() until exhausted
while True:
    try:
        item = next(it)
    except StopIteration:
        break
    # Body of the loop
    print(item)
\`\`\`

Custom iterator classes implement \`__iter__\` (returning \`self\`) and \`__next__\`.`,
        codeSnippets: [
          {
            id: 'snip-countdown-iter',
            title: 'Custom Countdown Iterator',
            code: `class Countdown:
    def __init__(self, start):
        self.current = start
        
    def __iter__(self):
        return self
        
    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        val = self.current
        self.current -= 1
        return val

for n in Countdown(3):
    print(n)  # 3, 2, 1`,
            explanation: 'Implementing __iter__ returning self and __next__ raising StopIteration satisfies Python full iterator protocol.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Iterating Over a Consumed Generator Twice',
        badSnippet: `gen = (x * 2 for x in range(3))\nlist1 = list(gen)  # [0, 2, 4]\nlist2 = list(gen)  # []  TRAP: Generator is already exhausted!`,
        badExplanation: 'Generators are single-use state machines. Once exhausted, subsequent next() calls raise StopIteration.',
        goodSnippet: `def get_gen():\n    return (x * 2 for x in range(3))\n\nlist1 = list(get_gen())\nlist2 = list(get_gen())  # Works!`,
        goodExplanation: 'Re-invoke a generator function or generator expression factory to create a fresh iterator.',
        perfImpact: 'Eliminates unexpected empty collection bugs in multi-pass algorithms.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'yield',
        category: 'Generators',
        signature: 'yield / yield from iterable',
        summary: 'Suspends function execution and yields a value (or delegates to sub-generator with yield from).',
        parameters: [
          { name: 'val', type: 'object', desc: 'Value emitted to caller.' }
        ],
        returns: 'Generator iterator yielding values lazily.',
        exampleSnippet: 'def gen(): yield 1; yield 2'
      },
      {
        name: 'islice',
        category: 'Itertools',
        signature: 'itertools.islice(iterable, [start], stop, [step])',
        summary: 'Returns an iterator yielding selected elements from iterable without allocating a list slice.',
        parameters: [
          { name: 'iterable', type: 'Iterable', desc: 'Input sequence or generator.' },
          { name: 'stop', type: 'int', desc: 'Element index to stop at.' }
        ],
        returns: 'Lazy slice iterator.',
        exampleSnippet: 'first_five = islice(stream, 5)'
      },
      {
        name: 'chain',
        category: 'Itertools',
        signature: 'itertools.chain(*iterables)',
        summary: 'Combines multiple iterables into a single contiguous streaming sequence.',
        parameters: [
          { name: '*iterables', type: 'Iterable', desc: 'Iterables to chain together.' }
        ],
        returns: 'Contiguous chained iterator.',
        exampleSnippet: 'combined = chain(list_a, list_b)'
      }
    ],
    interactiveWidgetType: 'python-memory'
  },
  challenges: [
    {
      id: 'python-p5-c1',
      dayId: 5,
      partId: 5,
      title: 'Streaming Sliding Window Batch Generator',
      slug: 'streaming-sliding-window-batch-generator',
      difficulty: 'Intermediate',
      category: 'Generators & Itertools',
      summary: 'Implement a memory-bounded sliding window generator that streams windows of elements from any finite or infinite iterable.',
      estimatedTime: '20 min',
      hints: [
        'Obtain an iterator from the input stream to consume items sequentially on demand.',
        'Maintain a bounded FIFO queue sized to the window capacity to hold active window elements.',
        'Prime the buffer with the first window of elements, and emit it only if the buffer reaches the required size.',
        'In a streaming loop, emit the current window contents as a tuple, then advance the iterator by pulling up to step new items.',
        'Terminate the generator gracefully when the input iterator is exhausted and cannot supply further items.'
      ],
      instructions: `Write a generator function \`stream_sliding_window(iterable, window_size: int, step: int = 1)\` that:
1. **Validation**: Validates that \`window_size\` and \`step\` are positive integers (> 0, rejecting booleans). Raise \`ValueError\` if invalid.
2. **Lazy Streaming**: Lazily consumes from \`iterable\` on demand without loading the full stream or collection into memory.
3. **Sliding Windows**: Yields tuples of length \`window_size\` representing each sliding window.
4. **Step Advancement**: Advances the window forward by \`step\` elements between successive yields.
5. **Clean Termination**: Halts cleanly when the stream is exhausted and fewer than \`window_size\` elements remain to form a complete window.
6. **Memory Constraint**: Maintains strictly bounded auxiliary memory ($O(\\text{window\\_size})$) throughout execution.`,
      starterCode: `from typing import Generator, Any

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
`,
      solutionCode: `from collections import deque
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
        # Advance by step elements
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Standard Sequence Window',
          inputDescription: 'iterable=[1, 2, 3, 4, 5], window_size=3, step=1',
          expectedOutput: '[(1, 2, 3), (2, 3, 4), (3, 4, 5)]'
        },
        {
          id: 't2',
          name: 'Stepped Window (step=2)',
          inputDescription: 'iterable=range(6), window_size=2, step=2',
          expectedOutput: '[(0, 1), (2, 3), (4, 5)]'
        },
        {
          id: 't3',
          name: 'Input Smaller than Window Size',
          inputDescription: 'iterable=[1, 2], window_size=5',
          expectedOutput: 'Yields nothing'
        }
      ],
      benchmarkTargetMs: 0.1,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'Memory-Bounded Streaming with Deque',
        subtitle: 'Sliding buffers with O(1) appending and popping',
        overview: 'Time-series analysis and signal processing operate on continuous streams of sensor data. `collections.deque` provides $O(1)$ bounded sliding windows.',
        mentalModel5s: 'Pre-fill deque to window_size -> Yield tuple -> Advance by consuming step items.',
        visualAnalogy: 'A conveyor belt window: looking at 3 items at a time as new items slide in and old items drop off.',
        pitfalls: [
          'Calling `list(iterable)` which reads the entire dataset into memory, crashing on infinite streams.'
        ],
        progressiveHints: [
          'Step 1: Validate window_size and step as strictly positive integers, rejecting boolean values.',
          'Step 2: Convert the input collection or stream into an iterator to consume items lazily on demand.',
          'Step 3: Prime a bounded double-ended queue sized to the window capacity with the initial batch of elements.',
          'Step 4: In a streaming loop, emit the buffered window as a tuple, advance the iterator by pulling up to step new elements, and break when the input is exhausted.'
        ],
        mathFormulas: [
          {
            title: 'Sliding Window Stride Formula',
            latex: 'N_{\\text{windows}} = \\left\\lfloor \\frac{L - W}{S} \\right\\rfloor + 1',
            explanation: 'Number of full sliding windows generated from sequence length L, window size W, and step S.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Converting to list and slicing
data = list(iterable)
for i in range(0, len(data) - w + 1, step):
    yield tuple(data[i:i+w])`,
          naiveExplanation: 'Allocates massive memory and fails entirely on infinite generators.',
          idiomaticCode: `# Maintain a bounded queue of window_size elements
buffer = deque(maxlen=window_size)
# Lazily pull elements, yield tuple(buffer), and advance by step`,
          idiomaticExplanation: 'Runs in strictly bounded O(window_size) RAM regardless of input stream size.',
          speedupText: 'Infinite stream support with zero RAM spike'
        },
        memoryLayout: {
          title: 'collections.deque Block Layout',
          content: 'Deques use doubly-linked 64-element memory chunks, providing O(1) appends and pops on both ends.',
          diagramAscii: `deque(maxlen=3): [block: val1 <-> val2 <-> val3]`,
          keyRule: 'When maxlen is reached, adding a new item automatically drops the opposite end.'
        },
        keyTakeaways: [
          'Never convert streaming iterables into lists.',
          'Use collections.deque(maxlen=...) for bounded memory sliding windows.',
          'Raise StopIteration cleanly when stream is exhausted.'
        ]
      }
    },
    {
      id: 'python-p5-c2',
      dayId: 5,
      partId: 5,
      title: 'Memory-Bounded Log Event Filter Pipeline',
      slug: 'memory-bounded-log-event-filter-pipeline',
      difficulty: 'Intermediate',
      category: 'Generator Pipelines',
      summary: 'Build a multi-stage generator pipeline that lazily parses streaming log lines, filters by severity thresholds, and selects specific services.',
      estimatedTime: '20 min',
      hints: [
        'Map standard log severity names to an ascending integer scale to easily compare priority thresholds.',
        'Compile a regular expression pattern once upfront that captures bracketed fields and the trailing message text.',
        'Use named capture groups in the regex to extract timestamp, level, service, and message cleanly.',
        'Iterate over the incoming lines lazily, ignoring non-string inputs and lines that fail pattern matching.',
        'Normalize severity levels to uppercase and service names to lowercase for consistent filtering comparisons.'
      ],
      instructions: `Write a generator function \`pipeline_log_stream(log_lines, min_level: str = "WARNING", service: str = None)\` that:
1. **Validation**: Validates that \`min_level\` represents a recognized severity level: DEBUG, INFO, WARNING, ERROR, or CRITICAL (case-insensitive). Raise \`ValueError\` for invalid levels.
2. **Lazy Consumption**: Lazily consumes line strings from \`log_lines\` without buffering the entire input.
3. **Log Parsing**: Parses lines formatted with bracketed timestamp, level, and service tokens followed by a message: \`[TIMESTAMP] [LEVEL] [SERVICE] MESSAGE\`. Silently skips malformed lines.
4. **Severity Filtering**: Filters events so only records meeting or exceeding the \`min_level\` severity threshold are retained.
5. **Service Filtering**: If \`service\` is specified, filters for events matching that service name (case-insensitive).
6. **Yield**: Yields structured dictionaries containing trimmed 'timestamp', uppercase 'level', lowercase 'service', and trimmed 'message'.`,
      starterCode: `from typing import Generator

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
`,
      solutionCode: `import re
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
`,
      testCases: [
        {
          id: 't1',
          name: 'Filtering by Severity Threshold',
          inputDescription: 'lines=["[2026-01-01] [INFO] [web] OK", "[2026-01-01] [ERROR] [db] Timeout"], min_level="WARNING"',
          expectedOutput: 'Yields 1 record: [ERROR] [db] Timeout'
        },
        {
          id: 't2',
          name: 'Filtering by Service Name',
          inputDescription: 'min_level="DEBUG", service="auth"',
          expectedOutput: 'Only yields records where service=="auth"'
        },
        {
          id: 't3',
          name: 'Invalid min_level Error',
          inputDescription: 'min_level="VERBOSE"',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 0.1,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'Generator Pipelines in Data Engineering',
        subtitle: 'Composing lazy streaming stages for robust log processing',
        overview: 'Production monitoring agents process terabytes of log streams using generator pipelines to avoid buffering entire log files.',
        mentalModel5s: 'Compile regex once -> For each line in stream: match -> compare severity rank -> yield if matched.',
        visualAnalogy: 'A water filtration system: water flows through sediment, carbon, and UV stages continuously without stopping.',
        pitfalls: [
          'Compiling the regular expression inside the loop instead of at module/function initialization.',
          'Crashing on non-string or malformed lines.'
        ],
        progressiveHints: [
          'Step 1: Establish an ordinal ranking for severity levels (DEBUG through CRITICAL) using a lookup map or enum.',
          'Step 2: Normalize min_level to uppercase, validate against recognized levels, and determine the minimum threshold rank.',
          'Step 3: Precompile a regex with named capture groups to parse bracketed tokens and the trailing message body.',
          'Step 4: Lazily iterate lines, skip malformed entries, verify threshold rank and optional service filter, then yield structured records.'
        ],
        mathFormulas: [
          {
            title: 'Severity Hierarchy Ordering',
            latex: '\\text{rank}(\\ell) \\ge \\text{rank}(\\ell_{\\min})',
            explanation: 'Strict inequality ordering on discrete logging severity levels.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Loading entire file into memory
with open("huge.log") as f:
    lines = f.readlines()
results = []
for l in lines: ...`,
          naiveExplanation: 'Crashes immediately if huge.log is 10 GB.',
          idiomaticCode: `# Lazy streaming generator
for record in pipeline_log_stream(f):
    process(record)`,
          idiomaticExplanation: 'Maintains flat ~5 KB memory footprint regardless of file size.',
          speedupText: 'Infinite scalability'
        },
        memoryLayout: {
          title: 'Streaming Buffer',
          content: 'Only one line string and one regex match dictionary exist in heap memory at any instant.',
          diagramAscii: `Stream -> Line -> Match -> Dict -> Consumer (Discarded immediately)`,
          keyRule: 'Garbage collector reclaims discarded line buffers in generation 0 immediately.'
        },
        keyTakeaways: [
          'Generator pipelines compose cleanly with zero RAM footprint.',
          'Compile regular expressions once with re.compile().',
          'Represent hierarchical comparisons with integer ranks.'
        ]
      }
    }
  ]
};

export const PYTHON_PART05_TRACK = DAY05_TRACK;
export const testCases = DAY05_TRACK.challenges.flatMap((c) => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY05_TRACK;
