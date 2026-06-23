-- User AI usage tracking
-- Each row stores cumulative AI usage stats per user.

create table public.user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_tokens integer not null default 0,
  total_cost numeric(12,9) not null default 0,
  question_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Grant access to authenticated role (not anon!)
grant all on public.user_usage to authenticated;

-- Enable RLS
alter table public.user_usage enable row level security;

-- Single unified policy — users manage their own row
create policy "Users manage own usage"
  on public.user_usage for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
