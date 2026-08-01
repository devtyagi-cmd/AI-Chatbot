from __future__ import annotations

import io
from typing import Tuple

import pandas as pd

from .cleaning import drop_trailing_summary_rows


def parse_uploaded_bytes(content: bytes, extension: str) -> Tuple[pd.DataFrame, int]:
    """
    Parses raw file bytes (csv/xlsx/xls) into a cleaned DataFrame. Shared by
    the upload endpoint and by the database-reload path (when a file isn't
    in the in-memory cache - e.g. after a backend restart - and needs to be
    re-parsed from its persisted bytes), so both code paths produce
    identical data.

    Returns (dataframe, removed_summary_row_count).
    """
    if extension == "csv":
        df = pd.read_csv(io.BytesIO(content))
    else:
        df = pd.read_excel(io.BytesIO(content))

    df.columns = [str(c).strip() for c in df.columns]
    df, removed_summary_rows = drop_trailing_summary_rows(df)
    return df, removed_summary_rows
