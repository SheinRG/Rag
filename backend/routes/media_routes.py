"""
DocMind AI — Media Routes
YouTube video ingestion and Image OCR/analysis endpoints.
"""

import re
import json
import uuid
import logging
import base64
import httpx
import mimetypes
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Form, status
from pydantic import BaseModel

from auth_middleware import get_current_user
from database import supabase, embedder
from config import GROQ_API_KEY, CHUNK_SIZE, CHUNK_OVERLAP
from ingest import run_ingestion
from langchain_text_splitters import RecursiveCharacterTextSplitter
from groq import Groq

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Media"])
client = Groq(api_key=GROQ_API_KEY)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", ". ", " "],
)


# ─── YouTube Ingestion ───


class YouTubeRequest(BaseModel):
    url: str
    notebook_id: Optional[str] = None


def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:v=|\/v\/|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL")


def fetch_youtube_transcript(video_id: str) -> list[dict]:
    """Fetch transcript with timestamps from YouTube."""
    from youtube_transcript_api import YouTubeTranscriptApi

    ytt_api = YouTubeTranscriptApi()
    transcript = ytt_api.fetch(video_id)

    # Convert FetchedTranscript snippets to list of dicts
    entries = []
    for snippet in transcript:
        entries.append({
            "text": snippet.text,
            "start": snippet.start,
            "duration": snippet.duration
        })
    return entries


def format_timestamp(seconds: float) -> str:
    """Convert seconds to HH:MM:SS format."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def run_youtube_ingestion(
    document_id: str,
    video_id: str,
    user_id: str,
):
    """Background task: fetch transcript, chunk, embed, store."""
    try:
        logger.info(f"Starting YouTube ingestion for video {video_id}")

        # Step 1: Fetch transcript
        transcript = fetch_youtube_transcript(video_id)
        if not transcript:
            raise ValueError("No transcript available for this video.")

        # Step 2: Build timestamped text blocks
        # Group transcript entries into larger blocks (~500 chars each)
        blocks = []
        current_block = ""
        current_start = transcript[0]["start"]

        for entry in transcript:
            line = entry["text"].strip()
            if not line:
                continue

            if len(current_block) + len(line) > CHUNK_SIZE:
                blocks.append({
                    "content": current_block.strip(),
                    "timestamp": format_timestamp(current_start),
                    "start_seconds": current_start,
                })
                current_block = line + " "
                current_start = entry["start"]
            else:
                current_block += line + " "

        if current_block.strip():
            blocks.append({
                "content": current_block.strip(),
                "timestamp": format_timestamp(current_start),
                "start_seconds": current_start,
            })

        if not blocks:
            raise ValueError("Transcript produced no usable text blocks.")

        # Step 3: Embed
        texts = [f"[{b['timestamp']}] {b['content']}" for b in blocks]
        embeddings = embedder.encode(texts, batch_size=32, show_progress_bar=False).tolist()

        # Step 4: Store chunks
        rows = []
        for i, (block, embedding) in enumerate(zip(blocks, embeddings)):
            rows.append({
                "document_id": document_id,
                "user_id": user_id,
                "content": f"[{block['timestamp']}] {block['content']}",
                "embedding": embedding,
                "chunk_index": i,
            })

        batch_size = 100
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i + batch_size]
            supabase.table("chunks").insert(batch).execute()

        # Step 5: Update document status
        supabase.table("documents").update({
            "status": "ready",
            "num_chunks": len(blocks),
        }).eq("id", document_id).execute()

        logger.info(f"YouTube ingestion complete: {len(blocks)} chunks from video {video_id}")

    except Exception as e:
        logger.error(f"YouTube ingestion failed: {e}")
        try:
            supabase.table("documents").update({
                "status": "failed",
                "error_msg": str(e)[:500],
            }).eq("id", document_id).execute()
        except Exception as db_err:
            logger.error(f"Failed to update document status: {db_err}")


@router.post("/youtube")
async def ingest_youtube(
    body: YouTubeRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    """Ingest a YouTube video transcript as a document source."""
    try:
        video_id = extract_video_id(body.url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL.")

    # Create a document record
    doc_data = {
        "user_id": str(user.id),
        "filename": f"youtube_{video_id}",
        "original_name": f"YouTube: {video_id}",
        "file_type": "youtube",
        "file_size": 0,
        "status": "processing",
        "storage_path": f"youtube/{video_id}",
    }
    if body.notebook_id:
        doc_data["notebook_id"] = body.notebook_id

    result = supabase.table("documents").insert(doc_data).execute()
    doc_id = result.data[0]["id"]

    # Run ingestion in background
    background_tasks.add_task(
        run_youtube_ingestion,
        document_id=doc_id,
        video_id=video_id,
        user_id=str(user.id),
    )

    return {
        "id": doc_id,
        "original_name": f"YouTube: {video_id}",
        "status": "processing",
        "video_id": video_id,
    }


# ─── Image OCR / Analysis ───


@router.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    prompt: Optional[str] = Form("Describe this image in detail. If it contains text, transcribe it. If it's a diagram, explain the relationships."),
    notebook_id: Optional[str] = Form(None),
    user=Depends(get_current_user),
):
    """Analyze an uploaded image using Groq Vision API."""
    # Validate file type
    allowed = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    ext = "." + (file.filename or "image.png").rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {ext}")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 20MB limit.")

    # Encode to base64
    b64 = base64.b64encode(content).decode("utf-8")
    mime = file.content_type or "image/png"

    try:
        # Call Groq Vision API
        response = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime};base64,{b64}"},
                        },
                    ],
                }
            ],
            max_tokens=2000,
            temperature=0.3,
        )

        analysis = response.choices[0].message.content

        return {
            "analysis": analysis,
            "filename": file.filename,
        }

    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


# ─── Citation Verification ───


class VerifyRequest(BaseModel):
    answer: str
    sources: list[dict]  # [{"name": "...", "chunks": ["..."]}]


@router.post("/verify")
async def verify_citations(
    body: VerifyRequest,
    user=Depends(get_current_user),
):
    """Cross-check an AI answer against source documents for hallucination detection."""
    try:
        source_text = "\n\n".join(
            f"[SOURCE: {s['name']}]\n" + "\n".join(s.get("chunks", []))
            for s in body.sources
        )

        result = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": """You are a citation verification engine. Your job is to cross-check an AI-generated answer against the provided source documents.

