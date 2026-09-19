"""
Nexus — Maintenance Tasks
Background housekeeping that keeps ingestion durable in practice.

Upload endpoints schedule ingestion with FastAPI BackgroundTasks, which runs
in-process and is simply lost if the worker restarts mid-job. The watchdog is
the safety net: anything left in "processing" past INGESTION_TIMEOUT_MINUTES is
either a runaway job or an orphan from a dead worker. It is flipped to
"failed" so the frontend stops polling forever and the user can retry via
POST /api/documents/{id}/retry (which re-ingests from scratch, idempotently).
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from config import INGESTION_TIMEOUT_MINUTES, WATCHDOG_INTERVAL_SECONDS
from database import supabase

logger = logging.getLogger(__name__)

TIMEOUT_ERROR_MESSAGE = (
    "Processing timed out. The job may have been interrupted — "
    "use the retry action to re-ingest this document."
)


def flip_stale_processing(timeout_minutes: int = INGESTION_TIMEOUT_MINUTES) -> int:
    """
    Mark documents stuck in 'processing' for longer than timeout_minutes as
    'failed'. Returns the number of documents flipped.

    Safe to run from multiple workers: the UPDATE is restricted to rows that
    are still 'processing', so concurrent passes cannot double-count.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)).isoformat()
    result = (
        supabase.table("documents")
        .update({"status": "failed", "error_msg": TIMEOUT_ERROR_MESSAGE})
        .eq("status", "processing")
        .lt("created_at", cutoff)
        .execute()
    )
    count = len(result.data or [])
    if count:
        logger.warning(f"Flipped {count} stale 'processing' documents to 'failed'.")
    return count


async def run_watchdog(
    interval_seconds: int = WATCHDOG_INTERVAL_SECONDS,
    timeout_minutes: int = INGESTION_TIMEOUT_MINUTES,
):
    """
    Periodic watchdog loop, started from the app lifespan on a single task.
    Transient failures are logged and the next interval retries; only
    cancellation stops the loop.
    """
    logger.info(f"Watchdog started (interval={interval_seconds}s, timeout={timeout_minutes}m).")
    while True:
        try:
            await asyncio.to_thread(flip_stale_processing, timeout_minutes)
        except asyncio.CancelledError:
            logger.info("Watchdog stopped.")
            raise
        except Exception:
            logger.exception("Watchdog pass failed; will retry next interval.")
        await asyncio.sleep(interval_seconds)