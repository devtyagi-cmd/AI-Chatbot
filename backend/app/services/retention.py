from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from ..models import FileRecord

RETENTION_DAYS = 7


def delete_expired_data(db: Session) -> int:
    """
    Deletes any file (and, via cascade, its chat history) older than
    RETENTION_DAYS. Returns the number of files removed.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    expired = db.query(FileRecord).filter(FileRecord.created_at < cutoff).all()
    count = len(expired)
    for record in expired:
        db.delete(record)
    if count:
        db.commit()
    return count
