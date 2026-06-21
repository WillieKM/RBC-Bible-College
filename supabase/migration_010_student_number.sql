-- Adds an auto-assigned student ID, set when an application is approved.
-- Run this in the Supabase SQL editor after migration_009_application_photo.sql.

alter table profiles
  add column if not exists student_number text unique;



cHZNxfhC89n6u7kZyzOIlwLEn6BwikgOvEA2Jw+0oRY=