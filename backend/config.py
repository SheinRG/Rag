"""
Nexus — Configuration
Loads all environment variables and defines application constants.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ─── Supabase ───
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# ─── Groq ───
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.1-8b-instant"

# ─── Tavily ───
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

# ─── Embeddings ───
EMBED_MODEL = "embed-english-light-v3.0"
EMBED_DIMENSIONS = 384

# ─── Chunking ───
CHUNK_SIZE = 2500
CHUNK_OVERLAP = 200

# ─── Retrieval ───
TOP_K = 10
SIMILARITY_THRESHOLD = 0.10

# ─── File Upload ───
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "20"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md", ".csv", ".docx", ".pptx", ".xlsx", ".xls"]

# ─── Storage ───
STORAGE_BUCKET = "documents"

# ─── App ───
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
