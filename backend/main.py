import asyncio
import logging
import os

from dotenv import load_dotenv

load_dotenv()  # must run before importing anything that reads env vars at import time

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import get_db_session, init_db
from app.routers import auth, chat, files, history, upload
from app.security import require_shared_login
from app.services.retention import delete_expired_data

logger = logging.getLogger("ai_data_chatbot.main")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Data Chatbot API", version="0.1.0")

# Comma-separated list of allowed frontend origins, e.g.
#   ALLOWED_ORIGINS=https://my-team-app.vercel.app,http://localhost:3000
# Defaults to localhost so local dev keeps working with no extra setup.
_allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in _allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# require_shared_login is a no-op locally (until BASIC_AUTH_USERNAME /
# BASIC_AUTH_PASSWORD are set), so this doesn't affect local dev.
app.include_router(auth.router, prefix="/api", dependencies=[Depends(require_shared_login)])
app.include_router(upload.router, prefix="/api", dependencies=[Depends(require_shared_login)])
app.include_router(chat.router, prefix="/api", dependencies=[Depends(require_shared_login)])
app.include_router(files.router, prefix="/api", dependencies=[Depends(require_shared_login)])
app.include_router(history.router, prefix="/api", dependencies=[Depends(require_shared_login)])


@app.get("/api/health")
def health():
    return {"status": "ok"}


RETENTION_CHECK_INTERVAL_SECONDS = 6 * 60 * 60  # every 6 hours


async def _retention_loop() -> None:
    while True:
        try:
            with get_db_session() as db:
                removed = delete_expired_data(db)
                if removed:
                    logger.info("Retention cleanup removed %d expired file(s).", removed)
        except Exception as e:
            # A failed cleanup pass shouldn't crash the server - just log
            # and try again on the next interval.
            logger.warning("Retention cleanup failed: %s", e)
        await asyncio.sleep(RETENTION_CHECK_INTERVAL_SECONDS)


@app.on_event("startup")
async def on_startup() -> None:
    if os.environ.get("DATABASE_URL"):
        init_db()
        asyncio.create_task(_retention_loop())
    else:
        logger.warning(
            "DATABASE_URL not set - file/history persistence is disabled for this run "
            "(uploads will only live in memory, as before)."
        )


if __name__ == "__main__":
    # Lets this file be run directly (`python main.py`, or the frozen
    # backend.exe built by PyInstaller for the desktop app) without needing
    # the `uvicorn` CLI. Dev workflow (`uvicorn main:app --reload`) is
    # unaffected and still preferred while developing, since it gets
    # auto-reload on file changes.
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
