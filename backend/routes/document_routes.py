"""
Nexus — Document Routes
Upload, list, status, and delete documents.
"""

import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status, Form

from database import supabase
from auth_middleware import get_current_user
from config import STORAGE_BUCKET, MAX_FILE_SIZE_BYTES
from utils.file_handler import validate_file, get_file_type
from ingest import run_ingestion
from routes.media_routes import run_youtube_ingestion
from models.schemas import DocumentResponse, DocumentStatusResponse, DocumentUploadResponse, DocumentRenameRequest

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    notebook_id: Optional[str] = Form(None),
    user=Depends(get_current_user),
):
    """Upload a document and trigger background ingestion."""
    try:
        # Reject unsupported types before reading a single byte.
        ext_ok, ext_error = validate_file(file.filename, 0)
        if not ext_ok:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=ext_error)

        # Bounded read. file.read() with no argument pulls the entire upload into
        # memory before the size is ever checked, so a single oversized request
        # could exhaust the host's RAM. Reading limit+1 bytes is enough to detect
        # an overrun without ever holding more than the limit.
        content = await file.read(MAX_FILE_SIZE_BYTES + 1)
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
        if notebook_id:
            doc_data["notebook_id"] = notebook_id

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
async def list_documents(notebook_id: Optional[str] = None, user=Depends(get_current_user)):
    """List all documents for the current user, optionally filtered by notebook."""
    try:
        query = (
            supabase.table("documents")
            .select("id, original_name, file_type, file_size, num_chunks, status, error_msg, notebook_id, created_at")
            .eq("user_id", str(user.id))
        )

        if notebook_id:
            query = query.eq("notebook_id", notebook_id)

        result = query.order("created_at", desc=True).execute()

        logger.info(f"List documents: notebook_id={notebook_id}, returned={len(result.data)} docs")

        docs = []
        for doc in result.data:
            doc.setdefault("notebook_id", None)
            docs.append(DocumentResponse(**doc))
        return docs

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

        # Delete chunks explicitly rather than relying on the FK cascade alone.
        # Databases created before 000_initial_schema.sql may lack ON DELETE
        # CASCADE, and orphaned chunks stay searchable: they keep matching in
        # retrieval and get fed to the model as context for a source the user
        # believes is gone.
        supabase.table("chunks").delete().eq("document_id", doc_id).eq(
            "user_id", str(user.id)
        ).execute()

        supabase.table("documents").delete().eq("id", doc_id).eq(
            "user_id", str(user.id)
        ).execute()

        logger.info(f"Document {doc_id} deleted.")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document.",
        )


@router.patch("/{doc_id}/rename", response_model=DocumentResponse)
async def rename_document(
    doc_id: str,
    payload: DocumentRenameRequest,
    user=Depends(get_current_user)
):
    """Rename a document's original_name."""
    try:
        # Verify ownership
        check = supabase.table("documents").select("id").eq("id", doc_id).eq("user_id", str(user.id)).execute()
        if not check.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        result = (
            supabase.table("documents")
            .update({"original_name": payload.name})
            .eq("id", doc_id)
            .execute()
        )

        return DocumentResponse(**result.data[0])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to rename document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rename document.",
        )


@router.post("/{doc_id}/retry", response_model=DocumentResponse)
async def retry_document(
    doc_id: str,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    """
    Re-run ingestion for a document that failed (or was flipped to failed by
    the watchdog). Old chunks are dropped first so a retry can never duplicate
    a partially-ingested run, then status is reset to 'processing' and the
    ingestion pipeline is rescheduled.
    """
    try:
        result = (
            supabase.table("documents")
            .select(
                "id, original_name, file_type, file_size, num_chunks, status, "
                "error_msg, notebook_id, created_at, storage_path"
            )
            .eq("id", doc_id)
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        record = result.data

        if record["status"] == "processing":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Document is still processing. Wait for it to finish or fail before retrying.",
            )
        if record["status"] == "ready":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Document is already processed. No retry needed.",
            )

        # Drop any partial chunks from an earlier run so a retry is idempotent.
        supabase.table("chunks").delete().eq("document_id", doc_id).eq(
            "user_id", str(user.id)
        ).execute()

        supabase.table("documents").update({
            "status": "processing",
            "error_msg": None,
        }).eq("id", doc_id).eq("user_id", str(user.id)).execute()

        if record["file_type"] == "youtube":
            video_id = (record["storage_path"] or f"youtube/{doc_id}").rsplit("/", 1)[-1]
            background_tasks.add_task(
                run_youtube_ingestion, doc_id, video_id, str(user.id)
            )
        else:
            background_tasks.add_task(
                run_ingestion,
                document_id=doc_id,
                storage_path=record["storage_path"],
                file_type=record["file_type"],
                user_id=str(user.id),
            )

        record.update({"status": "processing", "error_msg": None})
        logger.info(f"Document {doc_id} retry scheduled.")

        return DocumentResponse(**record)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to schedule retry for document {doc_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to schedule retry.",
        )
