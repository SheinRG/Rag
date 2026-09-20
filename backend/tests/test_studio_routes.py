"""Studio endpoints: cached outputs and generate-on-miss behavior."""

import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import routes.studio_routes as studio_routes
import studio_cache as cache_module
import usage as usage_module
from auth_middleware import get_current_user
from conftest import FakeQuery, FakeSupabase

TOKENS_JSON = json.dumps({"topics": [{"topic": "Thermo", "description": "Heat and work"}]})


class FakeGroq:
    """Minimal Groq stand-in with a recorded completions.create call."""

    def __init__(self):
        self.completions_calls = []
        self.chat = type("Chat", (), {"completions": FakeGroq._Completions(self)})()

    class _Completions:
        def __init__(self, outer):
            self._outer = outer

        def create(self, **kwargs):
            self._outer.completions_calls.append(kwargs)
            message = type("M", (), {"content": TOKENS_JSON})()
            choice = type("C", (), {"message": message})()
            return type("R", (), {"choices": [choice]})()


@pytest.fixture
def harness(monkeypatch):
    app = FastAPI()
    app.include_router(studio_routes.router, prefix="/api")
    app.dependency_overrides[get_current_user] = lambda: type(
        "U", (), {"id": "user-1", "email": "a@b.com"}
    )()

    groq = FakeGroq()
    monkeypatch.setattr(studio_routes, "client", groq)

    def install(tables):
        supabase = FakeSupabase(tables=tables)
        monkeypatch.setattr(studio_routes, "supabase", supabase)
        usage_module.supabase = supabase
        cache_module.supabase = supabase
        return supabase

    with TestClient(app) as c:
        c.install = install
        c.groq = groq
        yield c


def _chunks():
    return FakeQuery(
        [{"content": "Some document content to summarize.", "chunk_index": 0}], count=1
    )


def test_topics_returns_cached_output_without_an_llm_call(harness):
    cached = [
        {"payload": json.dumps({"topics": [{"topic": "Cached"}], "document_name": "d.pdf"})}
    ]
    harness.install(
        {
            "documents": FakeQuery([{"id": "doc-1", "original_name": "d.pdf"}]),
            "studio_cache": FakeQuery(cached),
        }
    )
    resp = harness.get("/api/documents/doc-1/topics")
    assert resp.status_code == 200
    assert resp.json()["topics"][0]["topic"] == "Cached"
    assert harness.groq.completions_calls == []


def test_topics_cache_miss_generates_then_stores(harness):
    cache_q = FakeQuery([])
    harness.install(
        {
            "documents": FakeQuery([{"id": "doc-1", "original_name": "d.pdf"}]),
            "chunks": _chunks(),
            "studio_cache": cache_q,
        }
    )
    resp = harness.get("/api/documents/doc-1/topics")
    assert resp.status_code == 200
    assert len(harness.groq.completions_calls) == 1
    upserts = [x for x in cache_q.calls if x[0] == "upsert"]
    assert len(upserts) == 1
    assert upserts[0][1][0]["feature"] == "topics"
    assert upserts[0][1][0]["document_id"] == "doc-1"
    assert json.loads(upserts[0][1][0]["payload"])["topics"][0]["topic"] == "Thermo"


def test_quiz_returns_cached_without_an_llm_call(harness):
    cached = [{"payload": json.dumps({"questions": [{}, {}]})}]
    harness.install({"studio_cache": FakeQuery(cached)})
    resp = harness.post("/api/studio/quiz", json={"document_id": "doc-1"})
    assert resp.status_code == 200
    assert len(resp.json()["questions"]) == 2
    assert harness.groq.completions_calls == []


def test_quiz_cache_miss_generates_then_stores(harness):
    cache_q = FakeQuery([])
    harness.install({"chunks": _chunks(), "studio_cache": cache_q})
    resp = harness.post("/api/studio/quiz", json={"document_id": "doc-1"})
    assert resp.status_code == 200
    assert len(harness.groq.completions_calls) == 1
    assert any(x[0] == "upsert" and x[1][0]["feature"] == "quiz" for x in cache_q.calls)


def test_summary_returns_cached_without_an_llm_call(harness):
    cached = [{"payload": json.dumps({"summary": "Once upon a time"})}]
    harness.install({"studio_cache": FakeQuery(cached)})
    resp = harness.post("/api/studio/summary", json={"document_id": "doc-1"})
    assert resp.status_code == 200
    assert resp.json() == {"summary": "Once upon a time"}
    assert harness.groq.completions_calls == []


def test_summary_cache_miss_generates_then_stores(harness):
    cache_q = FakeQuery([])
    harness.install({"chunks": _chunks(), "studio_cache": cache_q})
    resp = harness.post("/api/studio/summary", json={"document_id": "doc-1"})
    assert resp.status_code == 200
    assert len(harness.groq.completions_calls) == 1
    assert any(x[0] == "upsert" and x[1][0]["feature"] == "summary" for x in cache_q.calls)


def test_flashcards_cache_miss_generates_then_stores(harness):
    cache_q = FakeQuery([])
    harness.install({"chunks": _chunks(), "studio_cache": cache_q})
    resp = harness.post("/api/studio/flashcards", json={"document_id": "doc-1"})
    assert resp.status_code == 200
    assert any(x[0] == "upsert" and x[1][0]["feature"] == "flashcards" for x in cache_q.calls)


def test_mindmap_cache_miss_generates_then_stores(harness):
    cache_q = FakeQuery([])
    harness.install({"chunks": _chunks(), "studio_cache": cache_q})
    resp = harness.post("/api/studio/mindmap", json={"document_id": "doc-1"})
    assert resp.status_code == 200
    assert any(x[0] == "upsert" and x[1][0]["feature"] == "mindmap" for x in cache_q.calls)


def test_flashcards_without_a_document_never_touches_the_cache(harness):
    cache_q = FakeQuery([])
    harness.install({"chunks": _chunks(), "studio_cache": cache_q})
    resp = harness.post("/api/studio/flashcards", json={})
    assert resp.status_code == 200
    assert cache_q.calls == []


def test_get_all_chunks_orders_deterministically(harness):
    chunks = FakeQuery([{"content": "c"}])
    harness.install({"chunks": chunks})
    result = studio_routes._get_all_chunks("user-1")
    assert result == [{"content": "c"}]
    assert ("order", ("chunk_index",)) in chunks.calls
    assert ("limit", (20,)) in chunks.calls