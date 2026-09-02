import type { DayTrack } from '../../types';

export const DAY03_TRACK: DayTrack = {
  partNumber: 3,
  partId: 3,
  dayNumber: 3,
  id: 3,
  title: 'Part 3: Indexing, Slicing & Views',
  subtitle: 'Master 1D & 2D slicing, row/column extraction, stepping strides, and memory views vs copies',
  description: 'Navigate multidimensional NumPy arrays with confidence. Master intuitive 2D grid coordinates, row and column slicing, stride stepping, and uncover the vital difference between zero-copy views and independent copies.',
  iconName: 'Cpu',
  badge: 'Part 3 • NumPy',
  libraryMechanics: {
    libraryName: 'NumPy Indexing, Slicing & Views',
    tagline: 'Master intuitive 1D & 2D slicing, row and column extractions, stride stepping, and zero-copy views.',
    overview: `### 🎯 Why Indexing and Slicing Matter
Every data science, machine learning, and image processing pipeline begins with selecting and reshaping data. Whether you are extracting a region of interest from an image, selecting specific feature columns from a tabular matrix, or downsampling sensor telemetry, slicing is your everyday superpower.

### 🖼️ The Visual Coordinate Model
Forget low-level pointer arithmetic—think of NumPy arrays visually:
- **1D Array:** A train of cargo cars numbered from \`0\` at the front to \`-1\` at the caboose.
- **2D Array:** A digital photo or spreadsheet grid. **Always remember: Row comes first, Column comes second! \`arr[row, col]\`.**
- **Slicing:** A transparent rectangular window sliding over the data. In NumPy, basic slicing doesn't duplicate numbers in RAM—it gives you a lightweight **view** looking directly into the original array.`,
    whyItExists: `In standard Python, slicing a list (\`my_list[1:4]\`) makes a completely new list, copying all pointers in memory. If you have a 1 GB list, slicing it doubles your RAM usage!

NumPy changes the game with **Zero-Copy Views**:
- When you slice an ndarray (\`sub = arr[100:500, :]\`), NumPy creates a lightweight Python wrapper that points directly to the existing data buffer in RAM.
- **Execution time is instantaneous (microseconds)** regardless of whether the array has 10 elements or 10 billion elements.
- However, because views share memory, modifying the view also modifies the parent array! When you need an isolated copy that won't mutate the original, NumPy gives you \`.copy()\`.`,
    coreAnatomy: {
      objectName: 'ndarray (Slices & Views)',
      description: 'A sliced view is an ndarray that shares its memory buffer with a parent array while maintaining its own shape, offset, and step strides.',
      fields: [
        {
          name: 'base',
          type: 'ndarray | None',
          role: 'References the original parent array if this array is a view, or None if the array owns its own memory.'
        },
        {
          name: 'flags.owndata',
          type: 'bool',
          role: 'Boolean indicating True if the array owns its memory buffer, or False if it borrows memory as a view.'
        },
        {
          name: 'shape',
          type: 'tuple[int, ...]',
          role: 'The dimensions of the slice (e.g. (4, 4) for a 4-row by 4-column cropped bounding box).'
        },
        {
          name: 'strides',
          type: 'tuple[int, ...]',
          role: 'The number of bytes to jump along each axis. Stepping arr[::2] doubles the stride jump!'
        },
        {
          name: 'ndim',
          type: 'int',
          role: 'The number of dimensions (1 for a vector/row, 2 for a matrix/grid).'
        }
      ],
      memoryDiagramAscii: `+-------------------------------------------------------------------------------+
|                       Original 4x4 Grid in RAM                                |
+-------+-------+-------+-------+-------+-------+-------+-------+-------+-------+
| (0,0) | (0,1) | (0,2) | (0,3) | (1,0) | (1,1) | (1,2) | (1,3) | (2,0) | (2,1) |
+-------+-------+-------+-------+-------+-------+-------+-------+-------+-------+
                                    ^               ^
                                    |               |
               +--------------------+---------------+--------------------+
               | Sliced View: arr[1:3, 1:3]  (Zero Bytes Copied!)         |
               | shape=(2, 2), base points to original array            |
               | Modifying view elements directly updates original RAM! |
               +---------------------------------------------------------+`
    },
    chapters: [
      {
        id: 'ch1-indexing-coords',
        title: '1D & 2D Indexing: Grids, Coordinates & Negative Offsets',
        icon: 'Cpu',
        summary: 'Master 0-indexed positions, negative wrap-around indices, and 2D grid coordinate indexing arr[row, col].',
        markdownContent: `### 1D Coordinates: Fast and Intuitive
In NumPy, 1D arrays are indexed just like Python lists:
\`\`\`python
arr = np.array([10, 20, 30, 40, 50])
print(arr[0])   # 10 (first item)
print(arr[-1])  # 50 (last item, wraps around from the back!)
print(arr[-2])  # 40 (second to last item)
\`\`\`

### 2D Matrix Coordinates: Row First, Column Second
In a 2D matrix, think of a spreadsheet or a chessboard:
- The first index selects the **Row** (vertical position).
- The second index selects the **Column** (horizontal position).

\`\`\`python
grid = np.array([
    [11, 12, 13, 14],
    [21, 22, 23, 24],
    [31, 32, 33, 34]
])

print(grid[0, 0])    # 11 (Top-left corner)
print(grid[1, 2])    # 23 (Row index 1, Col index 2)
print(grid[-1, -1])  # 34 (Bottom-right corner)
\`\`\`

> **Pro Tip:** In standard Python, nested lists require \`matrix[1][2]\`. In NumPy, always write \`matrix[1, 2]\`. It is faster, cleaner, and avoids creating temporary list objects!`,
        codeSnippets: [
          {
            id: 'snip-2d-indexing',
            title: 'Selecting Elements in a 2D Grid',
            code: `import numpy as np

# 3x4 matrix
A = np.array([
    [10, 20, 30, 40],
    [50, 60, 70, 80],
    [90, 100, 110, 120]
])

print("Element at Row 1, Col 2:", A[1, 2])
print("Bottom-right corner:", A[-1, -1])`,
            expectedOutput: `Element at Row 1, Col 2: 70
Bottom-right corner: 120`,
            explanation: 'Row index 1 refers to the second row [50, 60, 70, 80], and column index 2 picks the third element (70).'
          }
        ]
      },
      {
        id: 'ch2-slicing-extraction',
        title: 'Slicing & Extraction: Rows, Columns & Stride Stepping',
        icon: 'Layers',
        summary: 'Extract sub-matrices, full rows arr[r, :], full columns arr[:, c], and decimate with stride steps arr[::2].',
        markdownContent: `### The Slicing Formula: start:stop:step
A slice specifies a range:
- \`start\`: Beginning index (inclusive). Defaults to 0.
- \`stop\`: Ending index (**exclusive**). Slicing stops just before this index!
- \`step\`: Stride step size. Defaults to 1.

### Extracting Whole Rows and Columns
The colon \`:\` by itself means "all elements along this dimension":
- **Extract Row \`r\`:** \`arr[r, :]\` returns all columns in row \`r\` as a 1D array.
- **Extract Column \`c\`:** \`arr[:, c]\` returns all rows in column \`c\` as a 1D array.

\`\`\`python
# Extract the entire second row
row_one = grid[1, :]   # [21, 22, 23, 24]

# Extract the entire third column
col_two = grid[:, 2]   # [13, 23, 33]
\`\`\`

### 2D Bounding Boxes: Cropping Regions
To crop a rectangular region from rows \`r1\` to \`r2\` and columns \`c1\` to \`c2\`:
\`\`\`python
crop = grid[0:2, 1:3]
# [[12, 13],
#  [22, 23]]
\`\`\`

### Stride Stepping: Downsampling & Reversal
- \`arr[::2]\`: Selects every other element (\`0, 2, 4, ...\`). Great for downsampling!
- \`arr[1::2]\`: Selects alternating elements starting from index 1 (\`1, 3, 5, ...\`).
- \`arr[::-1]\`: Reverses the array with zero memory overhead!`,
        codeSnippets: [
          {
            id: 'snip-row-col-crop',
            title: 'Extracting Rows, Columns and Strided Subsamples',
            code: `import numpy as np

M = np.arange(16).reshape(4, 4)
print("Original 4x4:\n", M)

# Extract column 1
col1 = M[:, 1]
print("\nColumn 1:", col1)

# Downsample alternating rows and columns (stride 2)
downsampled = M[::2, ::2]
print("\nDownsampled 2x2:\n", downsampled)`,
            expectedOutput: `Original 4x4:
 [[ 0  1  2  3]
 [ 4  5  6  7]
 [ 8  9 10 11]
 [12 13 14 15]]

Column 1: [ 1  5  9 13]

Downsampled 2x2:
 [[ 0  2]
 [ 8 10]]`,
            explanation: 'M[:, 1] slices all rows for column 1. M[::2, ::2] steps across even rows and even columns.'
          }
        ]
      },
      {
        id: 'ch3-views-vs-copies',
        title: 'The Golden Rule: Views vs. Copies (and .copy())',
        icon: 'Sparkles',
        summary: 'Understand why basic slicing returns zero-copy views, how modifying views mutates parent arrays, and when to use .copy().',
        markdownContent: `### Views: The Double-Edged Sword
In NumPy, basic slicing creates a **view**, not a copy. A view shares the exact same memory buffer as the original array.

**The Benefit:** Slicing a 10-million-element matrix takes less than a microsecond and uses zero extra bytes of RAM!
**The Trap:** If you modify elements in a view, you inadvertently modify the original array!

\`\`\`python
original = np.array([10, 20, 30, 40])
sub = original[1:3]  # [20, 30] - this is a VIEW
sub[0] = 999         # mutate the view

print(original)      # [ 10, 999,  30,  40] <-- Original changed!
\`\`\`

### When to Use .copy()
If you want to edit your sliced data without affecting the original array, create an independent copy:
\`\`\`python
safe_sub = original[1:3].copy()
safe_sub[0] = 42

print(original[1])   # 999 (original is untouched!)
\`\`\`

### How to Check Memory Sharing
You can verify if two arrays share the same memory buffer using \`np.shares_memory(a, b)\`:
\`\`\`python
np.shares_memory(original, sub)       # True (View)
np.shares_memory(original, safe_sub)  # False (Independent copy)
\`\`\``,
        codeSnippets: [
          {
            id: 'snip-views-copies',
            title: 'Verifying Shared Memory with np.shares_memory',
            code: `import numpy as np

arr = np.array([1, 2, 3, 4, 5])
view_arr = arr[1:4]
copy_arr = arr[1:4].copy()

print("view_arr shares memory with arr?", np.shares_memory(arr, view_arr))
print("copy_arr shares memory with arr?", np.shares_memory(arr, copy_arr))`,
            expectedOutput: `view_arr shares memory with arr? True
copy_arr shares memory with arr? False`,
            explanation: 'view_arr references the underlying memory buffer of arr, while copy_arr allocates its own distinct buffer.'
          }
        ]
      }
    ],
    commonTraps: [
      {
        title: 'Accidentally Mutating Parent Data Through a Slice View',
        badSnippet: `# Intending to sanitize a subset of data
cleaned_patch = image[10:50, 10:50]
cleaned_patch[cleaned_patch < 0] = 0  # Inadvertently alters original image!`,
        badExplanation: 'Basic slicing returns a view. Modifying cleaned_patch alters pixels in image in-place.',
        goodSnippet: `# Explicitly isolate the patch with .copy()
cleaned_patch = image[10:50, 10:50].copy()
cleaned_patch[cleaned_patch < 0] = 0  # Original image remains intact`,
        goodExplanation: 'Calling .copy() detaches the slice from the parent memory buffer.',
        perfImpact: 'Prevent catastrophic data corruption bugs in production pipelines.'
      },
      {
        title: 'Chained Indexing arr[r][c] instead of Multidimensional Indexing arr[r, c]',
        badSnippet: `val = matrix[2][3]   # Creates temporary 1D slice, then indexes it`,
        badExplanation: 'matrix[2] allocates a 1D slice view, and then [3] indexes that slice. Slower and non-idiomatic.',
        goodSnippet: `val = matrix[2, 3]   # Direct multidimensional coordinate lookup`,
        goodExplanation: 'NumPy looks up the coordinate in a single step without intermediate object creation.',
        perfImpact: 'Up to 3x faster indexing in hot loops.'
      },
      {
        title: 'Off-By-One Errors with Half-Open Slice Intervals [start:stop)',
        badSnippet: `# Wanting rows 0, 1, 2, 3
sub = arr[0:3, :]  # Only extracts rows 0, 1, 2!`,
        badExplanation: 'The stop index in Python and NumPy is strictly exclusive. stop=3 stops before index 3.',
        goodSnippet: `sub = arr[0:4, :]  # Correctly extracts rows 0, 1, 2, 3`,
        goodExplanation: 'Specify stop = end_index + 1 to include the end row.',
        perfImpact: 'Avoid missing border rows or columns in bounding box extractions.'
      }
    ],
    apiCheatSheet: [
      {
        name: 'arr[start:stop:step]',
        category: 'Slicing',
        signature: 'arr[start:stop:step]',
        summary: 'Extract a sequence of elements from start (inclusive) to stop (exclusive) jumping by step.',
        parameters: [
          { name: 'start', type: 'int, optional', desc: 'Starting index (inclusive, defaults to 0).' },
          { name: 'stop', type: 'int, optional', desc: 'Stopping index (exclusive, defaults to len).' },
          { name: 'step', type: 'int, optional', desc: 'Stride step size (defaults to 1).' }
        ],
        returns: 'A zero-copy slice view of the array.',
        exampleSnippet: `x = np.arange(10)\nx[2:8:2]  # array([2, 4, 6])`
      },
      {
        name: 'arr[r, :] & arr[:, c]',
        category: 'Extraction',
        signature: 'arr[row_idx, :] / arr[:, col_idx]',
        summary: 'Extract an entire row or column from a 2D matrix as a 1D array.',
        parameters: [
          { name: 'row_idx / col_idx', type: 'int', desc: 'Index of row or column to extract.' }
        ],
        returns: '1D view of the selected row or column.',
        exampleSnippet: `M = np.ones((3, 4))\nrow0 = M[0, :]  # Shape (4,)\ncol1 = M[:, 1]  # Shape (3,)`
      },
      {
        name: 'arr.copy()',
        category: 'Memory',
        signature: 'arr.copy(order="C")',
        summary: 'Return a deep copy of the array with its own independent memory buffer.',
        parameters: [
          { name: 'order', type: 'str, optional', desc: 'Memory order: "C" (row-major) or "F" (column-major).' }
        ],
        returns: 'New ndarray owning its own data.',
        exampleSnippet: `sub = arr[0:5].copy()\nsub[0] = 99  # Does not modify arr!`
      },
      {
        name: 'np.shares_memory()',
        category: 'Inspection',
        signature: 'np.shares_memory(a, b)',
        summary: 'Determine if two arrays share memory (i.e. one is a view of the other).',
        parameters: [
          { name: 'a', type: 'ndarray', desc: 'First array.' },
          { name: 'b', type: 'ndarray', desc: 'Second array.' }
        ],
        returns: 'Boolean indicating True if memory is shared.',
        exampleSnippet: `view = arr[1:3]\nnp.shares_memory(arr, view)  # True`
      }
    ],
    interactiveWidgetType: 'numpy-strides'
  },
  challenges: [
    {
      id: 'd3-c1',
      dayId: 3,
      partId: 3,
      title: 'Sub-Grid Bounding Box Cropper',
      slug: 'sub-grid-bounding-box-cropper',
      difficulty: 'Beginner',
      category: 'Indexing & Slicing',
      summary: 'Extract rectangular bounding box regions and perimeter rows/columns from a 2D matrix using clean slice syntax.',
      mentalModel5s: 'Think of 2D slicing arr[r_start:r_end, c_start:c_end] as placing a transparent rectangular stencil over a grid: it isolates the region instantly without copying any data in RAM.',
      visualAnalogy: 'Cropping a photo in an image editor: you drag a rectangular selection box over the canvas, and inspect its four perimeter borders.',
      pitfalls: [
        'Confusing row and column order (NumPy is always row first, column second: arr[r, c]).',
        'Off-by-one errors: stop index is exclusive, so row_end is NOT included in the slice.',
        'Using Python nested list syntax arr[r][c] instead of NumPy comma notation arr[r, c].',
        'Unintentionally calling .copy() when zero-copy views are expected.'
      ],
      progressiveHints: [
        'Tier 1 (Coordinates): In a 2D matrix, the slice syntax is grid[row_start:row_end, col_start:col_end].',
        'Tier 2 (Cropped View): Assign cropped = grid[row_start:row_end, col_start:col_end].',
        'Tier 3 (Perimeter Rows): The top row of the cropped region is cropped[0, :], and the bottom row is cropped[-1, :].',
        'Tier 4 (Perimeter Columns): The left column is cropped[:, 0], and the right column is cropped[:, -1].'
      ],
      deepInternals: {
        title: 'Zero-Copy Sub-Matrix Slices',
        content: 'When you slice a 2D array, NumPy creates a new PyArrayObject header whose data pointer points to grid[row_start, col_start], inheriting the parent array strides without duplicating any byte data.',
        keyRule: 'NumPy 2D slices are zero-copy views; modifications affect the parent array.'
      },
      instructions: `Given a 2D NumPy array \`grid\` of shape $(H, W)$, implement \`crop_bounding_box\` to crop a rectangular sub-matrix and extract its 4 perimeter boundaries.

**Requirements:**
1. Extract the rectangular subgrid defined by the row and column boundaries, storing it under \`'cropped'\`.
2. Extract the boundary edges from the cropped region as 1D arrays:
   - \`'top_row'\`: The first row of the crop.
   - \`'bottom_row'\`: The last row of the crop.
   - \`'left_col'\`: The first column of the crop.
   - \`'right_col'\`: The last column of the crop.
3. Return a dictionary containing keys: \`'cropped'\`, \`'top_row'\`, \`'bottom_row'\`, \`'left_col'\`, and \`'right_col'\`.
4. Return zero-copy views directly from slicing without copying data.`,
      hints: [
        'Use grid[row_start:row_end, col_start:col_end] to create the cropped 2D view.',
        'Use cropped[0, :] to get the top row and cropped[-1, :] to get the bottom row.',
        'Use cropped[:, 0] to get the left column and cropped[:, -1] to get the right column.'
      ],
      starterCode: `import numpy as np

def crop_bounding_box(
    grid: np.ndarray,
    row_start: int,
    row_end: int,
    col_start: int,
    col_end: int
) -> dict:
    """
    Extract a rectangular bounding-box subgrid from a 2D array along with its boundary rows and columns.
    
    Args:
        grid: 2D numpy array of shape (H, W)
        row_start: starting row index (inclusive)
        row_end: ending row index (exclusive)
        col_start: starting col index (inclusive)
        col_end: ending col index (exclusive)
        
    Returns:
        dict containing:
            'cropped': 2D subgrid view of shape (row_end - row_start, col_end - col_start)
            'top_row': 1D top boundary row (first row of cropped region)
            'bottom_row': 1D bottom boundary row (last row of cropped region)
            'left_col': 1D left boundary column (first column of cropped region)
            'right_col': 1D last column of cropped region)
    """
    # TODO: Extract cropped subgrid and its 4 perimeter edges using 2D slicing
    pass
`,
      solutionCode: `import numpy as np

def crop_bounding_box(
    grid: np.ndarray,
    row_start: int,
    row_end: int,
    col_start: int,
    col_end: int
) -> dict:
    """
    Extract a rectangular bounding-box subgrid and its perimeter boundaries using 2D slicing.
    """
    if grid.ndim != 2:
        raise ValueError(f"Expected 2D array, got {grid.ndim}D")
        
    cropped = grid[row_start:row_end, col_start:col_end]
    if cropped.size == 0:
        raise ValueError("Cropped bounding box is empty")
        
    top_row = cropped[0, :]
    bottom_row = cropped[-1, :]
    left_col = cropped[:, 0]
    right_col = cropped[:, -1]
    
    return {
        "cropped": cropped,
        "top_row": top_row,
        "bottom_row": bottom_row,
        "left_col": left_col,
        "right_col": right_col,
    }
`,
      testCases: [
        { id: 't1', name: 'Standard 4x4 Crop in 6x6 Grid', inputDescription: 'grid shape (6,6), rows 1..5, cols 2..6', expectedOutput: 'cropped (4,4), top_row (4,), left_col (4,)' },
        { id: 't2', name: 'Zero-Copy Memory Check', inputDescription: 'np.shares_memory(grid, res["cropped"])', expectedOutput: 'True' },
        { id: 't3', name: 'Single 1x1 Cell Crop', inputDescription: 'grid shape (3,3), rows 1..2, cols 1..2', expectedOutput: 'cropped (1,1) with value 50' }
      ],
      benchmarkTargetMs: 0.15,
      memoryTargetMb: 0.05,
      conceptPrimer: {
        title: '2D Matrix Slicing & Bounding Box Extraction',
        subtitle: 'Navigating multi-dimensional arrays with row-first coordinate slices',
        overview: 'In 2D NumPy arrays, indexing is written as arr[row_slice, col_slice]. Extracting sub-grids, rows, and columns produces instant zero-copy views without copying data in memory.',
        mentalModel5s: 'arr[r1:r2, c1:c2] sets a 2D window frame over the array buffer.',
        visualAnalogy: 'A rectangular stencil placed on a physical grid map.',
        pitfalls: [
          'Confusing row and column order.',
          'Forgetting that stop indices are exclusive.'
        ],
        progressiveHints: [
          'Tier 1: 2D slice syntax is grid[r1:r2, c1:c2].',
          'Tier 2: top_row = cropped[0, :].',
          'Tier 3: bottom_row = cropped[-1, :].',
          'Tier 4: left_col = cropped[:, 0], right_col = cropped[:, -1].'
        ],
        deepInternals: {
          title: 'Strided Slice Pointer Math',
          content: 'A slice simply adjusts the pointer offset and dimension sizes in the ndarray metadata struct without heap reallocations.',
          keyRule: 'Slicing creates views; modifying a slice updates the original array.'
        },
        mathFormulas: [
          {
            title: '2D Slicing Indexing Range',
            latex: '\\text{grid}[r_s:r_e, c_s:c_e]_{i, j} = \\text{grid}[r_s + i, c_s + j], \\quad 0 \\le i < (r_e - r_s), \\; 0 \\le j < (c_e - c_s)',
            explanation: 'Maps local cropped coordinates (i, j) to global parent matrix coordinates.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Naive nested loop cropping (slow and verbose)
def naive_crop(grid, r1, r2, c1, c2):
    out = []
    for r in range(r1, r2):
        row = []
        for c in range(c1, c2):
            row.append(grid[r, c])
        out.append(row)
    return np.array(out)`,
          naiveExplanation: 'Incurs slow Python loop iterations and allocates new list structures.',
          idiomaticCode: `# Idiomatic 2D NumPy slice
def idiomatic_crop(grid, r1, r2, c1, c2):
    return grid[r1:r2, c1:c2]`,
          idiomaticExplanation: 'Direct 2D view creation executing in 0.2 microseconds with zero memory duplication.',
          speedupText: '150x faster'
        },
        memoryLayout: {
          title: 'Zero-Copy 2D View Layout',
          content: 'The sliced view points directly to the address of grid[r1, c1] and retains the original row stride.',
          diagramAscii: `Original Matrix:
[ 0,  1,  2,  3]
[ 4,  5,  6,  7]  --> Slice [1:3, 1:3] points to element 5
[ 8,  9, 10, 11]      View: [[ 5,  6], [ 9, 10]]
[12, 13, 14, 15]`,
          keyRule: 'Modifying elements inside a slice directly mutates the source array.'
        },
        keyTakeaways: [
          'Row index comes first, column index comes second: arr[row, col].',
          'Colon : alone means "all elements along this axis".',
          'Negative index -1 accesses the last item.',
          'Basic slicing returns zero-copy views.'
        ]
      },
      sampleDataFrame: {
        name: 'Bounding Box Coordinates Sample',
        columns: ['Box_ID', 'row_start', 'row_end', 'col_start', 'col_end', 'Crop_Height', 'Crop_Width'],
        dtypes: { Box_ID: 'int64', row_start: 'int64', row_end: 'int64', col_start: 'int64', col_end: 'int64', Crop_Height: 'int64', Crop_Width: 'int64' },
        rows: [
          { Box_ID: 1, row_start: 1, row_end: 5, col_start: 2, col_end: 6, Crop_Height: 4, Crop_Width: 4 },
          { Box_ID: 2, row_start: 0, row_end: 3, col_start: 0, col_end: 3, Crop_Height: 3, Crop_Width: 3 },
          { Box_ID: 3, row_start: 2, row_end: 4, col_start: 1, col_end: 5, Crop_Height: 2, Crop_Width: 4 }
        ],
        totalRows: 3,
        memoryUsageKb: 0.8
      },
      samplePlot: {
        id: 'p-crop',
        title: '2D Grid Bounding Box Slicing Visualizer',
        type: 'svg',
        description: 'Visual diagram illustrating a 6x6 matrix with a 4x4 cropped bounding box and highlighted boundary edges',
        svgContent: `<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="320" fill="#0f172a" rx="8"/>
          <!-- Grid Title -->
          <text x="30" y="35" fill="#f8fafc" font-size="16" font-weight="bold" font-family="system-ui">2D Array Cropping: grid[1:5, 2:6]</text>
          <text x="30" y="58" fill="#94a3b8" font-size="12" font-family="system-ui">Zero-copy sub-matrix bounding box with top/bottom rows & left/right cols</text>
          
          <!-- Outer Grid (6x6) -->
          <g transform="translate(60, 80)">
            <!-- Background Cells -->
            <rect x="0" y="0" width="240" height="192" fill="#1e293b" stroke="#334155" stroke-width="2" rx="4"/>
            <!-- Cropped Highlight Region (Rows 1..4, Cols 2..5) -->
            <!-- Each cell is 40x32 -->
            <rect x="80" y="32" width="160" height="128" fill="#065f46" fill-opacity="0.4" stroke="#10b981" stroke-width="2.5" stroke-dasharray="4" rx="3"/>
            
            <!-- Grid Lines -->
            <line x1="40" y1="0" x2="40" y2="192" stroke="#334155" stroke-width="1"/>
            <line x1="80" y1="0" x2="80" y2="192" stroke="#334155" stroke-width="1"/>
            <line x1="120" y1="0" x2="120" y2="192" stroke="#334155" stroke-width="1"/>
            <line x1="160" y1="0" x2="160" y2="192" stroke="#334155" stroke-width="1"/>
            <line x1="200" y1="0" x2="200" y2="192" stroke="#334155" stroke-width="1"/>
            
            <line x1="0" y1="32" x2="240" y2="32" stroke="#334155" stroke-width="1"/>
            <line x1="0" y1="64" x2="240" y2="64" stroke="#334155" stroke-width="1"/>
            <line x1="0" y1="96" x2="240" y2="96" stroke="#334155" stroke-width="1"/>
            <line x1="0" y1="128" x2="240" y2="128" stroke="#334155" stroke-width="1"/>
            <line x1="0" y1="160" x2="240" y2="160" stroke="#334155" stroke-width="1"/>
            
            <!-- Axis Labels -->
            <text x="-25" y="20" fill="#64748b" font-size="11" font-family="monospace">R0</text>
            <text x="-25" y="52" fill="#10b981" font-weight="bold" font-size="11" font-family="monospace">R1</text>
            <text x="-25" y="84" fill="#10b981" font-size="11" font-family="monospace">R2</text>
            <text x="-25" y="116" fill="#10b981" font-size="11" font-family="monospace">R3</text>
            <text x="-25" y="148" fill="#10b981" font-weight="bold" font-size="11" font-family="monospace">R4</text>
            <text x="-25" y="180" fill="#64748b" font-size="11" font-family="monospace">R5</text>
            
            <text x="15" y="-10" fill="#64748b" font-size="11" font-family="monospace">C0</text>
            <text x="55" y="-10" fill="#64748b" font-size="11" font-family="monospace">C1</text>
            <text x="95" y="-10" fill="#10b981" font-weight="bold" font-size="11" font-family="monospace">C2</text>
            <text x="135" y="-10" fill="#10b981" font-size="11" font-family="monospace">C3</text>
            <text x="175" y="-10" fill="#10b981" font-size="11" font-family="monospace">C4</text>
            <text x="215" y="-10" fill="#10b981" font-weight="bold" font-size="11" font-family="monospace">C5</text>
          </g>
          
          <!-- Legend and Info -->
          <g transform="translate(350, 90)">
            <rect x="0" y="0" width="220" height="180" fill="#1e293b" stroke="#334155" rx="6"/>
            <text x="15" y="28" fill="#38bdf8" font-size="13" font-weight="bold" font-family="system-ui">Extracted Views</text>
            
            <circle cx="25" cy="55" r="5" fill="#10b981"/>
            <text x="40" y="59" fill="#e2e8f0" font-size="12" font-family="monospace">cropped: (4, 4)</text>
            
            <circle cx="25" cy="85" r="5" fill="#f59e0b"/>
            <text x="40" y="89" fill="#e2e8f0" font-size="12" font-family="monospace">top_row: crop[0, :]</text>
            
            <circle cx="25" cy="115" r="5" fill="#ef4444"/>
            <text x="40" y="119" fill="#e2e8f0" font-size="12" font-family="monospace">bottom_row: crop[-1, :]</text>
            
            <circle cx="25" cy="145" r="5" fill="#a855f7"/>
            <text x="40" y="149" fill="#e2e8f0" font-size="12" font-family="monospace">left_col: crop[:, 0]</text>
            
            <text x="15" y="172" fill="#64748b" font-size="11" font-family="system-ui">Zero memory copied (all views)</text>
          </g>
        </svg>`
      },
      expectedTensors: [
        { name: 'grid', shape: '(6, 6)', dtype: 'int64' },
        { name: 'cropped', shape: '(4, 4)', dtype: 'int64' },
        { name: 'top_row', shape: '(4,)', dtype: 'int64' }
      ]
    },
    {
      id: 'd3-c2',
      dayId: 3,
      partId: 3,
      title: 'Alternating Pattern & Decimation',
      slug: 'alternating-pattern-decimation',
      difficulty: 'Intermediate',
      category: 'Striding & Views',
      summary: 'Downsample a 2D matrix using stride stepping, extract alternating patterns, and isolate an independent copy with .copy().',
      mentalModel5s: 'arr[::step, ::step] skips elements by stepping through memory. Slices share memory, so call .copy() whenever you need an independent array that won\'t mutate the original.',
      visualAnalogy: 'Walking along a tiled sidewalk taking two steps at a time (even tiles) or tracing only the black squares of a chessboard.',
      pitfalls: [
        'Mutating isolated_copy and accidentally mutating the original array because .copy() was omitted.',
        'Using negative step incorrectly (remember ::-1 reverses along an axis).',
        'Confusing step size with stop index (the 3rd slot in start:stop:step is the stride step).'
      ],
      progressiveHints: [
        'Tier 1 (Even Subsampling): To sample every `step` element starting from 0, use grid[::step, ::step].',
        'Tier 2 (Odd Subsampling): To sample every `step` element starting from index 1, use grid[1::step, 1::step].',
        'Tier 3 (Reversal): To reverse both dimensions, use a negative step: grid[::-1, ::-1].',
        'Tier 4 (Isolation): To create an independent copy that does not share memory, call even_sample.copy().'
      ],
      deepInternals: {
        title: 'Stride Stepping vs Memory Duplication',
        content: 'grid[::2, ::2] simply doubles the byte step in the view strides. The isolated copy allocates a fresh contiguous buffer and detaches its base pointer.',
        keyRule: 'Use .copy() to decouple an array from its source memory buffer.'
      },
      instructions: `Implement \`decimate_and_isolate(grid: np.ndarray, step: int = 2) -> dict\` to downsample a 2D matrix, extract alternating patterns, and create an independent copy.

**Requirements:**
1. \`'even_sample'\`: A 2D view taking every \`step\` elements starting from index 0 across both axes (\`grid[::step, ::step]\`).
2. \`'odd_sample'\`: A 2D view taking every \`step\` elements starting from index 1 across both axes (\`grid[1::step, 1::step]\`).
3. \`'reversed_grid'\`: A 2D view with all rows and columns reversed (\`grid[::-1, ::-1]\`).
4. \`'isolated_copy'\`: An independent deep copy of \`even_sample\` using \`.copy()\`.
5. Return a dictionary with keys: \`'even_sample'\`, \`'odd_sample'\`, \`'reversed_grid'\`, and \`'isolated_copy'\`.
6. Ensure that modifying \`isolated_copy\` does NOT modify \`grid\`.`,
      hints: [
        'grid[::step, ::step] steps across rows and columns by step size.',
        'grid[1::step, 1::step] starts at row 1 and column 1.',
        'grid[::-1, ::-1] reverses both dimensions.',
        'Call .copy() on even_sample to make an isolated copy.'
      ],
      starterCode: `import numpy as np

def decimate_and_isolate(grid: np.ndarray, step: int = 2) -> dict:
    """
    Downsample a 2D array using stride stepping, extract alternating patterns,
    and isolate an independent copy.
    
    Args:
        grid: 2D numpy array of shape (H, W)
        step: positive integer decimation step (e.g. 2 for every second element)
        
    Returns:
        dict containing:
            'even_sample': 2D view taking every \`step\` element from index 0: grid[::step, ::step]
            'odd_sample': 2D view taking every \`step\` element from index 1: grid[1::step, 1::step]
            'reversed_grid': 2D view with all rows and columns reversed: grid[::-1, ::-1]
            'isolated_copy': an independent deep copy of 'even_sample' using .copy()
    """
    # TODO: Implement stride stepping and independent copy isolation
    pass
`,
      solutionCode: `import numpy as np

def decimate_and_isolate(grid: np.ndarray, step: int = 2) -> dict:
    """
    Downsample a 2D array using stride stepping, extract alternating patterns, and isolate a copy.
    """
    if grid.ndim != 2:
        raise ValueError("Input grid must be 2D")
    if step <= 0:
        raise ValueError("Step must be positive")
        
    even_sample = grid[::step, ::step]
    odd_sample = grid[1::step, 1::step]
    reversed_grid = grid[::-1, ::-1]
    isolated_copy = even_sample.copy()
    
    return {
        "even_sample": even_sample,
        "odd_sample": odd_sample,
        "reversed_grid": reversed_grid,
        "isolated_copy": isolated_copy,
    }
`,
      testCases: [
        { id: 't1', name: '8x8 Grid Decimation (step=2)', inputDescription: 'grid shape (8,8), step=2', expectedOutput: 'even_sample (4,4), odd_sample (4,4), reversed (8,8)' },
        { id: 't2', name: 'Memory Isolation Check', inputDescription: 'np.shares_memory(grid, isolated_copy)', expectedOutput: 'False' },
        { id: 't3', name: 'Mutation Safety Test', inputDescription: 'Mutating isolated_copy must not alter grid', expectedOutput: 'grid values untouched' }
      ],
      benchmarkTargetMs: 0.20,
      memoryTargetMb: 0.10,
      conceptPrimer: {
        title: 'Stride Stepping & Memory Isolation',
        subtitle: 'Subsampling grids at C-speed and mastering array independence',
        overview: 'Stride stepping with arr[::step] allows downsampling arrays in O(1) time without looping. Knowing when an array is a view versus an independent copy is critical for memory safety.',
        mentalModel5s: 'Stepping hops across memory. Calling .copy() cuts the umbilical cord to the original array.',
        visualAnalogy: 'Downsampling an image by taking every second pixel like a checkerboard.',
        pitfalls: [
          'Forgetting that views mutate parent arrays.',
          'Not validating positive step values.'
        ],
        progressiveHints: [
          'Tier 1: Use grid[::step, ::step] for even sampling.',
          'Tier 2: Use grid[1::step, 1::step] for odd sampling.',
          'Tier 3: Use grid[::-1, ::-1] for reversing.',
          'Tier 4: Call .copy() for true memory detachment.'
        ],
        deepInternals: {
          title: 'How Strided Slices Work Internally',
          content: 'NumPy multiplies the array strides by the step factor. A step of 2 doubles the stride, telling the CPU to advance 2 items per step.',
          keyRule: 'Stride stepping never allocates memory; .copy() always allocates fresh memory.'
        },
        mathFormulas: [
          {
            title: 'Downsampled View Indexing',
            latex: '\\text{view}[i, j] = \\text{grid}[i \\times \\text{step}, \\; j \\times \\text{step}]',
            explanation: 'The new coordinate index is multiplied by the stride step.'
          }
        ],
        naiveVsIdiomatic: {
          naiveCode: `# Naive Python loop decimation
def naive_decimate(grid, step):
    rows = []
    for r in range(0, grid.shape[0], step):
        row = []
        for c in range(0, grid.shape[1], step):
            row.append(grid[r, c])
        rows.append(row)
    return np.array(rows)`,
          naiveExplanation: 'Incurs nested loops and creates intermediate Python list wrappers.',
          idiomaticCode: `# Idiomatic NumPy stride stepping
def idiomatic_decimate(grid, step):
    return grid[::step, ::step]`,
          idiomaticExplanation: 'Instantaneous O(1) strided slice creation in compiled C.',
          speedupText: '200x faster'
        },
        memoryLayout: {
          title: 'Stepping Through Memory Strides',
          content: 'Stepping with step=2 doubles the byte offset jump between elements, creating a view with new strides.',
          diagramAscii: `Original: [ 0,  1,  2,  3,  4,  5,  6,  7]  (Stride: 8B)
Stepped:  [ 0,      2,      4,      6    ]  (Stride: 16B - Stride Doubled!)`,
          keyRule: 'Slices modify strides; .copy() allocates a fresh contiguous buffer.'
        },
        keyTakeaways: [
          'arr[::2] selects every second element.',
          'arr[1::2] selects alternating elements starting at index 1.',
          'arr[::-1] reverses elements efficiently.',
          '.copy() guarantees independence from the source array.'
        ]
      },
      sampleDataFrame: {
        name: 'Decimation Pattern Benchmark',
        columns: ['Grid_Size', 'Step', 'Original_Shape', 'Even_Sample_Shape', 'Memory_Copied_Bytes'],
        dtypes: { Grid_Size: 'string', Step: 'int64', Original_Shape: 'string', Even_Sample_Shape: 'string', Memory_Copied_Bytes: 'int64' },
        rows: [
          { Grid_Size: 'Small', Step: 2, Original_Shape: '(8, 8)', Even_Sample_Shape: '(4, 4)', Memory_Copied_Bytes: 0 },
          { Grid_Size: 'Medium', Step: 2, Original_Shape: '(64, 64)', Even_Sample_Shape: '(32, 32)', Memory_Copied_Bytes: 0 },
          { Grid_Size: 'Large', Step: 3, Original_Shape: '(300, 300)', Even_Sample_Shape: '(100, 100)', Memory_Copied_Bytes: 0 }
        ],
        totalRows: 3,
        memoryUsageKb: 0.9
      },
      samplePlot: {
        id: 'p-decimate',
        title: 'Checkerboard Decimation & Alternating Stride Sampling',
        type: 'svg',
        description: 'Visual diagram of an 8x8 grid showing even samples, odd samples, and reversed stepping',
        svgContent: `<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <rect width="600" height="320" fill="#0f172a" rx="8"/>
          <text x="30" y="35" fill="#f8fafc" font-size="16" font-weight="bold" font-family="system-ui">Decimation & Alternating Strides: grid[::2, ::2]</text>
          <text x="30" y="58" fill="#94a3b8" font-size="12" font-family="system-ui">Even sampling (emerald), odd sampling (amber), and copy isolation</text>
          
          <!-- 8x8 Matrix representation -->
          <g transform="translate(60, 80)">
            <rect x="0" y="0" width="200" height="200" fill="#1e293b" stroke="#334155" stroke-width="2" rx="4"/>
            <!-- 4x4 Even samples (each 25x25) -->
            <!-- Even rows: 0, 2, 4, 6; Even cols: 0, 2, 4, 6 -->
            <rect x="0" y="0" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="50" y="0" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="100" y="0" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="150" y="0" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            
            <rect x="0" y="50" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="50" y="50" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="100" y="50" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="150" y="50" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            
            <rect x="0" y="100" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="50" y="100" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="100" y="100" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="150" y="100" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            
            <rect x="0" y="150" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="50" y="150" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="100" y="150" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            <rect x="150" y="150" width="25" height="25" fill="#10b981" fill-opacity="0.8"/>
            
            <!-- Odd samples: row 1, col 1, etc. -->
            <rect x="25" y="25" width="25" height="25" fill="#f59e0b" fill-opacity="0.6"/>
            <rect x="75" y="25" width="25" height="25" fill="#f59e0b" fill-opacity="0.6"/>
            <rect x="125" y="25" width="25" height="25" fill="#f59e0b" fill-opacity="0.6"/>
            <rect x="175" y="25" width="25" height="25" fill="#f59e0b" fill-opacity="0.6"/>
          </g>
          
          <!-- Legend and Info -->
          <g transform="translate(320, 90)">
            <rect x="0" y="0" width="250" height="180" fill="#1e293b" stroke="#334155" rx="6"/>
            <text x="15" y="28" fill="#38bdf8" font-size="13" font-weight="bold" font-family="system-ui">Pattern Breakdown</text>
            
            <rect x="15" y="45" width="14" height="14" fill="#10b981" rx="2"/>
            <text x="38" y="57" fill="#e2e8f0" font-size="12" font-family="monospace">even_sample: grid[::2, ::2]</text>
            
            <rect x="15" y="75" width="14" height="14" fill="#f59e0b" rx="2"/>
            <text x="38" y="87" fill="#e2e8f0" font-size="12" font-family="monospace">odd_sample: grid[1::2, 1::2]</text>
            
            <circle cx="22" cy="115" r="7" fill="#818cf8"/>
            <text x="38" y="119" fill="#e2e8f0" font-size="12" font-family="monospace">reversed: grid[::-1, ::-1]</text>
            
            <path d="M 15 145 L 30 145" stroke="#ec4899" stroke-width="3"/>
            <text x="38" y="149" fill="#e2e8f0" font-size="12" font-family="monospace">isolated: .copy() (No share)</text>
          </g>
        </svg>`
      },
      expectedTensors: [
        { name: 'grid', shape: '(8, 8)', dtype: 'int64' },
        { name: 'even_sample', shape: '(4, 4)', dtype: 'int64' },
        { name: 'isolated_copy', shape: '(4, 4)', dtype: 'int64' }
      ]
    }
  ]
};

export const PART03_TRACK = DAY03_TRACK;
export const DAY03_INDEXING_SLICING_TRACK = DAY03_TRACK;
export const PART03_INDEXING_SLICING_TRACK = DAY03_TRACK;
export default DAY03_TRACK;
