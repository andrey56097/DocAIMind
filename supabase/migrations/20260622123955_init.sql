-- Enable pgvector extension in public schema
create extension if not exists vector;

-- Documents table
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_path text not null,
  file_size integer not null default 0,
  created_at timestamptz not null default now()
);

-- Chunks table with embeddings
create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index for vector similarity search
create index on public.chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Enable RLS
alter table public.documents enable row level security;
alter table public.chunks enable row level security;

-- Allow anon key to read/write (for development)
create policy "Allow all on documents"
  on public.documents for all
  using (true)
  with check (true);

create policy "Allow all on chunks"
  on public.chunks for all
  using (true)
  with check (true);
