from __future__ import annotations

from typing import Tuple

import pandas as pd


def _find_identifier_columns(
    df: pd.DataFrame,
    uniqueness_threshold: float = 0.9,
    null_threshold: float = 0.05,
) -> list:
    """
    Find columns that behave like a row identifier: filled in on almost
    every row, and almost always a unique value per row (a serial number,
    a transaction ID, an invoice number, etc). Real data rows should never
    be blank in a column like this - a row that IS blank there is a strong
    signal it isn't a real data row at all.
    """
    identifier_cols = []
    n = len(df)
    if n == 0:
        return identifier_cols

    for col in df.columns:
        non_null = df[col].dropna()
        null_rate = 1 - (len(non_null) / n)
        if null_rate >= null_threshold or len(non_null) == 0:
            continue
        uniqueness = non_null.astype(str).nunique() / len(non_null)
        if uniqueness >= uniqueness_threshold:
            identifier_cols.append(col)

    return identifier_cols


def drop_trailing_summary_rows(
    df: pd.DataFrame,
    max_trailing_check: int = 5,
) -> Tuple[pd.DataFrame, int]:
    """
    Many exported spreadsheets (accounting/ERP systems especially) tack a
    grand-total or subtotal row onto the very end of the data: the row's
    identifying columns (an ID/serial number, dates, codes) are left blank,
    while a handful of numeric columns are filled in with pre-computed
    totals. If that row is treated as a normal transaction, any SUM/COUNT
    aggregate silently double-counts (real rows + the sheet's own
    precomputed total) - the identifying columns being blank is exactly
    what a "core" or "mostly non-null" check misses, since the row often
    still has several other columns filled in.

    Heuristic: find identifier-like columns (near-unique, near-always
    filled in - e.g. a serial number or transaction ID). Then check only
    the last `max_trailing_check` rows: if a trailing row is blank across
    ALL identifier columns, it's treated as a summary/footer row and
    dropped, since a real transaction should always have an ID.

    Only the tail of the file is checked (footer rows are conventionally
    at the bottom) - this keeps the heuristic from accidentally dropping a
    real row that happens to be missing its ID in the middle of a file.

    Returns (cleaned_dataframe, number_of_rows_dropped).
    """
    if len(df) == 0:
        return df, 0

    identifier_cols = _find_identifier_columns(df)
    if not identifier_cols:
        # Nothing in this file reliably looks like a row ID - no safe
        # signal to flag a footer row against.
        return df, 0

    n = min(max_trailing_check, len(df))
    tail_idx = df.index[-n:]

    drop_idx = [idx for idx in tail_idx if df.loc[idx, identifier_cols].isna().all()]

    if not drop_idx:
        return df, 0

    cleaned = df.drop(index=drop_idx).reset_index(drop=True)
    return cleaned, len(drop_idx)
