"""Web search endpoints: guard rails that run before any external call."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import routes.search_routes as search_routes
import usage as usage_module
from auth_middleware import get_current_user
from conftest import FakeSupabase


@pytest.fixture
def client(monkeypatch):
    app = FastAPI()
    app.include_router(search_routes.router, prefix="/api")
    app.dependency_overrides[get_current_user] = lambda: type(
        "U", (), {"id": "user-1", "email": "a@b.com"}
    )()

    usage_module.supabase = FakeSupabase(tables={})

    with TestClient(app) as c:
        c.app = app
        yield c


def test_search_web_rejects_a_blank_query(client):
    resp = client.post("/api/search/web", json={"query": " "})
    assert resp.status_code == 400
    assert "empty" in resp.json()["detail"].lower()


def test_search_web_fails_without_a_tavily_key(client, monkeypatch):
    monkeypatch.setattr(search_routes, "TAVILY_API_KEY", "")
    resp = client.post("/api/search/web", json={"query": "climate science"})
    assert resp.status_code == 500
    assert "Tavily" in resp.json()["detail"]