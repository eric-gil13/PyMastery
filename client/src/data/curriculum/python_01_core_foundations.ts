import type { DayTrack, Challenge, ConceptPrimerData, TestCase } from '../../types';

export const DAY01_TRACK: DayTrack = {
  partNumber: 1,
  partId: 1,
  dayNumber: 1,
  id: 1,
  title: 'Part 1: Python Core Foundations & Memory Model',
  subtitle: 'Primitives, reference variables, truthiness rules, string formatting, and control flow',
  description: 'Master the fundamental building blocks of Python. Understand how Python variables act as pointers to heap objects rather than fixed memory slots, master the rules of truthiness, write idiomatic string operations with f-strings, and construct safe, branch-checked data sanitizers.',
  iconName: 'Cpu',
  badge: 'Part 1 • Python Foundations',
  libraryMechanics: {
    libraryName: 'Python Core Foundations',
    tagline: 'Names, pointers, reference counting, dynamic typing, and fundamental control flow.',
    overview: `### 🌟 Welcome to Pure Python Zero-to-Hero
Python is a dynamically-typed, garbage-collected language with a completely uniform object model: **everything in Python is an object**.

Unlike compiled languages like C or Go where a variable represents a fixed block of physical memory holding raw bytes, a Python variable is merely a **name tag** (pointer) bound to an object allocated on the heap.

### ⚡ The PyObject Foundation
Every object in CPython inherits from \`PyObject\`, containing at least two core header fields:
1. **\`ob_refcnt\`**: Reference count for automatic memory reclamation.
2. **\`ob_type\`**: A pointer to the type object describing its behavior and methods.

When you write \`a = 42\`, Python allocates an integer object on the heap and points the name \`a\` to it. When you write \`b = a\`, no new integer is created—\`b\` simply points to the exact same heap memory!`,
    whyItExists: `Understanding Python's memory model and reference semantics is the cornerstone of writing bug-free, high-performance code across every ecosystem (NumPy, Pandas, PyTorch).
- **Names vs Boxes:** Variables are pointers. Re-binding (\`x = 1\`) is distinct from in-place mutation (\`x.append(1)\`).
- **Truthiness:** Python evaluates objects in boolean contexts using \`__bool__\` and \`__len__\`. Empty collections (\`[]\`, \`{}\`, \`""\`) and \`0\`/\`None\` are falsy.
- **F-Strings:** Python 3.6+ formatted string literals evaluate expressions at runtime with compiled bytecode speed, replacing legacy \`%\` and \`.format()\` styles.`,
    coreAnatomy: {
      objectName: 'PyObject & Name Binding',
      description: 'The fundamental C structure underlying every runtime instance in CPython.',
      fields: [
        {
          name: 'ob_refcnt',
          type: 'Py_ssize_t (int64)',
          role: 'Tracks how many active references currently point to this heap object.'
        },
        {
          name: 'ob_type',
          type: 'struct _typeobject*',
          role: 'Pointer to the type descriptor defining methods, dunders, and memory size.'
        },
        {
          name: 'ob_ival / payload',
          type: 'digit / char[] / PyObject**',
          role: 'The actual payload value stored inside the heap container.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|             Python Memory Model: Stack vs Heap              |
|                                                             |
|  Stack (Namespace)                 Heap Memory (PyObject)   |
|  +--------------+                  +----------------------+ |
|  | Name: 'a'    | ------------->   | PyObject [int]       | |
|  +--------------+         |        | ob_refcnt: 2         | |
|  | Name: 'b'    | ---------+       | payload: 42          | |
|  +--------------+                  +----------------------+ |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-pointers-and-identity',
        title: 'Variables as Pointers: is vs ==',
        icon: 'Layers',
        summary: 'Learn why assignment never copies data and how Python manages object identity.',
        markdownContent: `### Assignment Never Copies in Python

In Python, assignment (\`=\`) never copies an underlying object; it strictly binds a name to an object reference.

\`\`\`python
# Both x and y point to the exact same list in RAM
x = [1, 2, 3]
y = x
y.append(4)
print(x)  # [1, 2, 3, 4]

# Identity (is) vs Equality (==)
print(x == y)  # True: values are equal
print(x is y)  # True: identical physical address in RAM (id(x) == id(y))
\`\`\`

To create an independent copy, explicitly create one:
\`\`\`python
z = x.copy()
print(z == x)  # True: same values
print(z is x)  # False: different objects in RAM!
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-identity',
            title: 'Exploring id() and is',
            code: `a = [10, 20, 30]
b = a
c = list(a)

print("id(a):", id(a))
print("id(b):", id(b))
print("id(c):", id(c))
print("a is b:", a is b)
print("a is c:", a is c)`,
            explanation: 'Assignment (b = a) creates an alias pointing to the same id; list(a) clones a new list instance.'
          }
        ]
      },
      {
        id: 'ch2-truthiness',
        title: 'Python Truthiness & Short-Circuiting',
        icon: 'Zap',
        summary: 'Master how Python evaluates expressions in boolean conditions.',
        markdownContent: `### The Truth Value Testing Protocol

Any object can be tested for truth value in an \`if\` or \`while\` condition.

The following are evaluated as **falsy**:
- Constants: \`None\` and \`False\`
- Zero of any numeric type: \`0\`, \`0.0\`, \`0j\`
- Empty sequences and collections: \`""\`, \`()\`, \`[]\`, \`{}\`, \`set()\`, \`range(0)\`

Everything else is **truthy**.

### Short-Circuit Evaluation
Python's \`and\` and \`or\` operators short-circuit and return the **actual operand value**, not a boolean:
\`\`\`python
# or returns the first truthy value, or the last falsy value
user_name = input_name or "Anonymous"

# and returns the first falsy value, or the last truthy value
status = is_authenticated and get_role()
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-truthiness',
            title: 'Short-Circuiting in Action',
            code: `default_name = "Guest"
provided_name = ""

name = provided_name or default_name
print("Resolved name:", name)

val = [] and "Never Evaluated"
print("Result of empty list and:", val)`,
            explanation: 'or returns the first truthy operand; and returns the first falsy operand.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Using `is` Instead of `==` for Numerical Comparison',
        badSnippet: `x = 1000\ny = 1000\nif x is y:\n    print("Match")`,
        badExplanation: 'CPython interns small integers (-5 to 256), so `is` fails unpredictably for larger numbers.',
        goodSnippet: `x = 1000\ny = 1000\nif x == y:\n    print("Match")`,
        goodExplanation: 'Use `==` to compare numerical values. Use `is` only for singletons like `None`.',
        perfImpact: 'Prevents catastrophic subtle bugs in numerical condition checking.'
      },
      {
        title: 'Quadratic String Concatenation in Loops',
        badSnippet: `s = ""\nfor word in words:\n    s += word + " "`,
        badExplanation: 'Because strings are immutable, `s += word` reallocates a new buffer every loop: O(N^2).',
        goodSnippet: `s = " ".join(words)`,
        goodExplanation: 'str.join() pre-calculates the required buffer size and copies bytes in a single O(N) pass.',
        perfImpact: 'Up to 100x faster execution and massive memory savings on large text streams.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'isinstance',
        category: 'Inspection',
        signature: 'isinstance(obj, classinfo) -> bool',
        summary: 'Check whether an object is an instance or subclass of a classinfo type.',
        parameters: [
          { name: 'obj', type: 'object', desc: 'The runtime instance to inspect.' },
          { name: 'classinfo', type: 'type | tuple[type, ...]', desc: 'A class or tuple of classes.' }
        ],
        returns: 'True if obj is an instance, False otherwise.',
        exampleSnippet: 'is_num = isinstance(val, (int, float))'
      },
      {
        name: 'id',
        category: 'Inspection',
        signature: 'id(obj) -> int',
        summary: 'Return the identity (memory address in CPython) of an object.',
        parameters: [
          { name: 'obj', type: 'object', desc: 'Any Python object.' }
        ],
        returns: 'Integer representing unique memory identity.',
        exampleSnippet: 'addr = id(my_var)'
      },
      {
        name: 'str.strip',
        category: 'String',
        signature: 'str.strip([chars]) -> str',
        summary: 'Return a copy of the string with leading and trailing characters removed.',
        parameters: [
          { name: 'chars', type: 'str, optional', desc: 'Characters to strip (whitespace by default).' }
        ],
        returns: 'Cleaned string.',
        exampleSnippet: 'clean = "  text  ".strip()'
      },
      {
        name: 'f-string',
        category: 'Formatting',
        signature: 'f"{value:spec}"',
        summary: 'Format variables and expressions at runtime with compiled bytecode speed.',
        parameters: [
          { name: 'spec', type: 'format_spec', desc: 'Formatting specification, e.g. .2f for floats.' }
        ],
        returns: 'Formatted string.',
        exampleSnippet: 'msg = f"Score: {score:.2f}"'
      }
    ],
    interactiveWidgetType: 'python-memory'
  },
  challenges: [
    {
      id: 'python-p1-c1',
      dayId: 1,
      partId: 1,
      title: 'Data Sanitizer & String Formatter',
      slug: 'data-sanitizer-string-formatter',
      difficulty: 'Beginner',
      category: 'String & Type Processing',
      summary: 'Clean raw user profile records, sanitize email addresses, round numerical scores, and format a standardized summary string.',
      estimatedTime: '15 min',
      instructions: `Write a function \`clean_and_format_record(raw_record: dict) -> dict\` that:
1. **Input Validation**:
   - If \`raw_record\` is not a dictionary or is empty, raise \`ValueError("raw_record must be a non-empty dict")\`.
   - The dictionary must contain keys \`"name"\`, \`"email"\`, \`"role"\`, and \`"score"\`. If any required key is missing, raise \`KeyError(f"Missing required key: {key}")\`.
2. **Sanitization Rules**:
   - \`name\`: Strip leading/trailing whitespace and convert to Title Case (e.g. \`"  jane DOE  "\` -> \`"Jane Doe"\`).
   - \`email\`: Strip whitespace and convert to all lowercase.
   - \`role\`: Strip whitespace and convert to UPPERCASE.
   - \`score\`: Convert to \`float\` rounded to 2 decimal places. If \`score\` cannot be converted to float or is negative, raise \`ValueError("Invalid score")\`.
3. **Generated Summary**:
   - Add a key \`"bio"\`: formatted exactly as \`"{name} ({role}) - Score: {score:.2f}"\`.
4. **Return**: A new dictionary with cleaned \`"name"\`, \`"email"\`, \`"role"\`, \`"score"\`, and \`"bio"\`.`,
      hints: [
        'Check `isinstance(raw_record, dict) and bool(raw_record)` upfront.',
        'Use `.strip().title()` for name, `.strip().lower()` for email, and `.strip().upper()` for role.',
        'Wrap float parsing in `try/except (TypeError, ValueError): raise ValueError("Invalid score")`.',
        'Format the bio string using `f"{name} ({role}) - Score: {score:.2f}"`.'
      ],
      starterCode: `def clean_and_format_record(raw_record: dict) -> dict:
    """
    Sanitize and format a raw user record.
    
    Args:
        raw_record: Dictionary containing 'name', 'email', 'role', 'score'.
        
    Returns:
        Cleaned dictionary with formatted 'bio' string.
    """
    # TODO: Validate input, clean values, build bio string, and return new dict
    pass
`,
      solutionCode: `def clean_and_format_record(raw_record: dict) -> dict:
    if not isinstance(raw_record, dict) or not raw_record:
        raise ValueError("raw_record must be a non-empty dict")
        
    required_keys = ("name", "email", "role", "score")
    for k in required_keys:
        if k not in raw_record:
            raise KeyError(f"Missing required key: {k}")
            
    name = str(raw_record["name"]).strip().title()
    email = str(raw_record["email"]).strip().lower()
    role = str(raw_record["role"]).strip().upper()
    
    try:
        score = float(raw_record["score"])
        if score < 0:
            raise ValueError("Invalid score")
        score = round(score, 2)
    except (TypeError, ValueError):
        raise ValueError("Invalid score")
        
    bio = f"{name} ({role}) - Score: {score:.2f}"
    
    return {
        "name": name,
        "email": email,
        "role": role,
        "score": score,
        "bio": bio,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Standard Dirty Record',
          inputDescription: "{name: '  alAN turing  ', email: ' ALAN@EXAMPLE.COM ', role: 'scientist ', score: '98.567'}",
          expectedOutput: "{name: 'Alan Turing', email: 'alan@example.com', role: 'SCIENTIST', score: 98.57, bio: 'Alan Turing (SCIENTIST) - Score: 98.57'}"
        },
        {
          id: 't2',
          name: 'Integer Score Formatted to 2 Decimals',
          inputDescription: "{name: 'ada lovelace', email: 'ada@math.org', role: 'engineer', score: 100}",
          expectedOutput: "bio: 'Ada Lovelace (ENGINEER) - Score: 100.00'"
        },
        {
          id: 't3',
          name: 'Missing Key Validation',
          inputDescription: "{name: 'Bob'}",
          expectedOutput: 'Raises KeyError'
        }
      ],
      benchmarkTargetMs: 0.05,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'String Cleaning & Safe Coercion',
        subtitle: 'Formatting strings and validating dictionary boundaries',
        overview: 'Data pipelines ingest messy inputs from web forms, JSON payloads, and log lines. Clean validation and formatting prevents data corruption.',
        mentalModel5s: 'Validate dictionary keys upfront -> Clean and coerce strings/floats -> Assemble f-string bio.',
        visualAnalogy: 'A quality-assurance sieve at a factory line: dirty parts are rejected or scrubbed before assembly.',
        pitfalls: [
          'Forgetting to check if input is a dict before indexing.',
          'Not handling negative numbers or string representations of numbers in float conversion.'
        ],
        progressiveHints: [
          'Step 1: Check `isinstance(raw_record, dict) and bool(raw_record)`.',
          'Step 2: Loop over required keys and check membership.',
          'Step 3: Use `.strip()`, `.title()`, `.lower()`, and `.upper()` on string fields.',
          'Step 4: Use `f"{score:.2f}"` to guarantee exactly 2 decimal places in bio.'
        ],
        mathFormulas: [
          {
            title: 'Round Half to Even',
            latex: '\\text{round}(x, 2)',
            explanation: 'Python uses round-to-even (banker rounding) to minimize statistical drift.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual string concatenation with % formatting
bio = name + " (" + role + ") - Score: " + "%0.2f" % score`,
          naiveExplanation: 'Hard to read, error-prone with spacing, and slower than f-strings.',
          idiomaticCode: `bio = f"{name} ({role}) - Score: {score:.2f}"`,
          idiomaticExplanation: 'F-strings are evaluated as optimized BUILD_STRING bytecode instructions in CPython.',
          speedupText: '2x faster'
        },
        memoryLayout: {
          title: 'String Immutability',
          content: 'Strings in Python are immutable PyASCIIObject or PyCompactUnicodeObject structures.',
          diagramAscii: `name = "Alan" -> [PyASCIIObject: length=4, hash=-1, ascii_bytes='A','l','a','n',0]`,
          keyRule: 'Every string transformation (.title(), .strip()) returns a brand new string instance.'
        },
        keyTakeaways: [
          'Always validate presence of dictionary keys before access.',
          'Use f-strings for all modern string templating.',
          'Wrap numeric type conversions in try/except blocks to gracefully catch invalid values.'
        ]
      }
    },
    {
      id: 'python-p1-c2',
      dayId: 1,
      partId: 1,
      title: 'Safe Numeric Converter & Metric Analyzer',
      slug: 'safe-numeric-converter-metric-analyzer',
      difficulty: 'Beginner',
      category: 'Control Flow & Truthiness',
      summary: 'Convert arbitrary raw metric inputs, categorize their magnitude within bounding ranges, and inspect mathematical parity.',
      estimatedTime: '15 min',
      instructions: `Write a function \`categorize_metric(val: any, low: float = 0.0, high: float = 100.0) -> dict\` that:
1. **Validation & Coercion**:
   - If \`val\` is \`None\` or a boolean (note: in Python, \`bool\` is a subclass of \`int\`), raise \`ValueError("val must be a valid numeric value")\`.
   - Attempt to coerce \`val\` to a \`float\`. If coercion fails, raise \`ValueError("val must be a valid numeric value")\`.
   - If \`low >= high\`, raise \`ValueError("low must be strictly less than high")\`.
2. **Range Categorization**:
   - If \`val < low\`: category is \`"below"\`.
   - If \`low <= val <= high\`: category is \`"in_range"\`.
   - If \`val > high\`: category is \`"above"\`.
3. **Parity Check**:
   - If \`val\` represents an exact integer (e.g. \`42.0\` or \`42\`):
     - Check if the integer is even (\`"even"\`) or odd (\`"odd"\`).
   - If \`val\` has a non-zero fractional part (e.g. \`42.5\`), parity is \`"non-integer"\`.
4. **Normalized Ratio**:
   - Compute \`ratio = (val - low) / (high - low)\` rounded to 4 decimal places.
5. **Return**: A dictionary with keys: \`"value"\` (float), \`"category"\` (str), \`"parity"\` (str), \`"ratio"\` (float).`,
      hints: [
        'Remember that `isinstance(True, int)` is True in Python! Check `isinstance(val, bool)` explicitly.',
        'Use `fval.is_integer()` on float values to verify if there is any decimal fraction.',
        'Compute `round((fval - flow) / (fhigh - flow), 4)`.'
      ],
      starterCode: `def categorize_metric(val: any, low: float = 0.0, high: float = 100.0) -> dict:
    """
    Safely convert and categorize a numeric metric against bounding thresholds.
    
    Args:
        val: Value to analyze (int, float, or numeric string).
        low: Lower bound (default 0.0).
        high: Upper bound (default 100.0).
        
    Returns:
        Dictionary with keys: 'value', 'category', 'parity', 'ratio'.
    """
    # TODO: Validate val and bounds, determine category and parity, compute ratio
    pass
`,
      solutionCode: `def categorize_metric(val: any, low: float = 0.0, high: float = 100.0) -> dict:
    if val is None or isinstance(val, bool):
        raise ValueError("val must be a valid numeric value")
        
    try:
        fval = float(val)
    except (TypeError, ValueError):
        raise ValueError("val must be a valid numeric value")
        
    flow = float(low)
    fhigh = float(high)
    if flow >= fhigh:
        raise ValueError("low must be strictly less than high")
        
    if fval < flow:
        category = "below"
    elif fval > fhigh:
        category = "above"
    else:
        category = "in_range"
        
    if fval.is_integer():
        int_val = int(fval)
        parity = "even" if int_val % 2 == 0 else "odd"
    else:
        parity = "non-integer"
        
    ratio = round((fval - flow) / (fhigh - flow), 4)
    
    return {
        "value": fval,
        "category": category,
        "parity": parity,
        "ratio": ratio,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'In-Range Integer Float',
          inputDescription: 'val=50.0, low=0, high=100',
          expectedOutput: "{value: 50.0, category: 'in_range', parity: 'even', ratio: 0.5}"
        },
        {
          id: 't2',
          name: 'Above Range Non-Integer',
          inputDescription: 'val="105.75", low=0, high=100',
          expectedOutput: "{value: 105.75, category: 'above', parity: 'non-integer', ratio: 1.0575}"
        },
        {
          id: 't3',
          name: 'Boolean Input Validation',
          inputDescription: 'val=True',
          expectedOutput: 'Raises ValueError (booleans rejected)'
        }
      ],
      benchmarkTargetMs: 0.05,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'Safe Coercion & Boolean Gotchas',
        subtitle: 'Why bool is an int and how to enforce strict type semantics',
        overview: 'In Python, bool subclasses int: `isinstance(True, int)` is True! Safe code checks for bool explicitly when handling numeric inputs.',
        mentalModel5s: 'Check `isinstance(val, bool)` before float coercion to prevent True becoming 1.0.',
        visualAnalogy: 'A strict bouncer at the door: checking specific credentials rather than relying on loose type affinity.',
        pitfalls: [
          'Checking `isinstance(val, (int, float))` without checking `not isinstance(val, bool)`.',
          'Using `% 2` directly on floats without verifying `f.is_integer()`.'
        ],
        progressiveHints: [
          'Step 1: Check `if val is None or isinstance(val, bool): raise ValueError()`.',
          'Step 2: Try converting `val`, `low`, and `high` to float.',
          'Step 3: Check `low < high`.',
          'Step 4: Use `fval.is_integer()` to decide if parity applies.'
        ],
        mathFormulas: [
          {
            title: 'Bounded Interval Mapping',
            latex: 'f(x) = \\frac{x - \\text{low}}{\\text{high} - \\text{low}}',
            explanation: 'Normalizes input x into a proportional [0, 1] interval.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Checking if float is int via string manipulation
if "." in str(fval) and str(fval).split(".")[1] != "0":
    parity = "non-integer"`,
          naiveExplanation: 'Fragile, slow string parsing fails on scientific notation (e.g. 1e-05).',
          idiomaticCode: `if fval.is_integer():
    parity = "even" if int(fval) % 2 == 0 else "odd"
else:
    parity = "non-integer"`,
          idiomaticExplanation: 'Python float built-in .is_integer() checks IEEE-754 mantissa directly.',
          speedupText: '10x faster'
        },
        memoryLayout: {
          title: 'IEEE 754 Float PyFloatObject',
          content: 'A Python float wraps an 8-byte C double.',
          diagramAscii: `PyFloatObject: [ob_refcnt (8B) | ob_type (8B) | double ob_fval (8B)] = 24 bytes total`,
          keyRule: 'Float objects are immutable; arithmetic produces new PyFloatObjects.'
        },
        keyTakeaways: [
          'Remember that bool subclasses int in Python.',
          'Use .is_integer() on floats to safely test for whole numbers.',
          'Validate boundary constraints (low < high) before computing ratios.'
        ]
      }
    }
  ]
};

export const PYTHON_PART01_TRACK = DAY01_TRACK;
export const testCases = DAY01_TRACK.challenges.flatMap((c) => c.testCases);
export type { DayTrack, Challenge, ConceptPrimerData, TestCase };
export default DAY01_TRACK;
