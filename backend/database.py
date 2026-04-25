"""
Nexus — Database & Embedder Initialization
Initializes the Supabase client and Gemini embedding API.
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


# ─── Embedding Model (Gemini API — zero local RAM) ───

class GeminiEmbedder:
    """
    Embedding via Google Gemini API.
    Uses batchEmbedContents for efficiency.
    Matches FastEmbed's .embed() generator interface so all callers work unchanged.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set!")
        self.url = (
            "https://generativelanguage.googleapis.com/v1beta/"
            f"models/gemini-embedding-2:batchEmbedContents?key={self.api_key}"
        )
        self._last_call_time = 0.0

    def embed(self, texts, batch_size=100, **kwargs):
        """
        Yield numpy embeddings one-by-one (generator), matching FastEmbed's interface.
        Internally batches up to 100 texts per API call (Gemini max).
        Rate-limits to stay safely under 15 RPM free-tier quota.
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is missing. Add it to your .env file.")

        if isinstance(texts, str):
            texts = [texts]
        texts = list(texts)

        # Use Gemini's max batch size (100) regardless of caller's batch_size
        api_batch = 100

        for i in range(0, len(texts), api_batch):
            batch = texts[i : i + api_batch]
            requests_body = [
                {
                    "model": "models/gemini-embedding-2",
                    "content": {"parts": [{"text": t}]},
                    "outputDimensionality": 768,
                }
                for t in batch
            ]

            # ── Rate-limit: ensure >= 5s between API calls (max 12 calls/min) ──
            elapsed = time.time() - self._last_call_time
            if elapsed < 5:
                time.sleep(5 - elapsed)

            # ── Retry with back-off on 429 ──
            for attempt in range(5):
                try:
                    resp = httpx.post(
                        self.url,
                        json={"requests": requests_body},
                        timeout=120.0,
                    )
                    self._last_call_time = time.time()

                    if resp.status_code == 429:
                        wait = 60 * (attempt + 1)  # 60s, 120s, 180s …
                        logger.warning(
                            f"Gemini 429 rate-limit on batch {i // api_batch}. "
                            f"Sleeping {wait}s (attempt {attempt + 1}/5)"
                        )
                        time.sleep(wait)
                        continue

                    resp.raise_for_status()
                    data = resp.json()

                    for emb in data.get("embeddings", []):
                        yield np.array(emb["values"], dtype=np.float32)
                    break  # success — exit retry loop

                except httpx.HTTPStatusError:
                    raise
                except Exception as e:
                    if attempt < 4:
                        logger.warning(f"Gemini request error: {e}. Retrying in 10s…")
                        time.sleep(10)
                    else:
                        raise


embedder = GeminiEmbedder()
logger.info("Gemini Embedding API initialized (zero local memory footprint).")
