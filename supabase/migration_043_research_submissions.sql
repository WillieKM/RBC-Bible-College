-- Research & dissertation uploads for Master's and Doctorate scholars.
-- Run this in the Supabase SQL editor after migration_042_seed_library.sql.
--
-- Files live in the existing private "submissions" bucket under
-- research/<student_id>/... and are served through short-lived signed URLs.
-- Accessed only via the service-role admin client (server actions check who is
-- the student, their professors, or an admin), so no RLS policies are needed.
create table if not exists research_submissions (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references profiles(id) on delete cascade,
  title            text not null,
  kind             text not null default 'draft'
                     check (kind in ('proposal', 'chapter', 'draft', 'final', 'other')),
  note             text,
  file_path        text not null,
  file_name        text not null,
  status           text not null default 'submitted'
                     check (status in ('submitted', 'received', 'needs_changes', 'approved')),
  reviewer_comment text,
  reviewed_by      uuid references profiles(id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists research_submissions_student_idx
  on research_submissions (student_id, created_at desc);

alter table research_submissions enable row level security;
-- No policies: only the service-role key (admin client) can read/write this table.
