"""
Nexus — FastAPI Application
Main app assembly with middleware, routers, and startup checks.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from config import ALLOWED_ORIGINS, ENVIRONMENT
from routes.auth_routes import router as auth_router
from routes.document_routes import router as document_router
from routes.query_routes import router as query_router
from routes.studio_routes import router as studio_router
from routes.search_routes import router as search_router
from routes.notebook_routes import router as notebook_router
from routes.media_routes import router as media_router

# ─── Logging ───
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
# Silence noisy HTTP debug logs (saves RAM + makes real errors visible)
for noisy in ("httpx", "httpcore", "hpack", "hpack.hpack", "hpack.table"):
    logging.getLogger(noisy).setLevel(logging.WARNING)
logger = logging.getLogger(__name__)


# ─── Lifespan (startup / shutdown) ───

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Verify external connections on startup."""
    logger.info("Nexus starting up...")

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

    logger.info("Nexus shutting down.")


# ─── App ───

app = FastAPI(
    title="Nexus API",
    version="1.0.0",
    description="Production RAG Document Intelligence API",
    lifespan=lifespan,
)

# ─── Middleware ───

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

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
