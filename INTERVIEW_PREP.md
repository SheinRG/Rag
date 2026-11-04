# NEXUS — Technical Engineering & Interview Preparation Document

> A senior-engineer's teardown of the NEXUS codebase, written for interview defense.
> Everything here is grounded in the **actual repository** — not an idealized template.

---

## ⚠️ READ THIS FIRST — Reality vs. the Template

Your prep template assumed a "standard RAG stack." This codebase is **leaner and more opinionated** than that template. If you claim things that aren't in the code, an experienced interviewer will expose it in 30 seconds. Here is the truth table. **Memorize it.**

| Template assumed | What NEXUS actually uses | Say this in the interview |
|---|---|---|
| MongoDB | ❌ Not used. Single **Postgres** (via Supabase) with the **pgvector** extension. | "It's all Postgres — relational metadata *and* vectors in one database via pgvector." |
| Self-hosted PostgreSQL container | ❌ **Supabase managed Postgres** (DB + Auth + Storage + RPC). | "I used Supabase as a managed backend-as-a-service to avoid running my own Postgres/auth/object-store." |
| Dedicated vector DB (Pinecone/Weaviate/Qdrant) | ❌ **pgvector** inside the same Postgres. | "No separate vector DB — pgvector keeps one source of truth and one connection." |
| JWT with refresh-token rotation implemented by me | ⚠️ **Supabase Auth** issues/refreshes JWTs. Refresh is handled by the Supabase client SDK, not my code. | "Auth is delegated to Supabase (GoTrue). It issues JWTs; the frontend SDK handles refresh." |
| WebSockets | ❌ **Server-Sent Events (SSE)** over HTTP. | "Streaming is one-directional server→client, so SSE, not WebSockets." |
| LangChain / LlamaIndex orchestration | ⚠️ Only `langchain-text-splitters` (the `RecursiveCharacterTextSplitter`). No chains, agents, or LlamaIndex. | "I used LangChain *only* for its text splitter; the RAG orchestration is hand-written." |
| OpenAI / Anthropic | ❌ **Groq** (Llama 3.1 8B) for generation, **Cohere** for embeddings, **Tavily** for web search. | "Groq for the LLM because of latency + free tier; Cohere for embeddings; Tavily for live web." |
| Tesseract / OCR library | ❌ OCR/image understanding is done by a **Groq vision model** (Llama-4-Scout), not a classic OCR lib. | "Image analysis is multimodal-LLM based, not Tesseract." |
| Docker Compose multi-service | ❌ **Single Dockerfile** for the backend. Frontend built separately (Vite). No compose file. | "One container for the API; the frontend is a static SPA; managed services for the rest." |
| Redis / Celery / task queue | ❌ Ingestion runs in FastAPI **`BackgroundTasks`** (in-process). No Redis/Celery. | "Async ingestion uses FastAPI background tasks today; a real queue is my #1 scaling change." |
| Local embedding model (FastEmbed/SBERT on box) | ❌ Embeddings are a **Cohere HTTP API call** — *zero local RAM* by design (512 MB Render tier). | "I deliberately moved embeddings off-box to fit a 512 MB free tier." |

There are also two honest wrinkles you should know about (they make you look *more* credible, not less, when you volunteer them):

1. **The cross-encoder reranker is likely disabled in production.** `retriever.py` imports `sentence_transformers.CrossEncoder`, but **`sentence-transformers`/`torch` are NOT in `requirements.txt`**. So the `try/except` at import fails and `reranker = None`. On your local machine (where you may have it installed) reranking works; on the deployed Render box it silently no-ops. Know this cold — see §10 and §19.
2. **`search_routes.py` docstring says "DuckDuckGo" but the code calls the Tavily API.** `duckduckgo-search` is in `requirements.txt` as a leftover. The live path is Tavily. Don't say DuckDuckGo.

---

## 1. PROJECT SUMMARY

### What problem does it solve?
People accumulate documents (PDFs, DOCX, slide decks, spreadsheets, YouTube lectures, images) and can't efficiently *ask questions across them* or *synthesize* them. Traditional keyword search (Ctrl-F) fails on meaning; pasting everything into ChatGPT breaks on context-window limits and gives no source attribution. **NEXUS is a NotebookLM-style "document intelligence" workspace**: upload sources → ask grounded questions → get streamed, cited answers → generate study/research artifacts (summaries, quizzes, flashcards, mind maps, research dossiers).

### Who are the target users?
Students, researchers, analysts, and knowledge workers who need to **understand and interrogate a private corpus** rather than the open web. Anyone who'd use NotebookLM but wants their own instance.

### Why does it exist?
It's a portfolio-grade demonstration of an **end-to-end production RAG system** built to run on **free tiers** (Render 512 MB, Supabase free, Groq free, Cohere trial) — proving you can ship real GenAI infrastructure under hard cost/memory constraints, not just call an API.

### Why a RAG architecture?
Three reasons, in order of importance:
1. **Grounding / hallucination control** — answers are constrained to the user's uploaded text, with sources returned alongside every answer.
2. **Context-window economics** — a 700-page book cannot fit in a prompt. RAG retrieves only the ~5 most relevant chunks, keeping token cost and latency bounded.
3. **Freshness & privacy** — the model never needs retraining; you add knowledge by ingesting documents, and each user's data is isolated by `user_id`.

### 🎤 30-second pitch
> "NEXUS is a NotebookLM clone — a RAG app where you upload your documents and chat with them and get cited answers. FastAPI backend, React frontend, Supabase Postgres with pgvector for the vector store, Cohere for embeddings, and Groq's Llama 3.1 for generation with token streaming over SSE. It also generates quizzes, flashcards, summaries, and research reports from your sources. The whole thing is engineered to run on free tiers under 512 MB of RAM."

### 🎤 2-minute pitch
> "The core problem RAG solves here is grounding an LLM in *your* private documents. When you upload a PDF, the backend stores it in Supabase object storage, then a background task streams it page-group by page-group — extracting text with PyMuPDF, splitting it into ~2500-character overlapping chunks, embedding each chunk with Cohere's 384-dim model, and storing the vectors in Postgres via pgvector.
>
> When you ask a question, I embed the query, run a cosine-similarity search through a Postgres RPC function, take the top matches, optionally rerank them, and build a prompt that injects those chunks as context with source labels. Groq's Llama 3.1 8B streams the answer back token-by-token over Server-Sent Events, and I stream the source chunks and three suggested follow-up questions after the answer.
>
> On top of chat, there's a 'Studio' — one-click quiz, flashcards, summary, mind-map, and a multi-section research dossier, plus YouTube-transcript ingestion, image analysis via a Groq vision model, and live web search via Tavily. Auth, storage, and the database are all Supabase, so I didn't have to run my own infra. The interesting engineering was making ingestion of huge PDFs fit in 512 MB — I process 50 pages at a time and aggressively garbage-collect, and I pushed embeddings off-box to a hosted API so there's zero model weight in memory."

### 🎤 5-minute pitch
Cover the 2-minute version, then add the **four hard problems** (see §19): (1) memory-safe streaming ingestion for 700-page PDFs on 512 MB; (2) moving embeddings & the LLM entirely to hosted APIs to eliminate local model RAM; (3) SSE streaming end-to-end with `requestAnimationFrame`-batched rendering on the client; (4) multi-source + notebook-scoped retrieval and the recall trade-off it introduced. Close with the honest scaling roadmap (§20): swap BackgroundTasks for a real queue, push filters into the SQL RPC, add a rerank API, and cache Studio artifacts.

---

## 2. HIGH-LEVEL ARCHITECTURE

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (React 19 SPA, Vite)                       │
│   Zustand stores (auth/chat/document/notebook)  ·  React Router 7           │
│   react-markdown + remark-gfm  ·  SSE reader (fetch ReadableStream)         │
└───────────────┬───────────────────────────────────────────┬───────────────┘
                │ (1) Auth: signup/login DIRECT to Supabase   │ (2) API calls with
                │     JS SDK (GoTrue) → returns JWT            │     Bearer JWT
                ▼                                             ▼
      ┌──────────────────┐               ┌──────────────────────────────────────┐
      │  SUPABASE AUTH   │               │        FASTAPI BACKEND (uvicorn)      │
      │  (GoTrue)        │               │  CORS · GZip · lifespan health checks │
      │  issues/refresh  │◄──────────────┤  auth_middleware: get_user(token)     │
      │  JWT             │  verify token │  Routers: auth / documents / query /  │
      └──────────────────┘               │  studio / search / notebooks / media  │
                                         └───┬───────────────┬──────────────┬────┘
                                             │               │              │
                     ┌───────────────────────┘               │              └─────────────┐
                     ▼ UPLOAD                                 ▼ ASK                        ▼ STUDIO/MEDIA
        ┌──────────────────────────┐          ┌──────────────────────────┐   ┌──────────────────────────┐
        │ 1. validate_file()       │          │ 1. embed query (Cohere)  │   │ quiz/summary/flashcards/  │
        │ 2. Supabase Storage.put  │          │ 2. match_chunks RPC      │   │ mindmap/topics/overview/  │
        │ 3. insert documents row  │          │    (pgvector cosine)     │   │ verify/research/youtube/  │
        │ 4. BackgroundTasks →      │          │ 3. (rerank if available) │   │ image(vision)/drive       │
        │    run_ingestion         │          │ 4. build_system_prompt   │   └────────────┬─────────────┘
        └───────────┬──────────────┘          │ 5. Groq stream (SSE)     │                │
                    │                          │ 6. stream sources+       │                │
                    ▼                          │    suggestions           │                │
        ╔══════════════════════════╗          └───────────┬──────────────┘                │
        ║  INGESTION PIPELINE       ║                      │                                │
        ║  download → PyMuPDF parse ║                      │                                │
        ║  → RecursiveCharSplitter  ║                      ▼                                ▼
        ║  → Cohere embed (384d)    ║          ┌──────────────────┐            ┌──────────────────────┐
        ║  → insert chunks rows     ║          │  GROQ  (Llama 3.1 │            │ TAVILY (web) ·        │
        ║  (50-page groups, gc)     ║          │  8B-instant) LLM  │            │ YouTube Transcript API│
        ╚═══════════┬══════════════╝          │  + Llama-4-Scout  │            │ · Google Drive API    │
                    │                          │  vision           │            └──────────────────────┘
                    ▼                          └──────────────────┘
   ┌───────────────────────────────────────────────────────────────────┐
   │           SUPABASE POSTGRES (managed)  +  pgvector extension        │
   │  Tables: notebooks · documents · chunks(embedding vector(384))      │
   │  RPC: match_chunks(query_embedding, user_id, count, threshold)      │
   │  Storage bucket: "documents" (raw files)                            │
   └───────────────────────────────────────────────────────────────────┘
                    ▲
                    │ COHERE Embeddings API (embed-english-light-v3.0, 384-dim, off-box, zero RAM)
                    └──────────────────────────────────────────────────────────────────────────
