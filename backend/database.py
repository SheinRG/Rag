"""
Nexus — Database & Embedder Initialization
Initializes the Supabase client and SentenceTransformer model once.
"""

import logging
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, EMBED_MODEL
from fastembed import TextEmbedding

logger = logging.getLogger(__name__)

# ─── Supabase Client (service role — bypasses RLS) ───
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ─── Embedding Model (loaded once, reused everywhere) ───
logger.info(f"Loading fastembed model: {EMBED_MODEL}")

class FastEmbedWrapper:
    def __init__(self, model_name):
        # We prefix with sentence-transformers/ if not already present
        # but fastembed uses 'sentence-transformers/all-MiniLM-L6-v2'
        name = f"sentence-transformers/{model_name}" if "sentence" not in model_name else model_name
        self.model = TextEmbedding(model_name=name)
        
    def encode(self, texts):
        if isinstance(texts, str):
            texts = [texts]
        # TextEmbedding.embed returns an iterable of numpy arrays
        # return a list of lists/numpy arrays that match sentence-transformers output
        embeddings = list(self.model.embed(texts))
        return embeddings

embedder = FastEmbedWrapper(EMBED_MODEL)
logger.info("Embedding model loaded successfully.")
