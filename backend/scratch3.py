import asyncio
from database import supabase

def test_fetch():
    res = supabase.table("chunks").select("content, document_id").limit(100).execute()
    if not res.data:
        print("No chunks found in DB")
        return
    
    for c in res.data:
        if "project" in c["content"].lower():
            print(f"CHUNK HAS PROJECT: {c['content'][:100]}...")

if __name__ == "__main__":
    test_fetch()
