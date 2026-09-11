"""Pydantic data models for PyMastery."""

from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


# --- Code Execution Models ---

class TestCase(BaseModel):
    id: Optional[str] = None
    name: str
    call: Optional[str] = None  # e.g., "lru_cache.get(1)" or "solution([2, 7, 11, 15], 9)"
    expected: Optional[Any] = None  # Expected return value or structure
    test_code: Optional[str] = None  # Raw python test assertion code if custom
    description: Optional[str] = None
    hidden: bool = False
    tolerance: Optional[float] = None  # For float or numpy comparisons


class TestCaseResult(BaseModel):
    id: Optional[str] = None
    name: str
    status: Literal["passed", "failed", "error", "skipped"]
    duration_ms: float = 0.0
    memory_kb: float = 0.0
    input_repr: Optional[str] = None
    expected: Optional[Any] = None
    actual: Optional[Any] = None
    error_message: Optional[str] = None
    diff: Optional[str] = None
    traceback: Optional[str] = None
    stdout: Optional[str] = None
    hidden: bool = False
    call: Optional[str] = None


    @property
    def passed(self) -> bool:
        return self.status == "passed"




class PlotArtifact(BaseModel):
    index: int
    format: Literal["png", "svg"]
    data: str  # Base64 string for PNG, or SVG xml text
    mime_type: str = "image/png"
    dpi: int = 100
    title: Optional[str] = None


class DataObjectSummary(BaseModel):
    name: str
    object_type: Literal["dataframe", "series", "numpy_array", "torch_tensor", "dict", "list", "other"]
    shape: Optional[List[int]] = None
    dtype: Optional[str] = None
    columns: Optional[List[str]] = None
    dtypes: Optional[Dict[str, str]] = None
    preview: Optional[Any] = None
    summary_stats: Optional[Dict[str, Any]] = None


class BenchmarkResult(BaseModel):
    iterations: int = 100
    warmup_iterations: int = 10
    total_time_ms: float = 0.0
    mean_ms: float = 0.0
    median_ms: float = 0.0
    min_ms: float = 0.0
    max_ms: float = 0.0
    std_dev_ms: float = 0.0
    ops_per_sec: float = 0.0
    peak_memory_kb: float = 0.0
    memory_diff_kb: float = 0.0


class RunRequest(BaseModel):
    code: str
    challenge_id: Optional[str] = None
    mode: Literal["run", "test", "benchmark"] = "run"
    test_cases: Optional[List[TestCase]] = None
    benchmark_setup: Optional[str] = None
    benchmark_stmt: Optional[str] = None
    benchmark_iterations: int = 100
    timeout: float = 25.0  # Increased for cloud free tier environments
    memory_limit_mb: float = 512.0  # Max 1024 MB
    stdin: Optional[str] = ""


class RunResponse(BaseModel):
    success: bool
    status: Literal["completed", "timeout", "memory_exceeded", "syntax_error", "runtime_error"]
    stdout: str = ""
    stderr: str = ""
    exit_code: int = 0
    duration_ms: float = 0.0
    execution_duration_ms: Optional[float] = None
    peak_memory_mb: float = 0.0

    error: Optional[str] = None
    traceback: Optional[str] = None
    
    # Test suite evaluation
    test_results: Optional[List[TestCaseResult]] = None
    tests_summary: Optional[Dict[str, Any]] = None  # {total, passed, failed, errors, score_percent}
    
    # Benchmark stats
    benchmark: Optional[BenchmarkResult] = None
    
    # Rich output hooks
    plots: List[PlotArtifact] = Field(default_factory=list)
    data_objects: List[DataObjectSummary] = Field(default_factory=list)


# --- Curriculum Models ---

class Challenge(BaseModel):
    id: str
    track_id: str
    track_name: str
    title: str
    difficulty: Literal["Beginner", "Intermediate", "Advanced", "Expert"]
    category: str
    xp_reward: int = 100
    estimated_minutes: int = 15
    description_markdown: str
    hints: List[str] = Field(default_factory=list)
    starter_code: str
    solution_code: Optional[str] = None
    test_cases: List[TestCase] = Field(default_factory=list)
    benchmark_code: Optional[str] = None
    benchmark_setup: Optional[str] = None
    benchmark_stmt: Optional[str] = None
    benchmark_iterations: Optional[int] = 100
    tags: List[str] = Field(default_factory=list)


