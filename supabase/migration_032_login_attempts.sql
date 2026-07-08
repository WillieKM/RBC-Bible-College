-- Track failed login attempts per IP for brute-force protection.
-- Service role bypasses RLS so the admin client can insert/query;
-- no other role can access this table directly.

create table if not exists login_attempts (
  id         uuid        primary key default gen_random_uuid(),
  ip         text        not null,
  email      text,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_ip_idx on login_attempts (ip, created_at);

alter table login_attempts enable row level security;
-- No explicit policies → all access denied for authenticated/anon roles;
-- service_role key bypasses RLS automatically.
