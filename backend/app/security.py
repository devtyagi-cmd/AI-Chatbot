"""
Lightweight shared-password gate for internal deployments.

This is intentionally simple: one shared username/password for the whole
team (set via env vars), not individual accounts. That's enough to keep the
API from being wide open to the entire internet without building a real
auth system. If BASIC_AUTH_USERNAME / BASIC_AUTH_PASSWORD aren't set (e.g.
local dev), the gate is skipped entirely so nothing changes for local use.
"""

from __future__ import annotations

import os
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

_security = HTTPBasic(auto_error=False)


def require_shared_login(
    credentials: HTTPBasicCredentials = Depends(_security),
) -> None:
    expected_user = os.environ.get("BASIC_AUTH_USERNAME")
    expected_pass = os.environ.get("BASIC_AUTH_PASSWORD")

    if not expected_user or not expected_pass:
        # No credentials configured on the server - auth is off (local dev).
        return

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login required.",
            headers={"WWW-Authenticate": "Basic"},
        )

    # secrets.compare_digest avoids leaking timing information about how
    # many characters matched.
    user_ok = secrets.compare_digest(credentials.username, expected_user)
    pass_ok = secrets.compare_digest(credentials.password, expected_pass)

    if not (user_ok and pass_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Basic"},
        )
