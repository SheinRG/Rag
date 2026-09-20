"""
Nexus — Per-User Quotas & Budgets
Enforces the caps that keep a single user from exhausting storage or the AI
budget: document count, storage bytes, and daily AI tool calls.

Document count and storage are computed from the documents table on demand (no
counter to drift); the daily AI-call budget uses a per-user row that resets on
date change. All reads/writes fail open (log + allow) if the usage table does
not exist yet, so AI features never break on databases that predate migration
003 — they just don't enforce the budget until the table is created.
"""

import logging
from datetime import date

from fastapi import Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from auth_middleware import get_current_user
from config import MAX_AI_CALLS_PER_DAY, MAX_DOCUMENTS, MAX_STORAGE_BYTES
from database import supabase

logger = logging.getLogger(__name__)


def document_count(user_id: str) -> int:
    """Number of document rows the user currently has (any status)."""
    result = (
        supabase.table("documents")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    if result.count is not None:
        return result.count
    return len(result.data or [])


def used_storage_bytes(user_id: str) -> int:
    """Sum of the file sizes of the user's documents (stored bytes)."""
    result = (
        supabase.table("documents")
        .select("file_size")
        .eq("user_id", user_id)
        .execute()
    )
    return sum(row.get("file_size") or 0 for row in (result.data or []))


def check_upload_quota(user_id: str, incoming_bytes: int) -> None:
    """
    Raise 403 when adding a new document would exceed the per-user caps.
    Call before bytes are written to storage.
    """
    if document_count(user_id) >= MAX_DOCUMENTS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Document limit reached ({MAX_DOCUMENTS}). Delete old documents to add more.",
        )
    if used_storage_bytes(user_id) + incoming_bytes > MAX_STORAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Storage limit reached. Delete old documents to free space.",
        )


def _usage_row(user_id: str):
    try:
        result = (
            supabase.table("usage")
            .select("ai_calls_date, ai_calls_used")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data
    except Exception as e:
        logger.warning(f"Usage lookup failed (table may not exist yet): {e}")
        return None


def _reset_usage(user_id: str, today: str) -> None:
    try:
        supabase.table("usage").upsert(
            {"user_id": user_id, "ai_calls_date": today, "ai_calls_used": 1},
            on_conflict="user_id",
        ).execute()
    except Exception as e:
        logger.warning(f"Usage reset failed (table may not exist yet): {e}")


def check_ai_quota(user_id: str) -> None:
    """Raise 429 when the user has hit today's AI-call budget."""
    today = date.today().isoformat()
    row = _usage_row(user_id)
    if row and row.get("ai_calls_date") == today:
        used = row.get("ai_calls_used") or 0
        if used >= MAX_AI_CALLS_PER_DAY:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"You've reached today's AI limit ({MAX_AI_CALLS_PER_DAY} calls). Try again tomorrow.",
            )


def count_ai_call(user_id: str) -> None:
    """Charge one AI call for today (creates/resets the row on a new day)."""
    today = date.today().isoformat()
    row = _usage_row(user_id)
    try:
        if row and row.get("ai_calls_date") == today:
            used = (row.get("ai_calls_used") or 0) + 1
            supabase.table("usage").update({"ai_calls_used": used}).eq(
                "user_id", user_id
            ).execute()
        else:
            _reset_usage(user_id, today)
    except Exception as e:
        logger.warning(f"Usage write failed (table may not exist yet): {e}")


async def charge_ai_call(user_id: str) -> None:
    """Enforce today's budget, then charge one call. For endpoints that only
    spend budget when they actually hit the LLM (e.g. cache-backed studio)."""
    await run_in_threadpool(check_ai_quota, user_id)
    await run_in_threadpool(count_ai_call, user_id)


async def track_ai_usage(user=Depends(get_current_user)) -> None:
    """
    FastAPI dependency for AI-charged endpoints: enforces today's budget, then
    charges exactly one call per user-facing action (even when the action makes
    several internal LLM calls, e.g. the research report).
    """
    await charge_ai_call(str(user.id))