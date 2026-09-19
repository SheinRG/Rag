"""
Nexus — Studio Routes
Endpoints for AI-powered document insights: overview, suggestions, quiz,
summary, flashcards, and mind map.
"""

# Maintenance: 2026-05-06

import json
import re
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Optional

from auth_middleware import get_current_user
from database import supabase
from config import GROQ_API_KEY, GROQ_MODEL, GROQ_REASONING_EFFORT
from groq import Groq, RateLimitError
from utils.prompt_security import UNTRUSTED_CONTENT_RULE, wrap_document_content

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Studio"])
client = Groq(api_key=GROQ_API_KEY)


class StudioRequest(BaseModel):
    document_id: Optional[str] = None


def _get_doc_chunks(document_id: str, user_id: str, limit: int = 15) -> list[dict]:
    """
    Fetch chunks for a document, sampled EVENLY across the whole document
    rather than just the first N. This means studio features (quiz, summary,
    flashcards, mind map) reflect the entire document, not only its opening pages.
    """
    count_res = (
        supabase.table("chunks")
        .select("chunk_index", count="exact")
        .eq("document_id", document_id)
        .eq("user_id", user_id)
        .execute()
    )
    total = count_res.count or 0

    # Small docs: just take everything in order.
    if total <= limit:
        result = (
            supabase.table("chunks")
            .select("content, chunk_index")
            .eq("document_id", document_id)
            .eq("user_id", user_id)
            .order("chunk_index")
            .execute()
        )
        return result.data or []

    # Large docs: pick `limit` evenly-spaced chunk indices spanning the document.
    step = total / limit
    wanted = sorted({int(i * step) for i in range(limit)})
    result = (
        supabase.table("chunks")
        .select("content, chunk_index")
        .eq("document_id", document_id)
        .eq("user_id", user_id)
        .in_("chunk_index", wanted)
        .order("chunk_index")
        .execute()
    )
    return result.data or []


def _get_all_chunks(user_id: str, limit: int = 20) -> list[dict]:
    """Fetch chunks across all user documents."""
    result = (
        supabase.table("chunks")
        .select("content")
        .eq("user_id", user_id)
        .limit(limit)
        .execute()
    )
    return result.data or []


def _build_context(chunks: list[dict], max_chars: int = 12000) -> str:
    if not chunks:
        return "No content available."
    text = "\n\n".join(c["content"] for c in chunks)
    if len(text) > max_chars:
        text = text[:max_chars] + "\n\n...[Content Truncated to stay within AI limits]..."
    # Studio prompts embed this text directly; seal it so any instructions the
    # document contains are treated as data, not commands.
    return wrap_document_content(text)


