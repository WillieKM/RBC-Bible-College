-- Lets applicants upload a passport-style photo with their application.
-- Run this in the Supabase SQL editor after migration_008_module_prerequisites.sql.

alter table applications
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('application-photos', 'application-photos', true)
on conflict (id) do nothing;

create policy "application_photos_public_insert" on storage.objects
  for insert with check (bucket_id = 'application-photos');
