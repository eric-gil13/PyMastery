import type { DayTrack, LibraryId } from '../types';

// 0. Pure Python (Parts 1-7)
import { PYTHON_PART01_TRACK } from './curriculum/python_01_core_foundations';
import { PYTHON_PART02_TRACK } from './curriculum/python_02_data_structures';
import { PYTHON_PART03_TRACK } from './curriculum/python_03_functions';
import { PYTHON_PART04_TRACK } from './curriculum/python_04_oop_dunders';
import { PYTHON_PART05_TRACK } from './curriculum/python_05_iterators_generators';
import { PYTHON_PART06_TRACK } from './curriculum/python_06_decorators_context';
import { PYTHON_PART07_TRACK } from './curriculum/python_07_modern_capstone';

// 1. NumPy (Parts 1-7)
import { DAY01_ARRAY_BASICS_TRACK as NUMPY_PART01 } from './curriculum/day01_array_basics';
import { DAY02_SHAPES_DIMENSIONS_TRACK as NUMPY_PART02 } from './curriculum/day02_shapes_dimensions';
import { DAY03_TRACK as NUMPY_PART03 } from './curriculum/day03_indexing_slicing';
import { DAY04_TRACK as NUMPY_PART04 } from './curriculum/day04_vectorized_math';
import { DAY05_TRACK as NUMPY_PART05 } from './curriculum/day05_aggregations_axes';
import { DAY06_TRACK as NUMPY_PART06 } from './curriculum/day06_boolean_masking';
import { DAY07_TRACK as NUMPY_PART07 } from './curriculum/day07_broadcasting_linear_algebra';

// 2. Pandas (Parts 1-7)
import { PANDAS_PART01_TRACK } from './curriculum/pandas_01_series_dataframe';
import { PANDAS_PART02_TRACK } from './curriculum/pandas_02_indexing_selection';
import { PANDAS_PART03_TRACK } from './curriculum/pandas_03_cleaning_missing';
import { PANDAS_PART04_TRACK } from './curriculum/pandas_04_groupby_aggregations';
import { PANDAS_PART05_TRACK } from './curriculum/pandas_05_merging_joining';
import { PANDAS_PART06_TRACK } from './curriculum/pandas_06_datetime_timeseries';
import { PANDAS_PART07_TRACK } from './curriculum/pandas_07_analytics_pipeline';

// 3. Matplotlib (Parts 1-4)
import { MATPLOTLIB_PART01_TRACK } from './curriculum/matplotlib_01_foundations';
import { MATPLOTLIB_PART02_TRACK } from './curriculum/matplotlib_02_chart_types';
import { MATPLOTLIB_PART03_TRACK } from './curriculum/matplotlib_03_subplots';
import { MATPLOTLIB_PART04_TRACK } from './curriculum/matplotlib_04_customization';

// 4. Scikit-Learn (Parts 1-6)
import { SKLEARN_PART01_TRACK } from './curriculum/sklearn_01_workflow';
import { SKLEARN_PART02_TRACK } from './curriculum/sklearn_02_preprocessing';
import { SKLEARN_PART03_TRACK } from './curriculum/sklearn_03_classification';
import { SKLEARN_PART04_TRACK } from './curriculum/sklearn_04_regression';
import { SKLEARN_PART05_TRACK } from './curriculum/sklearn_05_cross_validation';
import { SKLEARN_PART06_TRACK } from './curriculum/sklearn_06_pipelines';

// 5. PyTorch (Parts 1-7)
import { PYTORCH_PART01_TRACK } from './curriculum/pytorch_01_tensors';
import { PYTORCH_PART02_TRACK } from './curriculum/pytorch_02_autograd';
import { PYTORCH_PART03_TRACK } from './curriculum/pytorch_03_modules';
import { PYTORCH_PART04_TRACK } from './curriculum/pytorch_04_loss_optim';
import { PYTORCH_PART05_TRACK } from './curriculum/pytorch_05_training_loop';
import { PYTORCH_PART06_TRACK } from './curriculum/pytorch_06_datasets';
import { PYTORCH_PART07_TRACK } from './curriculum/pytorch_07_architectures';

export const PYTHON_ZERO_TO_HERO_TRACKS: DayTrack[] = [
  PYTHON_PART01_TRACK,
  PYTHON_PART02_TRACK,
  PYTHON_PART03_TRACK,
  PYTHON_PART04_TRACK,
  PYTHON_PART05_TRACK,
  PYTHON_PART06_TRACK,
  PYTHON_PART07_TRACK,
];

export const NUMPY_ZERO_TO_HERO_TRACKS: DayTrack[] = [
  NUMPY_PART01,
  NUMPY_PART02,
  NUMPY_PART03,
  NUMPY_PART04,
  NUMPY_PART05,
  NUMPY_PART06,
  NUMPY_PART07,
];

