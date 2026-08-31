"""SQLite persistence layer and multi-device sync manager for PyMastery with user accounts."""

from __future__ import annotations
import contextlib
import datetime
import json
import os
import pathlib
import sqlite3
import uuid
from typing import Any, Dict, List, Optional

from server.models import (
    BenchmarkHighscore,
    ChallengeProgress,
    CodeDraft,
    SyncExportPayload,
    SyncImportResponse,
    UserProfile,
)
from server.auth import hash_password, verify_password, generate_token, verify_token


class DatabaseManager:
    """Manages SQLite storage for user accounts, profiles, challenge completions, drafts, and benchmarks."""

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            data_dir = pathlib.Path(__file__).resolve().parent / "data"
            data_dir.mkdir(parents=True, exist_ok=True)
            self.db_path = str(data_dir / "pymastery.db")
        else:
            self.db_path = db_path
            pathlib.Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

        self._init_db()

    @contextlib.contextmanager
    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Accounts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS accounts (
                    id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    last_login_at TEXT
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_profile (
                    user_id TEXT PRIMARY KEY,
                    username TEXT NOT NULL DEFAULT 'Pythonista',
                    xp INTEGER NOT NULL DEFAULT 0,
                    level INTEGER NOT NULL DEFAULT 1,
                    streak_days INTEGER NOT NULL DEFAULT 1,
                    last_active_at TEXT,
                    settings TEXT DEFAULT '{}',
                    updated_at TEXT
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS challenge_progress (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL DEFAULT 'default_user',
                    challenge_id TEXT NOT NULL,
                    track_id TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'not_started',
                    best_code TEXT,
                    attempts_count INTEGER NOT NULL DEFAULT 0,
                    passed_tests_count INTEGER NOT NULL DEFAULT 0,
                    total_tests_count INTEGER NOT NULL DEFAULT 0,
                    best_runtime_ms REAL,
                    best_memory_kb REAL,
                    first_completed_at TEXT,
                    last_attempt_at TEXT,
                    UNIQUE(user_id, challenge_id)
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS code_drafts (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL DEFAULT 'default_user',
                    challenge_id TEXT NOT NULL,
                    code TEXT NOT NULL,
                    cursor_position TEXT DEFAULT '{}',
                    saved_at TEXT NOT NULL,
                    UNIQUE(user_id, challenge_id)
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS benchmark_highscores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    challenge_id TEXT NOT NULL,
                    user_id TEXT NOT NULL DEFAULT 'default_user',
                    runtime_ms REAL NOT NULL,
                    memory_kb REAL NOT NULL,
                    ops_per_sec REAL NOT NULL,
                    code TEXT,
                    created_at TEXT NOT NULL
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS activity_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL DEFAULT 'default_user',
                    event_type TEXT NOT NULL,
                    details TEXT DEFAULT '{}',
                    created_at TEXT NOT NULL
                )
            """)

    # ------------------ User Account & Auth ------------------

    def register_user(self, username: str, password: str) -> dict:
        username = username.strip()
        if not username or not password:
            return {"success": False, "message": "Username and password required"}

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM accounts WHERE LOWER(username) = LOWER(?)", (username,))
            if cursor.fetchone():
                return {"success": False, "message": "Username already exists"}

            user_id = str(uuid.uuid4())
            pwd_hash, salt = hash_password(password)
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()

            cursor.execute("""
                INSERT INTO accounts (id, username, password_hash, salt, created_at, last_login_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, username, pwd_hash, salt, now, now))

            cursor.execute("""
                INSERT INTO user_profile (user_id, username, xp, level, streak_days, last_active_at, settings, updated_at)
                VALUES (?, ?, 0, 1, 1, ?, '{}', ?)
            """, (user_id, username, now, now))

            token = generate_token(user_id, username)
            return {
                "success": True,
                "user_id": user_id,
                "username": username,
                "token": token,
                "message": f"Welcome, {username}!"
            }

    def login_user(self, username: str, password: str) -> dict:
        username = username.strip()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, username, password_hash, salt FROM accounts WHERE LOWER(username) = LOWER(?)", (username,))
            row = cursor.fetchone()
            if not row:
                return {"success": False, "message": "Invalid username or password"}

            user_id = row["id"]
            actual_username = row["username"]
            stored_hash = row["password_hash"]
            salt = row["salt"]

            if not verify_password(password, stored_hash, salt):
                return {"success": False, "message": "Invalid username or password"}

            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            cursor.execute("UPDATE accounts SET last_login_at = ? WHERE id = ?", (now, user_id))

            token = generate_token(user_id, actual_username)
            return {
                "success": True,
                "user_id": user_id,
                "username": actual_username,
                "token": token,
                "message": f"Logged in as {actual_username}"
            }

    def get_full_user_state(self, user_id: str) -> dict:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM user_profile WHERE user_id = ?", (user_id,))
            prof = cursor.fetchone()
            profile_data = dict(prof) if prof else {"user_id": user_id, "username": "Student", "xp": 0, "level": 1}

            cursor.execute("SELECT * FROM challenge_progress WHERE user_id = ?", (user_id,))
            progress_rows = [dict(r) for r in cursor.fetchall()]

            cursor.execute("SELECT * FROM code_drafts WHERE user_id = ?", (user_id,))
            drafts_rows = [dict(r) for r in cursor.fetchall()]

            return {
                "profile": profile_data,
                "progress": {r["challenge_id"]: r for r in progress_rows},
                "drafts": {r["challenge_id"]: r["code"] for r in drafts_rows},
            }

    def save_user_state(self, user_id: str, state_payload: dict) -> dict:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()

            challenge_id = state_payload.get("challenge_id")
            code = state_payload.get("code")
            if challenge_id and code is not None:
                record_id = f"{user_id}_{challenge_id}"
                cursor.execute("""
                    INSERT INTO code_drafts (id, user_id, challenge_id, code, saved_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(user_id, challenge_id) DO UPDATE SET
                        code = excluded.code,
                        saved_at = excluded.saved_at
                """, (record_id, user_id, challenge_id, code, now))

            cursor.execute("UPDATE user_profile SET last_active_at = ?, updated_at = ? WHERE user_id = ?", (now, now, user_id))

        return {"success": True, "saved_at": now}

    # ------------------ Progress & Draft Helpers ------------------

    def save_draft(
        self,
        challenge_id_or_draft: Any,
        code: Optional[str] = None,
        cursor_position: Optional[dict] = None,
        user_id: str = "default_user",
    ) -> CodeDraft:
        if isinstance(challenge_id_or_draft, CodeDraft):
            ch_id = challenge_id_or_draft.challenge_id
            cd = challenge_id_or_draft.code
            pos = challenge_id_or_draft.cursor_position
        else:
            ch_id = str(challenge_id_or_draft)
            cd = code or ""
            pos = cursor_position or {}

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        record_id = f"{user_id}_{ch_id}"
        pos_str = json.dumps(pos or {})
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO code_drafts (id, user_id, challenge_id, code, cursor_position, saved_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, challenge_id) DO UPDATE SET
                    code = excluded.code,
                    cursor_position = excluded.cursor_position,
                    saved_at = excluded.saved_at
            """, (record_id, user_id, ch_id, cd, pos_str, now))

        return CodeDraft(challenge_id=ch_id, code=cd, cursor_position=pos or {}, saved_at=now)

    def get_draft(self, challenge_id: str, user_id: str = "default_user") -> Optional[CodeDraft]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM code_drafts WHERE user_id = ? AND challenge_id = ?", (user_id, challenge_id))
            row = cursor.fetchone()
            if not row:
                return None
            return CodeDraft(
                challenge_id=row["challenge_id"],
                code=row["code"],
                cursor_position=json.loads(row["cursor_position"]) if row["cursor_position"] else {},
                saved_at=row["saved_at"],
            )

    def update_challenge_progress(
        self,
        challenge_id: str,
        track_id: str,
        passed: bool,
        passed_tests: int,
        total_tests: int,
        runtime_ms: Optional[float] = None,
        memory_kb: Optional[float] = None,
        code: Optional[str] = None,
        user_id: str = "default_user",
    ) -> ChallengeProgress:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        record_id = f"{user_id}_{challenge_id}"

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM challenge_progress WHERE user_id = ? AND challenge_id = ?", (user_id, challenge_id))
            existing = cursor.fetchone()

            if existing:
                status = "completed" if passed or existing["status"] == "completed" else "attempted"
                attempts = existing["attempts_count"] + 1
                first_completed = existing["first_completed_at"] or (now if passed else None)
                
                best_runtime = existing["best_runtime_ms"]
                if runtime_ms is not None:
                    best_runtime = min(best_runtime, runtime_ms) if best_runtime else runtime_ms

                best_memory = existing["best_memory_kb"]
                if memory_kb is not None:
                    best_memory = min(best_memory, memory_kb) if best_memory else memory_kb

                best_code = code if (passed and not existing["best_code"]) else (existing["best_code"] or code)

                cursor.execute("""
                    UPDATE challenge_progress SET
                        status = ?,
                        best_code = ?,
                        attempts_count = ?,
                        passed_tests_count = MAX(passed_tests_count, ?),
                        total_tests_count = ?,
                        best_runtime_ms = ?,
                        best_memory_kb = ?,
                        first_completed_at = ?,
                        last_attempt_at = ?
                    WHERE id = ?
                """, (status, best_code, attempts, passed_tests, total_tests, best_runtime, best_memory, first_completed, now, record_id))
            else:
                status = "completed" if passed else "in_progress"
                first_completed = now if passed else None
                cursor.execute("""
                    INSERT INTO challenge_progress (
                        id, user_id, challenge_id, track_id, status, best_code,
                        attempts_count, passed_tests_count, total_tests_count,
                        best_runtime_ms, best_memory_kb, first_completed_at, last_attempt_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
                """, (record_id, user_id, challenge_id, track_id, status, code, passed_tests, total_tests, runtime_ms, memory_kb, first_completed, now))

            # Award XP on passing using current cursor
            if passed and (not existing or existing["status"] != "completed"):
                self._add_xp(user_id, 100, cursor=cursor)

        return self.get_challenge_progress(challenge_id, user_id)

    def get_challenge_progress(self, challenge_id: str, user_id: str = "default_user") -> Optional[ChallengeProgress]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM challenge_progress WHERE user_id = ? AND challenge_id = ?", (user_id, challenge_id))
            row = cursor.fetchone()
            if not row:
                return None
            return ChallengeProgress(
                challenge_id=row["challenge_id"],
                track_id=row["track_id"],
                status=row["status"],
                best_code=row["best_code"],
                attempts_count=row["attempts_count"],
                passed_tests_count=row["passed_tests_count"],
                total_tests_count=row["total_tests_count"],
                best_runtime_ms=row["best_runtime_ms"],
                best_memory_kb=row["best_memory_kb"],
                first_completed_at=row["first_completed_at"],
                last_attempt_at=row["last_attempt_at"],
            )

    get_progress = get_challenge_progress

    def list_all_progress(self, user_id: str = "default_user") -> List[ChallengeProgress]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM challenge_progress WHERE user_id = ?", (user_id,))
            return [
                ChallengeProgress(
                    challenge_id=r["challenge_id"],
                    track_id=r["track_id"],
                    status=r["status"],
                    best_code=r["best_code"],
                    attempts_count=r["attempts_count"],
                    passed_tests_count=r["passed_tests_count"],
                    total_tests_count=r["total_tests_count"],
                    best_runtime_ms=r["best_runtime_ms"],
                    best_memory_kb=r["best_memory_kb"],
                    first_completed_at=r["first_completed_at"],
                    last_attempt_at=r["last_attempt_at"],
                )
                for r in cursor.fetchall()
            ]

    def save_progress(self, progress: ChallengeProgress, user_id: str = "default_user") -> ChallengeProgress:
        return self.update_challenge_progress(
            challenge_id=progress.challenge_id,
            track_id=progress.track_id,
            passed=(progress.status == "completed"),
            passed_tests=progress.passed_tests_count,
            total_tests=progress.total_tests_count,
            runtime_ms=progress.best_runtime_ms,
            memory_kb=progress.best_memory_kb,
            code=progress.best_code,
            user_id=user_id,
        )

    def _add_xp(self, user_id: str, amount: int, cursor: Optional[sqlite3.Cursor] = None):
        if cursor is not None:
            cursor.execute("SELECT xp FROM user_profile WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            current_xp = row["xp"] if row else 0
            new_xp = current_xp + amount
            new_level = max(1, 1 + int(new_xp // 200))
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            cursor.execute("""
                INSERT INTO user_profile (user_id, xp, level, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    xp = excluded.xp,
                    level = excluded.level,
                    updated_at = excluded.updated_at
            """, (user_id, new_xp, new_level, now))
        else:
            with self._get_connection() as conn:
                cur = conn.cursor()
                self._add_xp(user_id, amount, cursor=cur)

    def get_user_profile(self, user_id: str = "default_user") -> UserProfile:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM user_profile WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            if not row:
                now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                cursor.execute("""
                    INSERT INTO user_profile (user_id, username, xp, level, streak_days, last_active_at, updated_at)
                    VALUES (?, 'Pythonista', 0, 1, 1, ?, ?)
                """, (user_id, now, now))
                return UserProfile(user_id=user_id, username="Pythonista", xp=0, level=1, streak_days=1)
            return UserProfile(
                user_id=row["user_id"],
                username=row["username"],
                xp=row["xp"],
                level=row["level"],
                streak_days=row["streak_days"],
                last_active_at=row["last_active_at"],
                settings=json.loads(row["settings"]) if row["settings"] else {},
                updated_at=row["updated_at"],
            )

    get_profile = get_user_profile

    def update_profile(self, profile: UserProfile) -> UserProfile:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        computed_level = max(profile.level, 1 + int(profile.xp // 200))
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO user_profile (user_id, username, xp, level, streak_days, last_active_at, settings, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    username = excluded.username,
                    xp = excluded.xp,
                    level = excluded.level,
                    streak_days = excluded.streak_days,
                    last_active_at = excluded.last_active_at,
                    settings = excluded.settings,
                    updated_at = excluded.updated_at
            """, (profile.user_id, profile.username, profile.xp, computed_level, profile.streak_days, profile.last_active_at, json.dumps(profile.settings), now))
        return self.get_user_profile(profile.user_id)

    def record_benchmark(self, hs: BenchmarkHighscore) -> BenchmarkHighscore:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO benchmark_highscores (challenge_id, user_id, runtime_ms, memory_kb, ops_per_sec, code, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (hs.challenge_id, hs.user_id, hs.runtime_ms, hs.memory_kb, hs.ops_per_sec, hs.code, now))
            hs.id = cursor.lastrowid
            hs.created_at = now
        return hs

    def get_highscores(self, challenge_id: str, limit: int = 10) -> List[BenchmarkHighscore]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM benchmark_highscores WHERE challenge_id = ? ORDER BY runtime_ms ASC LIMIT ?", (challenge_id, limit))
            return [
                BenchmarkHighscore(
                    id=r["id"],
                    challenge_id=r["challenge_id"],
                    user_id=r["user_id"],
                    runtime_ms=r["runtime_ms"],
                    memory_kb=r["memory_kb"],
                    ops_per_sec=r["ops_per_sec"],
                    code=r["code"],
                    created_at=r["created_at"],
                )
                for r in cursor.fetchall()
            ]

    def export_all(self, user_id: str = "default_user") -> SyncExportPayload:
        prof = self.get_user_profile(user_id)
        prog = self.list_all_progress(user_id)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM code_drafts WHERE user_id = ?", (user_id,))
            drafts = [
                CodeDraft(
                    challenge_id=r["challenge_id"],
                    code=r["code"],
                    cursor_position=json.loads(r["cursor_position"]) if r["cursor_position"] else {},
                    saved_at=r["saved_at"],
                )
                for r in cursor.fetchall()
            ]
            cursor.execute("SELECT * FROM benchmark_highscores WHERE user_id = ?", (user_id,))
            benchmarks = [
                BenchmarkHighscore(
                    id=r["id"],
                    challenge_id=r["challenge_id"],
                    user_id=r["user_id"],
                    runtime_ms=r["runtime_ms"],
                    memory_kb=r["memory_kb"],
                    ops_per_sec=r["ops_per_sec"],
                    code=r["code"],
                    created_at=r["created_at"],
                )
                for r in cursor.fetchall()
            ]
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return SyncExportPayload(
            user_id=user_id,
            exported_at=now,
            profile=prof,
            progress=prog,
            drafts=drafts,
            benchmarks=benchmarks,
        )

    def import_all(self, payload: SyncExportPayload, merge: bool = True) -> SyncImportResponse:
        user_id = payload.profile.user_id or "default_user"
        if payload.profile:
            self.update_profile(payload.profile)
        for p in payload.progress:
            self.save_progress(p, user_id=user_id)
        for d in payload.drafts:
            self.save_draft(d.challenge_id, d.code, d.cursor_position, user_id=user_id)
        for b in payload.benchmarks:
            self.record_benchmark(b)
        return SyncImportResponse(
            success=True,
            imported_progress=len(payload.progress),
            imported_drafts=len(payload.drafts),
            imported_benchmarks=len(payload.benchmarks),
            message="Import successful",
        )


db = DatabaseManager()
