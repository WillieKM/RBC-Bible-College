-- Remove programs not offered by RBC. Any students enrolled in these will
-- need to be reassigned manually before running this migration.
-- SAFE CHECK: uncomment the SELECT first to verify no students are affected.

-- SELECT p.name, COUNT(pr.id) AS students
-- FROM programs p
-- LEFT JOIN profiles pr ON pr.program_id = p.id AND pr.role = 'student'
-- WHERE p.name IN (
--   'Bachelor of Divinity (B.Div.)',
--   'Bachelor of Religious Education (B.R.E.)',
--   'Doctor of Ministry (D.Min.)',
--   'Doctor of Theology (Th.D.)',
--   'Master of Arts in Christian Ministry',
--   'Master of Divinity (M.Div.)'
-- )
-- GROUP BY p.name;

DELETE FROM programs WHERE name IN (
  'Bachelor of Divinity (B.Div.)',
  'Bachelor of Religious Education (B.R.E.)',
  'Doctor of Ministry (D.Min.)',
  'Doctor of Theology (Th.D.)',
  'Master of Arts in Christian Ministry',
  'Master of Divinity (M.Div.)'
);

-- Rename the generic program names to their proper full names
UPDATE programs SET name = 'Certificate in Biblical Studies'
  WHERE name = 'Certificate';

UPDATE programs SET name = 'Diploma in Christian Ministry'
  WHERE name = 'Diploma';

-- Ensure the Doctorate in Divinity exists (may not have been seeded)
INSERT INTO programs (name, program_level)
  SELECT 'Doctor of Divinity (D.Div.)', 'doctorate'
  WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = 'Doctor of Divinity (D.Div.)');
