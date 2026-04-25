"""
Nexus — Database & Embedder Initialization
Initializes the Supabase client and SentenceTransformer model once.
"""

import logging
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, EMBED_MODEL

logger = logging.getLogger(__name__)

# ─── Supabase Client (service role — bypasses RLS) ───
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

import os
import httpx
import numpy as np

# ─── Embedding Model (Gemini API - Lightning Fast) ───
class GeminiEmbedder:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key={self.api_key}"

    def encode(self, texts, batch_size=100, **kwargs):
        if not self.api_key:
            logger.error("GEMINI_API_KEY is not set!")
            raise ValueError("GEMINI_API_KEY is missing. Add it to .env")

        if isinstance(texts, str):
            texts = [texts]
        
        all_embeddings = []
        import time
        # Gemini allows up to 100 requests per batchEmbedContents call
        for i in range(0, len(texts), 100):
            batch_texts = texts[i:i+100]
            requests = [
                {
                    "model": "models/gemini-embedding-2",
                    "content": {"parts": [{"text": text}]},
                    "outputDimensionality": 768
                }
                for text in batch_texts
            ]
            
            max_retries = 5
            for attempt in range(max_retries):
                with httpx.Client() as client:
                    response = client.post(self.url, json={"requests": requests}, timeout=60.0)
                    if response.status_code == 429:
                        if attempt < max_retries - 1:
                            sleep_time = (2 ** attempt) * 2  # 2s, 4s, 8s, 16s...
                            logger.warning(f"Gemini Rate Limit hit. Retrying in {sleep_time}s...")
                            time.sleep(sleep_time)
                            continue
                    response.raise_for_status()
                    data = response.json()
                    
                    for emb in data.get("embeddings", []):
                        all_embeddings.append(emb["values"])
                    break # Break retry loop on success
                    
        return np.array(all_embeddings)

embedder = GeminiEmbedder()
logger.info("Gemini Embedding API loaded successfully.")
