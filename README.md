# Nexus — Document Intelligence Platform

[![CI](https://github.com/SheinRG/Rag/actions/workflows/ci.yml/badge.svg)](https://github.com/SheinRG/Rag/actions/workflows/ci.yml)

An AI-powered research assistant that lets you upload documents (PDF, DOCX, PPTX, XLSX, TXT, Markdown, YouTube links, images) and have intelligent conversations with them. Built with a RAG (Retrieval-Augmented Generation) pipeline for grounded, cited answers.

## ✨ Features

- **Multi-Source Chat** — Select multiple documents and ask questions across all of them simultaneously
- **Smart Retrieval** — pgvector cosine similarity search with cross-encoder reranking
- **Studio Tools** — Quick Summaries, Flashcards, Mind Maps, Quizzes, and Research Dossiers
- **Notebook Organization** Group documents into notebooks for focused research
- **Web Search** — Integrated Tavily-powered web search alongside your documents
- **Key Topics** — Auto-extracted study guide with progress tracking
- **Notes** — Create and manage personal notes per notebook
- **Google Drive Integration** — Import documents directly from Google Drive
- **Real-time Streaming** — SSE-based token streaming for instant AI responses

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS 4, Framer Motion, Zustand |
| Backend | FastAPI, Python 3.11, Groq (openai/gpt-oss-20b) |
| Database | Supabase (PostgreSQL + pgvector + Auth + Storage) |
| Embeddings | Cohere `embed-english-light-v3.0` (384-dim) |
| Reranker | Cohere Rerank `rerank-v3.5` |
| Search | Tavily AI Search API |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Supabase project (with pgvector enabled)
- Groq API key (chat completions)
- Cohere API key (embeddings + reranking)
- Tavily API key (optional — web search)

### Database

Run the migrations in `backend/migrations/` **in numeric order** in the Supabase
SQL Editor. `000_initial_schema.sql` creates `documents`, `chunks`, the
`vector(384)` column, the HNSW index, and the `match_chunks()` RPC that
retrieval calls — nothing works without it.

```
000_initial_schema.sql   tables, indexes, match_chunks() with scope filtering
001_create_notebooks.sql notebooks table + documents.notebook_id
002_enable_rls.sql       row-level security on documents and chunks
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env    # Fill in your keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # Fill in your keys
npm run dev
```

### Docker (Production)

```bash
docker-compose up --build
```

## 🧪 Tests

```bash
cd backend
pip install -r requirements-dev.txt
ruff check .
pytest
```

Every external service is stubbed, so the suite needs no credentials and cannot
reach a live Supabase, Cohere, or Groq endpoint. The frontend is checked with
`npm run lint` and `npm run build`. CI runs all four on every push and PR.

## 📊 Retrieval evaluation

Most bad RAG answers are bad-*context* problems, so retrieval is scored
directly rather than judged through the model:

```bash
cd backend
cp evals/golden_set.example.jsonl evals/golden_set.jsonl   # add your own cases
python -m evals.run_eval --user-id <your-user-uuid> -k 5 --compare-rerank
```

Reports hit rate@k, document recall@k, MRR@k, a keyword-coverage groundedness
proxy, and p50/p95 latency — and with `--compare-rerank`, the measured lift the
Cohere reranker buys over raw vector order. `--fail-under 0.8` exits non-zero on
a regression so it can gate a deploy. See
[`backend/evals/README.md`](backend/evals/README.md) for how to read a run.

## 📁 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app assembly
│   ├── config.py            # Environment config
│   ├── llm.py               # Groq streaming pipeline
│   ├── database.py          # Supabase client, embeddings, Cohere rerank
│   ├── retriever.py         # pgvector search + reranking
│   ├── ingest.py            # Document processing pipeline
│   ├── auth_middleware.py   # JWT verification
│   ├── rate_limit.py        # Per-user request throttling
│   ├── models/              # Pydantic request/response schemas
│   ├── utils/               # File handling helpers
│   ├── migrations/          # SQL migrations (schema, notebooks, RLS)
│   ├── routes/              # API route handlers
│   ├── evals/               # Retrieval evaluation harness
│   ├── tests/               # pytest suite (all externals stubbed)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # Landing, Login, Dashboard, Notebooks
│   │   ├── components/      # Chat, Documents, Studio, UI
│   │   ├── store/           # Zustand state management
│   │   └── api/             # Axios + SSE client
│   ├── nginx.conf           # SPA routing config
│   └── Dockerfile
├── .github/workflows/ci.yml # Lint + tests for both halves
└── docker-compose.yml
```

## 🔒 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for required configuration.

## 📄 License

MIT

