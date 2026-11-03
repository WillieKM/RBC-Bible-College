-- Autosaved drafts of a scholar's written "Response" to an assignment.
-- Run this in the Supabase SQL editor after migration_048_staff_room_attachments.sql.
--
-- One draft per scholar per assignment; cleared when they submit. Accessed only
-- via the service-role admin client (the app checks enrollment), so no RLS policies.
create table if not exists assignment_drafts (
  student_id    uuid not null references profiles(id) on delete cascade,
  assignment_id uuid not null references assignments(id) on delete cascade,
  content       text not null default '',
  updated_at    timestamptz not null default now(),
  primary key (student_id, assignment_id)
);

alter table assignment_drafts enable row level security;
-- No policies: only the service-role key (admin client) can read/write this table.