def _generate(system: str, user_msg: str, max_tokens: int = 1500, json_mode: bool = False) -> str:
    """Synchronous Groq generation. When json_mode=True, asks Groq to emit a JSON object."""
    kwargs = {
        "model": GROQ_MODEL,
        "reasoning_effort": GROQ_REASONING_EFFORT,
        "messages": [
            {"role": "system", "content": f"{UNTRUSTED_CONTENT_RULE}\n\n{system}"},
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.4,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


async def _agenerate(system: str, user_msg: str, max_tokens: int = 1500, json_mode: bool = False) -> str:
    """Run the blocking Groq call in a threadpool so the event loop stays free."""
    return await run_in_threadpool(_generate, system, user_msg, max_tokens, json_mode)


def _parse_json(raw: str):
    """Best-effort JSON parse: tries direct, then strips fences / extracts the object."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r'[\[{][\s\S]*[\]}]', cleaned)
        if match:
            return json.loads(match.group())
        raise


# ─── Key Topics Extraction ───


@router.get("/documents/{doc_id}/topics")
async def extract_key_topics(doc_id: str, user=Depends(get_current_user)):
    """Extract the main topics/concepts from a document for study navigation."""
    try:
        # Verify document belongs to user
        doc = (
            supabase.table("documents")
            .select("id, original_name")
            .eq("id", doc_id)
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )
        if not doc.data:
            raise HTTPException(status_code=404, detail="Document not found")

        chunks = _get_doc_chunks(doc_id, str(user.id), limit=20)
        if not chunks:
            raise HTTPException(status_code=400, detail="No content found for this document")

        context = _build_context(chunks)

        system = """You are an expert academic content analyzer. Extract the key topics and concepts from the provided document content.
Return ONLY a valid JSON object: {"topics": [ ... ]} where each item has:
- "topic": a concise topic name (3-6 words max)
- "description": a one-line summary of what this topic covers (under 15 words)

Extract between 5 and 10 topics. Order them logically (as they appear in the document)."""

        user_msg = f"Document: {doc.data['original_name']}\n\nContent:\n{context}"

        raw = await _agenerate(system, user_msg, max_tokens=800, json_mode=True)
        parsed = _parse_json(raw)
        topics = parsed.get("topics", parsed) if isinstance(parsed, dict) else parsed
        return {"topics": topics, "document_name": doc.data["original_name"]}

    except json.JSONDecodeError:
        logger.error(f"Failed to parse topics JSON: {raw[:200]}")
        raise HTTPException(status_code=500, detail="Failed to parse topics from AI response")
    except HTTPException:
        raise
    except RateLimitError as e:
        logger.warning(f"Groq Rate Limit Exceeded: {e}")
        raise HTTPException(status_code=429, detail="AI Rate limit exceeded. Please wait 1 minute.")
    except Exception as e:
        logger.error(f"Key topics extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract key topics.")


# ─── Document Overview + Suggestions ───


@router.get("/documents/{doc_id}/overview")
async def document_overview(doc_id: str, user=Depends(get_current_user)):
    """Generate a brief overview and suggested prompts for a document."""
    try:
        # Verify document belongs to user
        doc = (
            supabase.table("documents")
            .select("id, original_name")
            .eq("id", doc_id)
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )
        if not doc.data:
            raise HTTPException(status_code=404, detail="Document not found.")

        chunks = _get_doc_chunks(doc_id, str(user.id), limit=10)
        if not chunks:
            return {"summary": "Document is still being processed.", "suggestions": []}

        context = _build_context(chunks)

        result = await _agenerate(
            system="""You are Nexus. Given document chunks, produce a JSON object with:
1. "summary": A 2-3 sentence overview of what the document is about.
2. "suggestions": An array of exactly 3 short, specific questions a user might ask about this document.
Return ONLY valid JSON.""",
            user_msg=f"Document: {doc.data['original_name']}\n\nContent:\n{context}",
            max_tokens=500,
            json_mode=True,
        )

        try:
            parsed = _parse_json(result)
        except json.JSONDecodeError:
            parsed = {"summary": "Could not generate overview.", "suggestions": []}

        return parsed

    except HTTPException:
        raise
    except RateLimitError as e:
        logger.warning(f"Groq Rate Limit Exceeded: {e}")
        return {"summary": "AI Rate limit exceeded. Please wait 1 minute.", "suggestions": []}
    except Exception as e:
        logger.error(f"Overview generation failed: {e}")
        return {"summary": "Failed to generate overview.", "suggestions": []}


# ─── Quiz Generator ───


@router.post("/studio/quiz")
async def generate_quiz(body: StudioRequest, user=Depends(get_current_user)):
    """Generate a quiz from document content."""
    try:
        if body.document_id:
            chunks = _get_doc_chunks(body.document_id, str(user.id))
        else:
            chunks = _get_all_chunks(str(user.id))

        if not chunks:
            raise HTTPException(status_code=400, detail="No content available.")

        context = _build_context(chunks)
        result = await _agenerate(
            system="""Generate a quiz with exactly 5 multiple-choice questions based on the provided content.
Return ONLY valid JSON in this format:
{"questions": [{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A", "explanation": "..."}]}""",
            user_msg=context,
            max_tokens=2000,
            json_mode=True,
        )

        try:
            parsed = _parse_json(result)
        except json.JSONDecodeError:
            parsed = {"questions": []}

        return parsed

    except HTTPException:
        raise
    except RateLimitError as e:
        logger.warning(f"Groq Rate Limit Exceeded: {e}")
        raise HTTPException(status_code=429, detail="AI Rate limit exceeded. Please wait 1 minute.")
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz.")


# ─── Executive Summary ───


@router.post("/studio/summary")
async def generate_summary(body: StudioRequest, user=Depends(get_current_user)):
    """Generate a comprehensive summary."""
    try:
        if body.document_id:
            chunks = _get_doc_chunks(body.document_id, str(user.id), limit=20)
        else:
            chunks = _get_all_chunks(str(user.id))

        if not chunks:
            raise HTTPException(status_code=400, detail="No content available.")

        context = _build_context(chunks)
        result = await _agenerate(
            system="""You are Nexus. Generate a comprehensive, well-structured executive summary of the provided content.
Use Markdown formatting with headers, bullet points, and bold text.
Include: Key Themes, Main Points, Important Details, and Conclusions.""",
            user_msg=context,
            max_tokens=2000,
        )

        return {"summary": result}

    except HTTPException:
        raise
    except RateLimitError as e:
        logger.warning(f"Groq Rate Limit Exceeded: {e}")
        raise HTTPException(status_code=429, detail="AI Rate limit exceeded. Please wait 1 minute.")
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate summary.")


# ─── Flashcards ───


@router.post("/studio/flashcards")
async def generate_flashcards(body: StudioRequest, user=Depends(get_current_user)):
    """Generate study flashcards."""
    try:
        if body.document_id:
            chunks = _get_doc_chunks(body.document_id, str(user.id))
        else:
            chunks = _get_all_chunks(str(user.id))

        if not chunks:
            raise HTTPException(status_code=400, detail="No content available.")

        context = _build_context(chunks)
        result = await _agenerate(
            system="""Generate exactly 8 study flashcards from the provided content.
Return ONLY valid JSON in this format:
{"cards": [{"front": "Question or term", "back": "Answer or definition"}]}""",
            user_msg=context,
            max_tokens=1500,
            json_mode=True,
        )

        try:
            parsed = _parse_json(result)
        except json.JSONDecodeError:
            parsed = {"cards": []}

        return parsed

    except HTTPException:
        raise
    except RateLimitError as e:
        logger.warning(f"Groq Rate Limit Exceeded: {e}")
        raise HTTPException(status_code=429, detail="AI Rate limit exceeded. Please wait 1 minute.")
    except Exception as e:
        logger.error(f"Flashcard generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate flashcards.")


# ─── Mind Map ───


@router.post("/studio/mindmap")
async def generate_mindmap(body: StudioRequest, user=Depends(get_current_user)):
    """Generate a Mermaid.js mind map."""
    try:
        if body.document_id:
            chunks = _get_doc_chunks(body.document_id, str(user.id))
        else:
            chunks = _get_all_chunks(str(user.id))

        if not chunks:
            raise HTTPException(status_code=400, detail="No content available.")

        context = _build_context(chunks)
        result = await _agenerate(
            system="""Analyze the content and create a Mermaid.js mindmap diagram.
Return ONLY the mermaid code, starting with 'mindmap' on the first line.
Use proper indentation. Keep node labels short (max 5 words).
Example format:
mindmap
  root((Main Topic))
    Branch 1
      Sub item A
      Sub item B
    Branch 2
      Sub item C
No markdown fences. No explanation.""",
            user_msg=context,
            max_tokens=1000,
        )

        # Clean up the result
        clean = result.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean
        if clean.endswith("```"):
            clean = clean.rsplit("```", 1)[0]

        return {"mermaid": clean.strip()}

    except HTTPException:
        raise
    except RateLimitError as e:
        logger.warning(f"Groq Rate Limit Exceeded: {e}")
        raise HTTPException(status_code=429, detail="AI Rate limit exceeded. Please wait 1 minute.")
    except Exception as e:
        logger.error(f"Mind map generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate mind map.")
