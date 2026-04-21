import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

try:
    # Try to insert a dummy row to see columns (rollback or delete later)
    # Actually, just query one row if it exists
    res = supabase.table("documents").select("*").limit(1).execute()
    if res.data:
        print("Columns:", res.data[0].keys())
    else:
        print("No documents found to inspect columns.")
except Exception as e:
    print(f"Error: {e}")
