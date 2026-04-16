import asyncio
from database import supabase, embedder
from config import SIMILARITY_THRESHOLD

def test_fetch():
    res = supabase.table("chunks").select("user_id").limit(1).execute()
    if not res.data:
        print("No chunks found in DB")
        return
    uid = res.data[0]["user_id"]
    print(f"Testing with user id: {uid}")
    
    query = "projects in resume"
    q_emb = embedder.encode([query]).tolist()[0]
    
    # Try different thresholds
    for t in [0.75, 0.5, 0.3, 0.1]:
        r = supabase.rpc("match_chunks", {
            "query_embedding": q_emb,
            "match_user_id": uid,
            "match_count": 5,
            "match_threshold": t,
        }).execute()
        
        print(f"Threshold {t}: {len(r.data)} chunks found.")
        if len(r.data) > 0 and t == 0.1:
            for c in r.data[:2]:
                print("Similarity:", c["similarity"], "Content:", c["content"][:50])

if __name__ == "__main__":
    test_fetch()
