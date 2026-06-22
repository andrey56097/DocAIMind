-- Grant permissions to anon and service_role for local development
grant usage on schema public to anon, service_role;
grant all on all tables in schema public to anon, service_role;
grant all on all sequences in schema public to anon, service_role;
