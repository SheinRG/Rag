"""
DocMind AI — Query Routes
Streaming Q&A endpoint via SSE.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from auth_middleware import get_current_user
from llm import ask_stream
from models.schemas import AskRequest
from pydantic import BaseModel


class AskRequestWithDoc(BaseModel):
    question: str
    document_id: str | None = None


logger = logging.getLogger(__name__)
router = APIRouter(tags=["Query"])


@router.post("/ask/stream")
async def ask_stream_endpoint(
    body: AskRequestWithDoc,
    user=Depends(get_current_user),
):
    """Stream an AI-generated answer via SSE."""
    if not body.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

    return StreamingResponse(
        ask_stream(body.question, str(user.id), document_id=body.document_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
