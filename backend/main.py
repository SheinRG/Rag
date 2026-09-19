"""
Nexus — FastAPI Application
Main app assembly with middleware, routers, and startup checks.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import (
    ALLOWED_ORIGINS,
    ENVIRONMENT,
    SENTRY_DSN,
    SENTRY_TRACES_SAMPLE_RATE,
)
from observability import ObservabilityMiddleware, metrics_response, setup_logging
from rate_limit import limiter
from routes.auth_routes import router as auth_router
from routes.document_routes import router as document_router
from routes.query_routes import router as query_router
from routes.studio_routes import router as studio_router
from routes.search_routes import router as search_router
from routes.notebook_routes import router as notebook_router
from routes.media_routes import router as media_router

# ─── Logging ───
# One JSON object per line, tagged with request_id while a request is in
# flight, so logs at any volume are machine-parseable and filterable.
setup_logging()
# Silence noisy HTTP debug logs (saves RAM + makes real errors visible)
for noisy in ("httpx", "httpcore", "hpack", "hpack.hpack", "hpack.table"):
    logging.getLogger(noisy).setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# ─── Error tracking (optional) ───
# Only active when SENTRY_DSN is set; otherwise the app runs without it.
if SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=ENVIRONMENT,
        traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE,
    )
    logger.info("Sentry error tracking enabled.")


# ─── Lifespan (startup / shutdown) ───

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Verify external connections on startup and run the ingestion watchdog."""
    logger.info("Nexus starting up...")

    # Start the stale-'processing' watchdog (safety net for lost background jobs).
    from maintenance import run_watchdog
    watchdog_task = asyncio.create_task(run_watchdog())

    # Verify Supabase connection
    try:
        from database import supabase
        supabase.table("documents").select("id").limit(1).execute()
        logger.info("✅ Supabase connection verified.")
    except Exception as e:
        logger.warning(f"⚠️ Supabase connection check failed: {e}")

    # Verify Groq API key is set
    from config import GROQ_API_KEY
    if GROQ_API_KEY:
        logger.info("✅ Groq API key is configured.")
    else:
        logger.warning("⚠️ Groq API key is not set.")

    # Verify embedding model is loaded
    try:
        from database import embedder
        test_embed = list(embedder.embed(["test"]))[0]
        logger.info(f"✅ Embedding model loaded (dim={len(test_embed)}).")
    except Exception as e:
        logger.warning(f"⚠️ Embedding model check failed: {e}")

    yield

    watchdog_task.cancel()
    try:
        await watchdog_task
    except asyncio.CancelledError:
        pass
    logger.info("Nexus shutting down.")


# ─── App ───

app = FastAPI(
    title="Nexus API",
    version="1.0.0",
    description="Production RAG Document Intelligence API",
    lifespan=lifespan,
)

# ─── Rate limiting ───

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ─── Middleware ───

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Auth is Bearer-token based (Authorization header), not cookies, so credentialed
    # CORS is unnecessary — disabling it avoids accidental cookie exposure.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Outermost: stamps every response with X-Request-ID and meters the call.
# Added last so it wraps the rate limiter and CORS layers too.
app.add_middleware(ObservabilityMiddleware)

# ─── Routers ───

app.include_router(auth_router, prefix="/api/auth")
app.include_router(document_router, prefix="/api/documents")
app.include_router(query_router, prefix="/api")
app.include_router(studio_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(notebook_router, prefix="/api/notebooks")
app.include_router(media_router, prefix="/api/media")


# ─── Health Check ───

@app.get("/health", tags=["System"])
async def health():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0", "service": "Nexus"}


# ─── Metrics (Prometheus) ───

@app.get("/metrics", include_in_schema=False, tags=["System"])
async def metrics():
    """Prometheus metrics in the text exposition format (scrape target)."""
    return metrics_response()
