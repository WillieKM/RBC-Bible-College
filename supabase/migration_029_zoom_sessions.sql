-- Zoom session links that can be scheduled once or sent on a recurring
-- schedule to students in a specific program.
create table if not exists zoom_sessions (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  zoom_url     text not null,
  description  text,
  program_id   uuid references programs(id) on delete cascade,
  -- 'none' = one-off, 'weekly' = every N days matching day_of_week
  recurrence   text not null default 'none'
                 check (recurrence in ('none', 'weekly', 'biweekly', 'monthly')),
  -- For 'none': exact UTC datetime to send.
  -- For recurring: used as a reference; the cron checks day_of_week (weekly/biweekly)
  -- or day-of-month (monthly) and fires at 07:00 on matching days.
  send_at      timestamptz,
  -- 0=Sunday … 6=Saturday. Used for weekly/biweekly recurrence only.
  day_of_week  smallint,
  -- Updated after each successful send so the cron knows when it last fired.
  last_sent_at timestamptz,
  -- Set to false to pause without deleting.
  active       boolean not null default true,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table zoom_sessions enable row level security;

create policy "zoom_sessions_admin_all" on zoom_sessions
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "zoom_sessions_auth_select" on zoom_sessions
  for select using (auth.uid() is not null);
