-- Adds program-level and region tracking, plus declaration acceptance, to applications.
-- Run this in the Supabase SQL editor after migration.sql.

alter table applications
  add column if not exists program_level text not null default 'diploma'
    check (program_level in ('diploma', 'degree'));

alter table applications
  add column if not exists region text
    check (region in ('usa', 'international'));

alter table applications
  add column if not exists declaration_accepted boolean not null default false;
