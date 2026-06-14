-- Lets a module require another module to be completed first (e.g. Dissertation requires
-- the program's coursework modules to be finished).
-- Run this in the Supabase SQL editor after migration_007_seed_curriculum.sql.

alter table courses
  add column if not exists prerequisite_id uuid references courses(id) on delete set null;

-- Mark the capstone modules as requiring the last coursework module in each program.
update courses set prerequisite_id = (select id from courses where code = 'DBS-030')
  where code = 'DBS-THESIS';

update courses set prerequisite_id = (select id from courses where code = 'ThB-045')
  where code = 'ThB-DISSERTATION';

update courses set prerequisite_id = (select id from courses where code = 'MTh-052')
  where code = 'MTh-DISSERTATION';
