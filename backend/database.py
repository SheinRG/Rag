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

# ─── Embedding Model (Local - FastEmbed) ───
from fastembed import TextEmbedding
embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5", threads=2)
logger.info("Local Embedding Model loaded successfully.")
