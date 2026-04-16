import asyncio
from unittest.mock import Mock
from retriever import retrieve
from database import supabase

user_id = supabase.auth.get_user().user.id if supabase.auth.get_user() else None

def test_retrieval():
    # Use the first user we find in the chunks table
    res = supabase.table("chunks").select("user_id").limit(1).execute()
    if res.data:
        uid = res.data[0]["user_id"]
        print(f"Testing with user id: {uid}")
        
        chunks = retrieve("hi there", uid)
        print("Chunks for 'hi there':", len(chunks))
        
        chunks2 = retrieve("resume or interview", uid)
        print("Chunks for 'resume or interview':", len(chunks2))
        
        # Test low threshold
        import config
        config.SIMILARITY_THRESHOLD = 0.0
        chunks3 = retrieve("hi there", uid)
        print("Chunks for 'hi there' with threshold 0.0:", len(chunks3))

if __name__ == "__main__":
    test_retrieval()
