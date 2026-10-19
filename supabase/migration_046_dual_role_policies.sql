-- Let dual-access users (secondary_role) count as professors in RLS, matching
-- requireRole() in the app. Run after migration_045_fix_rls_recursion.sql.
-- Optional today: the app reads/writes zoom_attendance with the service role,
-- so this only matters for future user-scoped queries.

begin;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and (role in ('admin', 'professor') or secondary_role = 'professor')
  );
$$;

drop policy if exists "zoom_attendance_staff_all" on zoom_attendance;
create policy "zoom_attendance_staff_all" on zoom_attendance
  for all using (is_staff()) with check (is_staff());

commit;