```

### Component-by-component: what & why
- **React SPA (frontend)** — the UI. *Why:* rich interactivity (streaming chat, resizable panels, dropzone upload) needs a client-side app. Vite for fast builds; Zustand for lightweight state (no Redux boilerplate).
- **Supabase Auth (GoTrue)** — identity. *Why:* email/password auth, JWT issuance, and refresh are solved problems; delegating removes an entire class of security bugs. The frontend talks to it directly via the JS SDK.
- **FastAPI backend** — the brain. *Why:* async-native (critical for streaming + concurrent I/O to Groq/Cohere/Supabase), automatic OpenAPI docs, Pydantic validation, first-class `StreamingResponse` for SSE.
- **Auth middleware** — `get_current_user` dependency validates the Bearer JWT on every protected route by calling `supabase.auth.get_user(token)`.
- **Document upload route** — validates, stores the raw file, inserts a `documents` row with `status="processing"`, and schedules ingestion as a background task (returns `202 Accepted` immediately).
- **Ingestion pipeline (`ingest.py`)** — parse → chunk → embed → store. *Why separate & backgrounded:* embedding a book takes many seconds; you must not block the HTTP response.
- **Cohere Embeddings API** — turns text into 384-dim vectors. *Why hosted:* zero local model weight → fits 512 MB.
- **pgvector in Postgres** — the vector store + similarity search. *Why:* one database for both relational metadata and vectors; no second system to operate.
- **`match_chunks` RPC** — a Postgres function doing the cosine-similarity ANN query server-side. *Why:* keep the heavy vector math in the DB, return only top matches.
- **Retriever (`retriever.py`)** — embeds the query, calls the RPC, filters, optionally reranks, enriches with source names.
- **LLM layer (`llm.py`)** — builds the grounded prompt and streams from Groq. *Why Groq:* extremely low latency + generous free tier.
- **SSE streaming** — server pushes `token`/`sources`/`suggestions`/`done` events. *Why:* perceived latency — the user reads while the model writes.
- **Studio & Media routes** — value-add generation (quizzes, mind maps, research dossiers, YouTube/image/Drive ingestion, citation verification).

---

## 3. COMPLETE REQUEST FLOW — "User uploads a PDF, then asks a question"

### Phase A — Upload (synchronous, returns in ~1s)
1. **Frontend** `UploadZone.jsx` → `POST /api/documents/upload` (multipart) with the `Authorization: Bearer <jwt>` header, optional `notebook_id`.  
2. **`get_current_user`** dependency runs first: `supabase.auth.get_user(token)` → 401 if invalid. *(1 network round-trip to Supabase Auth per request.)*
3. **`upload_document`** reads the file into memory, calls **`validate_file(filename, size)`** — checks extension ∈ `ALLOWED_EXTENSIONS` and size ≤ 20 MB.
4. Generates a UUID filename, path = `{user.id}/{uuid}.{ext}`, and **uploads raw bytes to Supabase Storage** bucket `documents`. *(DB/storage interaction #1.)*
5. **Inserts a `documents` row** `{user_id, filename, original_name, file_type, file_size, status:"processing", storage_path, notebook_id?}`; grabs `doc_id`. *(DB interaction #2.)*
6. Schedules **`background_tasks.add_task(run_ingestion, ...)`** and returns `202` with `{id, original_name, status:"processing"}`.
7. **Frontend** now polls `GET /api/documents/{id}/status` until `status == "ready"` (or `"failed"`).

### Phase B — Ingestion (background, seconds→minutes)
8. **`run_ingestion`** → `download_from_storage` pulls the file to a temp path. *(Storage read.)*
9. **PDF branch** opens with PyMuPDF (`fitz`), reads total page count, closes, `gc.collect()`.
10. Loops in **`PAGE_GROUP = 50`** windows. For each window: reopen PDF, `page.get_text()` for those pages → `Document` objects → **`text_splitter.split_documents`** (RecursiveCharacterTextSplitter, size 2500 / overlap 200).
11. **Embeds** the group's chunk texts: `embedder.embed(texts)` → **Cohere API call(s)** (batches of 96, `input_type="search_document"`, retry-with-backoff on 429). *(AI call #1..N.)*
12. Builds `chunks` rows `{document_id, user_id, content, embedding(384d), chunk_index}` and **inserts them** into the `chunks` table. *(DB write.)* Then `del` locals + `gc.collect()` to free RAM.
13. After all groups: **updates the `documents` row** to `status:"ready", num_chunks:N`. On any exception → `status:"failed", error_msg`. `finally` deletes the temp file.

### Phase C — Ask a question (streamed)
14. **Frontend** `chatStore.sendMessage` → `streamPost('/ask/stream', {question, document_ids, notebook_id, history})` via `fetch` (keeps a `ReadableStream`).
15. **`ask_stream_endpoint`** validates non-empty question → returns `StreamingResponse(ask_stream(...), media_type="text/event-stream")`.
16. **`ask_stream`**: if the question is short (<15 words) and history exists, it *prepends the last message* to the retrieval query (contextualization for follow-ups).
17. **`retrieve`**: `embedder.embed_query(query)` → **Cohere API** (`input_type="search_query"`). *(AI call.)*
18. Builds RPC params and calls **`supabase.rpc("match_chunks", ...)`** — pgvector cosine search, `match_count=25` (or `100` if a document/notebook filter is set), `match_threshold=0.10`. *(DB/vector query.)*
19. If `document_ids`/`notebook_id` given → **filters candidates in Python**; if a reranker is loaded, reranks the top 20 with a cross-encoder; trims to `top_k=5`; enriches each chunk with its source document name (cached lookups). *(DB reads for names.)*
20. **`build_system_prompt`** injects the chunks as `[SOURCE: name]\n<content>` blocks into a NotebookLM-style system prompt.
21. **`client.chat.completions.create(model="llama-3.1-8b-instant", stream=True, max_tokens=1024, temperature=0.2)`** → **Groq streaming AI call**. Each delta is emitted as `data: {"type":"token","content":...}`.
22. After tokens: emits a **`sources`** event (grouped by document) and fires a **second Groq call** (JSON mode) to generate 3 follow-up **`suggestions`**, then a **`done`** event.
23. **Frontend** parses the SSE lines, buffers tokens and flushes them on `requestAnimationFrame` (smooth, non-janky rendering), attaches sources/suggestions to the last assistant message, and stops the spinner on `done`.

**Where the final answer comes from:** the Groq LLM, constrained by the retrieved chunks in the system prompt. The answer text is *generated*, but the *facts* are meant to come from the injected context; the returned `sources` let the user verify.

---

## 4. TECH STACK — choices, alternatives, trade-offs

| Tech | Why chosen | Alternatives | Trade-off |
|---|---|---|---|
| **React 19 + Vite 8** | Fast HMR, huge ecosystem, streaming UI needs a client app. | Next.js, SvelteKit, Vue | No SSR/SEO (fine — it's an authed app). Vite 8 is bleeding-edge. |
| **Zustand** | Minimal boilerplate global state; `persist` middleware for localStorage. | Redux Toolkit, Context | Less structure/devtools than Redux; fine for this size. |
| **FastAPI** | Async-native (streaming + concurrent API I/O), Pydantic validation, auto OpenAPI. | Flask, Django, Express, Go | Younger ecosystem than Flask; async footguns if you call blocking code (handled via `run_in_threadpool`). |
| **uvicorn** | ASGI server for async FastAPI. | Hypercorn, Gunicorn+workers | Single process on free tier = limited concurrency. |
| **Docker** | Reproducible backend image, easy Render deploy. | Buildpacks, bare VM | Image size/cold starts on free tier. |
| **Supabase Postgres + pgvector** | One managed DB for metadata **and** vectors; free tier; RPC for server-side ANN. | Pinecone/Weaviate/Qdrant + separate RDB; RDS+pgvector | pgvector ANN (IVFFlat/HNSW) is good but not best-in-class at massive scale; managed = less control. |
| **Supabase Auth (GoTrue)** | Turnkey JWT auth + refresh + email confirm. | Auth0, Clerk, Firebase, roll-your-own | Vendor lock-in; per-request `get_user` round-trip (see §14). |
| **Supabase Storage** | S3-compatible object store bundled in. | S3, GCS, R2 | Coupled to Supabase. |
| **SSE (not WebSockets)** | One-way server→client token streaming; simpler, works over plain HTTP, auto-reconnect semantics. | WebSockets, long-poll | No client→server mid-stream messaging; needs `X-Accel-Buffering: no` to defeat proxy buffering. |
| **LangChain (splitter only)** | Battle-tested `RecursiveCharacterTextSplitter`. | Custom splitter, LlamaIndex, Unstructured | Pulls a dependency for one class; no chains used (intentional — avoids abstraction bloat). |
| **Groq (Llama 3.1 8B-instant)** | ~sub-second TTFT, generous free tier, OpenAI-compatible SDK, 128k context. | OpenAI GPT-4o-mini, Anthropic Haiku, Together | 8B is weaker than frontier models on reasoning; strict TPM rate limits on free tier. |
| **Groq Llama-4-Scout (vision)** | Multimodal OCR/diagram understanding without a separate OCR stack. | Tesseract, GPT-4o-vision, PaddleOCR | Model availability churns (the old 90B-vision was decommissioned — see the config note). |
| **Cohere embed-english-light-v3.0** | 384-dim, hosted (zero RAM), free tier, `search_query`/`search_document` asymmetry. | OpenAI text-embedding-3, FastEmbed/BGE local, Voyage | English-only "light" model; 384 dims trades some recall for storage/speed; 10k calls/mo cap. |
| **Tavily** | LLM-optimized web search API (clean content, not raw HTML). | DuckDuckGo (leftover dep), SerpAPI, Bing | Paid beyond free tier; another key to manage. |
| **PyMuPDF (fitz)** | Fast, low-memory PDF text extraction; page-level access enables streaming. | pdfplumber, PyPDF2, pdfminer | AGPL license; no OCR for scanned PDFs (text-layer only). |
| **python-docx / python-pptx / openpyxl+pandas** | Native parsers for Office formats. | Unstructured, textract | Each format is a separate code path. |

**No MongoDB, no Redis, no Celery, no Pinecone, no OpenAI/Anthropic, no Tesseract, no WebSockets, no Docker Compose.** Say so plainly.

---

## 5. FOLDER STRUCTURE (architecture, not files)

```
NEXUS/
├── backend/
│   ├── main.py            # App assembly: CORS, GZip, routers, lifespan health checks
│   ├── config.py          # All env vars + constants (models, chunk sizes, TOP_K, limits)
│   ├── database.py        # Supabase client + CohereEmbedder (the embedding abstraction)
│   ├── auth_middleware.py # get_current_user JWT dependency
│   ├── ingest.py          # The ingestion pipeline (parse→chunk→embed→store, memory-safe)
│   ├── retriever.py       # Query embedding + pgvector RPC + filter + rerank + enrich
│   ├── llm.py             # Prompt building + Groq SSE streaming (chat Q&A)
│   ├── models/schemas.py  # Pydantic request/response contracts
│   ├── routes/            # One router per domain:
│   │   ├── auth_routes.py      # register/login/me (wraps Supabase Auth)
│   │   ├── document_routes.py  # upload/list/status/delete/rename
│   │   ├── query_routes.py     # /ask/stream (SSE chat)
│   │   ├── studio_routes.py    # topics/overview/quiz/summary/flashcards/mindmap
│   │   ├── search_routes.py    # /search/web (Tavily + Groq hybrid answer)
│   │   ├── notebook_routes.py  # notebook CRUD + /synthesize
│   │   └── media_routes.py     # youtube/analyze-image/verify/research-report/drive
│   ├── utils/             # file_handler (validation), chunker (deprecated shim)
│   └── Dockerfile
└── frontend/
    └── src/
        ├── api/client.js       # axios instance (JWT interceptor) + streamPost (SSE)
        ├── store/              # Zustand: auth/chat/document/notebook/theme
        ├── lib/supabase.js     # Supabase JS client (auth)
        ├── pages/              # Landing/Login/Signup/Dashboard/Notebooks
        └── components/         # chat/ documents/ studio/ layout/ ui/
