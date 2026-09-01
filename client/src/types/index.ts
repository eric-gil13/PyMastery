export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type Medal = 'gold' | 'silver' | 'bronze' | 'none';
export type LayoutMode = 'guided' | 'code' | 'study' | 'focus' | 'masterclass';
export type LibraryId = 'numpy' | 'pandas' | 'matplotlib' | 'sklearn' | 'pytorch';

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  inputDescription?: string;
  expectedOutput?: string;
  isSecret?: boolean;
}

export interface TestResultItem {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  expected?: string;
  actual?: string;
  durationMs?: number;
}

export interface TensorShapeDiff {
  name: string;
  expectedShape: string;
  actualShape: string;
  match: boolean;
  expectedDtype?: string;
  actualDtype?: string;
  dtypeMatch?: boolean;
}

export interface DataFrameData {
  name?: string;
  columns: string[];
  dtypes: Record<string, string>;
  rows: Array<Record<string, string | number | boolean | null>>;
  totalRows: number;
  memoryUsageKb?: number;
}

export interface VisualizationData {
  id: string;
  title: string;
  type: 'svg' | 'base64' | 'chart';
  svgContent?: string;
  imageUrl?: string;
  description?: string;
}

export interface PerformanceStats {
  userExecutionMs: number;
  benchmarkTargetMs: number;
  naiveExecutionMs?: number;
  speedupVsNaive?: number;
  memoryUsageMb: number;
  memoryTargetMb?: number;
  medal: Medal;
  percentile?: number;
}

export interface AIReviewResult {
  pythonicScore: number; // 1-10
  timeComplexity: string;
  spaceComplexity: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  idiomaticSnippet?: string;
  status: 'idle' | 'analyzing' | 'completed' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface NaiveVsIdiomatic {
  naiveCode: string;
  naiveExplanation: string;
  idiomaticCode: string;
  idiomaticExplanation: string;
  speedupText?: string;
}

export interface MemoryLayoutInfo {
  title: string;
  content: string;
  diagramAscii?: string;
  keyRule: string;
}

export interface DeepInternalsInfo {
  title: string;
  content: string;
  keyRule?: string;
}

export interface ConceptPrimerData {
  title: string;
  subtitle: string;
  overview: string;
  mentalModel5s?: string;
  visualAnalogy?: string;
  pitfalls?: string[];
  progressiveHints?: string[];
  deepInternals?: DeepInternalsInfo;
  mathFormulas: Array<{
    title: string;
    latex: string;
    explanation: string;
  }>;
  naiveVsIdiomatic: NaiveVsIdiomatic;
  memoryLayout: MemoryLayoutInfo;
  keyTakeaways: string[];
  analogy?: string;
  starterInputSnippet?: string;
}

export interface Challenge {
  id: string;
  dayId: number;
  partId?: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  category: string;
  summary: string;
  instructions: string;
  hints: string[];
  mentalModel5s?: string;
  visualAnalogy?: string;
  pitfalls?: string[];
  progressiveHints?: string[];
  deepInternals?: DeepInternalsInfo;
  starterCode: string;
  solutionCode: string;
  testCases: TestCase[];
  conceptPrimer: ConceptPrimerData;
  benchmarkTargetMs: number;
  memoryTargetMb: number;
  sampleDataFrame?: DataFrameData;
  samplePlot?: VisualizationData;
  expectedTensors?: Array<{ name: string; shape: string; dtype: string }>;
  estimatedTime?: string;
}

export interface RunnableCodeSnippet {
  id: string;
  title: string;
  code: string;
  expectedOutput?: string;
  explanation: string;
}

export interface ApiCheatItem {
  name: string;
  category: string;
  signature: string;
  summary: string;
  parameters: Array<{ name: string; type: string; desc: string }>;
  returns: string;
  exampleSnippet: string;
}

export interface CommonTrap {
  title: string;
  badSnippet: string;
  badExplanation: string;
  goodSnippet: string;
  goodExplanation: string;
  perfImpact: string;
}

export interface LibraryMechanicsChapter {
  id: string;
  title: string;
  icon?: string;
  summary: string;
  markdownContent: string;
  codeSnippets?: RunnableCodeSnippet[];
}

export interface LibraryMechanicsData {
  libraryName: string;
  tagline: string;
  overview: string;
  whyItExists: string;
  coreAnatomy: {
    objectName: string;
    description: string;
    fields: Array<{ name: string; type: string; role: string }>;
    memoryDiagramAscii?: string;
  };
  chapters: LibraryMechanicsChapter[];
  commonTraps: CommonTrap[];
  apiCheatSheet: ApiCheatItem[];
  interactiveWidgetType?: 'numpy-strides' | 'pandas-blockmanager' | 'matplotlib-artists' | 'sklearn-pipeline' | 'pytorch-autograd' | 'pytorch-nn' | 'production-pipeline';
}

export interface DayTrack {
  partNumber?: number;
  partId?: number;
  dayNumber: number;
  id: number;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  badge: string;
  libraryMechanics?: LibraryMechanicsData;
  challenges: Challenge[];
}

export interface ExecutionResponse {
  success: boolean;
  stdout: string;
  stderr?: string;
  errorTraceback?: string;
  testsTotal: number;
  testsPassed: number;
  testResults: TestResultItem[];
  tensorDiffs?: TensorShapeDiff[];
  dataframe?: DataFrameData;
  visualization?: VisualizationData;
  performance: PerformanceStats;
  aiReview?: AIReviewResult;
}

export interface EnvironmentStatus {
  pythonVersion: string;
  pytorchVersion: string;
  cudaAvailable: boolean;
  cudaDeviceName?: string;
  backendConnected: boolean;
  osName: string;
  totalMemoryGb?: number;
}

export interface UserProgress {
  completedChallenges: string[];
  medals: Record<string, Medal>;
  codeSubmissions: Record<string, string>;
  syncKey: string;
  lastSyncedAt?: string;
  customNotes?: Record<string, string>;
}
