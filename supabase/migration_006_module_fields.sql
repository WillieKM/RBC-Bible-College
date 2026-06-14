-- Adds description and credit-hours fields to courses (modules).
-- Run this in the Supabase SQL editor after migration_005_program_professor.sql.

alter table courses
  add column if not exists description text;

alter table courses
  add column if not exists credits numeric;

create unique index if not exists courses_code_key on courses (code) where code is not null;
