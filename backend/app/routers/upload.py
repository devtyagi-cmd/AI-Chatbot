from __future__ import annotations

import os
import uuid

import duckdb
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from ..data_store import FileSession, store
from ..services.cleaning import drop_trailing_summary_rows
from ..services.profiling import profile_dataframe

router = APIRouter()

UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads")
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only .csv, .xlsx, or .xls files are supported.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 25MB).")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    file_id = uuid.uuid4().hex[:12]
    saved_path = os.path.join(UPLOAD_DIR, f"{file_id}_{filename}")
    with open(saved_path, "wb") as f:
        f.write(contents)

    try:
        if ext == "csv":
            df = pd.read_csv(saved_path)
        else:
            df = pd.read_excel(saved_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    if df.shape[1] == 0:
        raise HTTPException(status_code=400, detail="File has no columns.")
    if df.shape[0] == 0:
        raise HTTPException(status_code=400, detail="File has no data rows.")

    # Normalize column names (strip stray whitespace) so both SQL and the UI
    # see clean headers.
    df.columns = [str(c).strip() for c in df.columns]

    # Some exported spreadsheets tack a grand-total/footer row onto the end
    # (e.g. an accounting "Total" line with most columns blank). Left in,
    # SUM()/COUNT() queries silently double-count. Strip it before this data
    # is queryable at all.
    df, removed_summary_rows = drop_trailing_summary_rows(df)

    if df.shape[0] == 0:
        raise HTTPException(status_code=400, detail="File has no data rows.")

    con = duckdb.connect(database=":memory:")
    con.register("data", df)

    profile = profile_dataframe(df)
    if removed_summary_rows:
        profile["removed_summary_rows"] = removed_summary_rows

    session = FileSession(
        file_id=file_id,
        filename=filename,
        df=df,
        con=con,
        profile=profile,
    )
    store.add(session)

    return {
        "file_id": file_id,
        "filename": filename,
        "profile": profile,
    }
