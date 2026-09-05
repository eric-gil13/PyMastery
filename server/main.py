"""PyMastery FastAPI Application with Runners, Sync, User Authentication, Curriculum, and AI Endpoints."""

from __future__ import annotations
import os
import sys
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Header, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from server.ai_tutor import ai_tutor
from server.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthResponse,
    verify_token,
)
from server.curriculum import curriculum
from server.models import (
    AIReviewRequest,
    AITestConnectionRequest,
    AITestConnectionResponse,
    AITutorChatRequest,
    AITutorResponse,
    BenchmarkHighscore,
    Challenge,
    ChallengeProgress,
    CodeDraft,
    CodeReviewFeedback,
    CurriculumOverview,
    RunRequest,
    RunResponse,
    SyncExportPayload,
    SyncImportResponse,
    Track,
    UserProfile,
)
from server.runner import runner
from server.sync import db

app = FastAPI(
    title="PyMastery Backend & Code Execution Runner",
    description="Interactive Mastery Learning Platform for Senior Python Engineers & Data Scientists",
    version="0.2.0",
)

# Enable CORS for local development and client apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(authorization: Optional[str] = None) -> str:
    """Helper to extract user_id from Bearer token, default to 'default_user'."""
    if not authorization or not isinstance(authorization, str):
        return "default_user"
    token = authorization.replace("Bearer ", "").strip()
    result = verify_token(token)
    if result:
        return result[0]
    return "default_user"


# --- Health & Status ---

@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "PyMastery Backend & Runner",
        "version": "0.2.0",
        "python_version": sys.version,
        "runner_python": runner.python_path,
    }


@app.get("/api/environment")
async def environment_status() -> Dict[str, Any]:
    torch_version = "2.4.0"
    cuda_available = False
    cuda_device = "CPU (Accelerated SIMD / AVX-512)"
    try:
        import torch
        torch_version = torch.__version__
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            cuda_device = torch.cuda.get_device_name(0)
    except Exception:
        pass

    total_mem_gb = 16
    try:
        import psutil
        total_mem_gb = round(psutil.virtual_memory().total / (1024 ** 3))
    except Exception:
        pass

    import platform
    return {
        "status": "ok",
        "python_version": sys.version.split()[0],
        "pytorch_version": torch_version,
        "cuda_available": cuda_available,
        "cuda_device_name": cuda_device,
        "backend_connected": True,
        "os_name": f"{platform.system()} {platform.release()}",
        "total_memory_gb": total_mem_gb,
    }


# --- User Accounts & Authentication ---

@app.post("/api/auth/register", response_model=AuthResponse)
async def register(req: UserRegisterRequest) -> AuthResponse:
    res = db.register_user(req.username, req.password)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return AuthResponse(
        success=True,
        token=res["token"],
        user_id=res["user_id"],
        username=res["username"],
        message=res["message"],
    )


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: UserLoginRequest) -> AuthResponse:
    res = db.login_user(req.username, req.password)
    if not res["success"]:
        raise HTTPException(status_code=401, detail=res["message"])
    return AuthResponse(
        success=True,
        token=res["token"],
        user_id=res["user_id"],
        username=res["username"],
        message=res["message"],
    )


