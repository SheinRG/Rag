"""
DocMind AI — Web Search Routes
Global search using DuckDuckGo + Groq for AI-synthesized answers.
"""

import json
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from auth_middleware import get_current_user
from config import GROQ_API_KEY, GROQ_MODEL, TAVILY_API_KEY
from groq import Groq

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Search"])
client = Groq(api_key=GROQ_API_KEY)


class WebSearchRequest(BaseModel):
    query: str


@router.post("/search/web")
async def web_search(body: WebSearchRequest, user=Depends(get_current_user)):
    """Search the web and stream an AI-synthesized answer via SSE."""
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    if not TAVILY_API_KEY:
        raise HTTPException(status_code=500, detail="Tavily API key is not configured.")

    async def _stream():
        try:
            yield f'data: {json.dumps({"type": "status", "content": "Searching the web with Tavily AI..."})}\n\n'

            # Step 1: Perform web search via Tavily
            async with httpx.AsyncClient() as tavily_client:
                logger.info(f"Searching Tavily for: {body.query}")
                response = await tavily_client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": TAVILY_API_KEY,
                        "query": body.query,
                        "search_depth": "basic", # Changed from 'smart' to 'basic'
                        "include_answer": False,
                        "max_results": 5
                    },
                    timeout=20.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Tavily API error ({response.status_code}): {response.text}")
                    yield f'data: {json.dumps({"type": "error", "content": f"Tavily API Error: {response.status_code}"})}\n\n'
                    yield f'data: {json.dumps({"type": "done"})}\n\n'
                    return

                results_data = response.json()
                results = results_data.get("results", [])

            if not results:
                yield f'data: {json.dumps({"type": "token", "content": "No relevant web results found for your query."})}\n\n'
                yield f'data: {json.dumps({"type": "done"})}\n\n'
                return

            # Step 2: Build context from search results
            context_parts = []
            sources = []
            for r in results:
                title = r.get('title', 'Untitled')
                url = r.get('url', '#')
                content = r.get('content', '')
                
                context_parts.append(f"Title: {title}\nURL: {url}\nContent: {content}")
                sources.append({"title": title, "url": url})

            context = "\n\n---\n\n".join(context_parts)

            yield f'data: {json.dumps({"type": "status", "content": "Synthesizing professional answer..."})}\n\n'

            # Step 3: Stream AI answer
            system_prompt = f"""You are DocMind AI's professional research assistant. Answer the user's question using the high-quality web results provided below.
            
Guidelines:
1. Provide a comprehensive, well-structured answer.
2. Cite your sources inline using [Source Title](URL) format.
3. Be objective and factual.
4. Use Markdown for formatting (tables, lists, bold text).

--- SEARCH RESULTS ---
{context}
--- END RESULTS ---"""

            stream = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": body.query},
                ],
                stream=True,
                max_tokens=1500,
                temperature=0.3,
            )

            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    yield f'data: {json.dumps({"type": "token", "content": delta.content})}\n\n'

            # Step 4: Send sources
            yield f'data: {json.dumps({"type": "web_sources", "content": sources})}\n\n'
            yield f'data: {json.dumps({"type": "done"})}\n\n'

        except Exception as e:
            logger.error(f"Web search failed: {e}")
            yield f'data: {json.dumps({"type": "error", "content": f"Search failed: {str(e)}"})}\n\n'
            yield f'data: {json.dumps({"type": "done"})}\n\n'

    return StreamingResponse(
        _stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
