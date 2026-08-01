"""
In-memory store mapping file_id -> the loaded dataframe, its DuckDB
connection, and its profile.

This is a *cache*, not the source of truth - the source of truth is the
`files` table in Postgres (see db.py / models.py). Uploading a file writes
to both; querying a file first checks this in-memory cache and, on a miss
(e.g. right after a backend restart), transparently reloads and re-parses
it from the database via get_or_load() below. Callers should use
get_or_load() rather than store.get() directly whenever a miss should be
recovered from the database instead of treated as "file not found".
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional

import duckdb
import pandas as pd


@dataclass
class FileSession:
    file_id: str
    filename: str
    df: pd.DataFrame
    con: duckdb.DuckDBPyConnection
    profile: dict


class DataStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, FileSession] = {}

    def add(self, session: FileSession) -> None:
        self._sessions[session.file_id] = session

    def get(self, file_id: str) -> Optional[FileSession]:
        return self._sessions.get(file_id)

    def remove(self, file_id: str) -> None:
        self._sessions.pop(file_id, None)


# Single process-wide instance. Fine for a single Render web service
# instance (this app must not be run with multiple instances/autoscaling -
# see README) - each process rebuilds its own cache from the database on
# demand, so that constraint is unaffected by adding persistence.
store = DataStore()


def get_or_load(file_id: str) -> Optional[FileSession]:
    """
    Returns the in-memory session for file_id, transparently rehydrating it
    from the database (re-parsing the stored file bytes into a fresh
    DataFrame + DuckDB connection) if it isn't cached in this process -
    which happens after every backend restart/redeploy. Returns None if the
    file doesn't exist in the database either (never uploaded, or expired
    past the retention window).
    """
    session = store.get(file_id)
    if session is not None:
        return session

    # Imported lazily to avoid a circular import (db/models don't need to
    # know about data_store, but data_store needs them for this fallback).
    from .db import get_db_session, is_db_enabled
    from .models import FileRecord
    from .services.file_parsing import parse_uploaded_bytes

    if not is_db_enabled():
        return None

    with get_db_session() as db:
        record = db.get(FileRecord, file_id)
        if record is None:
            return None

        df, _ = parse_uploaded_bytes(record.content, record.file_extension)
        con = duckdb.connect(database=":memory:")
        con.register("data", df)

        session = FileSession(
            file_id=record.file_id,
            filename=record.filename,
            df=df,
            con=con,
            profile=record.profile,
        )
        store.add(session)
        return session
