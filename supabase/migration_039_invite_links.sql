-- Permanent invite link tokens.
-- The id (UUID) is the token embedded in /auth/invite?t=<id>.
-- Accessed only via the service-role admin client, so no RLS policies needed.
create table if not exists invite_links (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  full_name  text not null default '',
  role       text not null default 'student',
  created_at timestamptz not null default now()
);

alter table invite_links enable row level security;
-- No policies: only service-role key (admin client) can read/write this table.
