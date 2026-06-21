-- ─── Course discussions ───────────────────────────────────────────────────────
create table if not exists course_discussions (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  parent_id   uuid references course_discussions(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
alter table course_discussions enable row level security;
create policy "Enrolled users and professor can read discussions" on course_discussions
  for select using (
    exists (select 1 from enrollments where course_id = course_discussions.course_id and student_id = auth.uid())
    or exists (select 1 from courses where id = course_discussions.course_id and professor_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Enrolled users and professor can post discussions" on course_discussions
  for insert with check (
    author_id = auth.uid() and (
      exists (select 1 from enrollments where course_id = course_discussions.course_id and student_id = auth.uid())
      or exists (select 1 from courses where id = course_discussions.course_id and professor_id = auth.uid())
      or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    )
  );
create policy "Author or admin can delete discussion" on course_discussions
  for delete using (
    author_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─── Notifications ────────────────────────────────────────────────────────────
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  body        text,
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table notifications enable row level security;
create policy "User manages own notifications" on notifications
  for all using (user_id = auth.uid());
create policy "Admin insert notifications" on notifications
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','professor'))
  );

-- ─── Calendar events ──────────────────────────────────────────────────────────
create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  event_date   date not null,
  end_date     date,
  type         text not null default 'other'
                 check (type in ('holiday','exam','assignment','class','other')),
  author_id    uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
alter table events enable row level security;
create policy "Admin manage events" on events
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Authenticated read events" on events
  for select using (auth.uid() is not null);

-- ─── Handbook pages ───────────────────────────────────────────────────────────
create table if not exists handbook_pages (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table handbook_pages enable row level security;
create policy "Admin manage handbook" on handbook_pages
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Authenticated read handbook" on handbook_pages
  for select using (auth.uid() is not null);

-- ─── Audit log ────────────────────────────────────────────────────────────────
create table if not exists audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references profiles(id) on delete set null,
  actor_name   text not null,
  action       text not null,
  target_type  text,
  target_id    text,
  details      jsonb,
  created_at   timestamptz not null default now()
);
alter table audit_logs enable row level security;
create policy "Admin read audit logs" on audit_logs
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Service role insert audit logs" on audit_logs
  for insert with check (true);
