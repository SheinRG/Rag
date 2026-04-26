"""
Nexus — Database & Embedder Initialization
Initializes the Supabase client and Cohere embedding API.
"""

import os
import time
import logging

import httpx
import numpy as np
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

logger = logging.getLogger(__name__)

# ─── Supabase Client (service role — bypasses RLS) ───
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ─── Embedding Model (Cohere API — fast, free, zero local RAM) ───

class CohereEmbedder:
    """
    Embedding via Cohere API (embed-english-light-v3.0).
    Free tier: 10,000 calls/month, 100 RPM, 96 items/call.
    Matches FastEmbed's .embed() generator interface so all callers work unchanged.
    """

    API_URL = "https://api.cohere.com/v1/embed"
    MODEL = "embed-english-light-v3.0"
    MAX_BATCH = 96  # Cohere's max texts per call

    def __init__(self):
        self.api_key = os.getenv("COHERE_API_KEY", "")
        if not self.api_key:
            logger.warning("COHERE_API_KEY is not set!")

    def embed(self, texts, batch_size=96, input_type="search_document", **kwargs):
        """
        Yield numpy embeddings one-by-one (generator), matching FastEmbed's interface.
        Batches up to 96 texts per API call.
        For queries (retrieval), call with input_type="search_query".
        """
        if not self.api_key:
            raise ValueError("COHERE_API_KEY is missing. Add it to your .env file.")

        if isinstance(texts, str):
            texts = [texts]
        texts = list(texts)

        total_batches = (len(texts) + self.MAX_BATCH - 1) // self.MAX_BATCH

        for i in range(0, len(texts), self.MAX_BATCH):
            batch_num = i // self.MAX_BATCH + 1
            batch = texts[i : i + self.MAX_BATCH]

            # ── Retry with back-off ──
            for attempt in range(5):
                try:
                    resp = httpx.post(
                        self.API_URL,
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "texts": batch,
                            "model": self.MODEL,
                            "input_type": input_type,
                            "truncate": "END",
                        },
                        timeout=120.0,
                    )

                    if resp.status_code == 429:
                        wait = 30 * (attempt + 1)
                        logger.warning(
                            f"Cohere 429 on batch {batch_num}/{total_batches}. "
                            f"Sleeping {wait}s (attempt {attempt + 1}/5)"
                        )
                        time.sleep(wait)
                        continue

                    resp.raise_for_status()
                    data = resp.json()

                    for emb in data.get("embeddings", []):
                        yield np.array(emb, dtype=np.float32)

                    logger.info(
                        f"Embedded batch {batch_num}/{total_batches} "
                        f"({len(batch)} items)"
                    )
                    break

                except httpx.HTTPStatusError:
                    raise
                except Exception as e:
                    if attempt < 4:
                        logger.warning(f"Cohere error: {e}. Retrying in 5s…")
                        time.sleep(5)
                    else:
                        raise

    def embed_query(self, text):
        """Embed a single query text for retrieval (uses search_query input type)."""
        return list(self.embed([text], input_type="search_query"))[0]


embedder = CohereEmbedder()
logger.info("Cohere embed-english-light-v3.0 ready (384 dims, 100 RPM, zero RAM).")
