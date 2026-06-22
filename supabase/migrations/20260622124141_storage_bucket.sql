-- Create storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Allow public access to read/write files in documents bucket
create policy "Allow all on documents bucket"
  on storage.objects for all
  using (bucket_id = 'documents')
  with check (bucket_id = 'documents');
