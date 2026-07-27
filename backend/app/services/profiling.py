from __future__ import annotations

from typing import Any, Dict

import pandas as pd

from .json_safe import records_json_safe


def profile_dataframe(df: pd.DataFrame, preview_rows: int = 10) -> Dict[str, Any]:
    """
    Build the "milestone 1" summary of an uploaded file:
    column names + dtypes, row count, missing value counts, and a preview.
    """
    columns = [{"name": str(col), "dtype": str(df[col].dtype)} for col in df.columns]

    missing = df.isna().sum()
    missing_values = {str(k): int(v) for k, v in missing.items() if int(v) > 0}

    preview_df = df.head(preview_rows)
    preview = records_json_safe(preview_df)

    return {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "columns": columns,
        "missing_values": missing_values,
        "preview": preview,
    }
