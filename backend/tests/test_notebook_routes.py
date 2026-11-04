"""Notebook endpoints: CRUD plus LLM-backed synthesis."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import routes.notebook_routes as notebook_routes
import usage as usage_module
from auth_middleware import get_current_user
from conftest import FakeQuery, FakeSupabase


class FakeGroq:
    def __init__(self):
        self.calls = []
        self.chat = type(
            "Chat",
            (),
            {"completions": FakeGroq._Completions(self)},
        )()

    class _Completions:
        def __init__(self, outer):
            self._outer = outer

        def create(self, **kwargs):
            self._outer.calls.append(kwargs)
            message = type("M", (), {"content": "REPORT CONTENT"})()
            choice = type("C", (), {"message": message})()
            return type("R", (), {"choices": [choice]})()


def _nb_row(**overrides):
    row = {
        "id": "nb-1",
        "title": "Physics",
        "emoji": "📓",
        "description": "",
        "user_id": "user-1",
        "created_at": "2026-01-01T00:00:00+00:00",
        "updated_at": "2026-01-01T00:00:00+00:00",
    }
    row.update(overrides)
    return row


@pytest.fixture
def client(monkeypatch):
    app = FastAPI()
    app.include_router(notebook_routes.router, prefix="/api/notebooks")
    app.dependency_overrides[get_current_user] = lambda: type(
        "U", (), {"id": "user-1", "email": "a@b.com"}
    )()

    groq = FakeGroq()
    monkeypatch.setattr(notebook_routes, "client", groq)

    def install(tables):
        supabase = FakeSupabase(tables=tables)
        monkeypatch.setattr(notebook_routes, "supabase", supabase)
        usage_module.supabase = supabase
        return supabase

    with TestClient(app) as c:
        c.install = install
        c.groq = groq
        yield c


def test_create_notebook_returns_the_row_with_zero_sources(client):
    client.install({"notebooks": FakeQuery([_nb_row()])})
    resp = client.post(
        "/api/notebooks",
        json={"title": "Physics", "emoji": "📓", "description": "notes"},
    )
    assert resp.status_code == 201
    assert resp.json()["id"] == "nb-1"
    assert resp.json()["source_count"] == 0


def test_list_notebooks_includes_source_counts(client):
    docs = FakeQuery([{"id": "d1"}, {"id": "d2"}, {"id": "d3"}], count=3)
    client.install({"notebooks": FakeQuery([_nb_row()]), "documents": docs})

    resp = client.get("/api/notebooks")

    assert resp.status_code == 200
    assert resp.json()[0]["source_count"] == 3
    assert ("eq", ("notebook_id", "nb-1")) in docs.calls


def test_get_notebook_returns_with_a_source_count(client):
    client.install(
        {
            "notebooks": FakeQuery([_nb_row()]),
            "documents": FakeQuery([{"id": "d1"}], count=1),
        }
    )
    resp = client.get("/api/notebooks/nb-1")
    assert resp.status_code == 200
    assert resp.json()["source_count"] == 1


def test_get_notebook_404s_for_an_unowned_notebook(client):
    client.install({"notebooks": FakeQuery([])})
    resp = client.get("/api/notebooks/nb-1")
    assert resp.status_code == 404


def test_update_notebook_applies_only_provided_fields(client):
    nb = FakeQuery([_nb_row()])
    client.install({"notebooks": nb})
    resp = client.patch("/api/notebooks/nb-1", json={"title": "Renamed"})
    assert resp.status_code == 200
    assert any(name == "update" for name, _ in nb.calls)
    assert ("update", ({"title": "Renamed"},)) in nb.calls


def test_update_notebook_400s_when_nothing_is_provided(client):
    client.install({"notebooks": FakeQuery([_nb_row()])})
    resp = client.patch("/api/notebooks/nb-1", json={})
    assert resp.status_code == 400


def test_delete_notebook_removes_it(client):
    nb = FakeQuery([_nb_row()])
    client.install({"notebooks": nb})
    resp = client.delete("/api/notebooks/nb-1")
    assert resp.status_code == 204
    assert any(name == "delete" for name, _ in nb.calls)


def test_synthesize_calls_groq_once_and_returns_the_report(client):
    client.install(
        {
            "notebooks": FakeQuery([{"id": "nb-1"}]),
            "documents": FakeQuery([{"id": "doc-1", "original_name": "a.pdf"}]),
            "chunks": FakeQuery([{"content": "ctx", "document_id": "doc-1"}]),
        }
    )
    resp = client.post("/api/notebooks/nb-1/synthesize")
    assert resp.status_code == 200
    assert resp.json() == {"report": "REPORT CONTENT"}
    assert len(client.groq.calls) == 1


def test_synthesize_400s_when_the_notebook_has_no_documents(client):
    client.install(
        {
            "notebooks": FakeQuery([{"id": "nb-1"}]),
            "documents": FakeQuery([]),
        }
    )
    resp = client.post("/api/notebooks/nb-1/synthesize")
    assert resp.status_code == 400


def test_synthesize_404s_for_an_unowned_notebook(client):
    client.install({"notebooks": FakeQuery([])})
    resp = client.post("/api/notebooks/nb-1/synthesize")
    assert resp.status_code == 404