"""
Nexus — LLM Module
Groq API integration with prompt building and SSE streaming.
"""

import json
import logging
from typing import AsyncGenerator, List

from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL
from retriever import retrieve

logger = logging.getLogger(__name__)

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY)


def build_system_prompt(chunks: List[dict]) -> str:
    """
    Builds the system prompt with context chunks.
    """
    context_parts = []
    for chunk in chunks:
        context_parts.append(f"[SOURCE: {chunk['source']}]\n{chunk['content']}")

    context = (
        "\n\n".join(context_parts)
        if context_parts
        else "No document context available."
    )

    prompt = f"""You are Nexus, a highly intelligent and collaborative research assistant (similar to NotebookLM). Your goal is to help the user understand, synthesize, and explore their uploaded documents.

Guidelines for your response:
1. Speak naturally and conversationally as a helpful research partner. Do not sound like a rigid robot.
2. If the user asks for a summary, overview, or abstract concept (e.g., "what is the basic intro"), read the available document chunks and synthesize them logically to provide a comprehensive answer. Make intelligent, helpful inferences based directly on the provided text.
3. Base your answers on the provided context. If the context absolutely does not contain enough information to formulate an answer, politely explain what information is missing.
4. Do NOT constantly inject disclaimers like "This is not explicitly mentioned but inferred..." or "No specific citation available". Just provide the synthesized answer confidently.
5. Format your answers beautifully using Markdown (bullet points, bold text, headers) to make reading easy.

--- CONTEXT START ---
{context}
--- CONTEXT END ---"""

    return prompt


async def ask_stream(
    question: str, user_id: str, document_id: str = None, notebook_id: str = None
) -> AsyncGenerator[str, None]:
    """
    Main streaming Q&A function.
    Retrieves context, queries Groq, and yields SSE events.
    Optionally filters by document_id for per-document chats.
    """
    try:
        # Step 1: Retrieve relevant chunks
        chunks = retrieve(question, user_id, document_id=document_id, notebook_id=notebook_id)

        # Step 3: Build prompt
        system_prompt = build_system_prompt(chunks)

        # Step 4: Stream from Groq
        stream = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            stream=True,
            max_tokens=1024,
            temperature=0.2,
        )

        for groq_chunk in stream:
            delta = groq_chunk.choices[0].delta
            if delta and delta.content:
                yield f"data: {json.dumps({'type': 'token', 'content': delta.content})}\n\n"

        # Step 5: Send source information with chunks
        sources_map = {}
        for chunk in chunks:
            src = chunk["source"]
            if src not in sources_map:
                sources_map[src] = []
            sources_map[src].append(chunk["content"])

        formatted_sources = [{"name": k, "chunks": v} for k, v in sources_map.items()]
        yield f"data: {json.dumps({'type': 'sources', 'content': formatted_sources})}\n\n"

        # Step 6: Generate follow-up suggestions
        try:
            suggestion_prompt = f"""Based on the user's question and the document context provided, generate exactly 3 short follow-up questions the user might want to ask next. 
These should be directly related to the document content and the conversation topic.
Keep each question concise (under 12 words).

User's question: {question}

Respond ONLY with a JSON array of 3 strings, nothing else. Example: ["Question 1?", "Question 2?", "Question 3?"]"""

            suggestion_resp = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You generate follow-up research questions. Respond ONLY with a valid JSON array of strings."},
                    {"role": "user", "content": suggestion_prompt},
                ],
                max_tokens=150,
                temperature=0.6,
            )
            raw = suggestion_resp.choices[0].message.content.strip()
            suggestions = json.loads(raw)
            if isinstance(suggestions, list) and len(suggestions) > 0:
                yield f"data: {json.dumps({'type': 'suggestions', 'content': suggestions[:3]})}\n\n"
        except Exception as e:
            logger.warning(f"Failed to generate suggestions: {e}")

        # Step 7: Send done signal
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        logger.error(f"Streaming failed: {e}")
        yield f"data: {json.dumps({'type': 'error', 'content': 'An error occurred while generating the answer. Please try again.'})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
