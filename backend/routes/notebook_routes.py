"""
Nexus — Notebook Routes
Create, list, update, and delete notebooks.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from database import supabase
from auth_middleware import get_current_user
from config import GROQ_API_KEY, GROQ_MODEL
from groq import Groq

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Notebooks"])
client = Groq(api_key=GROQ_API_KEY)


# ─── Schemas ───

class NotebookCreate(BaseModel):
    title: Optional[str] = "Untitled notebook"
    emoji: Optional[str] = "📓"
    description: Optional[str] = ""

class NotebookUpdate(BaseModel):
    title: Optional[str] = None
    emoji: Optional[str] = None
    description: Optional[str] = None


# ─── Routes ───

@router.post("", status_code=201)
async def create_notebook(body: NotebookCreate, user=Depends(get_current_user)):
    """Create a new notebook."""
    try:
        data = {
            "user_id": str(user.id),
            "title": body.title,
            "emoji": body.emoji,
            "description": body.description,
        }
        result = supabase.table("notebooks").insert(data).execute()
        notebook = result.data[0]
        notebook["source_count"] = 0
        return notebook
    except Exception as e:
        logger.error(f"Failed to create notebook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notebook.",
        )


@router.get("")
async def list_notebooks(user=Depends(get_current_user)):
    """List all notebooks for the current user with source counts."""
    try:
        result = (
            supabase.table("notebooks")
            .select("*")
            .eq("user_id", str(user.id))
            .order("updated_at", desc=True)
            .execute()
        )

        notebooks = result.data

        # Get document counts per notebook
        for nb in notebooks:
            try:
                count_result = (
                    supabase.table("documents")
                    .select("id", count="exact")
                    .eq("notebook_id", nb["id"])
                    .execute()
                )
                nb["source_count"] = count_result.count or 0
            except Exception:
                nb["source_count"] = 0

        return notebooks
    except Exception as e:
        logger.warning(f"Failed to list notebooks (table may not exist yet): {e}")
        with open("notebook_error_log.txt", "w", encoding="utf-8") as f:
            f.write(str(e))
        # Return empty list instead of 500 if table doesn't exist
        return []


@router.get("/{notebook_id}")
async def get_notebook(notebook_id: str, user=Depends(get_current_user)):
    """Get a single notebook."""
    try:
        result = (
            supabase.table("notebooks")
            .select("*")
            .eq("id", notebook_id)
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Notebook not found.")

        # Get source count
        count_result = (
            supabase.table("documents")
            .select("id", count="exact")
            .eq("notebook_id", notebook_id)
            .execute()
        )
        result.data["source_count"] = count_result.count or 0

        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get notebook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load notebook.",
        )


@router.patch("/{notebook_id}")
async def update_notebook(notebook_id: str, body: NotebookUpdate, user=Depends(get_current_user)):
    """Update a notebook's title, emoji, or description."""
    try:
        # Verify ownership
        existing = (
            supabase.table("notebooks")
            .select("id")
            .eq("id", notebook_id)
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Notebook not found.")

        updates = {k: v for k, v in body.dict().items() if v is not None}
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update.")

        result = (
            supabase.table("notebooks")
            .update(updates)
            .eq("id", notebook_id)
            .execute()
        )
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update notebook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notebook.",
        )


@router.delete("/{notebook_id}", status_code=204)
async def delete_notebook(notebook_id: str, user=Depends(get_current_user)):
    """Delete a notebook and all its associated documents."""
    try:
        existing = (
            supabase.table("notebooks")
            .select("id")
            .eq("id", notebook_id)
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Notebook not found.")

        # Delete the notebook (documents cascade via FK)
        supabase.table("notebooks").delete().eq("id", notebook_id).execute()
        logger.info(f"Notebook {notebook_id} deleted.")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete notebook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notebook.",
        )


@router.post("/{notebook_id}/synthesize")
async def synthesize_notebook(notebook_id: str, user=Depends(get_current_user)):
    """Generate a comprehensive synthesis report of all documents in the notebook."""
    try:
        # 1. Verify notebook exists and belongs to user
        nb_check = (
            supabase.table("notebooks")
            .select("id")
            .eq("id", notebook_id)
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )
        if not nb_check.data:
            raise HTTPException(status_code=404, detail="Notebook not found or access denied.")

        # 2. Get all documents in this notebook
        docs_result = (
            supabase.table("documents")
            .select("id, original_name")
            .eq("notebook_id", notebook_id)
            .execute()
        )
        
        docs = docs_result.data
        if not docs:
            raise HTTPException(status_code=400, detail="Notebook has no documents to synthesize. Please add some sources first.")

        # 3. Build context from chunks
        doc_ids = [doc["id"] for doc in docs]
        chunks_result = (
            supabase.table("chunks")
            .select("content, document_id")
            .in_("document_id", doc_ids)
            .eq("user_id", str(user.id))
            .limit(15)  # Reduced to avoid Groq TPM limits
            .execute()
        )
        
        chunks = chunks_result.data
        if not chunks:
            raise HTTPException(status_code=400, detail="No readable content found in your documents. Make sure they are fully processed.")

        doc_map = {doc["id"]: doc["original_name"] for doc in docs}
        
        context_parts = []
        for chunk in chunks:
            doc_name = doc_map.get(chunk["document_id"], "Unknown Document")
            context_parts.append(f"[From: {doc_name}]\n{chunk['content']}")
            
        context = "\n\n".join(context_parts)
        
        # 4. Synthesize with LLM (Dashboard Overview Style)
        prompt = f"""You are an expert knowledge curator. Your task is to provide a high-level "Dashboard Overview" of this research notebook.
        
        Rather than a detailed report, create a concise, thematic Executive Briefing that:
        1. Identifies the "Big Picture": What is the primary purpose of this collection of documents?
        2. Highlights the 3-5 most critical overarching themes that appear across multiple sources.
        3. Provides a "Quick Reference" summary for someone who needs to understand the notebook's essence in 60 seconds.

        Format professionally with Markdown:
        - Use ## for main headers.
        - Use bold text for key terms.
        - Keep the tone objective and bird's-eye view.
        - Do NOT get bogged down in granular details; focus on the synthesis of the whole.

        --- DOCUMENTS CONTEXT ---
        {context}
        --- END CONTEXT ---

        Write the Notebook Dashboard Overview now:"""

        if not GROQ_API_KEY:
            raise HTTPException(status_code=500, detail="LLM configuration missing (API Key).")

        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=2048,
        )
        
        report_content = completion.choices[0].message.content
        
        return {"report": report_content}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to synthesize notebook {notebook_id}: {e}")
        # Return the actual error message to help the user/dev diagnose
        error_detail = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Synthesis failed: {error_detail}",
        )
