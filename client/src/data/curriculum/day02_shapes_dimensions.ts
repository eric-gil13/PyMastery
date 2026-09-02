import type { DayTrack } from '../../types';

export const DAY02_SHAPES_DIMENSIONS_TRACK: DayTrack = {
  partNumber: 2,
  partId: 2,
  dayNumber: 2,
  id: 2,
  title: 'Part 2: Shapes, Dimensions & Vectors',
  subtitle: 'Master 1D vectors, 2D matrices, 3D tensors, and flexible shape transformations',
  description: 'Explore how multi-dimensional arrays work in NumPy. Understand the clear distinction between 1D vectors (N,), 2D matrices (R, C), and 3D tensors (C, H, W). Learn to inspect .shape, .ndim, and .size, and reshape data effortlessly using -1 dimension inference and .flatten().',
  iconName: 'Layers',
  badge: 'Part 2 • NumPy Shapes',
  libraryMechanics: {
    libraryName: 'NumPy Shapes & Dimensions',
    tagline: 'Build solid intuition for vectors, matrices, and tensors without getting lost in dimensions.',
    overview: `### 📐 Dimensions in NumPy: From Lines to Cubes
Every NumPy array has a specific geometry defined by its **shape** and **dimensions (ndim)**:

- **1D Array (Vector):** Shape \`(N,)\` — A simple one-directional line of numbers (like a time-series or sensor stream).
- **2D Array (Matrix):** Shape \`(Rows, Columns)\` — A table, spreadsheet, grayscale image, or coordinate grid.
- **3D Array (Tensor):** Shape \`(Channels, Rows, Columns)\` or \`(Batch, Height, Width)\` — A stack of matrices, like a color photo with RGB channels or video frames over time.

### 🔄 Reshaping Without Moving Data
The most powerful feature of NumPy arrays is that reshaping is effortless. An array of 12 numbers can be viewed as:
- A 1D line of 12 elements: \`(12,)\`
- A 2D grid of 3 rows and 4 columns: \`(3, 4)\`
- A 2D grid of 6 rows and 2 columns: \`(6, 2)\`
- A 3D box of 2 layers, 3 rows, and 2 columns: \`(2, 3, 2)\`

The numbers themselves stay exactly where they are—NumPy simply changes the "lens" (the shape tuple) through which you view them!`,
    whyItExists: `In machine learning, computer vision, data analysis, and engineering, data naturally comes in different dimensions:
- Tabular data has rows and columns: \`(samples, features)\`.
- Images have color channels: \`(3, height, width)\`.
- Audio streams have time samples and audio channels.

NumPy gives you concise tools to query an array's geometry (\`.shape\`, \`.ndim\`, \`.size\`), transform between formats with \`.reshape()\`, and let NumPy automatically infer missing dimensions using \`-1\`.`,
    coreAnatomy: {
      objectName: 'Shape & Dimension Attributes',
      description: 'The geometry of any ndarray is described by three core properties: shape, ndim, and size.',
      fields: [
        {
          name: 'shape',
          type: 'tuple[int, ...]',
          role: 'A tuple describing the length along each axis (e.g. (3, 4) for 3 rows and 4 columns).'
        },
        {
          name: 'ndim',
          type: 'int',
          role: 'Number of dimensions or axes: 1 for vector, 2 for matrix, 3 for 3D tensor.'
        },
        {
          name: 'size',
          type: 'int',
          role: 'Total count of numbers in the array (equal to the product of all shape values).'
        }
      ],
      memoryDiagramAscii: `1D Vector: shape (6,)
[ 0 | 1 | 2 | 3 | 4 | 5 ]

2D Matrix: shape (2, 3) -> 2 rows, 3 cols
[[ 0, 1, 2 ],
 [ 3, 4, 5 ]]

3D Tensor: shape (2, 1, 3) -> 2 channels, 1 row, 3 cols
[[[ 0, 1, 2 ]],
 [[ 3, 4, 5 ]]]

All three views share the same 6 numbers in the exact same order!`
    },
    chapters: [
      {
        id: 'ch1-vectors-vs-matrices',
        title: '1D Vectors vs 2D Row/Column Matrices',
        icon: 'Grid',
        summary: 'Understand the critical difference between a 1D vector (N,) and a 2D matrix with shape (1, N) or (N, 1).',
        markdownContent: `### The Classic NumPy Stumbling Block: (N,) vs (1, N)

One of the most frequent surprises for programmers new to NumPy is the difference between a 1D array and a 2D matrix:

1. **1D Vector:** \`shape = (5,)\`
   - Has only **1 axis** (\`ndim == 1\`).
   - It is neither a row nor a column—it is simply a sequence of 5 values.
   - Example: \`v = np.array([1, 2, 3, 4, 5])\`

2. **2D Row Matrix:** \`shape = (1, 5)\`
   - Has **2 axes** (\`ndim == 2\`).
   - Represents a table with 1 row and 5 columns.
   - Example: \`row = np.array([[1, 2, 3, 4, 5]])\`

3. **2D Column Matrix:** \`shape = (5, 1)\`
   - Has **2 axes** (\`ndim == 2\`).
   - Represents a table with 5 rows and 1 column.
   - Example: \`col = v.reshape(5, 1)\`

\`\`\`python
import numpy as np

v = np.arange(4)            # shape: (4,),   ndim: 1
row = v.reshape(1, 4)       # shape: (1, 4), ndim: 2
col = v.reshape(4, 1)       # shape: (4, 1), ndim: 2
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-vector-dims',
            title: 'Inspecting 1D vs 2D shapes',
            code: `import numpy as np

vec = np.array([10, 20, 30])
print("1D Vector shape:", vec.shape, "ndim:", vec.ndim)

row_matrix = vec.reshape(1, 3)
print("2D Row shape:   ", row_matrix.shape, "ndim:", row_matrix.ndim)

col_matrix = vec.reshape(3, 1)
print("2D Column shape:", col_matrix.shape, "ndim:", col_matrix.ndim)`,
            expectedOutput: `1D Vector shape: (3,) ndim: 1
2D Row shape:    (1, 3) ndim: 2
2D Column shape: (3, 1) ndim: 2`,
            explanation: 'A 1D vector has a 1-tuple shape (3,), whereas 2D matrices always have 2-tuples like (1, 3) or (3, 1).'
          }
        ]
      },
      {
        id: 'ch2-inspecting-arrays',
        title: 'Inspecting Arrays: .shape, .ndim, and .size',
        icon: 'Layers',
        summary: 'How to check the dimensions, number of axes, and total elements of any array.',
        markdownContent: `### The Core Three Properties

Whenever you receive an unfamiliar array from a function, model, or file, always inspect these three attributes:

- \`arr.shape\`: A tuple of integers showing the size along each axis.
- \`arr.ndim\`: An integer count of dimensions (\`len(arr.shape)\`).
- \`arr.size\`: The total number of values stored (\`np.prod(arr.shape)\`).

\`\`\`python
table = np.zeros((4, 6))
print(table.shape)  # (4, 6) -> 4 rows, 6 columns
print(table.ndim)   # 2
print(table.size)   # 24 elements
\`\`\`

> **Conservation of Elements:**
> When you reshape an array, the new shape MUST have the exact same \`size\`. You cannot reshape 24 numbers into a \`(5, 5)\` grid because $5 \\times 5 = 25$!`,
        codeSnippets: [
          {
            id: 'snip-inspecting',
            title: 'Checking shape, ndim, and size',
            code: `import numpy as np

# A 3D tensor representing 2 color channels of a 3x4 image
tensor = np.ones((2, 3, 4), dtype=np.float32)

print("Shape:", tensor.shape)
print("Dimensions (ndim):", tensor.ndim)
print("Total elements (size):", tensor.size)
print("Rows per channel:", tensor.shape[1])
print("Cols per channel:", tensor.shape[2])`,
            expectedOutput: `Shape: (2, 3, 4)
Dimensions (ndim): 3
Total elements (size): 24
Rows per channel: 3
Cols per channel: 4`,
            explanation: 'The size is 2 * 3 * 4 = 24. ndim is 3 because the shape tuple has 3 numbers.'
          }
        ]
      },
      {
        id: 'ch3-reshape-and-inferred-dimensions',
        title: 'Reshaping with Auto-Inference (-1)',
        icon: 'Cpu',
        summary: 'Let NumPy calculate the missing dimension automatically using -1.',
        markdownContent: `### The Power of \`-1\` in \`.reshape()\`

Suppose you have 60 data samples and want to organize them into 5 columns. How many rows do you need? $60 / 5 = 12$.

Rather than doing mental division or calculating row counts in your head, NumPy lets you write **\`-1\`** for one dimension:

\`\`\`python
data = np.arange(60)

# NumPy calculates that -1 must be 12:
grid = data.reshape(-1, 5)
print(grid.shape)  # (12, 5)
\`\`\`

### Rules for using \`-1\`:
1. You can use \`-1\` for **at most one** dimension in a reshape call.
2. The total size must divide evenly by the other specified dimensions. If not, NumPy raises a \`ValueError\`.
3. Example: An array of 24 items reshaped as \`(2, -1, 3)\` automatically infers the middle dimension as $24 / (2 \\times 3) = 4$.`,
        codeSnippets: [
          {
            id: 'snip-reshape-inference',
            title: 'Reshaping with -1 auto-inference',
            code: `import numpy as np

stream = np.arange(20)

# Infer rows for 4 columns
matrix_4cols = stream.reshape(-1, 4)
print("Reshaped with (-1, 4):", matrix_4cols.shape)

# Infer columns for 2 rows
matrix_2rows = stream.reshape(2, -1)
print("Reshaped with (2, -1):", matrix_2rows.shape)`,
            expectedOutput: `Reshaped with (-1, 4): (5, 4)
Reshaped with (2, -1): (2, 10)`,
            explanation: 'NumPy infers 20 / 4 = 5 rows in the first case, and 20 / 2 = 10 columns in the second.'
          }
        ]
      },
      {
        id: 'ch4-flatten-and-tensors',
        title: 'Flattening Back to 1D and Multi-Channel Tensors',
        icon: 'TrendingUp',
        summary: 'How .flatten() restores 1D streams, and how 3D tensors stack 2D matrices into channels.',
        markdownContent: `### Flattening: Unfolding Back to 1D

When you are done processing a 2D image or 3D tensor and need to send it across a network or save it to a flat file, you can flatten it back into a 1D vector using \`.flatten()\`:

\`\`\`python
grid = np.array([[1, 2], [3, 4]])
flat = grid.flatten()
print(flat)  # [1, 2, 3, 4]
\`\`\`

### 3D Tensors: Stacking 2D Slices
A 3D tensor of shape \`(C, H, W)\` can be visualized as a **binder containing $C$ transparent sheets**, where each sheet is a 2D matrix of size $H \\times W$:

\`\`\`python
# 3 color channels (Red, Green, Blue), each 100x100 pixels
image_tensor = np.zeros((3, 100, 100))

# Access channel 0 (e.g. Red channel)
red_channel = image_tensor[0]  # Shape (100, 100)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-flatten-tensor',
            title: '3D tensor slicing and flattening',
            code: `import numpy as np

# Create 2 channels of 2x3 matrices
raw = np.arange(12)
tensor = raw.reshape(2, 2, 3)

print("Channel 0:")
print(tensor[0])

print("\nChannel 1:")
print(tensor[1])

# Flatten back to 1D
restored = tensor.flatten()
print("\nFlattened back to 1D:", restored)`,
            expectedOutput: `Channel 0:
[[0 1 2]
 [3 4 5]]

Channel 1:
[[ 6  7  8]
 [ 9 10 11]]

Flattened back to 1D: [ 0  1  2  3  4  5  6  7  8  9 10 11]`,
            explanation: 'tensor[0] extracts the first 2D channel. .flatten() returns a pristine 1D array with all original values in sequence.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Assuming .reshape() modifies the original array in-place',
        badSnippet: `# Thinking reshape modifies arr in-place:
arr = np.arange(10)
arr.reshape(2, 5)
print(arr.shape)  # Still (10,)!`,
        badExplanation: 'reshape() does not mutate the array in-place; it returns a new array with the requested shape.',
        goodSnippet: `# Assign the returned reshaped array:
arr = np.arange(10)
reshaped = arr.reshape(2, 5)
print(reshaped.shape)  # (2, 5)`,
        goodExplanation: 'Always assign the result of .reshape() to a new variable or back to the original name.',
        perfImpact: 'Prevents silent bugs where downstream code receives the wrong shape.'
      },
      {
        title: 'Reshaping into dimensions that do not match array.size',
        badSnippet: `# 10 elements cannot fit into a 3x4 grid (requires 12):
data = np.arange(10)
grid = data.reshape(3, 4)  # Crashes with ValueError!`,
        badExplanation: 'The product of the new shape dimensions must equal the total number of elements in the array.',
        goodSnippet: `# Verify divisibility or use -1:
data = np.arange(12)
grid = data.reshape(3, -1)  # Infers (3, 4)`,
        goodExplanation: 'Ensure total elements match, or use -1 to let NumPy calculate the correct dimension.',
        perfImpact: 'Avoids runtime ValueError crashes in production pipelines.'
      },
      {
        title: 'Confusing 1D vectors with 2D 1-row matrices',
        badSnippet: `# Expecting a 1D vector to have two indexing dimensions:
vec = np.array([1, 2, 3])  # Shape (3,)
val = vec[0, 1]  # IndexError: too many indices for array!`,
        badExplanation: 'A 1D array only has 1 axis, so you can only index it with a single number: vec[0].',
        goodSnippet: `# For 2D indexing, ensure the array is 2D:
mat = vec.reshape(1, 3)
val = mat[0, 1]  # Works correctly: 2`,
        goodExplanation: 'Check .ndim or .shape to know whether you are working with a 1D vector or a 2D matrix.',
        perfImpact: 'Prevents indexing errors and unexpected shape mismatches in linear algebra.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'arr.shape',
        category: 'Inspection',
        signature: 'arr.shape',
        summary: 'Tuple of integers indicating the size of the array along each dimension.',
        parameters: [],
        returns: 'tuple of ints.',
        exampleSnippet: `rows, cols = matrix.shape`
      },
      {
        name: 'arr.ndim',
        category: 'Inspection',
        signature: 'arr.ndim',
        summary: 'Number of array dimensions / axes (e.g. 1 for vector, 2 for matrix).',
        parameters: [],
        returns: 'int indicating dimension count.',
        exampleSnippet: `if arr.ndim == 1: print("1D vector")`
      },
      {
        name: 'arr.size',
        category: 'Inspection',
        signature: 'arr.size',
        summary: 'Total number of elements across all dimensions.',
        parameters: [],
        returns: 'int total element count.',
        exampleSnippet: `num_items = arr.size`
      },
      {
        name: 'arr.reshape',
        category: 'Reshaping',
        signature: 'arr.reshape(*shape, order="C")',
        summary: 'Returns an array with the same data but a new shape. One dimension can be -1.',
        parameters: [
          { name: 'shape', type: 'int | tuple[int, ...]', desc: 'New shape. One dimension can be -1 (inferred).' }
        ],
        returns: 'New reshaped ndarray view.',
        exampleSnippet: `grid = arr.reshape(4, -1)`
      },
      {
        name: 'arr.flatten',
        category: 'Reshaping',
        signature: 'arr.flatten()',
        summary: 'Return a 1D copy of the array collapsed into one dimension.',
        parameters: [],
        returns: '1D np.ndarray containing all elements sequentially.',
        exampleSnippet: `flat_vector = matrix.flatten()`
      }
    ],
    interactiveWidgetType: 'numpy-strides'
  },
  challenges: [
    {
      id: 'd2-c1',
      dayId: 2,
      partId: 2,
      title: 'Image / Grid Reshaper',
      slug: 'image-grid-reshaper',
      difficulty: 'Beginner',
      category: 'Shapes & Reshaping',
      summary: 'Transform flat 1D data streams into 2D matrices by automatically inferring dimensions and unfolding them back.',
      mentalModel5s: 'Reshaping does not change numbers—it only changes how many numbers you put on each row before starting a new line.',
      visualAnalogy: 'A long ribbon of 24 postage stamps (1D). You can fold the ribbon into a grid of 4 rows and 6 columns (2D). The stamps themselves never moved or changed.',
      pitfalls: [
        'Forgetting that stream.size must divide evenly by num_cols.',
        'Not checking that input stream is strictly 1D (stream.ndim == 1).',
        'Not verifying num_cols > 0.'
      ],
      progressiveHints: [
        'Tier 1 (Validation): Check if stream.ndim != 1, or num_cols <= 0, or stream.size % num_cols != 0, and raise ValueError.',
        'Tier 2 (Reshaping): Call stream.reshape(-1, num_cols) to let NumPy calculate the matching number of rows.',
        'Tier 3 (Flattening): Call grid.flatten() to produce the restored 1D copy.',
        'Tier 4 (Return dict): Package original_shape, original_ndim, grid, grid_shape, grid_rows, grid_cols, and recovered_flat into the result dictionary.'
      ],
      deepInternals: {
        title: 'Shape Inference with -1',
        content: 'When you pass -1 to reshape, NumPy computes the missing axis as inferred = arr.size // (product of other dimensions). This guarantees total element conservation without manual calculation.',
        keyRule: 'Reshape requires the total element count to remain strictly identical.'
      },
      instructions: `In image processing, sensor logs, and serial streams, data often arrives as a flat 1D sequence of numbers that actually represents a 2D spatial grid or grayscale image.

Write a function \`reshape_stream_to_grid(stream: np.ndarray, num_cols: int) -> dict\` that:
1. Validates the input:
   - If \`stream.ndim != 1\`, raise \`ValueError("Input stream must be a 1D array")\`.
   - If \`num_cols <= 0\`, raise \`ValueError("num_cols must be positive")\`.
   - If \`stream.size % num_cols != 0\`, raise \`ValueError(f"Stream of size {stream.size} cannot be reshaped into {num_cols} columns")\`.
2. Reshapes \`stream\` into a 2D matrix named \`"grid"\` with \`num_cols\` columns, automatically inferring the row count.
3. Flattens \`grid\` back into a 1D array named \`"recovered_flat"\`, unfolded into a flat 1D sequence.
4. Returns a dictionary with:
   - \`"original_shape"\`: \`stream.shape\`
   - \`"original_ndim"\`: \`int(stream.ndim)\`
   - \`"grid"\`: \`grid\`
   - \`"grid_shape"\`: \`grid.shape\`
   - \`"grid_rows"\`: \`int(grid.shape[0])\`
   - \`"grid_cols"\`: \`int(grid.shape[1])\`
   - \`"recovered_flat"\`: \`recovered_flat\``,
      hints: [
        'Check stream.ndim == 1 before reshaping.',
        'Check stream.size % num_cols == 0 to ensure clean division.',
        'Use stream.reshape(-1, num_cols) to let NumPy auto-calculate rows.',
        'Use grid.flatten() to get a flat 1D array back.'
      ],
      starterCode: `import numpy as np

def reshape_stream_to_grid(stream: np.ndarray, num_cols: int) -> dict:
    """
    Reshape a flat 1D stream into a 2D grid matrix with inferred row count.
    
    Args:
        stream: 1D numpy array
        num_cols: Desired number of columns in the 2D grid
        
    Returns:
        Dictionary containing metadata, reshaped grid, and recovered 1D array
    """
    # TODO: Validate inputs, reshape to a 2D grid with inferred row count, flatten back to 1D, and return dict
    pass
`,
      solutionCode: `import numpy as np

def reshape_stream_to_grid(stream: np.ndarray, num_cols: int) -> dict:
    if stream.ndim != 1:
        raise ValueError("Input stream must be a 1D array")
    if num_cols <= 0:
        raise ValueError("num_cols must be positive")
    if stream.size % num_cols != 0:
        raise ValueError(f"Stream of size {stream.size} cannot be reshaped into {num_cols} columns")
        
    grid = stream.reshape(-1, num_cols)
    recovered = grid.flatten()
    
    return {
        "original_shape": stream.shape,
        "original_ndim": int(stream.ndim),
        "grid": grid,
        "grid_shape": grid.shape,
        "grid_rows": int(grid.shape[0]),
        "grid_cols": int(grid.shape[1]),
        "recovered_flat": recovered,
    }
`,
      testCases: [
        {
          id: 't1',
          name: '12 Elements into 4 Columns',
          inputDescription: 'stream=np.arange(12), num_cols=4',
          expectedOutput: 'grid_shape=(3, 4), grid_rows=3, grid_cols=4, recovered_flat matches original'
        },
        {
          id: 't2',
          name: '20 Floats into 5 Columns',
          inputDescription: 'stream=np.linspace(0, 100, 20), num_cols=5',
          expectedOutput: 'grid_shape=(4, 5), grid_rows=4, grid_cols=5'
        },
        {
          id: 't3',
          name: 'Incompatible Size Raises ValueError',
          inputDescription: 'stream=np.arange(10), num_cols=3 (10 % 3 != 0)',
          expectedOutput: 'Raises ValueError'
        }
      ],
      benchmarkTargetMs: 0.1,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: '2D Reshaping & Shape Inference',
        subtitle: 'Turning flat streams into structured grids without data copying',
        overview: 'Reshaping changes an array’s shape tuple without copying the underlying buffer. The -1 placeholder lets NumPy deduce the missing dimension based on total element count.',
        mentalModel5s: 'Changing shapes changes line breaks, not the underlying words.',
        visualAnalogy: 'Arranging 12 soldiers in a single file line (12,) vs 3 rows of 4 (3, 4).',
        pitfalls: [
          'Attempting to reshape when the new dimensions do not multiply to the exact total size.'
        ],
        progressiveHints: [
          'Step 1: Check stream.ndim == 1.',
          'Step 2: Check stream.size % num_cols == 0.',
          'Step 3: Call stream.reshape(-1, num_cols).',
          'Step 4: Flatten with grid.flatten() and return dictionary.'
        ],
        mathFormulas: [
          {
            title: 'Auto-Inferred Dimension Formula',
            latex: '\\text{rows} = \\frac{\\text{size}}{\\text{cols}}',
            explanation: 'NumPy divides total size by known dimension to infer the -1 axis size.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual nested loop slicing
rows = len(stream) // num_cols
grid = []
for r in range(rows):
    grid.append(stream[r*num_cols : (r+1)*num_cols])
grid = np.array(grid)`,
          naiveExplanation: 'Allocates intermediate Python lists and performs slow indexing.',
          idiomaticCode: `# Direct zero-copy reshape
grid = stream.reshape(-1, num_cols)`,
          idiomaticExplanation: 'Creates a reshaped array instantly in constant time.',
          speedupText: '40x faster'
        },
        memoryLayout: {
          title: '2D Row-Major Layout',
          content: 'Row 0 is followed immediately by Row 1 in continuous memory.',
          diagramAscii: `Row 0: [0, 1, 2, 3] | Row 1: [4, 5, 6, 7] | Row 2: [8, 9, 10, 11]`,
          keyRule: 'grid.flatten() unfolds rows sequentially back into a 1D array.'
        },
        keyTakeaways: [
          '.shape describes dimensions; .ndim describes dimension count.',
          '-1 in reshape automatically calculates the matching dimension.',
          '.flatten() produces a 1D copy of any multi-dimensional array.',
          'Always validate divisibility before reshaping.'
        ]
      },
      expectedTensors: [
        { name: 'stream', shape: '(N,)', dtype: 'int64' },
        { name: 'grid', shape: '(R, C)', dtype: 'int64' },
        { name: 'recovered_flat', shape: '(N,)', dtype: 'int64' }
      ]
    },
    {
      id: 'd2-c2',
      dayId: 2,
      partId: 2,
      title: 'Multi-Channel Tensor Formatter',
      slug: 'multichannel-tensor-formatter',
      difficulty: 'Intermediate',
      category: 'Tensor Dimensions',
      summary: 'Organize flat data streams into 3D multi-channel tensors (Channels, Height, Width) and inspect slices.',
      mentalModel5s: 'A 3D tensor is like a photo album: each page is a 2D image (Height x Width), and the number of pages is the channel count.',
      visualAnalogy: 'A full-color photo made of 3 color sheets (Red, Green, Blue) pressed together. Each sheet is a 2D grid, and together they make a 3D block.',
      pitfalls: [
        'Passing dimensions that cannot divide the total elements.',
        'Not handling multidimensional inputs that need to be flattened first.',
        'Confusing the channel axis (index 0) with height or width.'
      ],
      progressiveHints: [
        'Tier 1 (Flatten if needed): If raw_stream.ndim > 1, use raw = raw_stream.flatten(), otherwise raw = raw_stream.',
        'Tier 2 (Validation): Verify num_channels > 0 and height > 0. If width == -1, verify raw.size % (num_channels * height) == 0.',
        'Tier 3 (Reshape to 3D): Reshape raw using raw.reshape(num_channels, height, -1) or raw.reshape(num_channels, height, width).',
        'Tier 4 (Extract and Slices): Extract tensor[0, :, :] for channel_0, and compute channel means using [float(np.mean(tensor[c])) for c in range(num_channels)].'
      ],
      deepInternals: {
        title: '3D Tensors in Computer Vision and Deep Learning',
        content: 'Deep learning frameworks (PyTorch, TensorFlow) represent images and feature maps as multi-dimensional tensors. The shape (Channels, Height, Width) separates distinct modalities (e.g. RGB or infrared) across channel planes while preserving 2D spatial coordinates.',
        keyRule: 'Slicing tensor[0] extracts the complete 2D matrix of channel 0.'
      },
      instructions: `In robotics, image processing, and audio machine learning, multi-sensor recordings arrive as a continuous stream of data points. To process them with modern algorithms, you must pack them into a 3D tensor organized as \`(Channels, Height, Width)\`.

Write a function \`format_multichannel_tensor(raw_stream: np.ndarray, num_channels: int, height: int, width: int = -1) -> dict\` that:
1. Normalizes input: If \`raw_stream\` has more than 1 dimension, flatten it first into a 1D array named \`raw\`; otherwise \`raw = raw_stream\`.
2. Validates parameters:
   - If \`num_channels <= 0\` or \`height <= 0\`, raise \`ValueError("Channels and height must be positive integers")\`.
   - If \`width == -1\`: verify that \`raw.size % (num_channels * height) == 0\`. If not, raise \`ValueError(f"Data of size {raw.size} cannot be divided into {num_channels} channels of height {height}")\`.
   - If \`width > 0\`: verify that \`raw.size == num_channels * height * width\`. If not, raise \`ValueError(f"Expected {num_channels * height * width} elements, but got {raw.size}")\`.
   - If \`width <= 0\` and \`width != -1\`: raise \`ValueError("width must be positive or -1")\`.
3. Reshapes \`raw\` into a 3D tensor of shape \`(num_channels, height, inferred_or_given_width)\`.
4. Extracts the 2D slice for channel 0 named \`"channel_0"\` (which has shape \`(height, width)\`).
5. Computes \`channel_means\` as a Python list of float values representing the mean of each channel across all its elements.
6. Returns a dictionary:
   - \`"tensor"\`: \`tensor\`
   - \`"shape"\`: \`tensor.shape\`
   - \`"ndim"\`: \`int(tensor.ndim)\`
   - \`"size"\`: \`int(tensor.size)\`
   - \`"channel_0"\`: \`channel_0\`
   - \`"channel_means"\`: \`channel_means\``,
      hints: [
        'Use raw.flatten() if raw.ndim > 1.',
        'Use raw.reshape(num_channels, height, -1) when width is -1.',
        'tensor[0] or tensor[0, :, :] extracts the 2D slice for the first channel.',
        'Use float(np.mean(tensor[c])) to calculate average values per channel.'
      ],
      starterCode: `import numpy as np

def format_multichannel_tensor(raw_stream: np.ndarray, num_channels: int, height: int, width: int = -1) -> dict:
    """
    Format a data stream into a 3D multi-channel tensor (Channels, Height, Width).
    
    Args:
        raw_stream: 1D (or multi-D) numpy array
        num_channels: Number of channels/modalities (C)
        height: Spatial height / rows per channel (H)
        width: Spatial width / columns per channel (W). Inferred if -1.
        
    Returns:
        Dictionary with tensor, shape, ndim, size, channel_0, and channel_means
    """
    # TODO: Validate dimensions, reshape to 3D tensor, extract channel 0, and return dict
    pass
`,
      solutionCode: `import numpy as np

def format_multichannel_tensor(raw_stream: np.ndarray, num_channels: int, height: int, width: int = -1) -> dict:
    raw = raw_stream.flatten() if raw_stream.ndim > 1 else raw_stream
    
    if num_channels <= 0 or height <= 0:
        raise ValueError("Channels and height must be positive integers")
        
    if width == -1:
        if raw.size % (num_channels * height) != 0:
            raise ValueError(f"Data of size {raw.size} cannot be divided into {num_channels} channels of height {height}")
        tensor = raw.reshape(num_channels, height, -1)
    else:
        if width <= 0:
            raise ValueError("width must be positive or -1")
        if raw.size != num_channels * height * width:
            raise ValueError(f"Expected {num_channels * height * width} elements, but got {raw.size}")
        tensor = raw.reshape(num_channels, height, width)
        
    channel_0 = tensor[0, :, :]
    channel_means = [float(np.mean(tensor[c])) for c in range(num_channels)]
    
    return {
        "tensor": tensor,
        "shape": tensor.shape,
        "ndim": int(tensor.ndim),
        "size": int(tensor.size),
        "channel_0": channel_0,
        "channel_means": channel_means,
    }
`,
      testCases: [
        {
          id: 't1',
          name: 'Inferred Width 3D Tensor',
          inputDescription: 'raw=np.arange(24), num_channels=2, height=3, width=-1',
          expectedOutput: 'shape=(2, 3, 4), ndim=3, size=24, channel_0 shape=(3, 4)'
        },
        {
          id: 't2',
          name: 'Explicit Width Tensor',
          inputDescription: 'raw=np.arange(30), num_channels=3, height=2, width=5',
          expectedOutput: 'shape=(3, 2, 5), ndim=3, channel_means has 3 values'
        },
        {
          id: 't3',
          name: 'Incompatible Size Validation',
          inputDescription: 'raw=np.arange(25), num_channels=2, height=3, width=-1',
          expectedOutput: 'Raises ValueError because 25 is not divisible by 6'
        }
      ],
      benchmarkTargetMs: 0.1,
      memoryTargetMb: 0.1,
      conceptPrimer: {
        title: '3D Tensors & Multi-Channel Structures',
        subtitle: 'From 2D matrices to higher-dimensional stacked arrays',
        overview: 'A 3D tensor extends a 2D matrix by adding a depth or channel axis. This is the standard data representation for RGB images, video frames, and multi-sensor telemetry.',
        mentalModel5s: 'Index 0 selects the channel page; indices 1 and 2 select the row and column on that page.',
        visualAnalogy: 'A stack of transparent slides where each slide represents one color or sensor channel.',
        pitfalls: [
          'Confusing tensor shape ordering. (C, H, W) is channels first, common in scientific and PyTorch workflows.'
        ],
        progressiveHints: [
          'Step 1: Check raw.ndim and flatten if > 1.',
          'Step 2: Validate num_channels > 0 and height > 0.',
          'Step 3: Handle width == -1 vs explicit width.',
          'Step 4: Extract channel_0 via tensor[0] and compute means.'
        ],
        mathFormulas: [
          {
            title: '3D Tensor Element Count',
            latex: '\\text{Total Elements} = C \\times H \\times W',
            explanation: 'The size of a 3D tensor is the product of its channels, height, and width.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Manual channel chunking with Python loops
channels = []
per_ch = len(raw) // num_channels
for c in range(num_channels):
    ch_slice = raw[c*per_ch : (c+1)*per_ch]
    channels.append(ch_slice.reshape(height, -1))
tensor = np.stack(channels)`,
          naiveExplanation: 'Incurs unnecessary slicing, list overhead, and stack re-allocations.',
          idiomaticCode: `# Direct single-pass 3D reshape
tensor = raw.reshape(num_channels, height, -1)`,
          idiomaticExplanation: 'Instantaneously views the contiguous buffer as a 3D tensor with zero memory copying.',
          speedupText: '35x faster'
        },
        memoryLayout: {
          title: '3D Contiguous Buffer Layout',
          content: 'Channel 0 elements are stored first, followed by Channel 1, and so on. Within each channel, elements are arranged row by row.',
          diagramAscii: `[Channel 0: H x W items] [Channel 1: H x W items] ... [Channel C-1: H x W items]`,
          keyRule: 'tensor[c] extracts the c-th 2D channel matrix directly.'
        },
        keyTakeaways: [
          '3D tensors stack multiple 2D matrices along a channel or batch axis.',
          'Use .reshape(C, H, -1) to auto-infer the spatial width.',
          'tensor[0] extracts the first channel matrix in O(1) time.',
          'ndim is 3 for any 3D tensor.'
        ]
      },
      expectedTensors: [
        { name: 'raw_stream', shape: '(N,)', dtype: 'int64' },
        { name: 'tensor', shape: '(C, H, W)', dtype: 'int64' },
        { name: 'channel_0', shape: '(H, W)', dtype: 'int64' }
      ]
    }
  ]
};

export const PART02_SHAPES_DIMENSIONS_TRACK = DAY02_SHAPES_DIMENSIONS_TRACK;
export default DAY02_SHAPES_DIMENSIONS_TRACK;
