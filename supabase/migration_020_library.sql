-- Library resource centre (admin-managed, all roles can read)

create table if not exists library_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text,
  category text not null default 'General',
  author_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table library_resources enable row level security;

-- All authenticated users can read
create policy "library_read" on library_resources
  for select to authenticated using (true);

-- Admins manage via service role (createAdminClient bypasses RLS — no insert/update/delete policy needed)
