from __future__ import annotations

import re
from typing import Tuple

import duckdb
import pandas as pd

# Anything beyond a plain SELECT is refused. DuckDB has no separate "read-only
# user" concept for an in-memory connection registered against a dataframe,
# so this keyword blocklist plus the single-statement / SELECT-only check in
# validate_select_only() is what stands between the model and the process.
_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(insert|update|delete|drop|alter|create|attach|detach|copy|pragma|"
    r"call|export|import|install|load|vacuum|checkpoint|set|grant|revoke)\b",
    re.IGNORECASE,
)

_ALLOWED_START = re.compile(r"^\s*(with|select)\b", re.IGNORECASE)

MAX_ROWS = 1000


class SQLValidationError(Exception):
    pass


def validate_select_only(sql: str) -> str:
    stripped = sql.strip()
    # Allow a single trailing semicolon, reject anything that looks like
    # multiple stacked statements.
    if stripped.endswith(";"):
        stripped = stripped[:-1].strip()
    if ";" in stripped:
        raise SQLValidationError("Only a single SQL statement is allowed (no ';' in the middle of a query).")
    if not stripped:
        raise SQLValidationError("Empty query.")
    if not _ALLOWED_START.match(stripped):
        raise SQLValidationError("Only SELECT (or WITH ... SELECT) queries are allowed.")
    if _FORBIDDEN_KEYWORDS.search(stripped):
        raise SQLValidationError("Query contains a disallowed keyword.")
    return stripped


def run_sql_query(
    con: duckdb.DuckDBPyConnection, sql: str, max_rows: int = MAX_ROWS
) -> Tuple[pd.DataFrame, bool]:
    """
    Execute a validated read-only SQL query against the DuckDB connection
    (which has the uploaded file registered as a view/table named 'data').
    Returns (result_dataframe, was_truncated).
    """
    validated = validate_select_only(sql)
    result_df = con.execute(validated).fetchdf()
    truncated = len(result_df) > max_rows
    if truncated:
        result_df = result_df.head(max_rows)
    return result_df, truncated
