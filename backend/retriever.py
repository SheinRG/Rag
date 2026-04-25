"""
Nexus — Retriever
pgvector cosine similarity search via Supabase RPC.
"""

import logging
from typing import List

from database import supabase, embedder
from config import TOP_K, SIMILARITY_THRESHOLD

try:
    from sentence_transformers import CrossEncoder
    reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
except Exception as e:
    reranker = None
    print(f"Reranker failed to load: {e}")

logger = logging.getLogger(__name__)


def retrieve(
    query: str, user_id: str, top_k: int = TOP_K, document_ids: list[str] = None, notebook_id: str = None
) -> List[dict]:
    """
    Embeds the query and performs cosine similarity search against user's chunks.
    Optionally filters by document_id or notebook_id.
    Optionally filters by a list of document_ids or notebook_id.
    Returns a list of dicts with content, document_id, source name, and similarity score.
    """
    try:
        # Generate embedding for the query
        query_embedding = list(embedder.embed([query]))[0].tolist()

        # Build RPC parameters. If we have a filter, fetch more chunks initially to filter locally.
        candidate_count = 25
        rpc_params = {
            "query_embedding": query_embedding,
            "match_user_id": user_id,
            "match_count": candidate_count if not (document_ids or notebook_id) else 100,
            "match_threshold": SIMILARITY_THRESHOLD,
        }

        # Call the match_chunks RPC function
        result = supabase.rpc("match_chunks", rpc_params).execute()
        chunks = result.data or []

        # Filter by document_ids or notebook_id in Python
        if document_ids and chunks:
            chunks = [c for c in chunks if c.get("document_id") in document_ids]
        elif notebook_id and chunks:
            doc_res = supabase.table("documents").select("id").eq("notebook_id", notebook_id).execute()
            valid_doc_ids = {d["id"] for d in doc_res.data}
            chunks = [c for c in chunks if c.get("document_id") in valid_doc_ids]

        if not chunks:
            logger.info("No matching chunks found.")
            return []

        # Rerank with Cross-Encoder if available
        if reranker and len(chunks) > 1:
            pairs = [[query, chunk["content"]] for chunk in chunks]
            scores = reranker.predict(pairs)
            for i, chunk in enumerate(chunks):
                chunk["similarity"] = float(scores[i])  # Override similarity with reranker score
            
            # Sort by new score descending
            chunks.sort(key=lambda x: x["similarity"], reverse=True)
        
        # Finally, trim to top_k
        chunks = chunks[:top_k]

        # Enrich each result with the source document name
        enriched = []
        doc_name_cache = {}

        for chunk in chunks:
            doc_id = chunk["document_id"]

            # Cache document name lookups
            if doc_id not in doc_name_cache:
                doc_result = (
                    supabase.table("documents")
                    .select("original_name")
                    .eq("id", doc_id)
                    .single()
                    .execute()
                )
                doc_name_cache[doc_id] = (
                    doc_result.data["original_name"] if doc_result.data else "Unknown"
                )

            enriched.append(
                {
                    "content": chunk["content"],
                    "document_id": doc_id,
                    "source": doc_name_cache[doc_id],
                    "similarity": chunk["similarity"],
                }
            )

        logger.info(f"Retrieved {len(enriched)} chunks for query.")
        return enriched

    except Exception as e:
        logger.error(f"Retrieval failed: {e}")
        return []
