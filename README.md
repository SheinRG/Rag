# Nexus — Document Intelligence Platform

An AI-powered research assistant that lets you upload documents (PDF, DOCX, PPTX, XLSX, TXT, Markdown, YouTube links, images) and have intelligent conversations with them. Built with a RAG (Retrieval-Augmented Generation) pipeline for grounded, cited answers.

## ✨ Features

- **Multi-Source Chat** — Select multiple documents and ask questions across all of them simultaneously
- **Smart Retrieval** — pgvector cosine similarity search with cross-encoder reranking
- **Studio Tools** — Quick Summaries, Flashcards, Mind Maps, Quizzes, and Research Dossiers
- **Notebook Organization** — Group documents into notebooks for focused research
- **Web Search** — Integrated Tavily-powered web search alongside your documents
- **Key Topics** — Auto-extracted study guide with progress tracking
- **Notes** — Create and manage personal notes per notebook
- **Google Drive Integration** — Import documents directly from Google Drive
- **Real-time Streaming** — SSE-based token streaming for instant AI responses

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS 4, Framer Motion, Zustand |
| Backend | FastAPI, Python 3.11, Groq (Llama 3.1) |
| Database | Supabase (PostgreSQL + pgvector + Auth + Storage) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Reranker | cross-encoder/ms-marco-MiniLM-L-6-v2 |
| Search | Tavily AI Search API |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Supabase project (with pgvector enabled)
- Groq API key

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

## 📁 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app assembly
│   ├── config.py            # Environment config
│   ├── llm.py               # Groq streaming pipeline
│   ├── retriever.py         # pgvector search + reranking
│   ├── ingest.py            # Document processing pipeline
│   ├── auth_middleware.py   # JWT verification
│   ├── routes/              # API route handlers
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # Landing, Login, Dashboard, Notebooks
│   │   ├── components/      # Chat, Documents, Studio, UI
│   │   ├── store/           # Zustand state management
│   │   └── api/             # Axios + SSE client
│   ├── nginx.conf           # SPA routing config
│   └── Dockerfile
└── docker-compose.yml
```

## 🔒 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for required configuration.

## 📄 License

MIT