```

**Responsibility split:** `routes/` = HTTP surface + auth + validation; the *domain logic* lives in the top-level modules (`ingest`, `retriever`, `llm`, `database`). This keeps routes thin and testable and centralizes the RAG core. Config is fully centralized in `config.py` (single source of truth for every tunable).

---

## 6. DATABASE DESIGN

**One Postgres database (Supabase) with the pgvector extension.** Three core tables + one storage bucket + one RPC.

### Tables (inferred from the code's reads/writes)
**`notebooks`** — a workspace grouping documents.
`id (uuid pk) · user_id · title · emoji · description · created_at · updated_at`
*Why:* NotebookLM's core UX unit; lets a user scope chat/synthesis to a set of sources.

**`documents`** — one row per uploaded source.
`id (uuid pk) · user_id · notebook_id (fk→notebooks, nullable) · filename (uuid on disk) · original_name · file_type · file_size · status (processing|ready|failed) · error_msg · num_chunks · storage_path · created_at`
*Why:* metadata + processing lifecycle so the UI can poll status and show errors.

**`chunks`** — the retrieval unit and vector store.
`id (uuid pk) · document_id (fk→documents) · user_id · content (text) · embedding (vector(384)) · chunk_index (int)`
*Why:* stores each text chunk **and its embedding together** so retrieval returns text + metadata in one hop.

### Relationships
`notebooks 1—* documents 1—* chunks`. Deleting a notebook cascades to documents (FK `ON DELETE CASCADE` per the code comment); deleting a document should cascade to its chunks. `user_id` is denormalized onto every table so every query filters by owner cheaply.

### Indexes (what should exist / what the queries imply)
- **Vector ANN index on `chunks.embedding`** (IVFFlat or HNSW, `vector_cosine_ops`) — powers `match_chunks`. *This is the single most important index.*
- B-tree on `chunks.document_id` and `chunks.user_id` (filtered heavily in Studio/retrieval).
- B-tree on `documents.user_id`, `documents.notebook_id`, `documents.created_at` (list/order queries).
- ⚠️ **Interview-honest caveat:** the actual index DDL lives in Supabase, *not in this repo*. Say "the ANN index is defined in the Supabase migration, not in the app code."

### Why Postgres (not Mongo)?
Relational integrity (FK cascade from notebook→document→chunk), transactional inserts, **and** vectors in the *same* store via pgvector — so one query can do vector search *and* return relational metadata. Mongo would force a second system for either relations or vectors.

- **Metadata** → `documents`/`notebooks` rows.
- **Raw documents** → Supabase Storage bucket `documents` (object store, not the DB).
- **Embeddings** → `chunks.embedding` as `vector(384)`.

---

## 7. DOCUMENT INGESTION PIPELINE (the crown jewel)

```
PDF upload → validate → store raw → (background) download → extract → chunk → embed → store vectors → mark ready
```

1. **Upload & validation** (`validate_file`): extension allow-list + 20 MB cap. *Why:* reject junk/oversized files before spending storage or compute; the allow-list is the first line of defense against malicious uploads.
2. **Raw storage** (Supabase Storage, UUID filename under `user.id/`): keep the original for re-processing/download; UUID prevents path collisions and filename injection.
3. **Async trigger** (`BackgroundTasks`): return `202` instantly; heavy work happens off the request path. *Why:* embedding a book can take minutes.
4. **Download to temp** (`download_from_storage`): work on a local temp file; cleaned up in `finally`.
5. **Text extraction** (PyMuPDF per page; python-docx/pptx/pandas/csv for others): only pages with non-empty text become `Document`s. *Why:* skip blank/scanned pages; raise a clear error if a PDF has *no* text layer.
6. **Cleaning:** implicit — empty strings dropped, whitespace-stripped checks. (No heavy normalization; a known area to improve.)
7. **Chunking** (RecursiveCharacterTextSplitter, 2500/200): split on `\n\n → \n → . → " "` to keep semantic boundaries. *Why:* chunks must be small enough to be specific but large enough to be self-contained (see §9).
8. **Embedding** (Cohere, batches of 96, `search_document` type, 429 backoff): vectorize each chunk. *Why batched + retried:* respect the 100 RPM / rate limits and survive transient failures.
9. **Vector storage** (`chunks` insert, batches of 100): persist text + vector + `chunk_index`. *Why chunk_index:* preserves order for Studio even-sampling and research reports.
10. **Metadata update** (`documents.status = ready, num_chunks`): flips the UI from spinner to chat-ready. Failure path writes `status=failed, error_msg`.
11. **Ready for retrieval.**

**The killer detail — memory safety:** for PDFs the pipeline processes **50 pages at a time**, parsing→chunking→embedding→inserting→**freeing** (`del` + `gc.collect()`) each group before touching the next. This keeps peak RAM roughly constant regardless of document size, so a 700-page book ingests inside a 512 MB container. Combined with **off-box embeddings** (no model weights in RAM), that's how a "real" RAG app runs on a free tier.

---

## 8. RETRIEVAL PIPELINE

```
question → (contextualize with history) → embed query → match_chunks RPC (pgvector cosine)
        → Python filter by doc/notebook → (rerank top 20, if reranker loaded) → top_k=5
        → enrich with source names → inject into prompt → Groq stream → answer + sources
