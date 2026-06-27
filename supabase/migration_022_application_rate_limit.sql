-- Throttle abuse of the public, unauthenticated application form (each
-- submission triggers a storage upload and several outbound emails).
create table if not exists application_attempts (
  id         uuid primary key default gen_random_uuid(),
  ip         text not null,
  created_at timestamptz not null default now()
);
create index if not exists application_attempts_ip_created_at_idx on application_attempts (ip, created_at);

-- RLS enabled with no policies: only the service-role client (server-side
-- only) can read or write this table.
alter table application_attempts enable row level security;
