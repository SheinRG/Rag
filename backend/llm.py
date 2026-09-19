"""
Nexus — LLM Module
Groq API integration with prompt building and SSE streaming.
"""

import json
import logging
from typing import AsyncGenerator, List

from fastapi.concurrency import run_in_threadpool
from groq import AsyncGroq, RateLimitError
from config import GROQ_API_KEY, GROQ_MODEL, GROQ_REASONING_EFFORT
from retriever import retrieve
from utils.prompt_security import UNTRUSTED_CONTENT_RULE, wrap_document_content

logger = logging.getLogger(__name__)

# Async client so streaming/generation never blocks the event loop.
client = AsyncGroq(api_key=GROQ_API_KEY)

# Cap how much prior conversation we replay to keep token cost/context bounded.
MAX_HISTORY_MESSAGES = 8


def build_system_prompt(chunks: List[dict]) -> str:
    """
    Builds the system prompt with context chunks.
    """
    context_parts = []
    for chunk in chunks:
        # Each chunk is sealed as untrusted data: the source name comes from a
        # document filename the user chose, but the content itself can contain
        # prompt-injection text and must never reach the model as instructions.
        context_parts.append(
            f"[SOURCE: {chunk['source']}]\n{wrap_document_content(chunk['content'])}"
        )

    context = (
        "\n\n".join(context_parts)
        if context_parts
        else "No document context available."
    )

    prompt = f"""You are Nexus, a highly intelligent and collaborative research assistant (similar to NotebookLM). Your goal is to help the user understand, synthesize, and explore their uploaded documents.

{UNTRUSTED_CONTENT_RULE}

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
    question: str, user_id: str, document_ids: list[str] = None, notebook_id: str = None, history: list = None
) -> AsyncGenerator[str, None]:
    """
    Main streaming Q&A function.
    Retrieves context, queries Groq, and yields SSE events.
    Optionally filters by a list of document_ids for multi-source chats.
    """
    try:
        # Step 1: Construct contextual query and retrieve chunks
        retrieval_query = question
        if history and len(history) > 0:
            last_msg = history[-1]
            last_content = last_msg.get("content", "") if isinstance(last_msg, dict) else getattr(last_msg, "content", "")
            if len(question.split()) < 15 and last_content:
                # Append last assistant message to give embedder context
                retrieval_query = f"{last_content}\n\n{question}"

        # retrieve() is blocking (Cohere embed + Supabase RPC + Cohere rerank, each
        # with multi-second timeouts and a sleeping retry ladder). Running it inline
        # would stall the event loop for every other request on this worker.
        chunks = await run_in_threadpool(
            retrieve,
            retrieval_query,
            user_id,
            document_ids=document_ids,
            notebook_id=notebook_id,
        )

        # Step 2: Build prompt
        system_prompt = build_system_prompt(chunks)

        # Step 3: Stream from Groq
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for msg in history[-MAX_HISTORY_MESSAGES:]:
                role = msg.get("role", "user") if isinstance(msg, dict) else getattr(msg, "role", "user")
                content = msg.get("content", "") if isinstance(msg, dict) else getattr(msg, "content", "")
                if content:
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": question})

        stream = await client.chat.completions.create(
            model=GROQ_MODEL,
            reasoning_effort=GROQ_REASONING_EFFORT,
            messages=messages,
            stream=True,
            max_tokens=2048,
            temperature=0.2,
        )

        async for groq_chunk in stream:
            delta = groq_chunk.choices[0].delta
            if delta and delta.content:
                yield f"data: {json.dumps({'type': 'token', 'content': delta.content})}\n\n"

        # Step 4: Send source information with chunks
        sources_map = {}
        for chunk in chunks:
            src = chunk["source"]
            if src not in sources_map:
                sources_map[src] = []
            sources_map[src].append(chunk["content"])

        formatted_sources = [{"name": k, "chunks": v} for k, v in sources_map.items()]
        yield f"data: {json.dumps({'type': 'sources', 'content': formatted_sources})}\n\n"

        # Step 5: Generate follow-up suggestions
        try:
            suggestion_prompt = f"""Based on the user's question and the document context provided, generate exactly 3 short follow-up questions the user might want to ask next.
These should be directly related to the document content and the conversation topic.
Keep each question concise (under 12 words).

User's question: {question}

Respond ONLY with a JSON object of the form {{"questions": ["Q1?", "Q2?", "Q3?"]}}."""

            suggestion_resp = await client.chat.completions.create(
                model=GROQ_MODEL,
                reasoning_effort=GROQ_REASONING_EFFORT,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You generate follow-up research questions. Respond ONLY with a valid JSON object {\"questions\": [...]}"},
                    {"role": "user", "content": suggestion_prompt},
                ],
                max_tokens=150,
                temperature=0.6,
            )
            raw = suggestion_resp.choices[0].message.content.strip()
            parsed = json.loads(raw)
            suggestions = parsed.get("questions", []) if isinstance(parsed, dict) else parsed
            if isinstance(suggestions, list) and len(suggestions) > 0:
                yield f"data: {json.dumps({'type': 'suggestions', 'content': suggestions[:3]})}\n\n"
        except Exception as e:
            logger.warning(f"Failed to generate suggestions: {e}")

        # Step 6: Send done signal
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except RateLimitError as e:
        logger.warning(f"Groq Rate Limit Exceeded: {e}")
        yield f"data: {json.dumps({'type': 'error', 'content': 'You have reached the AI rate limit (too many tokens per minute). Please wait 60 seconds and try again.'})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    except Exception as e:
        logger.error(f"Streaming failed: {e}")
        yield f"data: {json.dumps({'type': 'error', 'content': 'An error occurred while generating the answer. Please try again.'})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
