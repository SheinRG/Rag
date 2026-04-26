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
    Embedding via Google Gemini API (gemini-embedding-2).
    Uses batchEmbedContents for efficiency.
    Matches FastEmbed's .embed() generator interface so all callers work unchanged.
    Free tier: 15 RPM (per item), 1000 RPD → batch 14 items, 65s spacing.
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
        Yield numpy embeddings one-by-one (generator).
        Batches 14 items per API call with 65s pacing to stay under 15 RPM.
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is missing. Add it to your .env file.")

        if isinstance(texts, str):
            texts = [texts]
        texts = list(texts)

        # Gemini free tier: 15 RPM counts EACH item in batch as 1 request.
        # 14 items per call = 14 RPM, with 65s spacing = safely under limit.
        api_batch = 14
        total_batches = (len(texts) + api_batch - 1) // api_batch

        if total_batches > 1:
            est_minutes = (total_batches - 1) * 65 / 60
            logger.info(
                f"Embedding {len(texts)} texts in {total_batches} batches "
                f"(~{est_minutes:.0f} min estimated)"
            )

        for i in range(0, len(texts), api_batch):
            batch_num = i // api_batch + 1
            batch = texts[i : i + api_batch]
            requests_body = [
                {
                    "model": "models/gemini-embedding-2",
                    "content": {"parts": [{"text": t}]},
                    "outputDimensionality": 768,
                }
                for t in batch
            ]

            # ── Rate-limit: 65s between API calls to stay under 15 RPM ──
            elapsed = time.time() - self._last_call_time
            if self._last_call_time > 0 and elapsed < 65:
                wait_time = 65 - elapsed
                logger.info(
                    f"Rate pacing: waiting {wait_time:.0f}s "
                    f"before batch {batch_num}/{total_batches}"
                )
                time.sleep(wait_time)

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
                        wait = 60 * (attempt + 1)
                        logger.warning(
                            f"Gemini 429 on batch {batch_num}/{total_batches}. "
                            f"Sleeping {wait}s (attempt {attempt + 1}/5)"
                        )
                        time.sleep(wait)
                        continue

                    resp.raise_for_status()
                    data = resp.json()

                    for emb in data.get("embeddings", []):
                        yield np.array(emb["values"], dtype=np.float32)

                    logger.info(
                        f"Embedded batch {batch_num}/{total_batches} "
                        f"({len(batch)} items)"
                    )
                    break

                except httpx.HTTPStatusError:
                    raise
                except Exception as e:
                    if attempt < 4:
                        logger.warning(f"Gemini error: {e}. Retrying in 10s…")
                        time.sleep(10)
                    else:
                        raise


embedder = GeminiEmbedder()
logger.info("Gemini embedding-2 API ready (zero local RAM).")

