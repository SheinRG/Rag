"""
DocMind AI — Retriever
pgvector cosine similarity search via Supabase RPC.
"""

import logging
from typing import List

from database import supabase, embedder
from config import TOP_K, SIMILARITY_THRESHOLD

logger = logging.getLogger(__name__)


def retrieve(
    query: str, user_id: str, top_k: int = TOP_K, document_id: str = None
) -> List[dict]:
    """
    Embeds the query and performs cosine similarity search against user's chunks.
    Optionally filters by document_id for per-document chats.
    Returns a list of dicts with content, document_id, source name, and similarity score.
    """
    try:
        # Embed the query
        query_embedding = embedder.encode([query]).tolist()[0]

        # Build RPC parameters. If we have a document_id filter, we fetch more chunks initially to filter locally.
        rpc_params = {
            "query_embedding": query_embedding,
            "match_user_id": user_id,
            "match_count": top_k if not document_id else 50,
            "match_threshold": SIMILARITY_THRESHOLD,
        }

        # Call the match_chunks RPC function
        result = supabase.rpc("match_chunks", rpc_params).execute()

        # Filter by document_id in Python since the default match_chunks RPC doesn't support the param
        chunks = result.data
        if document_id and chunks:
            chunks = [c for c in chunks if c.get("document_id") == document_id][:top_k]

        if not chunks:
            logger.info("No matching chunks found.")
            return []

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
