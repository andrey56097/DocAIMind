# DocAIMind — CLAUDE.md

## Project Overview
DocAIMind is a vanilla TypeScript SPA that lets users upload PDFs and ask questions about their content using AI (OpenAI embeddings + GPT). Built with Vite, Supabase (PostgreSQL + pgvector), and Deno edge functions.

## Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — Type-check and build for production
- `npm run preview` — Preview production build
- `npx tsc --noEmit` — TypeScript type check only

## Project Structure
```
src/
├── handlers/        # Event handlers (upload, delete, ask)
├── services/        # API clients + business logic (supabase, openai, documents, pdf)
├── ui/              # DOM rendering
├── config.ts        # Env-based configuration
├── types.ts         # Shared TS interfaces
├── state.ts         # Global app state
├── dom.ts           # DOM element references
├── embeddings.ts    # Embedding utilities
├── handlers_init.ts # Shared init helper
└── main.ts          # Entry point
supabase/
├── migrations/      # SQL migrations (pgvector, tables, RLS)
├── functions/       # Deno edge functions
└── config.toml
```

## Workflow Rules
- When new features are added, **update README.md** to reflect the changes
- Keep README.md accurate: feature list, project structure, architecture, and setup instructions
- Run `npx tsc --noEmit` after any code changes
- Environment variables come from `.env` (gitignored), documented in `.env.production.example`
- When I type **"commit"**, stage all changes, prepare a commit with a descriptive English message summarizing the changes, show me the summary, and ask for confirmation before committing and pushing.

## Supabase

### Site URL (local + production)
Keep **Site URL** = `https://doc-ai-mind.vercel.app` in Supabase Dashboard → Authentication → Settings.  
Add `http://localhost:5173` to **Additional redirect URLs** — then both work without manual switching.

## Local Supabase Setup

### Applying a new migration
```bash
cat supabase/migrations/<file>.sql | docker exec -i supabase_db_DocMind psql -U postgres -d postgres
```

**Always include in the migration:**
1. `GRANT ALL ON public.<table_name> TO authenticated;` — never `anon` (that key is client-side)
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` + `USING (auth.uid() = user_id)` policy

## Code Style
- TypeScript, strict mode
- Single-responsibility files under handlers/, services/, ui/
- Imports use full relative paths (e.g., `../services/supabase`)
- No frameworks — vanilla TS only
