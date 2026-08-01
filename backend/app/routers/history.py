from __future__ import annotations

from fastapi import APIRouter

from ..db import get_db_session, is_db_enabled
from ..models import ChatMessageRecord

router = APIRouter()


@router.get("/history/{file_id}")
def get_history(file_id: str) -> list:
    """Full past Q&A for a file, oldest first, within the retention window
    (expired files/messages are deleted outright, not just hidden). Returns
    an empty list if no database is configured (e.g. local dev)."""
    if not is_db_enabled():
        return []

    with get_db_session() as db:
        records = (
            db.query(ChatMessageRecord)
            .filter(ChatMessageRecord.file_id == file_id)
            .order_by(ChatMessageRecord.created_at.asc())
            .all()
        )
        return [
            {
                "question": r.question,
                "answer": r.answer,
                "sql": r.sql,
                "table": r.table_json,
                "chart": r.chart_json,
            }
            for r in records
        ]
