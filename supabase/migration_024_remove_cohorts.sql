-- Cohorts/terms went unused — dropping the feature entirely along with its
-- columns. Safe to run even though it was never populated.
alter table courses drop column if exists cohort_id;
alter table applications drop column if exists cohort_id;
drop table if exists cohorts;
