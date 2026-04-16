"""
DocMind AI — LLM Module
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


def build_prompt(question: str, chunks: List[dict]) -> str:
    """
    Builds the RAG prompt with context chunks and the user's question.
    """
    context_parts = []
    for chunk in chunks:
        context_parts.append(f'[SOURCE: {chunk["source"]}]\n{chunk["content"]}')

    context = "\n\n".join(context_parts) if context_parts else "No document context available."

    prompt = f"""You are DocMind AI, a highly intelligent and collaborative research assistant (similar to NotebookLM). Your goal is to help the user understand, synthesize, and explore their uploaded documents.

Guidelines for your response:
1. Speak naturally and conversationally as a helpful research partner. Do not sound like a rigid robot.
2. If the user asks for a summary, overview, or abstract concept (e.g., "what is the basic intro"), read the available document chunks and synthesize them logically to provide a comprehensive answer. Make intelligent, helpful inferences based directly on the provided text.
3. Base your answers on the provided context. If the context absolutely does not contain enough information to formulate an answer, politely explain what information is missing.
4. Do NOT constantly inject disclaimers like "This is not explicitly mentioned but inferred..." or "No specific citation available". Just provide the synthesized answer confidently.
5. Format your answers beautifully using Markdown (bullet points, bold text, headers) to make reading easy.

--- CONTEXT START ---
{context}
--- CONTEXT END ---

QUESTION: {question}
ANSWER:"""

    return prompt


async def ask_stream(question: str, user_id: str) -> AsyncGenerator[str, None]:
    """
    Main streaming Q&A function.
    Retrieves context, queries Groq, and yields SSE events.
    """
    try:
        # Step 1: Retrieve relevant chunks
        chunks = retrieve(question, user_id)

        # Step 3: Build prompt
        prompt = build_prompt(question, chunks)

        # Step 4: Stream from Groq
        stream = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            max_tokens=1024,
            temperature=0.2,
        )

        for groq_chunk in stream:
            delta = groq_chunk.choices[0].delta
            if delta and delta.content:
                yield f'data: {json.dumps({"type": "token", "content": delta.content})}\n\n'

        # Step 5: Send source information
        unique_sources = list({chunk["source"] for chunk in chunks})
        yield f'data: {json.dumps({"type": "sources", "content": unique_sources})}\n\n'

        # Step 6: Send done signal
        yield f'data: {json.dumps({"type": "done"})}\n\n'

    except Exception as e:
        logger.error(f"Streaming failed: {e}")
        yield f'data: {json.dumps({"type": "error", "content": "An error occurred while generating the answer. Please try again."})}\n\n'
        yield f'data: {json.dumps({"type": "done"})}\n\n'
