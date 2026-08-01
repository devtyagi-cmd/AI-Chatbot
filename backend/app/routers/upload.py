from __future__ import annotations

import uuid

import duckdb
from fastapi import APIRouter, File, HTTPException, UploadFile

from ..data_store import FileSession, store
from ..db import get_db_session, is_db_enabled
from ..models import FileRecord
from ..services.file_parsing import parse_uploaded_bytes
from ..services.profiling import profile_dataframe

router = APIRouter()

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

    try:
        df, removed_summary_rows = parse_uploaded_bytes(contents, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    if df.shape[1] == 0:
        raise HTTPException(status_code=400, detail="File has no columns.")
    if df.shape[0] == 0:
        raise HTTPException(status_code=400, detail="File has no data rows.")

    file_id = uuid.uuid4().hex[:12]

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

    # Persist durably (Postgres, not this container's disk) so the file
    # survives backend restarts/redeploys and stays queryable - along with
    # its chat history - for RETENTION_DAYS (see services/retention.py).
    # If no database is configured (e.g. local dev), the file simply lives
    # only in the in-memory cache for this process's lifetime, same as
    # before persistence existed - nothing else about upload changes.
    if is_db_enabled():
        with get_db_session() as db:
            record = FileRecord(
                file_id=file_id,
                filename=filename,
                file_extension=ext,
                content=contents,
                profile=profile,
            )
            db.add(record)
            db.commit()

    return {
        "file_id": file_id,
        "filename": filename,
        "profile": profile,
    }
