-- Attendance records for Zoom sessions. Recurring sessions produce one
-- row per student per session_date, so history is kept across occurrences.
create table if not exists zoom_attendance (
  id               uuid primary key default gen_random_uuid(),
  zoom_session_id  uuid not null references zoom_sessions(id) on delete cascade,
  student_id       uuid not null references profiles(id) on delete cascade,
  session_date     date not null default current_date,
  present          boolean not null default false,
  recorded_by      uuid references profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (zoom_session_id, student_id, session_date)
);

alter table zoom_attendance enable row level security;

-- Admins and professors can record and view attendance.
create policy "zoom_attendance_staff_all" on zoom_attendance
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'professor'))
  );
