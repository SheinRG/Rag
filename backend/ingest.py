"""
DocMind AI — Document Ingestion Pipeline
Complete pipeline: download → parse → chunk → embed → store.
"""

import os
import logging
import tempfile
from typing import List

from pypdf import PdfReader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from database import supabase
from config import STORAGE_BUCKET, CHUNK_SIZE, CHUNK_OVERLAP
from database import embedder

logger = logging.getLogger(__name__)

# Initialize text splitter once
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", ".", " "],
    length_function=len,
)


def download_from_storage(storage_path: str) -> str:
    """Download a file from Supabase Storage to a temporary local path."""
    try:
        response = supabase.storage.from_(STORAGE_BUCKET).download(storage_path)

        ext = os.path.splitext(storage_path)[1]
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        tmp.write(response)
        tmp.close()

        logger.info(f"Downloaded {storage_path} to {tmp.name}")
        return tmp.name

    except Exception as e:
        logger.error(f"Failed to download from storage: {e}")
        raise


def parse_document(file_path: str, file_type: str) -> List[Document]:
    """Parse a document file into LangChain Document objects."""
    try:
        if file_type == "pdf":
            reader = PdfReader(file_path)
            documents = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    documents.append(Document(
                        page_content=text,
                        metadata={"page": i + 1, "source": file_path}
                    ))
            if not documents:
                raise ValueError("PDF contains no readable text.")
            return documents

        elif file_type in ("txt", "md"):
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
            if not text.strip():
                raise ValueError("File is empty.")
            return [Document(page_content=text, metadata={"source": file_path})]

        elif file_type == "csv":
            import csv
            documents = []
            with open(file_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    content = " | ".join([f"{k}: {v}" for k, v in row.items()])
                    documents.append(Document(page_content=content, metadata={"source": file_path}))
            if not documents:
                raise ValueError("CSV is empty or invalid.")
            return documents

        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    except Exception as e:
        logger.error(f"Failed to parse document: {e}")
        raise


def chunk_documents(documents: List[Document]) -> List[Document]:
    """Split documents into smaller chunks."""
    chunks = text_splitter.split_documents(documents)
    logger.info(f"Split into {len(chunks)} chunks.")
    return chunks


def embed_chunks(chunks: List[Document]) -> List[List[float]]:
    """Generate embeddings for all chunks."""
    texts = [chunk.page_content for chunk in chunks]
    embeddings = embedder.encode(texts, batch_size=32, show_progress_bar=False).tolist()
    logger.info(f"Generated {len(embeddings)} embeddings.")
    return embeddings


def store_chunks(
    chunks: List[Document],
    embeddings: List[List[float]],
    document_id: str,
    user_id: str,
):
    """Store chunks and embeddings in the database, then update document status."""
    try:
        rows = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            rows.append({
                "document_id": document_id,
                "user_id": user_id,
                "content": chunk.page_content,
                "embedding": embedding,
                "chunk_index": i,
            })

        # Insert in batches of 100
        batch_size = 100
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            supabase.table("chunks").insert(batch).execute()

        # Update document status to ready
        supabase.table("documents").update({
            "status": "ready",
            "num_chunks": len(chunks),
        }).eq("id", document_id).execute()

        logger.info(f"Stored {len(chunks)} chunks for document {document_id}.")

    except Exception as e:
        logger.error(f"Failed to store chunks: {e}")
        raise


def run_ingestion(
    document_id: str,
    storage_path: str,
    file_type: str,
    user_id: str,
):
    """
    Orchestrates the full ingestion pipeline.
    Runs as a background task — errors must update DB, never crash silently.
    """
    local_path = None

    try:
        logger.info(f"Starting ingestion for document {document_id}")

        # Step 1: Download from storage
        local_path = download_from_storage(storage_path)

        # Step 2: Parse document
        documents = parse_document(local_path, file_type)

        if not documents or all(not doc.page_content.strip() for doc in documents):
            raise ValueError("Document contains no readable text content.")

        # Step 3: Chunk documents
        chunks = chunk_documents(documents)

        if not chunks:
            raise ValueError("Document produced no text chunks after splitting.")

        # Step 4: Embed chunks
        embeddings = embed_chunks(chunks)

        # Step 5: Store chunks + update status
        store_chunks(chunks, embeddings, document_id, user_id)

        logger.info(f"Ingestion complete for document {document_id}: {len(chunks)} chunks.")

    except Exception as e:
        logger.error(f"Ingestion failed for document {document_id}: {e}")

        try:
            supabase.table("documents").update({
                "status": "failed",
                "error_msg": str(e)[:500],
            }).eq("id", document_id).execute()
        except Exception as db_err:
            logger.error(f"Failed to update document status: {db_err}")

    finally:
        if local_path and os.path.exists(local_path):
            try:
                os.unlink(local_path)
            except Exception:
                pass
