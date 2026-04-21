import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

try:
    buckets = supabase.storage.list_buckets()
    print("Buckets:", [b.name for b in buckets])
    if "documents" not in [b.name for b in buckets]:
        print("Creating 'documents' bucket...")
        supabase.storage.create_bucket("documents", options={"public": False})
    else:
        print("'documents' bucket already exists.")
except Exception as e:
    print(f"Error: {e}")
