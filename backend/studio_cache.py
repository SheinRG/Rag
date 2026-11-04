"""
Nexus — Studio Output Cache
Deterministic, per-document AI outputs (key topics, overview, quiz, summary,
flashcards, mind map) are cached keyed by (user_id, document_id, feature) in
the studio_cache table. "Everything I own" mode has no document_id and is too
cheap/variable to cache, so it always recomputes.

All access fails open: a cache read/write error never breaks a studio feature,
it just recomputes. Rows cascade-delete when the parent document is deleted;
re-ingestion (retry) calls purge() explicitly so stale output can't linger.
"""

import json
import logging
from typing import Optional

from database import supabase

logger = logging.getLogger(__name__)


def get_cached(user_id: str, document_id: Optional[str], feature: str):
    """Return the cached payload for (user, document, feature), or None."""
    if not document_id:
        return None
    try:
        result = (
            supabase.table("studio_cache")
            .select("payload")
            .eq("user_id", user_id)
            .eq("document_id", document_id)
            .eq("feature", feature)
            .single()
            .execute()
        )
    except Exception as e:
        logger.warning(f"Studio cache read failed, recomputing: {e}")
        return None
    if not result.data:
        return None
    try:
        return json.loads(result.data["payload"])
    except (TypeError, json.JSONDecodeError):
        return None


def store(user_id: str, document_id: Optional[str], feature: str, payload) -> None:
    """Persist a generated output, replacing any previous version of the feature."""
    if not document_id:
        return
    try:
        supabase.table("studio_cache").upsert(
            {
                "user_id": user_id,
                "document_id": document_id,
                "feature": feature,
                "payload": json.dumps(payload),
            },
            on_conflict="user_id,document_id,feature",
        ).execute()
    except Exception as e:
        logger.warning(f"Studio cache write failed (not fatal): {e}")


def purge(user_id: str, document_id: str) -> None:
    """Drop every cached feature for a document (called on delete/re-ingest)."""
    try:
        supabase.table("studio_cache").delete().eq("user_id", user_id).eq(
            "document_id", document_id
        ).execute()
    except Exception as e:
        logger.warning(f"Studio cache purge failed (not fatal): {e}")