```

1. **Contextualization:** short follow-ups (<15 words) get the previous message prepended so the embedding captures the referent ("it", "that").
2. **Query embedding:** Cohere with `input_type="search_query"` (asymmetric — queries and documents are embedded differently for better retrieval).
3. **Similarity search:** `match_chunks(query_embedding, user_id, match_count, threshold=0.10)` — cosine distance in pgvector, scoped to the user.
4. **Candidate sizing:** 25 normally; **100 when a doc/notebook filter is set** (over-fetch to survive post-filtering). *(This is the known recall bug — §19/§24.)*
5. **Filter:** if `document_ids`/`notebook_id`, keep only matching candidates (in Python today).
6. **Rerank (optional):** cross-encoder `ms-marco-MiniLM-L-6-v2` re-scores the top 20 query–chunk pairs and re-sorts. **Currently a no-op in prod** because `sentence-transformers` isn't installed there.
7. **Top-K:** trim to 5.
8. **Enrich:** attach `original_name` per chunk (cached) so the UI can render source badges.
9. **Prompt + generate:** inject as context, stream from Groq.

---

## 9. CHUNKING

- **Strategy:** `RecursiveCharacterTextSplitter` — recursively splits on a separator hierarchy (`\n\n`, `\n`, `.`, `space`) so it breaks at the *largest* natural boundary that fits.
- **Chunk size:** **2500 characters** (~500–600 tokens).
- **Overlap:** **200 characters** (~8%).
- **Why this size:** big enough that a chunk is *self-contained* (a full idea/paragraph survives), small enough that 5 chunks fit comfortably in the prompt and each embedding is topically focused. 2500 is on the *larger* end — chosen so answers have richer context and fewer chunks are needed (cheaper retrieval + fewer Cohere calls).
- **Why overlap:** prevents a sentence/idea straddling a boundary from being lost — the tail of chunk N reappears at the head of chunk N+1, so a query matching that seam still retrieves coherent context.
- **Advantages:** semantic boundaries respected; fewer, richer chunks → lower embedding cost and fewer DB rows; good for prose/reports.
- **Disadvantages:** larger chunks dilute embeddings (a 2500-char chunk covering two subtopics has a "blurry" vector → weaker precision); more tokens per retrieved chunk; character-based (not token-based) sizing can overshoot token budgets for dense text; poor fit for tabular/code content. **Honest answer to "would you change it?":** yes — I'd test 800–1200 chars with token-aware splitting and semantic chunking, and measure retrieval precision.

---

## 10. EMBEDDINGS

- **Model:** Cohere `embed-english-light-v3.0`.
- **Dimension:** **384**.
- **Similarity metric:** **cosine** (via pgvector `match_chunks`; distance threshold 0.10).
- **Asymmetric embedding:** documents embedded with `input_type="search_document"`, queries with `search_query` — Cohere v3 is trained so these two spaces align for retrieval, improving relevance over naive symmetric embedding.
- **Why embeddings work:** the model maps text to points in a 384-dim space where *semantic* similarity ≈ *geometric* closeness. "How do I reset my password?" lands near "account recovery steps" even with zero shared keywords — that's the whole point vs. keyword search.
- **Cosine similarity:** measures the *angle* between two vectors (magnitude-invariant), so it compares *direction of meaning*, not length. `cos θ = (A·B)/(‖A‖‖B‖)`; 1 = identical direction, 0 = orthogonal/unrelated.
- **How retrieval happens:** embed the query → pgvector finds the nearest chunk vectors by cosine → those chunks' text becomes the LLM's grounding context.
- **Trade-offs of 384-dim "light":** faster, cheaper, smaller storage, but lower ceiling on nuance than 1024/1536-dim models. Good match for a free-tier app. English-only.

---

## 11. VECTOR DATABASE

- **Which:** **pgvector** — a Postgres extension — inside Supabase's managed Postgres. **There is no separate vector database.**
- **Why chosen:** (1) *one* system for relational metadata + vectors → one connection, one backup, one place for `JOIN`s; (2) free on Supabase; (3) `match_chunks` RPC does ANN server-side; (4) avoids the operational + cost overhead and the sync/consistency problems of keeping a separate vector DB in lockstep with the relational store.
- **How vectors are stored:** `chunks.embedding` column typed `vector(384)`; each row also carries `content`, `document_id`, `user_id`, `chunk_index`.
- **Metadata & filtering:** metadata lives *in the same row*, so filters are ordinary SQL predicates (`user_id`, `document_id`). **Today the doc/notebook filter is applied in Python after the RPC** — the honest weakness (§19).
- **Advantages:** simplicity, transactional consistency, no extra infra, SQL filtering + JOINs alongside vector search.
- **Disadvantages:** at very large scale (10s of millions of vectors) dedicated engines (Qdrant/Pinecone/Weaviate) offer better ANN performance, sharding, and metadata-filtered ANN out of the box. pgvector needs careful index tuning (IVFFlat lists / HNSW `m`,`ef`).
- **If asked "why not Pinecone?":** "I didn't have millions of vectors; pgvector kept everything in one database and one free tier. I'd migrate to a dedicated engine when ANN latency or metadata-filtered recall became the bottleneck."

---

## 12. PROMPT ENGINEERING

- **System prompt (chat):** persona = "Nexus, a NotebookLM-style research assistant." Rules: speak naturally; synthesize across chunks; **base answers on provided context**; *don't* spam disclaimers; format in Markdown. Context is injected between explicit `--- CONTEXT START ---`/`--- CONTEXT END ---` delimiters, each chunk prefixed `[SOURCE: <name>]`.
- **Context injection:** retrieved chunks are concatenated with source labels into the system prompt (not the user turn) — keeps the user message clean and the grounding stable across the conversation.
- **Citation prompting:** two mechanisms — (1) source labels in-context; (2) the API streams a **separate `sources` event** listing the exact chunks per document, so the UI renders verifiable source badges rather than trusting inline citations. Web search additionally instructs inline `[Title](URL)` citations.
- **Guardrails / hallucination prevention:**
  - `temperature=0.2` for chat (low creativity, high faithfulness).
  - "If the context absolutely does not contain enough information … politely explain what's missing" — a soft refusal instruction.
  - A dedicated **`/verify` endpoint** (media_routes) cross-checks a generated answer against its sources and returns per-claim `verified/inferred/unverified` + a 0–100 confidence score — an LLM-as-judge hallucination check.
  - JSON mode (`response_format={"type":"json_object"}`) forces structured output for quizzes/flashcards/suggestions/verification, eliminating parse-failure hallucinations.
- **Honest weaknesses:** the prompt *encourages* inference ("make intelligent, helpful inferences") and tells the model *not* to add uncertainty disclaimers — that's a deliberate UX choice that slightly *raises* hallucination risk in exchange for a less hedgy assistant. Be ready to defend the trade-off (the `/verify` endpoint is the mitigation). The `SIMILARITY_THRESHOLD=0.10` is so low it rarely filters anything, so weakly-relevant chunks can reach the prompt.

---

## 13. STREAMING

- **Used?** Yes — **Server-Sent Events (SSE)** for chat, web search, and research reports.
- **How it works:** the endpoint returns `StreamingResponse(async_generator, media_type="text/event-stream")` with headers `Cache-Control: no-cache`, `Connection: keep-alive`, and crucially **`X-Accel-Buffering: no`** (tells nginx/Render not to buffer the stream). The generator `yield`s `data: {json}\n\n` frames of typed events: `token`, `sources`, `suggestions`, `status`, `error`, `done`. Groq is called with `stream=True` via **`AsyncGroq`** so streaming never blocks the event loop.
- **Client side:** `streamPost` uses `fetch` and reads `response.body.getReader()`, decodes chunks, splits on `\n`, parses each `data:` line. Tokens are buffered and flushed on **`requestAnimationFrame`** so React re-renders at most once per frame (smooth, no layout thrash).
- **Why chosen:** *perceived latency*. Time-to-first-token is ~sub-second on Groq; the user starts reading immediately instead of staring at a spinner for the full multi-second generation.
- **Streaming vs. waiting for the full response:**
  - *Waiting:* one JSON blob at the end — simpler, but the user waits for the *entire* answer (feels slow), and a long generation risks proxy/idle timeouts.
  - *Streaming:* first token in <1s, progressive rendering, can cancel mid-stream (`AbortSignal`), and structured post-events (sources/suggestions) arrive after the prose. Cost: more complex client + server code, and you must defeat proxy buffering.
- **Why SSE over WebSockets:** the data flow is purely server→client; SSE is plain HTTP, simpler, auto-reconnects, and needs no separate socket server.

---

## 14. AUTHENTICATION

- **Provider:** **Supabase Auth (GoTrue)** — not hand-rolled.
- **JWT:** on login, Supabase returns an `access_token` (JWT). The frontend stores it in `localStorage` and attaches `Authorization: Bearer <jwt>` via an **axios request interceptor** (and manually for `fetch`/SSE). The backend's **`get_current_user`** dependency validates it by calling `supabase.auth.get_user(token)` and returns the user, else `401`.
- **Refresh token:** handled by the **Supabase JS SDK** on the client (`onAuthStateChange`, `getSession`) — the app code doesn't implement rotation itself. Say: "refresh is delegated to the Supabase client."
- **Password hashing:** done inside Supabase Auth (bcrypt) — the app never sees or stores raw passwords or hashes. `AuthRequest` enforces `min_length=6`.
- **Authorization (data isolation):** every table carries `user_id`, and **every query filters `.eq("user_id", user.id)`**. The backend uses the Supabase **service-role key** (bypasses RLS), so *ownership is enforced in application code* on every route. (⚠️ If asked about RLS: "I enforce ownership in the API layer because I use the service role; a hardening step is to also enable Row-Level Security as defense-in-depth.")
- **Protected routes:** frontend `ProtectedRoute.jsx` redirects unauthenticated users to `/login`; backend protects routes via the `Depends(get_current_user)` dependency. A global axios **response interceptor** catches `401` → clears storage → redirects to `/login`.
- **Honest weakness:** `get_current_user` makes a **network round-trip to Supabase per request**. A JWT can be verified *locally* with the project's JWT secret (no round-trip) — that's a listed optimization (§16/§24).

---

## 15. SECURITY

- **Prompt-injection prevention:** context is fenced with explicit delimiters and labeled `[SOURCE:]`; user content and retrieved content are separated from instructions. ⚠️ **Honest:** there's no dedicated injection sanitizer — a malicious document could contain "ignore previous instructions." Mitigations to cite: delimiters, low temperature, the `/verify` cross-check, and (future) an instruction-stripping/heuristic filter.
- **File validation:** extension allow-list (`.pdf,.txt,.md,.csv,.docx,.pptx,.xlsx,.xls`) + 20 MB size cap + UUID filenames scoped under `user.id/` in storage (no path traversal, no filename injection).
- **Malicious PDFs:** PyMuPDF only extracts the text layer (no JS execution, no rendering of embedded payloads); files are processed in an isolated temp file that's always deleted in `finally`; parse failures are caught and mark the doc `failed` rather than crashing the worker.
- **Rate limiting:** ⚠️ **No app-level rate limiter.** Protection is *indirect* — Groq/Cohere/Tavily each enforce their own limits, and the code handles `429`/`RateLimitError` gracefully (backoff on Cohere, user-facing message on Groq). Real limiting (per-user, e.g. slowapi/Redis) is a stated gap.
- **CORS:** `CORSMiddleware` with an **allow-list from `ALLOWED_ORIGINS`** env var (not `*`), `allow_credentials=True`.
- **Secrets:** all keys via env vars / `.env` (`python-dotenv`), never committed. The **service-role key lives only on the backend**. ⚠️ `SECRET_KEY` defaults to `"change-me-in-production"` if unset — flag that you'd fail-fast on that in prod.
- **Transport:** JWT in `localStorage` (XSS-exposed; a hardening step is httpOnly cookies) — be honest about this trade-off if pushed.
- **Other honest bugs to own:** `notebook_routes.list_notebooks` writes `notebook_error_log.txt` to disk on error (bad on read-only/ephemeral FS); `search_routes` echoes `str(e)` into the SSE error to the client (minor info leak).

---

## 16. PERFORMANCE OPTIMIZATIONS

- **Off-box embeddings:** Cohere API instead of a local model → **zero model RAM**, enabling the 512 MB tier. The single biggest architectural perf/cost decision.
- **Memory-safe streaming ingestion:** 50-page groups + `del` + `gc.collect()` → constant peak RAM for arbitrarily large PDFs.
- **Batch embeddings:** up to 96 texts per Cohere call (fewer round-trips); chunk inserts batched at 100 rows.
- **Async everywhere it matters:** `AsyncGroq` for streaming (chat/search) so token streaming never blocks the event loop; blocking Groq/Studio calls wrapped in **`run_in_threadpool`** so they don't stall other requests.
- **SSE + `requestAnimationFrame` batching:** server streams tokens; client coalesces them to ≤1 React render per frame.
- **Vector ANN index (pgvector) + server-side RPC:** similarity math runs in the DB; only top matches cross the wire.
- **Rerank cap:** only the top 20 candidates are reranked (when the reranker is present) to bound CPU.
- **Studio even-sampling:** for large docs, Studio features sample `limit` evenly-spaced chunks across the whole document (via `chunk_index` math) instead of the first N — better coverage *and* bounded token cost.
- **History trimming:** only the last `MAX_HISTORY_MESSAGES=8` turns are replayed to Groq → bounded token cost/latency.
- **GZip middleware** (`minimum_size=1000`) for JSON responses.
- **Doc-name caching** in the retriever to avoid N repeated lookups per query.
- **Frontend:** Zustand `persist` caches chat/notebook state in localStorage; connection pooling via the singleton Supabase client and a shared axios instance.
- ⚠️ **Not yet optimized (say so):** no Studio-artifact caching (regenerated + rebilled per click); per-request auth round-trip; the Python-side retrieval filter over-fetches 100 rows.

---

## 17. ERROR HANDLING

- **PDF/parse failure:** empty/scanned PDFs raise `ValueError("PDF contains no readable text")`; caught in `run_ingestion` → `documents.status=failed, error_msg` → UI shows the error. Temp file cleaned in `finally`.
- **Embedding failure:** Cohere calls **retry 5× with backoff** (30s×attempt on `429`, 5s on generic errors); exhaustion raises → ingestion marked `failed`.
- **LLM failure:** chat wraps generation in `try/except`; `RateLimitError` → friendly "wait 60s" SSE event; any other exception → generic error event + `done` (stream always terminates cleanly). Studio endpoints map `RateLimitError`→`429` and parse-failures→`500` with safe messages.
- **JSON parse failure:** `_parse_json` does best-effort recovery (strip code fences, regex-extract the first `{...}`/`[...]`); JSON mode makes this rare; on total failure returns an empty structure (`{"questions":[]}`) instead of crashing.
- **Timeouts:** explicit `httpx` timeouts (Cohere 120s, Tavily 20s, Drive 60s); SSE headers keep the connection alive and unbuffered.
- **Retries:** implemented for **embeddings** (Cohere). Not for Groq (fails fast to the user) — a candidate improvement.
- **DB failure:** startup `lifespan` verifies Supabase/Groq/embedder and logs warnings (doesn't hard-crash); routes wrap DB calls in `try/except` → `500` with non-leaky messages; `list_notebooks` degrades to `[]` if the table is missing.
- **Philosophy:** *never crash the worker, always give the UI a terminal state.* Errors are logged server-side; users see sanitized messages (mostly — see the two leak caveats in §15).

---

## 18. DEPLOYMENT

- **Backend:** single **Dockerfile** (`python:3.11-slim`, installs `build-essential`, `pip install -r requirements.txt`, runs `uvicorn main:app --host 0.0.0.0 --port 8000`). Deployed to **Render free tier (512 MB)** — the constraint that shaped the whole architecture.
- **Frontend:** Vite build → static SPA, deployed to a static host (Vercel/Netlify-class); talks to the API via `VITE_API_URL`.
- **Managed services:** Supabase (Postgres+pgvector, Auth, Storage), Groq, Cohere, Tavily — all external, all via env-var keys.
- **Environment variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GROQ_API_KEY`, `GROQ_VISION_MODEL`, `COHERE_API_KEY`, `TAVILY_API_KEY`, `ALLOWED_ORIGINS`, `MAX_FILE_SIZE_MB`, `SECRET_KEY`, `ENVIRONMENT`.
- **Production concerns:** cold starts (free tier spins down); single uvicorn process (limited concurrency); `BackgroundTasks` die with the process (ingestion isn't durable). No Docker Compose (managed services replace local infra).
- **Scaling (see §20):** horizontal API replicas behind a load balancer + move ingestion to a real queue/worker.

---

## 19. CHALLENGES (the hard problems & how they were solved)

1. **Ingesting a 700-page PDF in 512 MB.** Naively parsing+embedding a whole book blows the heap. **Solved** by streaming ingestion: 50-page windows, each fully processed and freed (`del`+`gc.collect()`) before the next; embeddings pushed to a hosted API so *no model weights* sit in RAM. Result: ~constant peak memory. **Lesson:** on constrained infra, *streaming + externalizing state* beats "load it all."
2. **Eliminating local model RAM.** A local embedding model (BGE/MiniLM) alone can exceed the memory budget. **Solved** by wrapping Cohere's HTTP API behind a `CohereEmbedder` class that mimics FastEmbed's `.embed()` generator interface — so callers didn't change when I swapped local→hosted. **Lesson:** program to an interface; make infra swappable.
3. **End-to-end streaming without event-loop stalls.** Groq's blocking client would freeze all concurrent requests. **Solved** with `AsyncGroq` for streams and `run_in_threadpool` for the blocking Studio/vision calls; on the client, `requestAnimationFrame` token batching for smooth rendering. **Lesson:** in async servers, one blocking call poisons everyone — offload it.
4. **Follow-up questions losing context.** "Explain that more" has no retrievable content. **Solved** by contextualizing the *retrieval query* (prepend the last message for short follow-ups) and replaying the last 8 turns to the LLM. **Lesson:** the retrieval query and the generation prompt are two different problems.
5. **Structured outputs from an 8B model.** Quizzes/flashcards must be valid JSON. **Solved** with Groq **JSON mode** + a defensive `_parse_json` fallback (fence-strip + regex-extract). **Lesson:** constrain the model *and* parse defensively.
6. **The reranker/requirements mismatch (a real lesson).** The cross-encoder was meant to boost precision, but `sentence-transformers`/`torch` aren't in `requirements.txt`, so it silently disables in prod — and torch would blow the 512 MB budget anyway. **Lesson:** heavyweight local ML contradicts the zero-RAM goal; the right fix is a hosted **Cohere Rerank** API. *(Volunteering this shows self-awareness.)*

---

## 20. SCALABILITY — "100,000 users, now what?"

Present it as a staged plan:

1. **Stateless API + load balancer:** the FastAPI app is already stateless (all state in Supabase/localStorage), so run **N uvicorn/gunicorn replicas behind a load balancer** and autoscale on CPU/RPS.
2. **Real ingestion queue (the #1 fix):** replace `BackgroundTasks` with **Redis/RabbitMQ + Celery/RQ** (or a managed queue). Upload enqueues a job; a pool of **background workers** (scaled independently) does parse→embed→store. Durable (survives restarts), retryable, backpressure-aware.
3. **Object storage at scale:** Supabase Storage → **S3/R2/GCS** with a CDN for downloads.
4. **Caching (Redis):**
   - Cache **query embeddings** and **frequent Q&A** (semantic cache) → fewer Cohere/Groq calls.
   - Cache **Studio artifacts** (quiz/summary/mindmap) keyed by `document_id` → the current "regenerate + rebill every click" problem disappears.
   - Cache **JWT verification** / verify locally to kill the per-request auth round-trip.
5. **Vector scaling:** as `chunks` grows into the millions, tune pgvector (HNSW) and read-replicas, or migrate the vector workload to **Qdrant/Pinecone** with **metadata-filtered ANN** (also fixes the recall bug by filtering *inside* the ANN query).
6. **DB scaling:** connection pooling (PgBouncer/Supabase pooler), read replicas for list/retrieval, partition `chunks` by user/time.
7. **Rate limiting & quotas:** per-user token/day limits (Redis counters) to protect the LLM budget and prevent abuse.
8. **Observability:** structured logs, tracing (OpenTelemetry), and per-stage metrics (ingest time, retrieval latency, TTFT).
9. **Cost control:** batch embeddings, semantic caching, and a smaller/cheaper model tier for Studio vs. chat.

**One-liner:** "Today it's a single container with in-process background tasks. To hit 100k users I'd make ingestion a real queued worker pool, put Redis in front for caching + rate limiting, move blobs to S3+CDN, run the API as autoscaled stateless replicas behind an LB, and revisit the vector store when ANN latency demands it."

---

## 21. INTERVIEW QUESTIONS

> Format note: I've given the **most-likely questions full 5-part treatment**, then dense rapid-fire banks to cover breadth (a real interviewer asks ~15–25 questions, not 150). Every rapid-fire answer is defensible from this codebase.

### 21A. BEGINNER (fundamentals & "what is")

**Flagship (full treatment):**

**Q1. What is RAG and why use it here?**
- *Ideal answer:* Retrieval-Augmented Generation — retrieve relevant chunks from a knowledge store, inject them into the LLM prompt, generate a grounded answer. Used here to answer questions about the user's private documents with source attribution and without exceeding the context window.
- *Expected follow-up:* Why not just fine-tune? → Fine-tuning is costly, slow to update, and doesn't cite sources; RAG updates by ingesting docs.
- *Senior follow-up:* Where can RAG still hallucinate? → If retrieval returns irrelevant chunks or the model ignores context; mitigated by thresholds, reranking, and the `/verify` step.
- *Common mistakes:* Saying RAG "prevents all hallucination" (it reduces, not eliminates); confusing RAG with fine-tuning.

**Q2. What's an embedding?**
- *Ideal:* A fixed-length vector (here 384-dim) representing text meaning, so semantically similar texts are geometrically close.
- *Follow-up:* Why 384 and not 1536? → Cheaper/faster/less storage; light model fits free tier.
- *Senior:* What's asymmetric embedding? → Different `input_type` for queries vs documents so their spaces align for retrieval.
- *Mistakes:* Thinking embeddings store the text; thinking bigger dims are always better.

**Q3. Why cosine similarity, not Euclidean?**
- *Ideal:* Cosine compares direction (meaning), is magnitude-invariant, and works well for normalized embeddings; long and short texts about the same topic still match.
- *Follow-up:* Formula? → `A·B / (‖A‖‖B‖)`.
- *Senior:* When would Euclidean/dot product differ? → Dot product favors magnitude; with normalized vectors cosine≡dot.
- *Mistakes:* Claiming they always give the same ranking.

**Rapid-fire beginner bank (Q4–Q50):**
- What does FastAPI's `Depends` do? *DI — runs `get_current_user` before the handler.*
- What is SSE? *Server→client event stream over HTTP; used for token streaming.*
- What is a chunk? *A slice of a document (2500 chars) that is embedded and retrieved.*
- Why chunk at all? *Docs exceed context windows; smaller units retrieve more precisely.*
- What is `top_k`? *How many chunks to keep for the prompt (5).*
- What's pgvector? *Postgres extension storing vectors + doing similarity search.*
- What's a JWT? *Signed token proving identity; sent as a Bearer header.*
- Where are passwords stored? *In Supabase Auth (bcrypt); the app never sees them.*
- What is CORS and how is it configured? *Cross-origin policy; allow-list from `ALLOWED_ORIGINS`.*
- What's the `documents.status` field for? *processing/ready/failed lifecycle for UI polling.*
- Why UUID filenames? *Avoid collisions + filename injection.*
- What does `run_ingestion` do? *Parse→chunk→embed→store in the background.*
- Why `202 Accepted` on upload? *Work is deferred to a background task.*
- What is Zustand? *Lightweight React state store.*
- How does the frontend know ingestion finished? *Polls `/documents/{id}/status`.*
- What is `temperature`? *Randomness knob; 0.2 for faithful chat.*
- What is `max_tokens`? *Cap on generated length (1024 for chat).*
- What's the vector dimension and why must it match? *384; the column is `vector(384)` and the index expects it.*
- What is a system prompt vs user prompt? *System sets rules/context; user is the question.*
- What's the difference between streaming and non-streaming responses? *TTFT vs wait-for-all.*
- What does GZip middleware do? *Compresses responses >1KB.*
- What's `X-Accel-Buffering: no`? *Tells the proxy not to buffer the SSE stream.*
- What DB stores the raw PDF? *Supabase Storage (object store), not the DB table.*
- What is `chunk_index`? *Preserves chunk order within a document.*
- What is `num_chunks`? *Count of stored chunks; set when ingestion completes.*
- What library extracts PDF text? *PyMuPDF (fitz).*
- How are Office files parsed? *python-docx/pptx, openpyxl+pandas, csv module.*
- What is Groq? *Fast LLM inference provider running Llama models.*
- What is Cohere used for? *Embeddings.*
- What is Tavily used for? *Live web search.*
- What is a notebook here? *A workspace grouping documents.*
- Why filter every query by `user_id`? *Data isolation between users.*
- What happens on a 401? *Interceptor clears storage and redirects to login.*
- What is `react-markdown` for? *Rendering the LLM's Markdown answer.*
- What triggers the source badges? *The `sources` SSE event.*
- What are suggestions? *3 LLM-generated follow-up questions.*
- What's the health endpoint? *`GET /health` returns status/version.*
- What does `lifespan` do? *Startup checks for Supabase/Groq/embedder.*
- Why `.env`? *Keep secrets out of code.*
- What is uvicorn? *ASGI server running FastAPI.*
- What is Vite? *Frontend build tool/dev server.*
- What's the max file size? *20 MB.*
- Which file types are allowed? *pdf/txt/md/csv/docx/pptx/xlsx/xls.*
- How is a YouTube video ingested? *Fetch transcript → chunk → embed → store.*
- How are images handled? *Sent to a Groq vision model for analysis.*
- What is the reranker supposed to do? *Re-score top candidates for precision.*
- Where is the RAG core code? *`ingest.py`, `retriever.py`, `llm.py`, `database.py`.*

### 21B. INTERMEDIATE (design & mechanics)

**Flagship:**

**Q1. Walk me through what happens from upload to a queryable document.**
- *Ideal:* (the §3 Phase A+B flow) validate → store → insert row → background parse/chunk/embed/store → mark ready.
- *Follow-up:* Why background? → Don't block the HTTP response for a multi-minute job.
- *Senior:* What breaks if the process restarts mid-ingest? → `BackgroundTasks` is lost; doc stuck `processing`. Fix: durable queue.
- *Mistakes:* Forgetting the status lifecycle / thinking upload does the embedding synchronously.

**Q2. How do you keep RAM under 512 MB for huge PDFs?**
- *Ideal:* 50-page streaming windows, free each group (`del`+`gc.collect()`), embeddings off-box via API.
- *Follow-up:* Why not embed all chunks then insert? → Peak memory scales with doc size.
- *Senior:* What's still risky? → A single 50-page group of dense text; you'd tune group size or cap chunk batch.
- *Mistakes:* Claiming `gc.collect()` alone fixes it without the windowing.

**Q3. How does retrieval filtering by document/notebook work, and what's wrong with it?**
- *Ideal:* Over-fetch 100 candidates from `match_chunks`, then filter by `document_ids`/notebook in Python, rerank, top-5.
- *Follow-up:* Why over-fetch? → Post-filtering can discard most global matches.
- *Senior:* Why is this a recall bug? → If the relevant chunks aren't in the global top-100, filtering can't recover them; the fix is to push the filter *into* the SQL RPC so ANN runs within the filtered set.
- *Mistakes:* Not recognizing the recall problem; claiming pgvector can't filter (it can, in the RPC).

**Q4. Why SSE over WebSockets, and how is it implemented?**
- *Ideal:* One-way streaming; `StreamingResponse` + `text/event-stream` + unbuffered headers; typed `data:` frames; client reads `ReadableStream`.
- *Follow-up:* How do you prevent proxy buffering? → `X-Accel-Buffering: no`.
- *Senior:* How do you cancel a stream? → `AbortSignal` on the fetch.
- *Mistakes:* Saying WebSockets are "always better"; forgetting buffering.

**Rapid-fire intermediate bank:**
- Why `AsyncGroq` for chat but sync `Groq`+threadpool for Studio? *Streaming must not block the loop; blocking calls are offloaded.*
- What's `input_type` and why does it matter? *Asymmetric doc/query embedding for better retrieval.*
- Why `search_query` for the question? *Aligns with `search_document` chunk space.*
- How are follow-up questions contextualized? *Prepend last message to the retrieval query for short questions.*
- Why replay only 8 history messages? *Bounded token cost/latency.*
- How does Studio sample large docs? *Evenly-spaced `chunk_index` sampling, not first-N.*
- How do you force valid JSON from the LLM? *JSON mode + defensive `_parse_json`.*
- What does `/verify` do? *LLM-as-judge cross-checks claims vs sources → score+verdict.*
- Why batch embeddings at 96? *Cohere's per-call max; fewer round-trips.*
- How are Cohere 429s handled? *Retry with escalating backoff (30s×attempt).*
- Why cache doc names in the retriever? *Avoid N repeated DB lookups per query.*
- How is the query embedded vs stored chunks? *Same model, different `input_type`.*
- What's the similarity threshold and its effect? *0.10 — effectively no filter; weak chunks pass.*
- How is auth enforced server-side? *`get_current_user` validates JWT via Supabase per request.*
- Why service-role key + app-level ownership checks? *Bypass RLS; enforce `user_id` in code.*
- How does the frontend attach the token? *axios interceptor + manual header for fetch/SSE.*
- What happens to sources in the response? *Grouped by document, streamed as a `sources` event.*
- How are quizzes graded client-side robust to LLM inconsistency? *Answer extraction normalized (see recent commit).*
- What's the web-search pipeline? *LLM rewrites query → Tavily → build context → stream hybrid answer with inline citations.*
- How is a research report generated? *LLM outlines 4–6 sections → writes each section streamed.*
- What's a known weakness of the research report? *Every section gets the same `context[:6000]` → repetition; fix = per-section retrieval.*
- How is Google Drive ingestion done? *Export/download via Drive API → store → run_ingestion.*
- How is a YouTube transcript chunked? *Grouped into ~CHUNK_SIZE timestamped blocks.*
- Why store `user_id` on chunks too? *Cheap per-user filtering without a JOIN.*
- What indexes matter most? *The pgvector ANN index on `chunks.embedding`.*
- How would you add citations inline? *Post-process spans → chunk offsets, or ask the model to cite `[SOURCE]` ids.*
- What's the cold-start issue? *Free tier spins down; first request is slow.*
- Why Markdown answers? *Readable formatting; rendered by react-markdown+gfm.*
- How is CORS locked down? *Allow-list env var, not `*`.*
- What's GZip's `minimum_size` for? *Don't waste CPU compressing tiny payloads.*
- How do you prevent one bad request from crashing ingestion? *try/except → mark `failed`, never raise out.*
- Why `finally: os.unlink`? *Always clean the temp file.*
- What's the difference between `documents` and `chunks`? *Metadata/lifecycle vs retrieval units+vectors.*
- How would you support non-English docs? *Multilingual embedding model + translation.*
- How does the client render tokens smoothly? *rAF-batched buffer flush.*
- What is `partialize` in the chat store? *Persist only selected slices to localStorage.*

### 21C. SENIOR (trade-offs, failure modes, scale)

**Flagship:**

**Q1. Your notebook-scoped retrieval over-fetches 100 then filters in Python. Diagnose and fix.**
- *Ideal:* It's a recall bug — ANN runs globally, so relevant in-scope chunks outside the global top-100 are unrecoverable. Fix: add `document_ids`/`notebook_id` params to `match_chunks` and filter *inside* the SQL before/within the ANN, using a partial/filtered index or `WHERE` + ANN.
- *Follow-up:* Why not just raise the candidate count to 1000? → Latency + still probabilistic; doesn't scale.
- *Senior follow-up:* Trade-offs of filtered ANN in pgvector? → Pre-filtering can hurt HNSW recall; may need IVFFlat with filtering or a dedicated engine with native metadata filtering.
- *Mistakes:* "Just increase match_count"; not realizing the filter belongs in the DB.

**Q2. The cross-encoder reranker isn't in `requirements.txt`. What's the impact and correct design?**
- *Ideal:* In prod the import fails → `reranker=None` → no reranking; only raw cosine ordering reaches the prompt, lowering precision. And shipping torch would exceed 512 MB anyway. Correct: use a hosted **Cohere Rerank** API (zero local RAM, consistent with the architecture).
- *Follow-up:* How would you detect this silently-disabled feature? → Startup assertion/health metric on reranker presence.
- *Senior:* When is reranking worth the latency/cost? → When first-stage recall is high but precision is low; measure nDCG before committing.
- *Mistakes:* Not knowing it's disabled; adding torch to a 512 MB box.

**Q3. Per-request `supabase.auth.get_user(token)` — what's the cost and how do you remove it?**
- *Ideal:* A network round-trip to Supabase on *every* protected request → added latency + a hard dependency on Auth availability. Fix: verify the JWT **locally** with the project's JWT secret (signature + `exp` + `aud`), only calling Auth on refresh.
- *Follow-up:* Risk of local verification? → You lose instant revocation; mitigate with short token TTL + refresh.
- *Senior:* How to keep revocation? → Short-lived access tokens + a revocation cache in Redis.
- *Mistakes:* Caching the whole user object indefinitely; ignoring token expiry.

**Q4. Ingestion uses FastAPI BackgroundTasks. Why is that a scaling/reliability problem?**
- *Ideal:* In-process, non-durable, tied to request lifecycle — a restart/deploy/crash loses jobs; no retries, no backpressure, competes for the API's CPU/RAM. Fix: external queue (Redis/RabbitMQ) + dedicated worker pool, idempotent jobs, retry/backoff, dead-letter queue.
- *Follow-up:* How to make jobs idempotent? → Key on `document_id`; upsert chunks; guard re-runs by status.
- *Senior:* How to give users progress? → Worker writes progress to `documents` (e.g., % pages), UI subscribes.
- *Mistakes:* Thinking BackgroundTasks == Celery.

**Q5. Where can this system still hallucinate, end to end?**
- *Ideal:* (a) retrieval miss (threshold 0.10 lets weak chunks in / recall bug drops good ones); (b) the prompt *encourages* inference and *discourages* disclaimers; (c) 8B model reasoning limits; (d) reranker off. Mitigations: raise/auto-tune threshold, fix filtered retrieval, add hosted rerank, keep `/verify`, consider a stronger model for hard queries.
- *Follow-up:* How would you measure hallucination? → Faithfulness eval (RAGAS-style) with an LLM judge over a labeled set.
- *Senior:* Retrieval precision vs. answer faithfulness — which first? → Fix retrieval first; a faithful answer over wrong context is still wrong.
- *Mistakes:* Only tuning the prompt; no eval harness.

**Rapid-fire senior bank:**
- How do you load-test TTFT and retrieval latency? *k6/Locust hitting `/ask/stream`; measure first-token + P95.*
- How would you cache Studio artifacts? *Redis keyed by `document_id`+type; invalidate on re-ingest.*
- Semantic caching for Q&A? *Embed the query; if cosine≈existing cached Q above τ, reuse the answer.*
- How to enforce per-user LLM budgets? *Redis token counters + 429 on exceed.*
- HNSW vs IVFFlat in pgvector? *HNSW: better recall/latency, more memory/build cost; IVFFlat: cheaper, needs `lists` tuning; filtering interacts with both.*
- When migrate off pgvector? *When ANN P95 or metadata-filtered recall degrades at scale.*
- How to shard chunks? *By `user_id`/tenant or time; partitioned tables + routing.*
- Multi-tenant isolation hardening? *Enable RLS as defense-in-depth alongside app checks.*
- How to make embeddings provider-agnostic? *The `CohereEmbedder` interface already abstracts it; add a factory + config.*
- Prompt-injection defense at scale? *Content/instruction separation, allow-listed tools, output verification, injection classifiers.*
- Observability plan? *OTel traces per stage (embed/RPC/LLM), structured logs, RED metrics.*
- Cost model per query? *1 embed call + 1 vector query + N generation tokens + optional suggestion call; cache to cut it.*
- How to A/B chunking strategies? *Golden Q/A set + retrieval precision\@k + faithfulness; ship behind a flag.*
- Blue/green or canary for prompt changes? *Version prompts; canary a % of traffic; watch faithfulness metrics.*
- Backpressure when Groq rate-limits globally? *Queue + token-bucket + graceful degraded responses.*
- Disaster recovery for vectors? *Vectors are derived — re-ingest from raw files in Storage; back up Postgres too.*
- Why is `str(e)` in the SSE error a problem? *Info leak; return a generic message, log details server-side.*
- The `notebook_error_log.txt` write — what's wrong? *Writes to ephemeral/read-only FS, not thread-safe, not observable; use the logger.*
- How to verify local JWTs but keep revocation? *Short TTL + refresh + Redis revocation list.*
- How would you add streaming to Studio? *Same SSE pattern; stream section-by-section (research report already does).*
- Idempotency for re-uploads of the same file? *Content hash → dedupe documents/chunks.*
- How to bound Cohere monthly quota? *Cache embeddings, dedupe chunks, batch, and alert on usage.*
- What's your first three production fixes? *(1) filtered retrieval in SQL, (2) durable queue, (3) hosted rerank + higher threshold.*

---

## 22. RESUME VALIDATION

For each likely bullet, here's the supporting code + how to defend it + the risk.

| Resume claim | Supported by | How to defend | Risk / caveat |
|---|---|---|---|
| "Built an end-to-end RAG application" | `ingest.py`+`retriever.py`+`llm.py` + pgvector | Walk the full §3 flow | ✅ Solid. |
| "Streamed LLM responses via SSE" | `llm.py` `StreamingResponse`, `chatStore.js` reader | Explain events + rAF batching + `X-Accel-Buffering` | ✅ Solid. |
| "Used pgvector for semantic search" | `match_chunks` RPC, `vector(384)` | Cosine + ANN index + RPC | ✅ Solid (index DDL is in Supabase, say so). |
| "Optimized to run in 512 MB" | 50-page streaming + off-box embeddings | §7/§19 memory story | ✅ Strong differentiator. |
| "Reranked retrieval with a cross-encoder" | `retriever.py` CrossEncoder | Explain intent | ⚠️ **Disabled in prod** (dep missing). Say "implemented; found it violates the RAM budget, so I'd move to hosted Cohere Rerank." Turn it into a *lesson*, don't overclaim. |
| "Multi-format ingestion (PDF/DOCX/PPTX/XLSX/CSV/YouTube/images)" | `ingest.py`, `media_routes.py` | Enumerate parsers + vision + transcript | ✅ Solid. |
| "JWT authentication & protected routes" | `auth_middleware.py`, `ProtectedRoute.jsx` | Supabase-issued JWT + `Depends` | ⚠️ Don't claim *you built* JWT/refresh; say "delegated to Supabase Auth." |
| "Hallucination mitigation / citation verification" | `/verify`, sources events, low temp | LLM-as-judge + source badges | ⚠️ Prompt *encourages* inference; be ready to discuss the trade-off. |
| "Web search integration" | `search_routes.py` (Tavily) | Query-rewrite → Tavily → hybrid answer | ⚠️ Say **Tavily**, not DuckDuckGo. |
| "Async background processing" | `BackgroundTasks` | Explain 202 + polling | ⚠️ Not a durable queue — call it "in-process background tasks," name the upgrade. |
| "Vector DB / Pinecone" | ❌ | — | 🚫 **Don't claim** a dedicated vector DB — it's pgvector. |
| "MongoDB / microservices / Kubernetes / Redis" | ❌ | — | 🚫 **Don't claim** — not in the codebase. |

**Golden rule:** every claim above the ⚠️ line is bulletproof; for the ⚠️ ones, *volunteer the nuance* — it reads as senior self-awareness. Never claim anything with 🚫.

---

## 23. WHITEBOARD PREP (simple enough to draw)

**A. High-level architecture**
```
[React SPA] --JWT--> [FastAPI] --> [Supabase: Postgres+pgvector | Auth | Storage]
     |                   |-------> [Cohere embed]  [Groq LLM]  [Tavily]
   (SSE tokens) <--------|
```

**B. RAG pipeline**
```
INGEST:  file -> parse(PyMuPDF) -> split(2500/200) -> embed(Cohere 384) -> chunks(pgvector)
QUERY:   question -> embed -> match_chunks(cosine, top25) -> filter -> rerank? -> top5
         -> prompt(context+sources) -> Groq stream -> answer + sources + suggestions
```

**C. Database**
```
notebooks(id, user_id, title, emoji) 
    |1
    |*
documents(id, user_id, notebook_id?, original_name, status, storage_path, num_chunks)
    |1
    |*
chunks(id, document_id, user_id, content, embedding vector(384), chunk_index)
        ^ ANN index (cosine) powers match_chunks()
Storage bucket "documents" holds raw files.
```

**D. Authentication**
```
Browser --signup/login--> Supabase Auth (GoTrue) --JWT--> Browser(localStorage)
Browser --Bearer JWT--> FastAPI --get_user(token)--> Supabase --> user | 401
ProtectedRoute guards UI; axios 401 interceptor -> /login
```

**E. Deployment**
```
[Static host: Vite SPA]        [Render: Docker uvicorn FastAPI]
        \___ VITE_API_URL ___________/
                     |--> Supabase (DB+Auth+Storage)
                     |--> Groq / Cohere / Tavily (env-var keys)
```

**F. Streaming flow**
```
Client fetch('/ask/stream') --> FastAPI StreamingResponse(text/event-stream)
Server: yield data:{token}...{sources}{suggestions}{done}
Client: ReadableStream reader -> parse 'data:' -> buffer -> rAF flush -> render
Headers: Cache-Control:no-cache, X-Accel-Buffering:no, keep-alive
```

---

## 24. DESIGN DECISIONS (why / alternatives / trade-offs / would-I-again)

1. **pgvector, not a dedicated vector DB.** *Why:* one managed store for metadata+vectors, free, simpler. *Alt:* Pinecone/Qdrant/Weaviate. *Trade-off:* weaker ANN + metadata-filtering at massive scale. *Again?* **Yes** at this scale; migrate when ANN latency/filtered-recall bites.
2. **Hosted embeddings (Cohere), not local.** *Why:* zero RAM → 512 MB tier. *Alt:* FastEmbed/BGE local. *Trade-off:* network latency, monthly quota, English-only light model. *Again?* **Yes**, given the memory constraint; add a provider-agnostic factory.
3. **Groq Llama 3.1 8B.** *Why:* latency + free tier. *Alt:* GPT-4o-mini/Haiku. *Trade-off:* weaker reasoning, strict TPM. *Again?* **Yes** for cost/speed; route hard queries to a stronger model.
4. **Supabase (BaaS).** *Why:* DB+Auth+Storage in one, fast to ship. *Alt:* self-host Postgres + Auth0 + S3. *Trade-off:* vendor lock-in, per-request auth round-trip, service-role key power. *Again?* **Yes** for a solo/portfolio build.
5. **SSE, not WebSockets.** *Why:* one-way streaming, simpler over HTTP. *Alt:* WS. *Trade-off:* no client→server mid-stream. *Again?* **Yes.**
6. **`BackgroundTasks`, not a queue.** *Why:* zero extra infra for a free-tier MVP. *Alt:* Celery/RQ+Redis. *Trade-off:* not durable/retryable/scalable. *Again?* **No** for production — this is the first thing I'd change.
7. **2500/200 chunking.** *Why:* fewer, richer, cheaper chunks. *Alt:* 800–1200 token-aware/semantic. *Trade-off:* larger chunks dilute embeddings → lower precision. *Again?* **I'd re-measure** — likely go smaller + token-aware.
8. **Python-side retrieval filtering.** *Why:* fastest path without touching the DB function. *Alt:* filter inside `match_chunks`. *Trade-off:* recall bug + over-fetch. *Again?* **No** — push it into SQL.
9. **Cross-encoder reranker (local).** *Why:* precision boost. *Alt:* Cohere Rerank API. *Trade-off:* torch breaks the RAM budget → silently disabled. *Again?* **No** — hosted rerank.
10. **App-level ownership vs RLS.** *Why:* service role + explicit `user_id` filters are simple and centralized. *Alt:* Postgres RLS. *Trade-off:* one missed filter = a leak. *Again?* **Add RLS** as defense-in-depth.
11. **localStorage JWT.** *Why:* trivial with the SPA + SSE. *Alt:* httpOnly cookies. *Trade-off:* XSS exposure. *Again?* **Cookies** for a security-sensitive product.
12. **Prompt that discourages disclaimers.** *Why:* less hedgy, better UX. *Alt:* strict "only answer from context." *Trade-off:* higher hallucination risk. *Again?* **Keep, but pair with `/verify` and a real retrieval threshold.**

---

## 25. FINAL INTERVIEW CHEAT SHEET (the 5-page condensed guide)

### Page 1 — The 60-second story + stack
NEXUS = NotebookLM-style RAG. **React 19 SPA → FastAPI → Supabase (Postgres+pgvector, Auth, Storage)**; **Cohere** embeddings (384-dim, hosted), **Groq Llama 3.1 8B** generation streamed over **SSE**; **Tavily** web search; **Groq vision** for images. Studio = quiz/flashcards/summary/mindmap/research dossier. **Engineered for a 512 MB free tier.** No Mongo, no Pinecone, no Redis, no WebSockets, no OpenAI — *own this.*

### Page 2 — The RAG pipeline (draw it)
Ingest: `parse(PyMuPDF) → split(2500/200) → embed(Cohere) → store(pgvector)`, **50-page streaming windows + gc** for memory safety.
Query: `embed(search_query) → match_chunks(cosine, 25) → filter → rerank? → top-5 → grounded prompt → Groq stream → answer + sources + suggestions`.
Numbers to memorize: **384 dims, cosine, chunk 2500/overlap 200, top_k 5, threshold 0.10, history 8, page-group 50, batch 96/100.**

### Page 3 — The engineering decisions that impress
- **Off-box embeddings + streaming ingestion** = a real RAG app in 512 MB (headline).
- **SSE + rAF-batched rendering** = smooth sub-second TTFT.
- **Async discipline:** `AsyncGroq` for streams, `run_in_threadpool` for blocking calls — one blocking call poisons an async server.
- **JSON mode + defensive parsing** for structured Studio outputs.
- **LLM-as-judge `/verify`** for hallucination scoring.
- **One Postgres for metadata+vectors** (pgvector) — one source of truth.

### Page 4 — Own your weaknesses (this is what separates senior candidates)
1. **Filtered retrieval recall bug** — filter in Python after global top-100; fix = push filter into `match_chunks` SQL.
2. **Reranker silently disabled** (dep missing + torch too heavy) — fix = hosted Cohere Rerank.
3. **`BackgroundTasks` not durable** — fix = Redis/Celery worker pool.
4. **Threshold 0.10 ≈ no filter**; **prompt encourages inference** — tune + rely on `/verify`.
5. **Per-request auth round-trip** — verify JWT locally.
6. **No Studio caching / rate limiting** — Redis.
> Volunteering these = instant credibility. Never bluff the 🚫 items in §22.

### Page 5 — Scale to 100k + the questions they'll actually ask
**Scale:** stateless API replicas + LB → **durable ingestion queue + workers** → Redis (semantic cache, artifact cache, rate limits, local JWT) → S3+CDN → tune/migrate the vector store → observability + per-user budgets.
**Top 8 questions to rehearse cold:**
1. "Walk me through a query end-to-end." (§3C)
2. "How does this fit in 512 MB?" (§7/§19)
3. "Where does it still hallucinate?" (senior Q5)
4. "Your notebook filter — recall problem?" (senior Q1)
5. "Why pgvector over Pinecone?" (§11)
6. "SSE vs WebSockets?" (§13)
7. "How would you make ingestion production-grade?" (senior Q4)
8. "What would you change today?" → *filtered retrieval in SQL, durable queue, hosted rerank + real threshold.*

**Closing line for the interview:** *"It's a fully working RAG product I shipped on free tiers under hard memory limits — and I can tell you exactly where the bodies are buried and how I'd productionize each one."* That sentence wins interviews.

---

*Prepared from a direct reading of the NEXUS repository. Every architectural claim traces to actual code in `backend/` and `frontend/src/`. The ⚠️/🚫 flags exist so you never get caught overclaiming — an interviewer respects "here's the limitation and the fix" far more than a rehearsed happy path.*