class Track(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    badge: str
    order: int
    difficulty: Literal["Beginner", "Intermediate", "Advanced", "Expert"]
    challenge_count: int = 0
    challenges: List[Challenge] = Field(default_factory=list)


class CurriculumOverview(BaseModel):
    tracks: List[Track]
    total_challenges: int
    total_xp: int


# --- Sync & Persistence Models ---

class UserProfile(BaseModel):
    user_id: str = "default_user"
    username: str = "Pythonista"
    xp: int = 0
    level: int = 1
    streak_days: int = 1
    last_active_at: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    updated_at: Optional[str] = None


class ChallengeProgress(BaseModel):
    challenge_id: str
    track_id: str
    status: Literal["not_started", "in_progress", "attempted", "completed", "mastered"] = "not_started"
    best_code: Optional[str] = None
    attempts_count: int = 0
    passed_tests_count: int = 0
    total_tests_count: int = 0
    best_runtime_ms: Optional[float] = None
    best_memory_kb: Optional[float] = None
    first_completed_at: Optional[str] = None
    last_attempt_at: Optional[str] = None


class CodeDraft(BaseModel):
    challenge_id: str
    code: str
    cursor_position: Optional[Dict[str, int]] = None
    saved_at: Optional[str] = None


class BenchmarkHighscore(BaseModel):
    id: Optional[int] = None
    challenge_id: str
    user_id: str = "default_user"
    runtime_ms: float
    memory_kb: float
    ops_per_sec: float
    code: Optional[str] = None
    created_at: Optional[str] = None


class SyncExportPayload(BaseModel):
    version: str = "1.0.0"
    exported_at: str
    profile: UserProfile
    progress: List[ChallengeProgress]
    drafts: List[CodeDraft]
    benchmarks: List[BenchmarkHighscore]


class SyncImportResponse(BaseModel):
    success: bool
    imported_progress: int
    imported_drafts: int
    imported_benchmarks: int
    message: str


# --- AI Tutor Models ---

class AIReviewRequest(BaseModel):
    code: str
    challenge_id: Optional[str] = None
    challenge_title: Optional[str] = None
    challenge_description: Optional[str] = None
    test_results: Optional[List[TestCaseResult]] = None
    user_api_key: Optional[str] = None
    provider: Optional[str] = "auto"
    model: Optional[str] = None
    base_url: Optional[str] = None


class CodeReviewFeedback(BaseModel):
    score: int = Field(ge=1, le=10)  # 1 to 10 score
    summary: str
    strengths: List[str]
    improvements: List[str]
    complexity: Dict[str, str]  # e.g., {"time": "O(N)", "space": "O(1)"}
    idiomatic_python: List[str]
    security_or_pitfalls: Optional[List[str]] = None
    provider_used: Optional[str] = "ast_analyzer"


class AITutorChatRequest(BaseModel):
    messages: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    question: Optional[str] = None
    chat_history: Optional[List[Dict[str, str]]] = None
    code: Optional[str] = None
    user_code: Optional[str] = None
    challenge_id: Optional[str] = None
    challenge_title: Optional[str] = None
    challenge_description: Optional[str] = None
    current_error: Optional[str] = None
    user_api_key: Optional[str] = None
    provider: Optional[str] = "auto"
    model: Optional[str] = None
    base_url: Optional[str] = None



class AITutorResponse(BaseModel):
    reply: str
    hints: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    provider_used: Optional[str] = "fallback"
    error_message: Optional[str] = None


class AITestConnectionRequest(BaseModel):
    user_api_key: Optional[str] = None
    provider: Optional[str] = "auto"
    model: Optional[str] = None
    base_url: Optional[str] = None


class AITestConnectionResponse(BaseModel):
    success: bool
    provider: str
    model: str
    message: str