@app.get("/api/auth/me")
async def get_me(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not isinstance(authorization, str):
        return {"authenticated": False, "username": "Guest", "user_id": "default_user"}
    token = authorization.replace("Bearer ", "").strip()
    result = verify_token(token)
    if not result:
        return {"authenticated": False, "username": "Guest", "user_id": "default_user"}
    user_id, username = result
    profile = db.get_user_profile(user_id)
    return {
        "authenticated": True,
        "user_id": user_id,
        "username": username,
        "profile": profile.model_dump(),
    }


# --- Seamless Multi-Device Auto-Sync ---

@app.get("/api/user/state")
async def get_user_state(user_id: Optional[str] = Query(None), authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    effective_user_id = user_id or get_current_user(authorization)
    return db.get_full_user_state(effective_user_id)


class UserStateSaveRequest(BaseModel):
    user_id: Optional[str] = None
    challenge_id: Optional[str] = None
    code: Optional[str] = None


@app.post("/api/user/save")
async def save_user_state(payload: UserStateSaveRequest, authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    effective_user_id = payload.user_id or get_current_user(authorization)
    return db.save_user_state(effective_user_id, payload.model_dump())


# --- Classic Sync & Persistence Endpoints ---

@app.get("/api/sync/profile", response_model=UserProfile)
async def get_profile(user_id: str = "default_user") -> UserProfile:
    return db.get_profile(user_id)


@app.post("/api/sync/profile", response_model=UserProfile)
async def update_profile(profile: UserProfile) -> UserProfile:
    return db.update_profile(profile)


@app.get("/api/sync/progress", response_model=List[ChallengeProgress])
async def list_progress() -> List[ChallengeProgress]:
    return db.list_all_progress()


@app.get("/api/sync/progress/{challenge_id}", response_model=Optional[ChallengeProgress])
async def get_progress(challenge_id: str) -> Optional[ChallengeProgress]:
    return db.get_progress(challenge_id)


@app.post("/api/sync/progress", response_model=ChallengeProgress)
async def save_progress(progress: ChallengeProgress) -> ChallengeProgress:
    return db.save_progress(progress)


@app.get("/api/sync/draft/{challenge_id}", response_model=Optional[CodeDraft])
async def get_draft(challenge_id: str) -> Optional[CodeDraft]:
    return db.get_draft(challenge_id)


@app.post("/api/sync/draft", response_model=CodeDraft)
async def save_draft(draft: CodeDraft) -> CodeDraft:
    return db.save_draft(draft)


@app.get("/api/sync/highscores/{challenge_id}", response_model=List[BenchmarkHighscore])
async def get_highscores(challenge_id: str, limit: int = 10) -> List[BenchmarkHighscore]:
    return db.get_highscores(challenge_id, limit)


@app.post("/api/sync/highscores", response_model=BenchmarkHighscore)
async def record_highscore(hs: BenchmarkHighscore) -> BenchmarkHighscore:
    return db.record_benchmark(hs)


@app.get("/api/sync/export", response_model=SyncExportPayload)
async def export_sync_data(user_id: str = "default_user") -> SyncExportPayload:
    return db.export_all(user_id)


@app.post("/api/sync/import", response_model=SyncImportResponse)
async def import_sync_data(payload: SyncExportPayload, merge: bool = True) -> SyncImportResponse:
    return db.import_all(payload, merge=merge)


# --- Curriculum Endpoints ---

@app.get("/api/curriculum", response_model=CurriculumOverview)
async def get_curriculum_overview() -> CurriculumOverview:
    return curriculum.get_overview()


@app.get("/api/curriculum/tracks", response_model=List[Track])
async def list_tracks() -> List[Track]:
    return curriculum.list_tracks()


@app.get("/api/curriculum/day/{day_num}", response_model=Track)
async def get_day_track(day_num: int) -> Track:
    track = curriculum.get_track_by_day(day_num)
    if not track:
        raise HTTPException(status_code=404, detail=f"Track for day {day_num} not found")
    return track


@app.get("/api/challenge/{challenge_id}", response_model=Challenge)
async def get_challenge(challenge_id: str) -> Challenge:
    ch = curriculum.get_challenge(challenge_id)
    if not ch:
        raise HTTPException(status_code=404, detail=f"Challenge '{challenge_id}' not found")
    return ch


# --- Code Execution & Testing ---

@app.post("/api/run", response_model=RunResponse)
async def execute_code(req: RunRequest, authorization: Optional[str] = Header(None)) -> RunResponse:
    effective_user_id = get_current_user(authorization)

    if req.mode == "run":
        req.test_cases = None
    elif req.challenge_id:
        ch = curriculum.get_challenge(req.challenge_id)
        if ch:
            if req.mode == "test":
                if not req.test_cases:
                    req.test_cases = ch.test_cases
            elif req.mode == "benchmark":
                if not req.test_cases:
                    req.test_cases = ch.test_cases
                if not req.benchmark_stmt:
                    req.benchmark_setup = getattr(ch, "benchmark_setup", None)
                    req.benchmark_stmt = getattr(ch, "benchmark_stmt", None) or getattr(ch, "benchmark_code", None)
                    req.benchmark_iterations = getattr(ch, "benchmark_iterations", None) or 100

    resp = await runner.execute(req)

    # If run has challenge_id, mode is test/benchmark, and tests were evaluated, update user progress automatically
    if req.mode != "run" and req.challenge_id and req.mode in ("test", "benchmark") and resp.test_results:
        all_passed = all(getattr(t, "status", "") == "passed" or getattr(t, "passed", False) for t in resp.test_results)
        passed_count = sum(1 for t in resp.test_results if getattr(t, "status", "") == "passed" or getattr(t, "passed", False))
        total_count = len(resp.test_results)
        runtime = getattr(resp, "duration_ms", 0.0)


        track_id = req.challenge_id.split("_")[0] if "_" in req.challenge_id else "day01"
        db.update_challenge_progress(
            challenge_id=req.challenge_id,
            track_id=track_id,
            passed=all_passed,
            passed_tests=passed_count,
            total_tests=total_count,
            runtime_ms=runtime,
            code=req.code,
            user_id=effective_user_id,
        )

    return resp



# --- AI Tutor & Review Endpoints ---

@app.post("/api/ai/review", response_model=CodeReviewFeedback)
async def review_code_endpoint(
    req: AIReviewRequest,
    x_ai_key: Optional[str] = Header(None, alias="X-AI-Key"),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_ai_model: Optional[str] = Header(None, alias="X-AI-Model"),
    x_ai_base_url: Optional[str] = Header(None, alias="X-AI-Base-URL"),
) -> CodeReviewFeedback:
    if x_ai_key and not req.user_api_key:
        req.user_api_key = x_ai_key
    if x_ai_provider and (not req.provider or req.provider == "auto"):
        req.provider = x_ai_provider
    if x_ai_model and not req.model:
        req.model = x_ai_model
    if x_ai_base_url and not req.base_url:
        req.base_url = x_ai_base_url
    return await ai_tutor.review_code(req)


@app.post("/api/ai/tutor", response_model=AITutorResponse)
async def tutor_chat_endpoint(
    req: AITutorChatRequest,
    x_ai_key: Optional[str] = Header(None, alias="X-AI-Key"),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_ai_model: Optional[str] = Header(None, alias="X-AI-Model"),
    x_ai_base_url: Optional[str] = Header(None, alias="X-AI-Base-URL"),
) -> AITutorResponse:
    if x_ai_key and not req.user_api_key:
        req.user_api_key = x_ai_key
    if x_ai_provider and (not req.provider or req.provider == "auto"):
        req.provider = x_ai_provider
    if x_ai_model and not req.model:
        req.model = x_ai_model
    if x_ai_base_url and not req.base_url:
        req.base_url = x_ai_base_url
    return await ai_tutor.tutor_chat(req)


@app.post("/api/ai/test", response_model=AITestConnectionResponse)
async def test_connection_endpoint(
    req: AITestConnectionRequest,
    x_ai_key: Optional[str] = Header(None, alias="X-AI-Key"),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_ai_model: Optional[str] = Header(None, alias="X-AI-Model"),
    x_ai_base_url: Optional[str] = Header(None, alias="X-AI-Base-URL"),
) -> AITestConnectionResponse:
    if x_ai_key and not req.user_api_key:
        req.user_api_key = x_ai_key
    if x_ai_provider and (not req.provider or req.provider == "auto"):
        req.provider = x_ai_provider
    if x_ai_model and not req.model:
        req.model = x_ai_model
    if x_ai_base_url and not req.base_url:
        req.base_url = x_ai_base_url
    return await ai_tutor.test_connection(req)


# --- Static Frontend Serving for Production / Docker ---
CLIENT_DIST_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "client",
    "dist",
)

if os.path.isdir(CLIENT_DIST_DIR):
    assets_dir = os.path.join(CLIENT_DIST_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path in ("docs", "openapi.json", "redoc"):
            raise HTTPException(status_code=404, detail="Not Found")
        target_file = os.path.join(CLIENT_DIST_DIR, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        index_file = os.path.join(CLIENT_DIST_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Index not found")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)

