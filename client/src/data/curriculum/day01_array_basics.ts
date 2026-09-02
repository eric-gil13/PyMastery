import type { DayTrack } from '../../types';

export const DAY01_ARRAY_BASICS_TRACK: DayTrack = {
  partNumber: 1,
  partId: 1,
  dayNumber: 1,
  id: 1,
  title: 'Part 1: Array Foundations & Creation',
  subtitle: 'Understand 1D arrays, data types, and fast buffer initialization',
  description: 'Learn why NumPy arrays are the foundational building block for numeric computing in Python. Discover how arrays differ from standard Python lists, master essential data types like float64 and int32, and practice creating arrays with np.zeros, np.ones, np.arange, and np.linspace.',
  iconName: 'Cpu',
  badge: 'Part 1 • NumPy Basics',
  libraryMechanics: {
    libraryName: 'NumPy Array Foundations',
    tagline: 'Unlock fast, typed numerical arrays with intuitive creation tools.',
    overview: `### 🌟 Welcome to NumPy: The Engine of Python Data Science
When you work with numbers in standard Python, you usually store them in a list: \`[1.0, 2.0, 3.0]\`. While Python lists are flexible and easy to use, they are not designed for high-speed mathematical operations.

In a Python list:
- Each number is an independent object floating separately in computer memory.
- Python has to inspect each element's type on every single operation.
- Doing math on a million numbers requires a million individual lookups.

### ⚡ The NumPy Solution: The ndarray
NumPy introduces the **ndarray** (N-dimensional array):
1. **Uniform Data Types (dtypes):** Every element in an array has the exact same type (e.g., all 64-bit floats or all 32-bit integers).
2. **Compact & Organized:** All numbers sit side-by-side in one neat, continuous row in memory.
3. **Effortless Math:** Operations happen across the entire array at compiled speed—no manual \`for\` loops required!`,
    whyItExists: `NumPy was built to give Python the speed and convenience of specialized scientific software.

Before NumPy, doing numerical math in Python meant writing slow \`for\` loops or resorting to writing C code by hand. NumPy gives you the best of both worlds:
- **Clean, expressive Python syntax:** Write \`arr * 2\` instead of looping over every item.
- **Lightning speed:** Behind the scenes, compiled routines calculate results instantly.
- **Universal compatibility:** Almost every major library in data science and AI (Pandas, PyTorch, SciPy, Matplotlib) builds directly on top of NumPy arrays.`,
    coreAnatomy: {
      objectName: 'ndarray',
      description: 'A NumPy array is a fast container for numbers of uniform type, characterized by its shape, data type (dtype), and total element count.',
      fields: [
        {
          name: 'dtype',
          type: 'np.dtype descriptor',
          role: 'The specific type of numbers stored (e.g., float64 for high-precision decimals, int32 for whole numbers).'
        },
        {
          name: 'shape',
          type: 'tuple[int, ...]',
          role: 'The dimensions of the array. For a 1D array of 5 elements, the shape is (5,).'
        },
        {
          name: 'ndim',
          type: 'int',
          role: 'Number of axes or dimensions (1 for a simple list/vector, 2 for a table/matrix).'
        },
        {
          name: 'size',
          type: 'int',
          role: 'The total number of elements contained in the array.'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------+
|                     Python List (Boxed Objects)             |
|  [ Ref to 1.5 ] ----> (Float Object: 24 bytes in heap)      |
|  [ Ref to 2.8 ] ----> (Float Object: 24 bytes in heap)      |
|  [ Ref to 3.2 ] ----> (Float Object: 24 bytes in heap)      |
+-------------------------------------------------------------+
                              vs
+-------------------------------------------------------------+
|               NumPy ndarray (Packed Numbers)                |
|  [  1.5  |  2.8  |  3.2  |  4.0  |  5.1  ] (8 bytes each)   |
|  Direct, contiguous slots of float64 in a single buffer     |
+-------------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-lists-vs-ndarrays',
        title: 'Python Lists vs NumPy Arrays',
        icon: 'Layers',
        summary: 'Why arrays are much faster and more memory-friendly than standard lists for numerical work.',
        markdownContent: `### Lists vs Arrays: The Mental Model

Think of a standard Python list like a **toolbox full of miscellaneous labeled jars**. Inside jar 1 is a float, jar 2 is an integer, and jar 3 is a string. When you ask Python to add 5 to everything in the toolbox, Python has to inspect each jar, check what kind of thing is inside, and decide how to add 5 to it.

A NumPy array is like an **ice cube tray**. Every single compartment has the exact same shape and holds the exact same kind of ice cube. Because everything is uniform:
- NumPy knows where every element is without searching.
- Calculations run in one swift sweep.

\`\`\`python
import numpy as np

# A Python list
py_list = [1.2, 3.4, 5.6]

# A NumPy 1D array
np_arr = np.array([1.2, 3.4, 5.6])
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-array-creation',
            title: 'Creating your first array from a Python list',
            code: `import numpy as np

# Convert a standard Python list of temperatures
temps_celsius = [21.5, 23.0, 19.8, 22.4]
arr = np.array(temps_celsius)

print("Array:", arr)
print("Data type (dtype):", arr.dtype)
print("Shape:", arr.shape)
print("Total elements (size):", arr.size)`,
            expectedOutput: `Array: [21.5 23.  19.8 22.4]
Data type (dtype): float64
Shape: (4,)
Total elements (size): 4`,
            explanation: 'np.array() inspects the input list and creates a typed, contiguous 1D array.'
          }
        ]
      },
      {
        id: 'ch2-dtypes-explained',
        title: 'Understanding Data Types (dtypes)',
        icon: 'Cpu',
        summary: 'Choosing between float64, float32, int32, and int64, and why types matter.',
        markdownContent: `### What is a dtype?

In NumPy, \`dtype\` stands for **data type**. It tells NumPy how many bits of memory each number uses and how to interpret them:

- \`np.float64\`: Standard 64-bit floating point number (default for decimal numbers in Python). High precision (up to 15-17 significant decimal digits).
- \`np.float32\`: 32-bit float (single precision). Uses half the memory, widely used in machine learning and graphics.
- \`np.int32\`: 32-bit integer (-2,147,483,648 to 2,147,483,647).
- \`np.int64\`: 64-bit integer for very large numbers.
- \`bool\`: Boolean (\`True\` or \`False\`), stored as 1 byte each.

You can explicitly specify the dtype when creating an array:
\`\`\`python
# Whole numbers stored as 32-bit integers
counts = np.array([10, 25, 42], dtype=np.int32)

# Convert from float to int using .astype()
floats = np.array([1.9, 2.1, 3.8])
ints = floats.astype(np.int32)  # [1, 2, 3] (decimals truncated)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-dtypes',
            title: 'Specifying and converting dtypes',
            code: `import numpy as np

# Explicit dtype creation
sensor_codes = np.array([101, 102, 103], dtype=np.int32)
voltages = np.array([3.3, 5.0, 1.8], dtype=np.float64)

# Casting with astype()
truncated_voltages = voltages.astype(np.int32)

print("sensor_codes dtype:", sensor_codes.dtype)
print("voltages dtype:", voltages.dtype)
print("truncated voltages:", truncated_voltages)`,
            expectedOutput: `sensor_codes dtype: int32
voltages dtype: float64
truncated voltages: [3 5 1]`,
            explanation: 'astype() creates a new array converted to the requested dtype. Truncation drops decimals without rounding.'
          }
        ]
      },
      {
        id: 'ch3-creation-helpers',
        title: 'Quick Array Generators: zeros, ones, and full',
        icon: 'Sparkles',
        summary: 'Pre-allocate arrays without typing numbers manually using np.zeros and np.ones.',
        markdownContent: `### Creating Blank Arrays Instantly

Frequently, you need an array of a known size before you have the actual data, such as a blank canvas, a sensor buffer, or a baseline reading:

- \`np.zeros(size)\`: Generates an array filled entirely with \`0.0\`.
- \`np.ones(size)\`: Generates an array filled entirely with \`1.0\`.
- \`np.full(size, fill_value)\`: Generates an array filled with any value you choose.

By default, these create arrays of \`float64\`, but you can pass \`dtype=np.int32\` or any other type.

\`\`\`python
# A buffer of 6 zeros
zero_buf = np.zeros(6)  # array([0., 0., 0., 0., 0., 0.])

# 4 multiplier flags of 1
scale_factors = np.ones(4)  # array([1., 1., 1., 1.])
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-zeros-ones',
            title: 'Pre-allocating buffers with zeros and ones',
            code: `import numpy as np

# 5 zero readings
baseline = np.zeros(5, dtype=np.float64)

# 4 unit multipliers
multipliers = np.ones(4, dtype=np.float64)

print("Baseline zeros:", baseline)
print("Multipliers ones:", multipliers)`,
            expectedOutput: `Baseline zeros: [0. 0. 0. 0. 0.]
Multipliers ones: [1. 1. 1. 1.]`,
            explanation: 'np.zeros and np.ones quickly construct ready-to-use arrays of any desired size and dtype.'
          }
        ]
      },
      {
        id: 'ch4-arange-vs-linspace',
        title: 'Sequences: np.arange vs np.linspace',
        icon: 'TrendingUp',
        summary: 'Master the difference between step-size sequences (arange) and point-count sequences (linspace).',
        markdownContent: `### How to Generate Number Sequences

When you need a sequence of numbers, NumPy provides two powerful functions. Picking the right one is easy once you understand their mental models:

#### 1. \`np.arange(start, stop, step)\` — 'Step-based'
- **Question it answers:** "I want to step by \`step\` until I reach \`stop\`."
- Just like Python's built-in \`range()\`, it stops **before** reaching \`stop\` (it excludes \`stop\`).
- Example: \`np.arange(0, 10, 2)\` $\\to$ \`[0, 2, 4, 6, 8]\`

#### 2. \`np.linspace(start, stop, num)\` — 'Count-based'
- **Question it answers:** "I want exactly \`num\` points evenly spaced between \`start\` and \`stop\`."
- Both \`start\` AND \`stop\` are **included** by default.
- Example: \`np.linspace(0, 10, 5)\` $\\to$ \`[0., 2.5, 5., 7.5, 10.]\`

> **Rule of Thumb:**
> - If you know the step size (e.g. "every 10 minutes"), use \`np.arange\`.
> - If you know the total number of points (e.g. "plot 50 points on this curve"), use \`np.linspace\`. With decimals, \`np.linspace\` avoids floating-point rounding errors!`,
        codeSnippets: [
          {
            id: 'snip-arange-linspace',
            title: 'Comparing arange vs linspace',
            code: `import numpy as np

# arange: step by 0.5 up to 3.0 (stop is excluded!)
steps = np.arange(0.0, 3.0, 0.5)

# linspace: exactly 5 points between 0.0 and 3.0 (stop is included!)
samples = np.linspace(0.0, 3.0, 5)

print("np.arange(0.0, 3.0, 0.5):", steps)
print("np.linspace(0.0, 3.0, 5):", samples)`,
            expectedOutput: `np.arange(0.0, 3.0, 0.5): [0.  0.5 1.  1.5 2.  2.5]
np.linspace(0.0, 3.0, 5): [0.   0.75 1.5  2.25 3.  ]`,
            explanation: 'Notice how arange stops before 3.0, whereas linspace lands exactly on 3.0 as its final point.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Expecting np.arange to include the stop value',
        badSnippet: `# Trying to generate numbers from 0 to 10 including 10:
numbers = np.arange(0, 10, 1)  # Ends at 9!`,
        badExplanation: 'Like Python range(), np.arange does not include the stop value in its output.',
        goodSnippet: `# Use linspace or set stop to stop + step:
numbers = np.linspace(0, 10, 11)  # Includes both 0 and 10`,
        goodExplanation: 'np.linspace includes the stop value by default and guarantees the exact number of samples you specify.',
        perfImpact: 'Prevents off-by-one errors and missing boundary points in calculations.'
      },
      {
        title: 'Using Python for-loops to create arrays item-by-item',
        badSnippet: `# Slow and unnecessary Python loop
res = []
for i in range(1000):
    res.append(i * 0.1)
arr = np.array(res)`,
        badExplanation: 'Growing a Python list element-by-element wastes memory allocations and is much slower.',
        goodSnippet: `# Instant single-call creation
arr = np.linspace(0, 99.9, 1000)
# or: arr = np.arange(1000) * 0.1`,
        goodExplanation: 'NumPy sequence generators create pre-allocated, fully populated arrays in compiled C in microseconds.',
        perfImpact: 'Up to 50x faster creation time.'
      },
      {
        title: 'Mixing up Python float with integer arrays',
        badSnippet: `# An array of integers accidentally truncating decimals
flags = np.array([1, 2, 3])  # dtype is int64
flags[0] = 4.9  # Silently stores 4!`,
        badExplanation: 'An integer array cannot hold decimal numbers; assigning a float will silently truncate the decimal part.',
        goodSnippet: `# Explicitly create a float array if decimals are expected
flags = np.array([1.0, 2.0, 3.0], dtype=np.float64)
flags[0] = 4.9  # Correctly stores 4.9`,
        goodExplanation: 'Specifying dtype=np.float64 ensures your array preserves precision when updating values.',
        perfImpact: 'Eliminates subtle numeric rounding and truncation bugs.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'np.array',
        category: 'Creation',
        signature: 'np.array(object, dtype=None)',
        summary: 'Create a NumPy array from a Python list, tuple, or sequence.',
        parameters: [
          { name: 'object', type: 'list | tuple | sequence', desc: 'Input sequence of data.' },
          { name: 'dtype', type: 'data-type, optional', desc: 'Desired data type (e.g. np.float64, np.int32).' }
        ],
        returns: 'np.ndarray containing the elements.',
        exampleSnippet: `arr = np.array([1.5, 2.5, 3.5], dtype=np.float64)`
      },
      {
        name: 'np.zeros',
        category: 'Creation',
        signature: 'np.zeros(shape, dtype=float)',
        summary: 'Return a new array of given shape and type, filled with zeros.',
        parameters: [
          { name: 'shape', type: 'int | tuple[int, ...]', desc: 'Number of elements or dimensions.' },
          { name: 'dtype', type: 'data-type, optional', desc: 'Desired data type, default is float64.' }
        ],
        returns: 'np.ndarray of zeros.',
        exampleSnippet: `buffer = np.zeros(10, dtype=np.float64)`
      },
      {
        name: 'np.ones',
        category: 'Creation',
        signature: 'np.ones(shape, dtype=float)',
        summary: 'Return a new array of given shape and type, filled with ones.',
        parameters: [
          { name: 'shape', type: 'int | tuple[int, ...]', desc: 'Number of elements or dimensions.' },
          { name: 'dtype', type: 'data-type, optional', desc: 'Desired data type, default is float64.' }
        ],
        returns: 'np.ndarray of ones.',
        exampleSnippet: `weights = np.ones(5, dtype=np.float64)`
      },
      {
        name: 'np.arange',
        category: 'Creation',
        signature: 'np.arange([start,] stop[, step], dtype=None)',
        summary: 'Return evenly spaced values within a half-open interval [start, stop) with a fixed step size.',
        parameters: [
          { name: 'start', type: 'number, optional', desc: 'Start of interval (default 0).' },
          { name: 'stop', type: 'number', desc: 'End of interval (exclusive).' },
          { name: 'step', type: 'number, optional', desc: 'Spacing between consecutive values (default 1).' }
        ],
        returns: '1D np.ndarray of stepped values.',
        exampleSnippet: `ticks = np.arange(0.0, 10.0, 2.0)`
      },
      {
        name: 'np.linspace',
        category: 'Creation',
        signature: 'np.linspace(start, stop, num=50, endpoint=True)',
        summary: 'Return a specified number of evenly spaced values over a closed interval [start, stop].',
        parameters: [
          { name: 'start', type: 'number', desc: 'Starting value of sequence.' },
          { name: 'stop', type: 'number', desc: 'Ending value of sequence.' },
          { name: 'num', type: 'int, optional', desc: 'Number of samples to generate (default 50).' }
        ],
        returns: 'np.ndarray of num equally spaced samples.',
        exampleSnippet: `coords = np.linspace(0.0, 1.0, 5)`
      },
      {
        name: 'arr.astype',
        category: 'Conversion',
        signature: 'arr.astype(dtype)',
        summary: 'Cast a copy of the array to a specified data type.',
        parameters: [
          { name: 'dtype', type: 'data-type', desc: 'Target data type (e.g. np.int32, np.float64).' }
        ],
        returns: 'New np.ndarray converted to the target dtype.',
        exampleSnippet: `int_arr = float_arr.astype(np.int32)`
      }
    ],
    interactiveWidgetType: 'numpy-strides'
  },
  challenges: [
    {
      id: 'd1-c1',
      dayId: 1,
      partId: 1,
      title: 'Sensor Reading Initializer',
      slug: 'sensor-reading-initializer',
      difficulty: 'Beginner',
      category: 'Array Foundations',
      summary: 'Convert raw sensor readings into typed NumPy arrays, and initialize zero and one reference buffers.',
      mentalModel5s: 'A Python list is a bag of pointers; a NumPy array is a uniform row of numbers. Use np.array for data, np.zeros for baselines, and np.ones for scale factors.',
      visualAnalogy: 'Think of standard Python lists as shopping bags holding wrapped gift items of different sizes, while a NumPy array is a precision egg carton where every slot holds the exact same kind of item and can be counted in one glance.',
      pitfalls: [
        'Forgetting to specify dtype=np.float64 when creating arrays from floats.',
        'Confusing baseline_count (the number of zeros) with the length of raw_readings.',
        'Not converting integer codes to np.int32, or letting them stay as floats.'
      ],
      progressiveHints: [
        'Tier 1 (Creating array): Use np.array(raw_readings, dtype=np.float64) to turn the raw list into a 64-bit float array.',
        'Tier 2 (Zeros): Use np.zeros(baseline_count, dtype=np.float64) to allocate your baseline array of zeros.',
        'Tier 3 (Ones): Use np.ones(len(raw_readings), dtype=np.float64) to create an array of ones matching the length of your readings.',
        'Tier 4 (Integer codes): Convert the readings to 32-bit integers using np.array(raw_readings, dtype=np.int32) or readings.astype(np.int32).'
      ],
      deepInternals: {
        title: 'Memory Uniformity & Dtypes',
        content: 'NumPy arrays store elements directly in continuous memory slots without Python object headers. Choosing np.float64 guarantees 8 bytes per number with double-precision IEEE 754 floating point accuracy.',
        keyRule: 'Always pick a deliberate dtype so you know the memory footprint and numerical precision of your data.'
      },
      instructions: `In real-world data pipelines (IoT devices, lab sensors, robotics), raw data arrives as standard Python lists of numbers. Your job is to initialize the fundamental NumPy arrays needed by downstream analytics.

Write a function \`init_sensor_data(raw_readings: list, baseline_count: int = 5) -> dict\` that:
1. Converts \`raw_readings\` into a NumPy array named \`"readings"\` with \`dtype=np.float64\`.
2. Creates an array of zeros named \`"baseline_zeros"\` of length \`baseline_count\` with \`dtype=np.float64\`.
3. Creates an array of ones named \`"scale_ones"\` of length equal to the number of elements in \`raw_readings\` with \`dtype=np.float64\`.
4. Creates an array of 32-bit integer status codes named \`"int_codes"\` by converting \`raw_readings\` to \`dtype=np.int32\` (which truncates decimal values).
5. Returns a dictionary containing all four arrays: \`{"readings": ..., "baseline_zeros": ..., "scale_ones": ..., "int_codes": ...}\`.`,
      hints: [
        'Use np.array(raw_readings, dtype=np.float64) for the readings.',
        'Use np.zeros(baseline_count, dtype=np.float64) for the baseline.',
        'Use np.ones(len(raw_readings), dtype=np.float64) for the scaling array.',
        'Use np.array(raw_readings, dtype=np.int32) or readings.astype(np.int32) for the integer codes.'
      ],
      starterCode: `import numpy as np

def init_sensor_data(raw_readings: list, baseline_count: int = 5) -> dict:
    """
    Initialize sensor buffers and typed arrays from raw readings.
    
    Args:
        raw_readings: List of float/int sensor readings
        baseline_count: Number of baseline zero readings to allocate
        
    Returns:
        Dictionary with 'readings', 'baseline_zeros', 'scale_ones', 'int_codes'
    """
    # TODO: Create the four NumPy arrays and return them in a dictionary
    pass
`,
      solutionCode: `import numpy as np

def init_sensor_data(raw_readings: list, baseline_count: int = 5) -> dict:
    readings = np.array(raw_readings, dtype=np.float64)
    baseline_zeros = np.zeros(baseline_count, dtype=np.float64)
    scale_ones = np.ones(len(raw_readings), dtype=np.float64)
    int_codes = np.array(raw_readings, dtype=np.int32)
    return {
        "readings": readings,
        "baseline_zeros": baseline_zeros,
        "scale_ones": scale_ones,
        "int_codes": int_codes,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Standard Sensor Readings',
          inputDescription: 'raw_readings=[21.5, 22.0, 19.8], baseline_count=4',
          expectedOutput: 'readings=[21.5, 22.0, 19.8] (float64), baseline_zeros of len 4, scale_ones of len 3, int_codes=[21, 22, 19] (int32)'
        },
        {
          id: 't2',
          name: 'Default Baseline Count',
          inputDescription: 'raw_readings=[10.2, 5.9], default baseline_count=5',
          expectedOutput: 'baseline_zeros has length 5'
        },
        {
          id: 't3',
          name: 'Empty Readings List',
          inputDescription: 'raw_readings=[], baseline_count=3',
          expectedOutput: 'readings, scale_ones, and int_codes all have length 0; baseline_zeros has length 3'
        }
      ],
      benchmarkTargetMs: 0.1,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'Array Creation & Data Types',
        subtitle: 'From Python lists to high-speed typed NumPy arrays',
        overview: 'NumPy arrays store numbers of uniform type in contiguous memory. This eliminates Python object overhead and enables fast mathematical operations.',
        mentalModel5s: 'Python lists store references to objects; NumPy arrays store pure, contiguous numbers of a single type.',
        visualAnalogy: 'A craft box with different trinkets (Python list) vs a precision ice cube tray where every slot is identical (NumPy array).',
        pitfalls: [
          'Assuming np.array() creates a float array when passed integers (it will use int64 if all inputs are ints).',
          'Not providing dtype explicitly when precision matters.'
        ],
        progressiveHints: [
          'Step 1: Convert raw_readings to np.float64 array.',
          'Step 2: Allocate zeros with np.zeros(baseline_count).',
          'Step 3: Allocate ones with np.ones(len(raw_readings)).',
          'Step 4: Convert to np.int32 using .astype(np.int32) or np.array(..., dtype=np.int32).'
        ],
        mathFormulas: [
          {
            title: 'Memory Footprint of Float64',
            latex: '\\text{Memory} = N \\times 8 \\text{ bytes}',
            explanation: 'Each float64 element occupies exactly 8 bytes of physical RAM.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual Python loops to create baseline buffers
zeros_list = [0.0] * baseline_count
ones_list = [1.0] * len(raw_readings)
int_list = [int(x) for x in raw_readings]`,
          naiveExplanation: 'Creates fragmented Python lists with slow per-element object allocations.',
          idiomaticCode: `# Clean, fast NumPy allocation
readings = np.array(raw_readings, dtype=np.float64)
baseline_zeros = np.zeros(baseline_count, dtype=np.float64)
scale_ones = np.ones(len(raw_readings), dtype=np.float64)
int_codes = readings.astype(np.int32)`,
          idiomaticExplanation: 'Directly allocates contiguous C buffers in a single operation.',
          speedupText: '25x faster'
        },
        memoryLayout: {
          title: 'Contiguous 1D Array Buffer',
          content: 'Elements are stored in sequential adjacent slots in memory. Accessing element i is a direct calculation of base_address + i * itemsize.',
          diagramAscii: `[Slot 0: 8 bytes] [Slot 1: 8 bytes] [Slot 2: 8 bytes] ... [Slot N-1: 8 bytes]`,
          keyRule: 'All elements in an ndarray share the same dtype and itemsize.'
        },
        keyTakeaways: [
          'NumPy arrays are typed and contiguous.',
          'np.zeros and np.ones pre-allocate buffers quickly.',
          'Use dtype=np.float64 for decimals and dtype=np.int32 for integers.',
          'astype() creates a converted copy of an array.'
        ]
      },
      expectedTensors: [
        { name: 'readings', shape: '(N,)', dtype: 'float64' },
        { name: 'baseline_zeros', shape: '(baseline_count,)', dtype: 'float64' },
        { name: 'scale_ones', shape: '(N,)', dtype: 'float64' },
        { name: 'int_codes', shape: '(N,)', dtype: 'int32' }
      ]
    },
    {
      id: 'd1-c2',
      dayId: 1,
      partId: 1,
      title: 'Range & Sampling Generator',
      slug: 'range-sampling-generator',
      difficulty: 'Beginner',
      category: 'Array Creation',
      summary: 'Generate stepped intervals and evenly spaced coordinate samples across specified intervals.',
      mentalModel5s: 'np.arange asks "what step size do you want?" np.linspace asks "how many points do you want in total?"',
      visualAnalogy: 'A wooden ruler with tick marks every 1 millimeter (np.arange) vs stretching a rubber band with 10 equally spaced beads between two posts (np.linspace).',
      pitfalls: [
        'Expecting np.arange to include the stop value (it excludes stop!).',
        'Confusing num_samples with step_size in np.linspace.',
        'Not validating that step is positive.'
      ],
      progressiveHints: [
        'Tier 1 (Input validation): Check if step <= 0 or num_samples < 1, and raise ValueError if so.',
        'Tier 2 (Stepped range): Use np.arange(start, stop, step) to create the sequence with fixed step size.',
        'Tier 3 (Linear samples): Use np.linspace(start, stop, num_samples) to place num_samples evenly across [start, stop].',
        'Tier 4 (Normalized coords): Use np.linspace(0.0, 1.0, num_samples) for normalized coordinates, and count steps with stepped_range.size.'
      ],
      deepInternals: {
        title: 'Step Spacing vs Interval Partitioning',
        content: 'np.arange steps forward by step until the next value would reach or exceed stop. np.linspace divides the exact mathematical distance (stop - start) by (num - 1), guaranteeing that the start and end values match exactly.',
        keyRule: 'Use np.linspace when you care about the endpoints and total count, especially when dealing with floating-point decimals.'
      },
      instructions: `When simulating physical processes, plotting curves, or taking measurements over time, you frequently need sequences of numbers:
1. Stepped time intervals (e.g., advance every 0.5 seconds).
2. Evenly spaced sample points (e.g., capture 100 evenly spaced readings across a time window).

Write a function \`generate_range_and_samples(start: float, stop: float, step: float, num_samples: int) -> dict\` that:
1. Validates inputs: If \`step <= 0\`, raise \`ValueError("Step size must be positive")\`. If \`num_samples < 1\`, raise \`ValueError("num_samples must be at least 1")\`.
2. Generates a 1D array named \`"stepped_range"\` containing values starting from start, stopping before stop, incrementing by step.
3. Generates a 1D array named \`"linear_samples"\` containing num_samples evenly spaced values across [start, stop].
4. Generates a 1D array named \`"unit_intervals"\` containing num_samples evenly spaced values across [0.0, 1.0].
5. Calculates \`"step_count"\` as an integer representing the total count of elements in \`stepped_range\`.
6. Returns a dictionary: \`{"stepped_range": ..., "linear_samples": ..., "unit_intervals": ..., "step_count": ...}\`.`,
      hints: [
        'np.arange(start, stop, step) takes start, stop, and step.',
        'np.linspace(start, stop, num_samples) takes start, stop, and the number of points.',
        'Use int(stepped_range.size) to get the total number of items in stepped_range.'
      ],
      starterCode: `import numpy as np

def generate_range_and_samples(start: float, stop: float, step: float, num_samples: int) -> dict:
    """
    Generate stepped ranges and linear sample points.
    
    Args:
        start: Start of the interval
        stop: End of the interval
        step: Step size between sequence values
        num_samples: Total number of evenly spaced sample points
        
    Returns:
        Dictionary with 'stepped_range', 'linear_samples', 'unit_intervals', 'step_count'
    """
    # TODO: Validate inputs, generate arrays, and return the dictionary
    pass
`,
      solutionCode: `import numpy as np

def generate_range_and_samples(start: float, stop: float, step: float, num_samples: int) -> dict:
    if step <= 0:
        raise ValueError("Step size must be positive")
    if num_samples < 1:
        raise ValueError("num_samples must be at least 1")
        
    stepped_range = np.arange(start, stop, step)
    linear_samples = np.linspace(start, stop, num_samples)
    unit_intervals = np.linspace(0.0, 1.0, num_samples)
    
    return {
        "stepped_range": stepped_range,
        "linear_samples": linear_samples,
        "unit_intervals": unit_intervals,
        "step_count": int(stepped_range.size),
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Even Integer Steps',
          inputDescription: 'start=0.0, stop=10.0, step=2.0, num_samples=5',
          expectedOutput: 'stepped_range=[0,2,4,6,8], linear_samples=[0, 2.5, 5, 7.5, 10], unit_intervals=[0, 0.25, 0.5, 0.75, 1], step_count=5'
        },
        {
          id: 't2',
          name: 'Fractional Steps',
          inputDescription: 'start=0.0, stop=1.0, step=0.25, num_samples=3',
          expectedOutput: 'stepped_range=[0, 0.25, 0.5, 0.75], linear_samples=[0, 0.5, 1.0], step_count=4'
        },
        {
          id: 't3',
          name: 'Invalid Parameters Raise ValueError',
          inputDescription: 'step=-1.0 or num_samples=0',
          expectedOutput: 'Raises ValueError with clear message'
        }
      ],
      benchmarkTargetMs: 0.1,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: 'Generating Sequences: arange vs linspace',
        subtitle: 'Controlling step size vs controlling sample count',
        overview: 'Generating numeric sequences is fundamental to plotting, simulation, and data sampling. Choosing between arange and linspace depends on whether you know the step size or the target number of samples.',
        mentalModel5s: 'arange is step-driven; linspace is count-driven.',
        visualAnalogy: 'Walking with fixed 2-foot strides until the finish line (arange) vs stretching a ribbon with 5 markers evenly placed from start to finish (linspace).',
        pitfalls: [
          'Using arange with floating point step sizes can sometimes lead to unexpected element counts due to decimal rounding. Prefer linspace when exact sample counts are desired.'
        ],
        progressiveHints: [
          'Step 1: Check step > 0 and num_samples >= 1.',
          'Step 2: Generate stepped_range with np.arange.',
          'Step 3: Generate linear_samples and unit_intervals with np.linspace.',
          'Step 4: Return dictionary.'
        ],
        mathFormulas: [
          {
            title: 'Linspace Spacing Formula',
            latex: '\\Delta x = \\frac{\\text{stop} - \\text{start}}{\\text{num} - 1}',
            explanation: 'The distance between adjacent sample points in linspace.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Generating sequences with Python loops
curr = start
steps = []
while curr < stop:
    steps.append(curr)
    curr += step`,
          naiveExplanation: 'Incurs float precision accumulation error and slow list operations.',
          idiomaticCode: `# Clean, vectorized NumPy sequence generation
stepped_range = np.arange(start, stop, step)
linear_samples = np.linspace(start, stop, num_samples)`,
          idiomaticExplanation: 'Computed with high-speed C arithmetic in a single call.',
          speedupText: '30x faster'
        },
        memoryLayout: {
          title: 'Sequential Values in Memory',
          content: 'Both arange and linspace construct flat contiguous 1D float arrays with direct stride-1 access.',
          diagramAscii: `[start] -> [start + dx] -> [start + 2*dx] -> ... -> [stop]`,
          keyRule: 'np.linspace includes both start and stop endpoints by default.'
        },
        keyTakeaways: [
          'Use np.arange when you have a fixed step size.',
          'Use np.linspace when you know the number of samples you want.',
          'np.linspace includes the stop point by default; np.arange excludes it.',
          'int(arr.size) gives the total element count.'
        ]
      },
      expectedTensors: [
        { name: 'stepped_range', shape: '(step_count,)', dtype: 'float64' },
        { name: 'linear_samples', shape: '(num_samples,)', dtype: 'float64' },
        { name: 'unit_intervals', shape: '(num_samples,)', dtype: 'float64' }
      ]
    }
  ]
};

export const PART01_ARRAY_BASICS_TRACK = DAY01_ARRAY_BASICS_TRACK;
export default DAY01_ARRAY_BASICS_TRACK;
