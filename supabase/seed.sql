-- Seed data for development
-- This runs when you do 'supabase db reset'

-- Verify extensions
select * from pg_extension where extname = 'vector';

-- Verify tables
select * from information_schema.tables
where table_schema = 'public'
  and table_name in ('documents', 'chunks');
