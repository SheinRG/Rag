"""Auth endpoints: register (neutral), login, and /me."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from supabase_auth.errors import AuthApiError

import routes.auth_routes as auth_routes
from auth_middleware import get_current_user
from conftest import FakeSupabase


class FakeSession:
    class _User:
        id = "user-1"
        email = "a@b.com"

    class _Tok:
        access_token = "tok-1"

    def __init__(self):
        self.user = self._User()
        self.session = self._Tok()


class FakeAuth:
    def __init__(self):
        self.calls = []

    def sign_up(self, payload):
        self.calls.append(("sign_up", payload))

    def sign_in_with_password(self, payload):
        self.calls.append(("sign_in", payload))
        return FakeSession()


class ErrorSignUpAuth(FakeAuth):
    def sign_up(self, payload):
        self.calls.append(("sign_up", payload))
        raise AuthApiError("email already registered", 400, None)


class ErrorLoginAuth(FakeAuth):
    def sign_in_with_password(self, payload):
        self.calls.append(("sign_in", payload))
        raise AuthApiError("Invalid login credentials", 400, None)


@pytest.fixture
def client(monkeypatch):
    app = FastAPI()
    app.include_router(auth_routes.router, prefix="/api/auth")
    app.state.limiter = auth_routes.limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    app.dependency_overrides[get_current_user] = lambda: type(
        "U", (), {"id": "user-1", "email": "a@b.com"}
    )()

    supabase = FakeSupabase()
    monkeypatch.setattr(auth_routes, "supabase", supabase)

    def mount_auth(auth):
        monkeypatch.setattr(auth_routes, "supabase", FakeSupabase())
        auth_routes.supabase.auth = auth
        return auth

    with TestClient(app) as c:
        c.mount_auth = mount_auth
        c.app = app
        c.supabase = supabase
        yield c


def test_register_returns_a_neutral_message_and_signs_up(client):
    auth = client.mount_auth(FakeAuth())
    response = client.post(
        "/api/auth/register", json={"email": "a@b.com", "password": "secret123"}
    )
    assert response.status_code == 200
    assert "confirmation" in response.json()["message"].lower()
    assert auth.calls == [("sign_up", {"email": "a@b.com", "password": "secret123"})]


def test_register_does_not_leak_whether_an_email_is_taken(client):
    client.mount_auth(ErrorSignUpAuth())
    response = client.post(
        "/api/auth/register", json={"email": "taken@b.com", "password": "secret123"}
    )
    assert response.status_code == 200
    assert "confirmation" in response.json()["message"].lower()


def test_login_returns_an_access_token(client):
    client.mount_auth(FakeAuth())
    response = client.post(
        "/api/auth/login", json={"email": "a@b.com", "password": "secret123"}
    )
    assert response.status_code == 200
    assert response.json()["access_token"] == "tok-1"
    assert response.json()["user"] == {"id": "user-1", "email": "a@b.com"}


def test_login_with_bad_credentials_returns_401(client):
    client.mount_auth(ErrorLoginAuth())
    response = client.post(
        "/api/auth/login", json={"email": "a@b.com", "password": "wrongpass"}
    )
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


def test_me_returns_the_current_user(client):
    client.mount_auth(FakeAuth())
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer tok"})
    assert response.status_code == 200
    assert response.json() == {"id": "user-1", "email": "a@b.com"}