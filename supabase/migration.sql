-- Bible School Admin — initial schema + RLS policies
-- Run this in the Supabase SQL editor.

-- ─── profiles ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin', 'professor', 'student')),
  created_at timestamptz not null default now()
);

-- ─── cohorts ─────────────────────────────────────────────────────────────
create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

-- ─── applications ────────────────────────────────────────────────────────
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  program text not null,
  statement text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  cohort_id uuid references cohorts(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ─── courses ─────────────────────────────────────────────────────────────
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id) on delete set null,
  title text not null,
  code text,
  professor_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── enrollments ─────────────────────────────────────────────────────────
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (course_id, student_id)
);

-- ─── assignments ─────────────────────────────────────────────────────────
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  points_possible numeric,
  created_at timestamptz not null default now()
);

-- ─── submissions ─────────────────────────────────────────────────────────
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  content text,
  file_url text,
  submitted_at timestamptz not null default now(),
  grade numeric,
  feedback text,
  graded_at timestamptz,
  graded_by uuid references profiles(id) on delete set null,
  unique (assignment_id, student_id)
);

-- ─── helper: current user's role ────────────────────────────────────────
create or replace function current_role_name()
returns text
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid();
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table cohorts enable row level security;
alter table applications enable row level security;
alter table courses enable row level security;
alter table enrollments enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;

-- profiles: users can read their own profile; admins can read/write all
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid() or current_role_name() = 'admin');

create policy "profiles_admin_all" on profiles
  for all using (current_role_name() = 'admin');

-- cohorts: any authenticated user can read; only admins write
create policy "cohorts_select_auth" on cohorts
  for select using (auth.uid() is not null);

create policy "cohorts_admin_write" on cohorts
  for all using (current_role_name() = 'admin');

-- applications: anyone (incl. anon) can insert; only admins can read/update
create policy "applications_insert_anon" on applications
  for insert with check (true);

create policy "applications_admin_all" on applications
  for select using (current_role_name() = 'admin');

create policy "applications_admin_update" on applications
  for update using (current_role_name() = 'admin');

-- courses: admins full access; professors read their own courses; students read courses they're enrolled in
create policy "courses_admin_all" on courses
  for all using (current_role_name() = 'admin');

create policy "courses_professor_select" on courses
  for select using (professor_id = auth.uid());

create policy "courses_student_select" on courses
  for select using (
    exists (
      select 1 from enrollments e
      where e.course_id = courses.id and e.student_id = auth.uid()
    )
  );

-- enrollments: admins full access; students can read their own; professors can read enrollments for their courses
create policy "enrollments_admin_all" on enrollments
  for all using (current_role_name() = 'admin');

create policy "enrollments_student_select" on enrollments
  for select using (student_id = auth.uid());

create policy "enrollments_professor_select" on enrollments
  for select using (
    exists (
      select 1 from courses c
      where c.id = enrollments.course_id and c.professor_id = auth.uid()
    )
  );

-- assignments: admins full access; professors manage assignments for their courses; students read assignments for enrolled courses
create policy "assignments_admin_all" on assignments
  for all using (current_role_name() = 'admin');

create policy "assignments_professor_all" on assignments
  for all using (
    exists (
      select 1 from courses c
      where c.id = assignments.course_id and c.professor_id = auth.uid()
    )
  );

create policy "assignments_student_select" on assignments
  for select using (
    exists (
      select 1 from enrollments e
      where e.course_id = assignments.course_id and e.student_id = auth.uid()
    )
  );

-- submissions: admins full access; students manage their own; professors can read/grade submissions for their courses
create policy "submissions_admin_all" on submissions
  for all using (current_role_name() = 'admin');

create policy "submissions_student_own" on submissions
  for all using (student_id = auth.uid());

create policy "submissions_professor_select" on submissions
  for select using (
    exists (
      select 1 from assignments a
      join courses c on c.id = a.course_id
      where a.id = submissions.assignment_id and c.professor_id = auth.uid()
    )
  );

create policy "submissions_professor_update" on submissions
  for update using (
    exists (
      select 1 from assignments a
      join courses c on c.id = a.course_id
      where a.id = submissions.assignment_id and c.professor_id = auth.uid()
    )
  );

-- ─── storage bucket for assignment files ──────────────────────────────────
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

create policy "submissions_storage_student_insert" on storage.objects
  for insert with check (
    bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "submissions_storage_student_select" on storage.objects
  for select using (
    bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "submissions_storage_professor_select" on storage.objects
  for select using (
    bucket_id = 'submissions' and current_role_name() in ('professor', 'admin')
  );
