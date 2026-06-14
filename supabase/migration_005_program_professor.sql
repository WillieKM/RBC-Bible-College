-- Lets each program have an assigned professor, who is notified of new applications to that program.
-- Run this in the Supabase SQL editor after migration_004_programs.sql.

alter table programs
  add column if not exists professor_id uuid references profiles(id) on delete set null;
