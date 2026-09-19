"""
Observability: request-id propagation, JSON log format, and /metrics output.
"""

import json
import logging

from fastapi import FastAPI
from fastapi.testclient import TestClient

import observability
from observability import JSONFormatter, ObservabilityMiddleware


def make_app():
    app = FastAPI()
    app.add_middleware(ObservabilityMiddleware)

    @app.get("/ping")
    async def ping():
        return {"ok": True}

    @app.get("/echo-id")
    async def echo_id():
        return {"request_id": observability.request_id_var.get()}

    @app.get("/metrics-test")
    async def metrics_test():
        return observability.metrics_response()

    return app


def test_request_id_is_assigned_echoed_and_visible_inside_the_handler():
    app = make_app()
    with TestClient(app) as client:
        echo = client.get("/echo-id")
        ping = client.get("/ping")

    assert echo.status_code == 200
    echoed = echo.json()["request_id"]
    assert echoed and echoed != "-"
    # The same id comes back on the response header for client correlation.
    assert ping.headers.get("X-Request-ID")


def test_client_supplied_request_id_is_honoured():
    app = make_app()
    with TestClient(app) as client:
        response = client.get("/echo-id", headers={"X-Request-ID": "trace-abc"})

    assert response.json()["request_id"] == "trace-abc"
    assert response.headers.get("X-Request-ID") == "trace-abc"


def test_metrics_endpoint_exposes_prometheus_text():
    app = make_app()
    with TestClient(app) as client:
        client.get("/ping")
        response = client.get("/metrics-test")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert "nexus_http_requests_total" in response.text
    assert "nexus_http_request_duration_seconds" in response.text


def test_json_formatter_output_is_parseable_and_carries_request_id():
    formatter = JSONFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="hello %s",
        args=("world",),
        exc_info=None,
    )
    record.request_id = "req-123"
    line = formatter.format(record)

    parsed = json.loads(line)
    assert parsed["msg"] == "hello world"
    assert parsed["request_id"] == "req-123"
    assert parsed["level"] == "INFO"
    assert parsed["logger"] == "test"