"""
DocMind AI — Retriever
pgvector cosine similarity search via Supabase RPC.
"""

import logging
from typing import List

from database import supabase, embedder
from config import TOP_K, SIMILARITY_THRESHOLD

logger = logging.getLogger(__name__)


def retrieve(query: str, user_id: str, top_k: int = TOP_K) -> List[dict]:
    """
    Embeds the query and performs cosine similarity search against user's chunks.
    Returns a list of dicts with content, document_id, source name, and similarity score.
    """
    try:
        # Embed the query
        query_embedding = embedder.encode([query]).tolist()[0]

        # Call the match_chunks RPC function
        result = supabase.rpc("match_chunks", {
            "query_embedding": query_embedding,
            "match_user_id": user_id,
            "match_count": top_k,
            "match_threshold": SIMILARITY_THRESHOLD,
        }).execute()

        if not result.data:
            logger.info("No matching chunks found.")
            return []

        # Enrich each result with the source document name
        enriched = []
        doc_name_cache = {}

        for chunk in result.data:
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

            enriched.append({
                "content": chunk["content"],
                "document_id": doc_id,
                "source": doc_name_cache[doc_id],
                "similarity": chunk["similarity"],
            })

        logger.info(f"Retrieved {len(enriched)} chunks for query.")
        return enriched

    except Exception as e:
        logger.error(f"Retrieval failed: {e}")
        return []
