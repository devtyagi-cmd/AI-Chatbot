from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("/login")
def login() -> dict:
    """
    The actual credential check happens in require_shared_login (applied to
    this router when it's included in main.py) - if the request reaches
    this function at all, the credentials were valid (or auth is disabled).
    Exists purely so the frontend can validate a login attempt immediately,
    instead of only finding out credentials are wrong when a real upload or
    chat request fails.
    """
    return {"status": "ok"}
