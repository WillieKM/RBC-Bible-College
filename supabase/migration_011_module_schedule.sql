-- Adds scheduled module delivery: each module can have a release_days value
-- (days after enrollment) and notifications are tracked to avoid re-sending.
-- Run after migration_010_student_number.sql.

alter table courses
  add column if not exists release_days integer;

create table if not exists module_notifications (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (course_id, student_id)
);

alter table module_notifications enable row level security;

create policy "module_notifications_admin_all" on module_notifications
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
