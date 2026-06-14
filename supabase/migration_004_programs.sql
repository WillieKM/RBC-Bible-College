-- Adds a programs table and links students (profiles) and modules (courses) to a program.
-- Run this in the Supabase SQL editor after migration_003_full_applications.sql.

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  program_level text not null default 'diploma' check (program_level in ('diploma', 'degree')),
  created_at timestamptz not null default now()
);

alter table profiles
  add column if not exists program_id uuid references programs(id) on delete set null;

alter table courses
  add column if not exists program_id uuid references programs(id) on delete set null;

alter table programs enable row level security;

create policy "programs_select_auth" on programs
  for select using (auth.uid() is not null);

create policy "programs_admin_write" on programs
  for all using (current_role_name() = 'admin');

-- Seed the programs offered across both application forms.
insert into programs (name, program_level) values
  ('Certificate', 'diploma'),
  ('Diploma', 'diploma'),
  ('Bachelor of Theology (B.Th.)', 'degree'),
  ('Bachelor of Divinity (B.Div.)', 'degree'),
  ('Bachelor of Religious Education (B.R.E.)', 'degree'),
  ('Master of Theology (M.Th.)', 'degree'),
  ('Master of Divinity (M.Div.)', 'degree'),
  ('Master of Arts in Christian Ministry', 'degree'),
  ('Doctor of Theology (Th.D.)', 'degree'),
  ('Doctor of Divinity (D.Div.)', 'degree'),
  ('Doctor of Ministry (D.Min.)', 'degree')
on conflict (name) do nothing;
