"""
In-memory store mapping file_id -> the loaded dataframe, its DuckDB
connection, and its profile. This is intentionally simple for milestone 1
(single CSV/Excel file, single process). When persistence is added later,
this is the seam to swap for PostgreSQL - the rest of the app only talks to
`store.get()` / `store.add()`, never to a dataframe directly.
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


# Single process-wide instance. Fine for local dev / single-user use;
# revisit when this needs to run across multiple worker processes.
store = DataStore()
