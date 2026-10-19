-- Fix infinite recursion between RLS policies on courses and enrollments.
-- Run this in the Supabase SQL editor after migration_044_assignment_approved_by.sql.
--
-- courses_student_select checks enrollments, and enrollments_professor_select
-- checks courses, so evaluating either as a student or professor recursed and
-- Postgres raised "infinite recursion detected in policy". Every table whose
-- policy subqueries courses/enrollments (assignments, submissions, attendance,
-- course_materials, course_discussions) failed the same way, so user-scoped
-- queries returned nothing. These SECURITY DEFINER helpers do the lookups
-- without re-entering RLS, breaking the cycle. Admin rules are unchanged.

begin;

create or replace function public.is_enrolled_in(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enrollments where course_id = p_course_id and student_id = auth.uid()
  );
$$;

create or replace function public.teaches_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from courses where id = p_course_id and professor_id = auth.uid()
  );
$$;

create or replace function public.teaches_assignment(p_assignment_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from assignments a join courses c on c.id = a.course_id
    where a.id = p_assignment_id and c.professor_id = auth.uid()
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- courses
drop policy if exists "courses_student_select" on courses;
create policy "courses_student_select" on courses
  for select using (is_enrolled_in(id));

-- enrollments
drop policy if exists "enrollments_professor_select" on enrollments;
create policy "enrollments_professor_select" on enrollments
  for select using (teaches_course(course_id));

-- assignments
drop policy if exists "assignments_student_select" on assignments;
create policy "assignments_student_select" on assignments
  for select using (is_enrolled_in(course_id));

drop policy if exists "assignments_professor_all" on assignments;
create policy "assignments_professor_all" on assignments
  for all using (teaches_course(course_id)) with check (teaches_course(course_id));

-- submissions
drop policy if exists "submissions_professor_select" on submissions;
create policy "submissions_professor_select" on submissions
  for select using (teaches_assignment(assignment_id));

drop policy if exists "submissions_professor_update" on submissions;
create policy "submissions_professor_update" on submissions
  for update using (teaches_assignment(assignment_id));

-- attendance
drop policy if exists "Professor manage attendance" on attendance;
create policy "Professor manage attendance" on attendance
  for all using (teaches_course(course_id) or is_admin())
  with check (teaches_course(course_id) or is_admin());

-- course_materials
drop policy if exists "Enrolled student read materials" on course_materials;
create policy "Enrolled student read materials" on course_materials
  for select using (is_enrolled_in(course_id));

drop policy if exists "Professor manage materials" on course_materials;
create policy "Professor manage materials" on course_materials
  for all using (teaches_course(course_id) or is_admin())
  with check (teaches_course(course_id) or is_admin());

-- course_discussions
drop policy if exists "Enrolled users and professor can read discussions" on course_discussions;
create policy "Enrolled users and professor can read discussions" on course_discussions
  for select using (is_enrolled_in(course_id) or teaches_course(course_id) or is_admin());

drop policy if exists "Enrolled users and professor can post discussions" on course_discussions;
create policy "Enrolled users and professor can post discussions" on course_discussions
  for insert with check (
    author_id = auth.uid() and (is_enrolled_in(course_id) or teaches_course(course_id) or is_admin())
  );

-- payment_proofs: students could submit proofs but not see their own.
drop policy if exists "Students can view own proofs" on payment_proofs;
create policy "Students can view own proofs" on payment_proofs
  for select using (student_id = auth.uid());

commit;