export const PANDAS_ZERO_TO_HERO_TRACKS: DayTrack[] = [
  PANDAS_PART01_TRACK,
  PANDAS_PART02_TRACK,
  PANDAS_PART03_TRACK,
  PANDAS_PART04_TRACK,
  PANDAS_PART05_TRACK,
  PANDAS_PART06_TRACK,
  PANDAS_PART07_TRACK,
];

export const MATPLOTLIB_ZERO_TO_HERO_TRACKS: DayTrack[] = [
  MATPLOTLIB_PART01_TRACK,
  MATPLOTLIB_PART02_TRACK,
  MATPLOTLIB_PART03_TRACK,
  MATPLOTLIB_PART04_TRACK,
];

export const SKLEARN_ZERO_TO_HERO_TRACKS: DayTrack[] = [
  SKLEARN_PART01_TRACK,
  SKLEARN_PART02_TRACK,
  SKLEARN_PART03_TRACK,
  SKLEARN_PART04_TRACK,
  SKLEARN_PART05_TRACK,
  SKLEARN_PART06_TRACK,
];

export const PYTORCH_ZERO_TO_HERO_TRACKS: DayTrack[] = [
  PYTORCH_PART01_TRACK,
  PYTORCH_PART02_TRACK,
  PYTORCH_PART03_TRACK,
  PYTORCH_PART04_TRACK,
  PYTORCH_PART05_TRACK,
  PYTORCH_PART06_TRACK,
  PYTORCH_PART07_TRACK,
];

export const LIBRARY_CURRICULA: Record<LibraryId, DayTrack[]> = {
  python: PYTHON_ZERO_TO_HERO_TRACKS,
  numpy: NUMPY_ZERO_TO_HERO_TRACKS,
  pandas: PANDAS_ZERO_TO_HERO_TRACKS,
  matplotlib: MATPLOTLIB_ZERO_TO_HERO_TRACKS,
  sklearn: SKLEARN_ZERO_TO_HERO_TRACKS,
  pytorch: PYTORCH_ZERO_TO_HERO_TRACKS,
};

export const LIBRARY_METADATA: Record<LibraryId, { name: string; icon: string; tagline: string }> = {
  python: { name: 'Python', icon: '🐍', tagline: 'Core foundations, data structures, OOP, iterators, and advanced mechanics' },
  numpy: { name: 'NumPy', icon: '⚡', tagline: 'Arrays, vectors, multi-dimensional math, and broadcasting' },
  pandas: { name: 'Pandas', icon: '📊', tagline: 'Series, DataFrames, indexing, cleaning, and aggregations' },
  matplotlib: { name: 'Matplotlib', icon: '📈', tagline: 'Figures, axes, multi-panel subplots, and styling' },
  sklearn: { name: 'Scikit-Learn', icon: '🛡️', tagline: 'Data splits, preprocessing, classification, regression, and pipelines' },
  pytorch: { name: 'PyTorch', icon: '🔥', tagline: 'Tensors, autograd, neural modules, optimizers, and training loops' },
};

// Aliases for compatibility with existing imports
export const PART01_TRACK = PYTHON_PART01_TRACK;
export const PART02_TRACK = PYTHON_PART02_TRACK;
export const PART03_TRACK = PYTHON_PART03_TRACK;
export const PART04_TRACK = PYTHON_PART04_TRACK;
export const PART05_TRACK = PYTHON_PART05_TRACK;
export const PART06_TRACK = PYTHON_PART06_TRACK;
export const PART07_TRACK = PYTHON_PART07_TRACK;

export const PART_TRACKS: DayTrack[] = PYTHON_ZERO_TO_HERO_TRACKS;
export const CURRICULUM_DATA: DayTrack[] = PYTHON_ZERO_TO_HERO_TRACKS;

export const ORDERED_LIBRARIES: LibraryId[] = ['python', 'numpy', 'pandas', 'matplotlib', 'sklearn', 'pytorch'];

export interface GlobalCurriculumItem {
  libraryId: LibraryId;
  track: DayTrack;
  challenge: import('../types').Challenge;
}

export function getAllCurriculumChallenges(): GlobalCurriculumItem[] {
  const items: GlobalCurriculumItem[] = [];
  for (const libId of ORDERED_LIBRARIES) {
    const tracks = LIBRARY_CURRICULA[libId] || [];
    for (const track of tracks) {
      for (const challenge of track.challenges) {
        items.push({ libraryId: libId, track, challenge });
      }
    }
  }
  return items;
}

export default CURRICULUM_DATA;
