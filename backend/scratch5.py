from retriever import retrieve
from database import supabase

def test():
    uid = supabase.table("documents").select("user_id").limit(1).execute().data[0]["user_id"]
    query = "what are the projects on this resume"
    chunks = retrieve(query, uid)
    
    print(f"Query: {query}")
    print(f"Retrieved {len(chunks)} chunks.")
    for i, c in enumerate(chunks):
        print(f"--- Chunk {i} ({c['similarity']:.2f}) ---")
        print(c["content"].strip())

if __name__ == "__main__":
    test()
