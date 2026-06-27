-- Replace the coarse 'degree' program level with explicit bachelors/masters/
-- doctorate tiers so tuition fees can be set per tier instead of one flat
-- "degree" rate.

-- 1. Drop the old check constraints so existing 'degree' rows can be updated.
alter table programs drop constraint if exists programs_program_level_check;
alter table applications drop constraint if exists applications_program_level_check;

-- 2. Reclassify the seeded TBCS programs by name.
update programs set program_level = 'bachelors' where name in (
  'Bachelor of Theology (B.Th.)', 'Bachelor of Divinity (B.Div.)', 'Bachelor of Religious Education (B.R.E.)'
);
update programs set program_level = 'masters' where name in (
  'Master of Theology (M.Th.)', 'Master of Divinity (M.Div.)', 'Master of Arts in Christian Ministry'
);
update programs set program_level = 'doctorate' where name in (
  'Doctor of Theology (Th.D.)', 'Doctor of Divinity (D.Div.)', 'Doctor of Ministry (D.Min.)'
);
-- Anything else still marked 'degree' (e.g. a custom program added later) defaults to bachelors.
update programs set program_level = 'bachelors' where program_level = 'degree';

update applications set program_level = 'bachelors' where program in (
  'Bachelor of Theology (B.Th.)', 'Bachelor of Divinity (B.Div.)', 'Bachelor of Religious Education (B.R.E.)'
);
update applications set program_level = 'masters' where program in (
  'Master of Theology (M.Th.)', 'Master of Divinity (M.Div.)', 'Master of Arts in Christian Ministry'
);
update applications set program_level = 'doctorate' where program in (
  'Doctor of Theology (Th.D.)', 'Doctor of Divinity (D.Div.)', 'Doctor of Ministry (D.Min.)'
);
update applications set program_level = 'bachelors' where program_level = 'degree';

-- 3. Re-add the constraints with the new allowed tiers.
alter table programs add constraint programs_program_level_check
  check (program_level in ('diploma', 'bachelors', 'masters', 'doctorate'));
alter table applications add constraint applications_program_level_check
  check (program_level in ('diploma', 'bachelors', 'masters', 'doctorate'));
