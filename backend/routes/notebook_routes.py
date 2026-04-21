"""
DocMind AI — Notebook Routes
Create, list, update, and delete notebooks.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from database import supabase
from auth_middleware import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Notebooks"])


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
