"""
DocMind AI — Database & Embedder Initialization
Initializes the Supabase client and SentenceTransformer model once.
"""

import logging
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, EMBED_MODEL

logger = logging.getLogger(__name__)

# ─── Supabase Client (service role — bypasses RLS) ───
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ─── Embedding Model (loaded once, reused everywhere) ───
logger.info(f"Loading embedding model: {EMBED_MODEL}")
embedder = SentenceTransformer(EMBED_MODEL)
logger.info("Embedding model loaded successfully.")
