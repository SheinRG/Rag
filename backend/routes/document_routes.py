"""
DocMind AI — Document Routes
Upload, list, status, and delete documents.
"""

import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status

from database import supabase
from auth_middleware import get_current_user
from config import STORAGE_BUCKET
from utils.file_handler import validate_file, get_file_type
from ingest import run_ingestion
from models.schemas import DocumentResponse, DocumentStatusResponse, DocumentUploadResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    """Upload a document and trigger background ingestion."""
    try:
        content = await file.read()
        file_size = len(content)

        is_valid, error_msg = validate_file(file.filename, file_size)
        if not is_valid:
            if "size" in error_msg.lower():
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=error_msg)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

        file_type = get_file_type(file.filename)
        safe_filename = f"{uuid.uuid4()}.{file_type}"
        storage_path = f"{user.id}/{safe_filename}"

        supabase.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type or "application/octet-stream"},
        )

        doc_data = {
            "user_id": str(user.id),
            "filename": safe_filename,
            "original_name": file.filename,
            "file_type": file_type,
            "file_size": file_size,
            "status": "processing",
            "storage_path": storage_path,
        }

        result = supabase.table("documents").insert(doc_data).execute()
        doc_id = result.data[0]["id"]

        background_tasks.add_task(
            run_ingestion,
            document_id=doc_id,
            storage_path=storage_path,
            file_type=file_type,
            user_id=str(user.id),
        )

        logger.info(f"Document {doc_id} uploaded, ingestion triggered.")

        return DocumentUploadResponse(
            id=doc_id,
            original_name=file.filename,
            status="processing",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document. Please try again.",
        )


@router.get("", response_model=list[DocumentResponse])
async def list_documents(user=Depends(get_current_user)):
    """List all documents for the current user."""
    try:
        result = (
            supabase.table("documents")
            .select("id, original_name, file_type, file_size, num_chunks, status, error_msg, created_at")
            .eq("user_id", str(user.id))
            .order("created_at", desc=True)
            .execute()
        )

        return [DocumentResponse(**doc) for doc in result.data]

    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load documents.",
        )


@router.get("/{doc_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(doc_id: str, user=Depends(get_current_user)):
    """Get the processing status of a specific document."""
    try:
        result = (
            supabase.table("documents")
            .select("id, status, num_chunks, error_msg")
            .eq("id", doc_id)
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        return DocumentStatusResponse(**result.data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get document status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get document status.",
        )


@router.delete("/{doc_id}", status_code=204)
async def delete_document(doc_id: str, user=Depends(get_current_user)):
    """Delete a document, its storage file, and all associated chunks."""
    try:
        result = (
            supabase.table("documents")
            .select("id, storage_path, user_id")
            .eq("id", doc_id)
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        storage_path = result.data["storage_path"]

        try:
            supabase.storage.from_(STORAGE_BUCKET).remove([storage_path])
        except Exception as storage_err:
            logger.warning(f"Failed to delete from storage (continuing): {storage_err}")

        supabase.table("documents").delete().eq("id", doc_id).execute()

        logger.info(f"Document {doc_id} deleted.")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document.",
        )
