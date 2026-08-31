"""Authentication and account management for PyMastery."""

from __future__ import annotations
import hashlib
import hmac
import os
import secrets
import time
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field


SECRET_KEY = os.environ.get("PYMASTERY_SECRET_KEY", "pymastery-study-secret-key-2026")


class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=3, max_length=100)


class UserLoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user_id: Optional[str] = None
    username: Optional[str] = None
    message: str = "Success"


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hash password using PBKDF2 with SHA-256 and salt."""
    if salt is None:
        salt = secrets.token_hex(16)
    
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    ).hex()
    return pwd_hash, salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """Verify password against stored hash."""
    computed_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(computed_hash, password_hash)


def generate_token(user_id: str, username: str) -> str:
    """Generate a lightweight signature token."""
    timestamp = str(int(time.time()))
    payload = f"{user_id}:{username}:{timestamp}"
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}:{signature}"


def verify_token(token: str) -> Optional[tuple[str, str]]:
    """Verify signature token and return (user_id, username) if valid."""
    if not token or ":" not in token:
        return None
    try:
        parts = token.split(":")
        if len(parts) != 4:
            return None
        user_id, username, timestamp_str, signature = parts
        
        # Verify signature
        payload = f"{user_id}:{username}:{timestamp_str}"
        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        
        if not hmac.compare_digest(expected_sig, signature):
            return None
        
        return user_id, username
    except Exception:
        return None
