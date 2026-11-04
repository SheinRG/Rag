"""
Nexus — Rate Limiting
Shared slowapi limiter. When a request carries a valid Bearer token, it is keyed
by the authenticated user (so a shared office IP resolves to per-user limits);
otherwise it falls back to the client IP (honouring X-Forwarded-For behind a
proxy such as Render/nginx). In-memory storage — fine for a single instance.
"""

import jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from config import SUPABASE_JWT_SECRET


def _auth_user_key(request: Request) -> str | None:
    """Return a stable per-user key when the Bearer token verifies locally."""
    auth = request.headers.get("authorization") or ""
    if not auth.lower().startswith("bearer "):
        return None
    token = auth.split(" ", 1)[1].strip()
    if not token or not SUPABASE_JWT_SECRET:
        return None
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError:
        # Unreadable/expired token — fall back to IP, don't treat as the user.
        return None
    sub = payload.get("sub")
    return f"user:{sub}" if sub else None


def _client_key(request: Request) -> str:
    """Prefer the authenticated user, then the real IP from X-Forwarded-For."""
    user_key = _auth_user_key(request)
    if user_key:
        return user_key
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# Global default protects every route; stricter per-route limits are applied
# with @limiter.limit(...) on auth and expensive LLM endpoints.
limiter = Limiter(key_func=_client_key, default_limits=["120/minute"])
