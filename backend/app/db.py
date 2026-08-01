from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


_engine = None
_SessionLocal = None


def is_db_enabled() -> bool:
    """Persistence is entirely optional - if DATABASE_URL isn't set (e.g.
    local dev with no Supabase configured), every DB-touching code path
    should degrade gracefully to "in-memory only, same as before
    persistence existed" rather than raising."""
    return bool(os.environ.get("DATABASE_URL"))


def get_engine():
    global _engine
    if _engine is None:
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            raise RuntimeError(
                "DATABASE_URL is not configured. Copy backend/.env.example to "
                "backend/.env and set it to your Supabase Postgres connection "
                "string (the direct/session connection, not the pooler one)."
            )
        # pool_pre_ping avoids errors from connections that Supabase (or any
        # managed Postgres) has silently closed after a period of idleness.
        _engine = create_engine(database_url, pool_pre_ping=True)
    return _engine


def _get_sessionmaker():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False)
    return _SessionLocal


def init_db() -> None:
    """Creates the files/chat_messages tables if they don't already exist."""
    from . import models  # noqa: F401 - import registers models on Base.metadata

    Base.metadata.create_all(bind=get_engine())


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: `db: Session = Depends(get_db)`."""
    SessionLocal = _get_sessionmaker()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Same as get_db, but usable outside of a FastAPI request (startup
    hooks, the background retention loop, etc)."""
    SessionLocal = _get_sessionmaker()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
