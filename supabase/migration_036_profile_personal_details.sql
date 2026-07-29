-- Add personal detail fields to profiles so directly-invited students
-- can complete their record without going through the application form.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth       date,
  ADD COLUMN IF NOT EXISTS gender              text,
  ADD COLUMN IF NOT EXISTS nationality         text,
  ADD COLUMN IF NOT EXISTS city_of_residence   text,
  ADD COLUMN IF NOT EXISTS occupation          text,
  ADD COLUMN IF NOT EXISTS highest_education   text,
  ADD COLUMN IF NOT EXISTS marital_status      text,
  ADD COLUMN IF NOT EXISTS statement           text;
