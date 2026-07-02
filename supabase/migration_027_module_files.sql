-- Uploadable module PDFs that professors can email to students by program tier.
create table if not exists module_files (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  file_url    text not null,
  file_name   text not null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table module_files enable row level security;

-- Admins can do everything
create policy "module_files_admin_all" on module_files
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Professors and students can read (to display files and pick modules to send)
create policy "module_files_auth_select" on module_files
  for select using (auth.uid() is not null);

-- Public bucket: objects are readable via stable public URL without any auth,
-- so email links work without the recipient needing a login session.
-- Writes go through the service-role admin client only (no storage policy needed).
insert into storage.buckets (id, name, public)
values ('module-files', 'module-files', true)
on conflict (id) do nothing;