For each major claim in the answer, determine if it is:
- ✅ VERIFIED: The claim is directly supported by the source text
- ⚠️ INFERRED: The claim is a reasonable inference but not explicitly stated
- ❌ UNVERIFIED: The claim has no basis in the provided sources

Return ONLY valid JSON in this format:
{
  "score": 85,
  "verdict": "Mostly Verified",
  "claims": [
    {"claim": "...", "status": "verified", "evidence": "..."},
    {"claim": "...", "status": "inferred", "evidence": "..."},
    {"claim": "...", "status": "unverified", "evidence": "No supporting text found"}
  ]
}

The score should be 0-100 representing overall verification confidence. No markdown fences.""",
                },
                {
                    "role": "user",
                    "content": f"ANSWER TO VERIFY:\n{body.answer}\n\nSOURCE DOCUMENTS:\n{source_text}",
                },
            ],
            max_tokens=2000,
            temperature=0.1,
        )

        raw = result.choices[0].message.content.strip()

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            json_match = re.search(r'\{[\s\S]*\}', raw)
            parsed = json.loads(json_match.group()) if json_match else {
                "score": 0,
                "verdict": "Verification failed",
                "claims": [],
            }

        return parsed

    except Exception as e:
        logger.error(f"Citation verification failed: {e}")
        raise HTTPException(status_code=500, detail="Citation verification failed.")


# ─── Autonomous Research Report ───


class ResearchRequest(BaseModel):
    prompt: str
    document_ids: list[str] = []


@router.post("/research-report")
async def generate_research_report(
    body: ResearchRequest,
    user=Depends(get_current_user),
):
    """Generate an autonomous, multi-section research report from documents."""
    from fastapi.responses import StreamingResponse

    async def stream_report():
        try:
            # Step 1: Gather all chunks from specified documents
            all_chunks = []
            for doc_id in body.document_ids:
                result = (
                    supabase.table("chunks")
                    .select("content")
                    .eq("document_id", doc_id)
                    .eq("user_id", str(user.id))
                    .order("chunk_index")
                    .limit(30)
                    .execute()
                )
                all_chunks.extend([c["content"] for c in (result.data or [])])

            if not all_chunks:
                # Fall back to all user chunks
                result = (
                    supabase.table("chunks")
                    .select("content")
                    .eq("user_id", str(user.id))
                    .limit(40)
                    .execute()
                )
                all_chunks = [c["content"] for c in (result.data or [])]

            if not all_chunks:
                yield f"data: {json.dumps({'type': 'error', 'content': 'No documents available for research.'})}\n\n"
                return

            context = "\n\n".join(all_chunks[:40])

            # Step 2: Generate outline
            yield f"data: {json.dumps({'type': 'status', 'content': 'Analyzing documents and creating outline...', 'step': 1})}\n\n"

            outline_response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a research analyst. Given document content and a research prompt, create a structured outline for a comprehensive report. Return ONLY a JSON array of section titles, like: [\"Executive Summary\", \"Section 1: ...\", \"Section 2: ...\", \"Conclusion\"]. No markdown fences.",
                    },
                    {
                        "role": "user",
                        "content": f"Research prompt: {body.prompt}\n\nDocument content:\n{context[:8000]}",
                    },
                ],
                max_tokens=500,
                temperature=0.3,
            )

            raw_outline = outline_response.choices[0].message.content.strip()
            try:
                sections = json.loads(raw_outline)
            except json.JSONDecodeError:
                json_match = re.search(r'\[[\s\S]*\]', raw_outline)
                sections = json.loads(json_match.group()) if json_match else [
                    "Executive Summary", "Key Findings", "Analysis", "Conclusion"
                ]

            yield f"data: {json.dumps({'type': 'outline', 'content': sections})}\n\n"

            # Step 3: Write each section
            full_report = f"# {body.prompt}\n\n"
            for i, section in enumerate(sections):
                yield f"data: {json.dumps({'type': 'status', 'content': f'Writing: {section}...', 'step': i + 2})}\n\n"

                section_response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {
                            "role": "system",
                            "content": f"""You are writing section "{section}" of a research report titled "{body.prompt}".
