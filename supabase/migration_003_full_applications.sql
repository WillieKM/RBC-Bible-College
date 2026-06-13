-- Expands applications to support the full RBCI-USA and RBCI-KE/TBCS application forms.
-- Run this in the Supabase SQL editor after migration_002_degree_applications.sql.

alter table applications
  add column if not exists details jsonb not null default '{}'::jsonb;
