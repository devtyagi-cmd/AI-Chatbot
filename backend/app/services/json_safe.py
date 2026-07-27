"""
Small helpers to make pandas / numpy / duckdb query results safe to json.dumps
or return from a FastAPI endpoint. Pandas dataframes are full of numpy scalar
types (np.int64, np.float64, np.bool_, pd.Timestamp, pd.NaT, NaN) which the
default JSON encoder either mishandles or rejects outright, so every place we
hand rows back to the frontend or back to the LLM goes through here.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List

import numpy as np
import pandas as pd


def json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        f = float(value)
        return None if math.isnan(f) else f
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if isinstance(value, (pd.Timestamp,)):
        return value.isoformat()
    if isinstance(value, (pd.Timedelta,)):
        return str(value)
    if isinstance(value, float) and math.isnan(value):
        return None
    try:
        if value is pd.NaT:
            return None
    except Exception:
        pass
    return value


def records_json_safe(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Convert a DataFrame into a list of plain-Python-typed dict rows."""
    records = df.to_dict(orient="records")
    return [{str(k): json_safe(v) for k, v in row.items()} for row in records]