Write 2-4 detailed paragraphs for this section using Markdown formatting.
Base your analysis on the provided document content. Be thorough and analytical.
Do NOT include the section title as a header—it will be added automatically.""",
                        },
                        {
                            "role": "user",
                            "content": f"Document content:\n{context[:6000]}",
                        },
                    ],
                    max_tokens=1000,
                    temperature=0.4,
                )

                section_text = section_response.choices[0].message.content
                full_report += f"## {section}\n\n{section_text}\n\n"

                yield f"data: {json.dumps({'type': 'section', 'content': {'title': section, 'text': section_text}})}\n\n"

            # Step 4: Send complete report
            yield f"data: {json.dumps({'type': 'complete', 'content': full_report})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.error(f"Research report failed: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        stream_report(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )

# ─── Google Drive Integration ───

class DriveRequest(BaseModel):
    file_id: str
    access_token: str
    file_name: str
    mime_type: Optional[str] = None
    notebook_id: Optional[str] = None

@router.post("/drive")
async def ingest_drive(
    body: DriveRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    """Download a file from Google Drive and ingest."""
    headers = {"Authorization": f"Bearer {body.access_token}"}
    
    is_google_workspace = body.mime_type and body.mime_type.startswith("application/vnd.google-apps")
    target_ext = ".pdf"
    
    if is_google_workspace:
        if "document" in body.mime_type or "presentation" in body.mime_type:
            url = f"https://www.googleapis.com/drive/v3/files/{body.file_id}/export?mimeType=application/pdf"
        elif "spreadsheet" in body.mime_type:
            url = f"https://www.googleapis.com/drive/v3/files/{body.file_id}/export?mimeType=text/csv"
            target_ext = ".csv"
        else:
            raise HTTPException(400, "Unsupported Google Workspace file format.")
    else:
        url = f"https://www.googleapis.com/drive/v3/files/{body.file_id}?alt=media"
        target_ext = "." + body.file_name.rsplit(".", 1)[-1] if "." in body.file_name else ".pdf"

    try:
        with httpx.Client() as client:
            resp = client.get(url, headers=headers, timeout=60.0)
            resp.raise_for_status()
            content = resp.content
    except Exception as e:
        logger.error(f"Google Drive download failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to download file from Google Drive.")

    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds 20MB limit.")

    file_size = len(content)
    clean_filename = body.file_name.rsplit(".", 1)[0] + target_ext
    storage_path = f"{user.id}/{uuid.uuid4()}_{clean_filename}"

    try:
        mime = mimetypes.guess_type(clean_filename)[0] or "application/octet-stream"
        supabase.storage.from_("documents").upload(
            storage_path,
            content,
            {"content-type": mime}
        )
    except Exception as e:
        logger.error(f"Supabase upload failed: {e}")
        raise HTTPException(status_code=500, detail="Storage failed.")

    doc_data = {
        "user_id": str(user.id),
        "filename": clean_filename,
        "original_name": body.file_name,
        "file_type": target_ext[1:],
        "file_size": file_size,
        "status": "processing",
        "storage_path": storage_path,
    }
    if body.notebook_id:
        doc_data["notebook_id"] = body.notebook_id

    result = supabase.table("documents").insert(doc_data).execute()
    doc_id = result.data[0]["id"]

    background_tasks.add_task(
        run_ingestion,
        document_id=doc_id,
        file_path=storage_path,
        user_id=str(user.id)
    )

    return {"id": doc_id, "status": "processing", "original_name": body.file_name}
