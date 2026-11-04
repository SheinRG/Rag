"""Per-user quotas: document count, storage bytes, and the daily AI-call budget."""

import pytest
from fastapi import Depends, FastAPI
from fastapi import HTTPException
from fastapi.testclient import TestClient

import usage as usage_module
from auth_middleware import get_current_user
from conftest import FakeQuery, FakeSupabase

TODAY = "2026-01-01"


class FakeDate:
    @staticmethod
    def today():
        t = type("T", (), {})()
        t.isoformat = lambda: TODAY
        return t


class BoomQuery(FakeQuery):
    """A query whose execute raises, simulating a missing table."""

    def execute(self, *a, **k):
        raise RuntimeError('relation "usage" does not exist')


@pytest.fixture
def seeded(monkeypatch):
    monkeypatch.setattr(usage_module, "date", FakeDate)

    def make(tables):
        supabase = FakeSupabase(tables=tables)
        monkeypatch.setattr(usage_module, "supabase", supabase)
        return supabase

    return make


# â”€â”€â”€ Underlying calcs â”€â”€â”€


def test_document_count_uses_the_exact_count(seeded):
    docs = FakeQuery([{"id": "a"}], count=7)
    seeded({"documents": docs})
    assert usage_module.document_count("user-1") == 7
    assert ("select", ("id",)) in docs.calls
    assert ("eq", ("user_id", "user-1")) in docs.calls


def test_document_count_falls_back_to_payload_length(seeded):
    seeded({"documents": FakeQuery([{"id": "a"}, {"id": "b"}], count=None)})
    assert usage_module.document_count("user-1") == 2


def test_storage_is_the_sum_of_file_sizes(seeded):
    seeded({"documents": FakeQuery([{"file_size": 5}, {"file_size": 7}, {"file_size": None}])})
    assert usage_module.used_storage_bytes("user-1") == 12


# â”€â”€â”€ Upload quota â”€â”€â”€


def test_upload_quota_blocks_when_user_is_at_the_document_cap(seeded, monkeypatch):
    monkeypatch.setattr(usage_module, "MAX_DOCUMENTS", 2)
    seeded({"documents": FakeQuery([{"id": "a"}, {"id": "b"}], count=2)})
    with pytest.raises(HTTPException) as exc:
        usage_module.check_upload_quota("user-1", 0)
    assert exc.value.status_code == 403


def test_upload_quota_blocks_when_storage_would_be_exceeded(seeded, monkeypatch):
    monkeypatch.setattr(usage_module, "MAX_STORAGE_BYTES", 10)
    seeded({"documents": FakeQuery([{"file_size": 8}])})
    with pytest.raises(HTTPException) as exc:
        usage_module.check_upload_quota("user-1", 5)
    assert exc.value.status_code == 403


def test_upload_quota_allows_when_storage_lands_exactly_on_the_cap(seeded, monkeypatch):
    monkeypatch.setattr(usage_module, "MAX_STORAGE_BYTES", 10)
    seeded({"documents": FakeQuery([{"file_size": 8}])})
    usage_module.check_upload_quota("user-1", 2)


def test_upload_quota_passes_under_the_limits(seeded):
    seeded({"documents": FakeQuery([{"id": "a"}, {"file_size": 1}], count=1)})
    usage_module.check_upload_quota("user-1", 10)


# â”€â”€â”€ Daily AI-call budget â”€â”€â”€


def test_ai_quota_blocks_at_todays_limit(seeded, monkeypatch):
    monkeypatch.setattr(usage_module, "MAX_AI_CALLS_PER_DAY", 3)
    seeded({"usage": FakeQuery([{"ai_calls_date": TODAY, "ai_calls_used": 3}])})
    with pytest.raises(HTTPException) as exc:
        usage_module.check_ai_quota("user-1")
    assert exc.value.status_code == 429


def test_ai_quota_allows_first_use_of_a_new_day(seeded, monkeypatch):
    monkeypatch.setattr(usage_module, "MAX_AI_CALLS_PER_DAY", 3)
    seeded({"usage": FakeQuery([{"ai_calls_date": "2025-12-31", "ai_calls_used": 3}])})
    usage_module.check_ai_quota("user-1")


def test_ai_quota_allows_first_call_with_no_row(seeded):
    seeded({"usage": FakeQuery([])})
    usage_module.check_ai_quota("user-1")


def test_count_ai_call_increments_within_the_same_day(seeded):
    usage_q = FakeQuery([{"ai_calls_date": TODAY, "ai_calls_used": 2}])
    seeded({"usage": usage_q})
    usage_module.count_ai_call("user-1")
    assert ("update", ({"ai_calls_used": 3},)) in usage_q.calls
    assert ("eq", ("user_id", "user-1")) in usage_q.calls


def test_count_ai_call_resets_on_a_new_day(seeded):
    usage_q = FakeQuery([{"ai_calls_date": "2025-12-31", "ai_calls_used": 9}])
    seeded({"usage": usage_q})
    usage_module.count_ai_call("user-1")
    upserts = [c for c in usage_q.calls if c[0] == "upsert"]
    assert len(upserts) == 1
    assert upserts[0][1][0]["ai_calls_date"] == TODAY
    assert upserts[0][1][0]["ai_calls_used"] == 1
    assert upserts[0][1][0]["user_id"] == "user-1"


# â”€â”€â”€ Fail open before migration 003 is applied â”€â”€â”€


def test_ai_quota_fails_open_when_the_usage_table_is_missing(seeded):
    seeded({"usage": BoomQuery([])})
    usage_module.check_ai_quota("user-1")
    usage_module.count_ai_call("user-1")


# â”€â”€â”€ The FastAPI dependency end to end â”€â”€â”€


def _app():
    app = FastAPI()
    app.dependency_overrides[get_current_user] = lambda: type(
        "U", (), {"id": "user-1", "email": "a@b.com"}
    )()

    @app.get("/check")
    async def check(_ai=Depends(usage_module.track_ai_usage)):
        return {"ok": True}

    return app


def test_track_ai_usage_charges_a_call_on_success(seeded):
    usage_q = FakeQuery([{"ai_calls_date": TODAY, "ai_calls_used": 1}])
    seeded({"documents": FakeQuery([]), "usage": usage_q})

    with TestClient(_app()) as client:
        resp = client.get("/check")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    assert ("update", ({"ai_calls_used": 2},)) in usage_q.calls


def test_track_ai_usage_returns_429_when_the_daily_budget_is_spent(seeded, monkeypatch):
    monkeypatch.setattr(usage_module, "MAX_AI_CALLS_PER_DAY", 2)
    seeded({"documents": FakeQuery([]), "usage": FakeQuery([{"ai_calls_date": TODAY, "ai_calls_used": 2}])})

    with TestClient(_app()) as client:
        resp = client.get("/check")

    assert resp.status_code == 429
