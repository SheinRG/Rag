"""
Nexus — Web Search Routes
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


from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class WebSearchRequest(BaseModel):
    query: str
    history: Optional[List[ChatMessage]] = []
    document_id: Optional[str] = None

@router.post("/search/web")
async def web_search(body: WebSearchRequest, user=Depends(get_current_user)):
    """Search the web contextually and stream a hybrid AI answer."""
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    if not TAVILY_API_KEY:
        raise HTTPException(status_code=500, detail="Tavily API key is not configured.")

    async def _stream():
        try:
            from database import supabase
            
            # Step 1: Get document context if available
            doc_context = ""
            if body.document_id:
                doc_res = supabase.table("documents").select("original_name").eq("id", body.document_id).execute()
                if doc_res.data:
                    doc_context = f"The user is currently viewing a document named '{doc_res.data[0]['original_name']}'."

            # Step 2: Format history
            history_text = "\n".join([f"{m.role}: {m.content}" for m in body.history[-4:]]) if body.history else "No previous conversation."

            yield f'data: {json.dumps({"type": "status", "content": "Analyzing context..."})}\n\n'

            # Step 3: Use LLM to generate a standalone web search query
            query_prompt = f"""You are an expert search query generator. Based on the user's latest query, the conversation history, and the document context, generate a single, highly effective Google search query to find the exact information needed.
            
Context: {doc_context}
Conversation History:
{history_text}
Latest User Query: {body.query}

Respond with ONLY the raw search query string. Nothing else."""

            query_response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": query_prompt}],
                max_tokens=50,
                temperature=0.1,
            )
            smart_query = query_response.choices[0].message.content.strip().replace('"', '')

            yield f'data: {json.dumps({"type": "status", "content": f"Searching web for: {smart_query}"})}\n\n'

            # Step 4: Perform web search via Tavily
            async with httpx.AsyncClient() as tavily_client:
                response = await tavily_client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": TAVILY_API_KEY,
                        "query": smart_query,
                        "search_depth": "basic",
                        "include_answer": False,
                        "max_results": 5
                    },
                    timeout=20.0
                )
                
                if response.status_code != 200:
                    yield f'data: {json.dumps({"type": "error", "content": f"Tavily API Error: {response.status_code}"})}\n\n'
                    yield f'data: {json.dumps({"type": "done"})}\n\n'
                    return

                results_data = response.json()
                results = results_data.get("results", [])

            if not results:
                yield f'data: {json.dumps({"type": "token", "content": "No relevant web results found for your query."})}\n\n'
                yield f'data: {json.dumps({"type": "done"})}\n\n'
                return

            # Step 5: Build context from search results
            context_parts = []
            sources = []
            for r in results:
                title = r.get('title', 'Untitled')
                url = r.get('url', '#')
                content = r.get('content', '')
                context_parts.append(f"Title: {title}\nURL: {url}\nContent: {content}")
                sources.append({"title": title, "url": url})

            web_context = "\n\n---\n\n".join(context_parts)

            yield f'data: {json.dumps({"type": "status", "content": "Synthesizing hybrid answer..."})}\n\n'

            # Step 6: Stream hybrid AI answer
            system_prompt = f"""You are Nexus's professional research assistant. Answer the user's question by combining the context of their previous conversation and the live web search results.
            
Guidelines:
1. Provide a comprehensive, well-structured answer.
2. Cite your web sources inline using [Source Title](URL) format.
3. If the user refers to the document or previous chat ("them", "this"), use the conversation history to understand the reference.
4. Use Markdown for formatting.

--- WEB SEARCH RESULTS ---
{web_context}
--- END RESULTS ---

{doc_context}"""

            chat_messages = [{"role": "system", "content": system_prompt}]
            for msg in body.history[-4:]:
                chat_messages.append({"role": msg.role, "content": msg.content})
            chat_messages.append({"role": "user", "content": body.query})

            stream = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=chat_messages,
                stream=True,
                max_tokens=1500,
                temperature=0.3,
            )

            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    yield f'data: {json.dumps({"type": "token", "content": delta.content})}\n\n'

            # Step 7: Send sources
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
