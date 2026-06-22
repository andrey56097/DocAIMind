<div align="center">
  <h1>🧠 DocAIMind</h1>
  <p><strong>AI-powered knowledge base — upload PDFs and ask questions in natural language</strong></p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite"/>
    <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase"/>
    <img src="https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white" alt="OpenAI"/>
    <img src="https://img.shields.io/badge/Deno-000000?style=flat&logo=deno&logoColor=white" alt="Deno"/>
    <img src="https://img.shields.io/badge/pgvector-336791?style=flat&logo=postgresql&logoColor=white" alt="pgvector"/>
  </p>
</div>

---

## Overview

**DocAIMind** is a single-page application that lets you upload PDF documents and ask questions about their content using AI. The app extracts text from uploaded PDFs, splits it into semantic chunks, generates vector embeddings, and stores everything in a PostgreSQL database with pgvector. When you ask a question, it finds the most relevant chunks via similarity search and answers using GPT — citing the sources.

### How it works

```
Upload PDF  →  Extract text  →  Split into chunks
                                      ↓
                              Generate embeddings (OpenAI)
                                      ↓
                              Store in Supabase (pgvector)

Ask question  →  Embed question  →  Similarity search  →  GPT answer + sources
```

---

## Tech Stack

| Technology | Role |
|---|---|
| **TypeScript** | Full type safety across the entire codebase |
| **Vite** | Fast bundler and dev server |
| **Supabase** | PostgreSQL database, storage, REST API, and edge functions |
| **pgvector** | Vector similarity search inside PostgreSQL |
| **OpenAI** | `text-embedding-3-small` for embeddings, `gpt-4o-mini` for answering |
| **pdfjs-dist** | PDF text extraction in the browser |
| **Deno** | Runtime for Supabase edge functions |

---

## Project Structure

```
docmind/
├── .env                          # Local environment variables (gitignored)
├── .env.production.example       # Production env template with instructions
├── .gitignore
├── .prettierrc
├── .vscode/
│   ├── extensions.json           # Recommended extensions
│   └── settings.json             # Deno config for edge functions
├── index.html                    # Entry HTML
├── package.json
├── tsconfig.json
├── public/
│   ├── fonts/                    # JetBrains Mono & Sans
│   └── style.css                 # Dark-theme styles (~840 lines)
├── src/
│   ├── main.ts                   # Entry point
│   ├── config.ts                 # Environment configuration
│   ├── types.ts                  # Shared TypeScript interfaces
│   ├── state.ts                  # Global application state
│   ├── dom.ts                    # DOM element references
│   ├── embeddings.ts             # Embedding utilities + cosine similarity
│   ├── handlers_init.ts          # Shared initialization (fetch & render docs)
│   ├── handlers/
│   │   ├── index.ts              # Event listener wiring
│   │   ├── upload.ts             # File upload handler
│   │   ├── delete.ts             # Document deletion handlers
│   │   └── ask.ts                # Question-answering handler
│   ├── services/
│   │   ├── supabase.ts           # Supabase REST client
│   │   ├── openai.ts             # OpenAI embedding + chat client
│   │   ├── documents.ts          # Document CRUD + vector search
│   │   └── pdf.ts                # PDF text extraction
│   └── ui/
│       └── index.ts              # UI rendering (documents, messages, progress)
└── supabase/
    ├── config.toml               # Edge function configuration
    ├── seed.sql                  # Verification queries
    ├── migrations/               # Database migrations (pgvector, tables, RLS)
    └── functions/
        ├── process-document/     # Edge function: process uploaded document
        └── ask-question/         # Edge function: search chunks & answer
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project ([local](https://supabase.com/docs/guides/local-development) or [cloud](https://supabase.com/dashboard))
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Local development

```bash
# 1. Clone the repository
git clone https://github.com/your-username/docmind.git
cd docmind

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.production.example .env
# Edit .env with your Supabase and OpenAI credentials

# 4. Run Supabase locally (optional)
supabase start

# 5. Start the dev server
npm run dev

# 6. Open http://localhost:5173
```

### Database migrations

If you're connecting to a fresh Supabase project, apply the migrations:

```bash
supabase migration up
```

---

## Features

- **📄 PDF upload** — drag-and-drop or select files (up to 10 MB)
- **⚡ Automatic chunking & embedding** — text is split into semantic chunks, embedded via OpenAI, and stored with pgvector
- **🔍 Semantic search** — questions are matched against document chunks using cosine similarity
- **🤖 AI answers** — GPT-4o-mini answers with source citations
- **💰 Cost tracking** — per-question token usage and cost display
- **📱 Responsive** — works on desktop and mobile

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |

---

## Architecture

### Client-side architecture

DocAIMind is a **vanilla TypeScript SPA** — no React, Vue, or other framework. The code is organised into three layers:

- **Handlers** — event-driven logic (upload, delete, ask)
- **Services** — API clients (Supabase, OpenAI) and business logic (document CRUD, PDF extraction)
- **UI** — pure rendering functions that read from state and write to the DOM

### Vector search flow

1. User uploads a PDF → text is extracted client-side via `pdfjs-dist`
2. Text is chunked (~800 characters at sentence boundaries)
3. Each chunk gets an embedding via OpenAI `text-embedding-3-small`
4. Embeddings are stored in the `chunks` table with a pgvector column
5. At query time, the question is embedded and cosine similarity is computed in-memory
6. Top 5 chunks are sent as context to `gpt-4o-mini` for answer generation

### Security

- No hardcoded credentials — everything comes from environment variables
- Supabase Row-Level Security (RLS) protects data at the database level
- The `.env` file is gitignored and never committed
- Anon keys are public-by-design (Supabase RLS enforces actual security)

---

## License

MIT
