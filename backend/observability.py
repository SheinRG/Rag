"""
Nexus — Observability
Request-scoped ID propagation, JSON structured logging, and Prometheus metrics.

Every incoming request gets a request_id (honouring X-Request-ID when a proxy
supplies one, otherwise a short random id), which is:
  * echoed back on the response so a client can correlate a failure,
  * stashed in a contextvar so the logging filter tags every log line emitted
    while the request is in flight,
  * used as a label set for the HTTP metrics that Prometheus scrapes at /metrics.
"""

import json
import logging
import time
import uuid
from contextvars import ContextVar

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

request_id_var: ContextVar = ContextVar("request_id", default="-")

HTTP_REQUESTS = Counter(
    "nexus_http_requests_total",
    "Total HTTP requests handled by Nexus.",
    ["method", "route", "status"],
)

HTTP_DURATION = Histogram(
    "nexus_http_request_duration_seconds",
    "HTTP request latency in seconds.",
    ["method", "route"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30),
)


class RequestIDFilter(logging.Filter):
    """Attach the current request_id to every forwarded log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        return True


class JSONFormatter(logging.Formatter):
    """Serialize log records as one JSON object per line (machine-parseable)."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%SZ"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        req_id = getattr(record, "request_id", None)
        if req_id:
            payload["request_id"] = req_id
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def _route_label(request: Request) -> str:
    """Cardinality-safe route label: the matched route path, else the raw path."""
    route = request.scope.get("route")
    path = getattr(route, "path", None)
    return path or request.url.path


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """
    Assign request ids, meter requests, and tag in-flight logs with the id.

    Registered outermost so it also covers CORS/rate-limit handling and can
    attach X-Request-ID to every response, including error pages.
    """

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:16]
        token = request_id_var.set(request_id)
        start = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            route = _route_label(request)
            HTTP_REQUESTS.labels(request.method, route, "5xx").inc()
            HTTP_DURATION.labels(request.method, route).observe(
                time.perf_counter() - start
            )
            request_id_var.reset(token)
            raise

        route = _route_label(request)
        HTTP_REQUESTS.labels(request.method, route, str(response.status_code)).inc()
        HTTP_DURATION.labels(request.method, route).observe(
            time.perf_counter() - start
        )
        response.headers["X-Request-ID"] = request_id
        request_id_var.reset(token)
        return response


def setup_logging():
    """Configure the root logger with JSON output and request-id tagging."""
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    handler.addFilter(RequestIDFilter())
    root.handlers.clear()
    root.addHandler(handler)


def metrics_response() -> Response:
    """Render the Prometheus exposition format for /metrics."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)