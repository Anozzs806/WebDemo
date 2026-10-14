"""Simple PIN-based admin session (demo). Cookie holds an HMAC token, never the PIN."""

import hashlib
import hmac
import os

from fastapi import HTTPException, Request

COOKIE_NAME = "admin_session"


def admin_token() -> str:
    secret = os.environ.get("SESSION_SECRET", "kilat-santap-demo-secret")
    return hmac.new(secret.encode(), b"admin", hashlib.sha256).hexdigest()


def is_admin(request: Request) -> bool:
    token = request.cookies.get(COOKIE_NAME, "")
    return bool(token) and hmac.compare_digest(token, admin_token())


async def require_admin(request: Request) -> None:
    if not is_admin(request):
        raise HTTPException(status_code=401, detail="PIN admin diperlukan")
