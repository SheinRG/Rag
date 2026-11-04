"""Query endpoints: input validation is enforced before any streaming starts."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import routes.query_routes as query_routes
import usage as usage_module
from auth_middleware import get_current_user
from conftest import FakeSupabase


@pytest.fixture
def client(monkeypatch):
    app = FastAPI()
    app.include_router(query_routes.router, prefix="/api")
    app.dependency_overrides[get_current_user] = lambda: type(
        "U", (), {"id": "user-1", "email": "a@b.com"}
    )()

    usage_module.supabase = FakeSupabase(tables={})

    with TestClient(app) as c:
        yield c


def test_ask_stream_rejects_a_blank_question(client):
    resp = client.post("/api/ask/stream", json={"question": "   "})
    assert resp.status_code == 400
    assert "empty" in resp.json()["detail"].lower()