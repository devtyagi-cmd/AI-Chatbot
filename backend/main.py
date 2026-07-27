import os

from dotenv import load_dotenv

load_dotenv()  # must run before importing anything that reads env vars at import time

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, upload
from app.security import require_shared_login

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
app.include_router(upload.router, prefix="/api", dependencies=[Depends(require_shared_login)])
app.include_router(chat.router, prefix="/api", dependencies=[Depends(require_shared_login)])


@app.get("/api/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    # Lets this file be run directly (`python main.py`, or the frozen
    # backend.exe built by PyInstaller for the desktop app) without needing
    # the `uvicorn` CLI. Dev workflow (`uvicorn main:app --reload`) is
    # unaffected and still preferred while developing, since it gets
    # auto-reload on file changes.
    import uvicorn

    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
