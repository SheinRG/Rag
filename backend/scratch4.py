import asyncio
from database import supabase

def test_fetch():
    res = supabase.table("documents").select("id").eq("original_name", "Resume(updated).pdf").limit(1).execute()
    if not res.data:
        print("Resume not found")
        return
    
    doc_id = res.data[0]["id"]
    chunks_res = supabase.table("chunks").select("content").eq("document_id", doc_id).execute()
    
    for i, c in enumerate(chunks_res.data):
        print(f"--- CHUNK {i} ---")
        print(c["content"].strip())

if __name__ == "__main__":
    test_fetch()
