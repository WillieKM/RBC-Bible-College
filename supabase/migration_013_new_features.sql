-- Payment status and completion tracking on profiles
alter table profiles add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'partial', 'paid'));
alter table profiles add column if not exists completed_at timestamptz;

-- ─── Announcements ────────────────────────────────────────────────────────────
create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  author_id   uuid references profiles(id) on delete set null,
  target      text not null default 'all' check (target in ('all', 'students', 'professors')),
  created_at  timestamptz not null default now()
);
alter table announcements enable row level security;

create policy "Admin full access on announcements" on announcements
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Authenticated users read announcements" on announcements
  for select using (auth.uid() is not null);

-- ─── Course materials ─────────────────────────────────────────────────────────
create table if not exists course_materials (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  title       text not null,
  type        text not null default 'link' check (type in ('link', 'note', 'file')),
  url         text,
  body        text,
  file_url    text,
  created_at  timestamptz not null default now()
);
alter table course_materials enable row level security;

create policy "Professor manage materials" on course_materials
  for all using (
    exists (select 1 from courses where id = course_id and professor_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Enrolled student read materials" on course_materials
  for select using (
    exists (select 1 from enrollments where course_id = course_materials.course_id and student_id = auth.uid())
  );

-- ─── Attendance ───────────────────────────────────────────────────────────────
create table if not exists attendance (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  session_date  date not null,
  present       boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  unique (course_id, student_id, session_date)
);
alter table attendance enable row level security;

create policy "Professor manage attendance" on attendance
  for all using (
    exists (select 1 from courses where id = course_id and professor_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Student read own attendance" on attendance
  for select using (student_id = auth.uid());
