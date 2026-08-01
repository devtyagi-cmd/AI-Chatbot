from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..data_store import get_or_load
from ..db import get_db_session, is_db_enabled
from ..models import FileRecord

router = APIRouter()


@router.get("/files")
def list_files() -> list:
    """Files uploaded within the retention window, newest first - lets the
    frontend offer a "recent files" list instead of requiring re-upload
    every time the page is reloaded. Returns an empty list if no database
    is configured (e.g. local dev)."""
    if not is_db_enabled():
        return []

    with get_db_session() as db:
        records = (
            db.query(FileRecord).order_by(FileRecord.created_at.desc()).limit(50).all()
        )
        return [
            {
                "file_id": r.file_id,
                "filename": r.filename,
                "uploaded_at": r.created_at.isoformat(),
                "row_count": r.profile.get("row_count"),
            }
            for r in records
        ]


@router.get("/files/{file_id}")
def reopen_file(file_id: str) -> dict:
    """Same response shape as POST /upload - reloads (from the in-memory
    cache, or from the database if this process was restarted since) an
    already-uploaded file so the frontend can resume it."""
    session = get_or_load(file_id)
    if session is None:
        raise HTTPException(status_code=404, detail="File not found or has expired.")
    return {
        "file_id": session.file_id,
        "filename": session.filename,
        "profile": session.profile,
    }
