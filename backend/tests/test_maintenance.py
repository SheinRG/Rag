"""
Maintenance: the stale-'processing' watchdog flips stuck jobs to failed.
"""

import pytest

import maintenance
from conftest import FakeQuery, FakeSupabase


def test_flip_stale_processing_marks_old_processing_jobs(monkeypatch):
    docs = FakeQuery([{"id": "doc-1"}, {"id": "doc-2"}])
    supabase = FakeSupabase(tables={"documents": docs})
    monkeypatch.setattr(maintenance, "supabase", supabase)

    count = maintenance.flip_stale_processing(timeout_minutes=5)

    assert count == 2
    # The update is scoped to rows that are still 'processing'...
    assert ("eq", ("status", "processing")) in docs.calls
    # ...and older than the cutoff (any created_at upper bound filter is a lt).
    assert any(name == "lt" for name, _ in docs.calls)
    assert (
        "update",
        ({"status": "failed", "error_msg": maintenance.TIMEOUT_ERROR_MESSAGE},),
    ) in docs.calls


def test_flip_stale_processing_reports_zero_when_nothing_is_stuck(monkeypatch):
    docs = FakeQuery([])
    supabase = FakeSupabase(tables={"documents": docs})
    monkeypatch.setattr(maintenance, "supabase", supabase)

    assert maintenance.flip_stale_processing(timeout_minutes=1) == 0


def test_run_watchdog_loop_logs_failures_and_keeps_running(monkeypatch):
    """
    A bad pass must not kill the loop: the next interval retries.
    We let the first call fail, then cancel the task to end the test.
    """
    import asyncio

    state = {"calls": 0}
    calls = []

    def flaky_flip(timeout_minutes):
        state["calls"] += 1
        if state["calls"] == 1:
            raise RuntimeError("db hiccup")
        calls.append(timeout_minutes)
        return 0

    monkeypatch.setattr(
        "asyncio.to_thread", lambda fn, *args, **kw: fn(*args, **kw)
    )
    monkeypatch.setattr(maintenance, "flip_stale_processing", flaky_flip)

    async def scenario():
        task = asyncio.create_task(
            maintenance.run_watchdog(interval_seconds=0.01, timeout_minutes=7)
        )
        await asyncio.sleep(0.05)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

    asyncio.run(scenario())

    # The first pass raised, but the loop kept going and ran the real flip.
    assert state["calls"] > 1
    assert 7 in calls