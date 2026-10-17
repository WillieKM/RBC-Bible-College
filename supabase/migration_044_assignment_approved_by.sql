-- Professor approval badge on assignments (added in code on 2026-09-30, but the
-- column was only described in a commit message, never added as a migration).
-- Without it, creating an assignment from Admin → Courses fails and students
-- get "not found" when opening an assignment. Safe to run more than once.
alter table assignments
  add column if not exists approved_by uuid references profiles(id) on delete set null;
