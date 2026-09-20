"""Rate-limit client identity."""

import os

import jwt as pyjwt

import rate_limit as rate_limit_module
from rate_limit import _client_key


def _request(headers=None, client_host="10.0.0.1"):
    return type(
        "Req",
        (),
        {
            "headers": headers or {},
            "client": type("C", (), {"host": client_host})(),
            "scope": {"client": (client_host, 0), "headers": []},
        },
    )()


def _token(sub="user-1", aud="authenticated"):
    secret = os.environ["SUPABASE_JWT_SECRET"]
    return pyjwt.encode({"sub": sub, "aud": aud}, secret, algorithm="HS256")


def test_uses_the_socket_address_without_a_proxy_header():
    assert _client_key(_request()) == "10.0.0.1"


def test_prefers_the_original_client_from_x_forwarded_for():
    req = _request({"x-forwarded-for": "203.0.113.7, 10.0.0.5"})
    assert _client_key(req) == "203.0.113.7"


def test_trims_whitespace_in_the_forwarded_chain():
    req = _request({"x-forwarded-for": "  203.0.113.7  ,10.0.0.5"})
    assert _client_key(req) == "203.0.113.7"


def test_valid_bearer_token_keys_the_user():
    req = _request({"authorization": f"Bearer {_token()}"})
    assert _client_key(req) == "user:user-1"


def test_bearer_token_wins_over_x_forwarded_for():
    req = _request(
        {
            "authorization": f"Bearer {_token()}",
            "x-forwarded-for": "203.0.113.7",
        }
    )
    assert _client_key(req) == "user:user-1"


def test_malformed_bearer_falls_back_to_ip():
    req = _request({"authorization": "Bearer not-a-jwt"})
    assert _client_key(req) == "10.0.0.1"


def test_empty_bearer_token_falls_back_to_ip():
    req = _request({"authorization": "Bearer   "})
    assert _client_key(req) == "10.0.0.1"


def test_expired_or_mismatched_audience_falls_back_to_ip():
    req = _request({"authorization": f"Bearer {_token(aud='someone-else')}"})
    assert _client_key(req) == "10.0.0.1"


def test_missing_secret_uses_ip(monkeypatch):
    monkeypatch.setattr(rate_limit_module, "SUPABASE_JWT_SECRET", "")
    req = _request({"authorization": f"Bearer {_token()}"})
    assert _client_key(req) == "10.0.0.1"
