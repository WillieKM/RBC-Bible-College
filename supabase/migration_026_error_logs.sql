-- Captures uncaught server-side errors (Server Components, Route Handlers,
-- Server Actions, proxy) via instrumentation.ts's onRequestError hook, so
-- crashes don't go unnoticed until someone happens to spot bad data.
create table if not exists error_logs (
  id              uuid primary key default gen_random_uuid(),
  message         text not null,
  digest          text,
  route_path      text,
  route_type      text,
  request_path    text,
  request_method  text,
  created_at      timestamptz not null default now()
);

alter table error_logs enable row level security;
-- RLS enabled with no policies: only the service-role client (server-side
-- only) can read or write this table.
