-- Seed academic calendar for 2026 and 2027
-- 3-term system: Term 1 Jan–Apr, Term 2 May–Aug, Term 3 Sep–Dec
-- Includes Christian holidays, Kenyan public holidays, and US public holidays.
-- Admin can add/edit/delete any event from /admin/calendar.

INSERT INTO events (title, description, event_date, end_date, type) VALUES

-- ════════════════════════════════════════
-- TERM 1 2026  (January – April)
-- ════════════════════════════════════════
('Term 1 2026 — Registration Week',
 'New students register; returning students confirm enrolment and fees.',
 '2026-01-05', '2026-01-09', 'other'),

('Term 1 2026 — Classes Begin',
 'First day of lectures and module access for Term 1.',
 '2026-01-12', NULL, 'class'),

('Term 1 2026 — Assignment Submission Deadline',
 'Mid-term assignments due. Submit via the student portal.',
 '2026-02-27', NULL, 'assignment'),

('Good Friday',
 'Public holiday — no classes or live sessions.',
 '2026-04-03', NULL, 'holiday'),

('Easter Monday',
 'Public holiday — no classes or live sessions.',
 '2026-04-06', NULL, 'holiday'),

('Term 1 2026 — Exam & Final Submission Week',
 'End-of-term exams and final assignment submissions due.',
 '2026-04-20', '2026-04-24', 'exam'),

('Term 1 2026 — Ends',
 'Last day of Term 1. Results published within 2 weeks.',
 '2026-04-24', NULL, 'other'),

-- ════════════════════════════════════════
-- TERM 2 2026  (May – August)
-- ════════════════════════════════════════
('Labour Day',
 'Public holiday — Kenya & international observance. No classes.',
 '2026-05-01', NULL, 'holiday'),

('Term 2 2026 — Registration Week',
 'Registration and fee payment for Term 2.',
 '2026-05-04', '2026-05-08', 'other'),

('Term 2 2026 — Classes Begin',
 'First day of lectures and module access for Term 2.',
 '2026-05-11', NULL, 'class'),

('Madaraka Day',
 'Kenya public holiday — no classes.',
 '2026-06-01', NULL, 'holiday'),

('Term 2 2026 — Assignment Submission Deadline',
 'Mid-term assignments due. Submit via the student portal.',
 '2026-06-26', NULL, 'assignment'),

('US Independence Day',
 'US public holiday.',
 '2026-07-04', NULL, 'holiday'),

('Term 2 2026 — Exam & Final Submission Week',
 'End-of-term exams and final assignment submissions due.',
 '2026-08-17', '2026-08-21', 'exam'),

('Term 2 2026 — Ends',
 'Last day of Term 2. Results published within 2 weeks.',
 '2026-08-21', NULL, 'other'),

-- ════════════════════════════════════════
-- TERM 3 2026  (September – December)
-- ════════════════════════════════════════
('Term 3 2026 — Registration Week',
 'Registration and fee payment for Term 3.',
 '2026-09-07', '2026-09-11', 'other'),

('Term 3 2026 — Classes Begin',
 'First day of lectures and module access for Term 3.',
 '2026-09-14', NULL, 'class'),

('Term 3 2026 — Assignment Submission Deadline',
 'Mid-term assignments due. Submit via the student portal.',
 '2026-11-06', NULL, 'assignment'),

('Mashujaa Day',
 'Kenya public holiday — no classes.',
 '2026-10-20', NULL, 'holiday'),

('US Thanksgiving',
 'US public holiday.',
 '2026-11-26', NULL, 'holiday'),

('Term 3 2026 — Exam & Final Submission Week',
 'End-of-term exams and final assignment submissions due.',
 '2026-12-07', '2026-12-11', 'exam'),

('Jamhuri Day',
 'Kenya public holiday — no classes.',
 '2026-12-12', NULL, 'holiday'),

('Term 3 2026 — Ends',
 'Last day of Term 3. Results published within 2 weeks.',
 '2026-12-11', NULL, 'other'),

('Christmas Break Begins',
 'No classes from this date through the New Year.',
 '2026-12-14', '2026-12-31', 'holiday'),

('Christmas Day',
 'Public holiday.',
 '2026-12-25', NULL, 'holiday'),

('Boxing Day',
 'Public holiday.',
 '2026-12-26', NULL, 'holiday'),

-- ════════════════════════════════════════
-- TERM 1 2027  (January – April)
-- ════════════════════════════════════════
('New Year''s Day 2027',
 'Public holiday.',
 '2027-01-01', NULL, 'holiday'),

('Term 1 2027 — Registration Week',
 'New students register; returning students confirm enrolment and fees.',
 '2027-01-11', '2027-01-15', 'other'),

('Term 1 2027 — Classes Begin',
 'First day of lectures and module access for Term 1.',
 '2027-01-18', NULL, 'class'),

('Term 1 2027 — Assignment Submission Deadline',
 'Mid-term assignments due. Submit via the student portal.',
 '2027-02-26', NULL, 'assignment'),

('Good Friday',
 'Public holiday — no classes or live sessions.',
 '2027-03-26', NULL, 'holiday'),

('Easter Monday',
 'Public holiday — no classes or live sessions.',
 '2027-03-29', NULL, 'holiday'),

('Term 1 2027 — Exam & Final Submission Week',
 'End-of-term exams and final assignment submissions due.',
 '2027-04-19', '2027-04-23', 'exam'),

('Term 1 2027 — Ends',
 'Last day of Term 1. Results published within 2 weeks.',
 '2027-04-23', NULL, 'other'),

-- ════════════════════════════════════════
-- TERM 2 2027  (May – August)
-- ════════════════════════════════════════
('Labour Day',
 'Public holiday — Kenya & international observance. No classes.',
 '2027-05-01', NULL, 'holiday'),

('Term 2 2027 — Registration Week',
 'Registration and fee payment for Term 2.',
 '2027-05-03', '2027-05-07', 'other'),

('Term 2 2027 — Classes Begin',
 'First day of lectures and module access for Term 2.',
 '2027-05-10', NULL, 'class'),

('Madaraka Day',
 'Kenya public holiday — no classes.',
 '2027-06-01', NULL, 'holiday'),

('Term 2 2027 — Assignment Submission Deadline',
 'Mid-term assignments due. Submit via the student portal.',
 '2027-06-25', NULL, 'assignment'),

('US Independence Day',
 'US public holiday.',
 '2027-07-04', NULL, 'holiday'),

('Term 2 2027 — Exam & Final Submission Week',
 'End-of-term exams and final assignment submissions due.',
 '2027-08-16', '2027-08-20', 'exam'),

('Term 2 2027 — Ends',
 'Last day of Term 2. Results published within 2 weeks.',
 '2027-08-20', NULL, 'other'),

-- ════════════════════════════════════════
-- TERM 3 2027  (September – December)
-- ════════════════════════════════════════
('Term 3 2027 — Registration Week',
 'Registration and fee payment for Term 3.',
 '2027-09-06', '2027-09-10', 'other'),

('Term 3 2027 — Classes Begin',
 'First day of lectures and module access for Term 3.',
 '2027-09-13', NULL, 'class'),

('Term 3 2027 — Assignment Submission Deadline',
 'Mid-term assignments due. Submit via the student portal.',
 '2027-11-05', NULL, 'assignment'),

('Mashujaa Day',
 'Kenya public holiday — no classes.',
 '2027-10-20', NULL, 'holiday'),

('US Thanksgiving',
 'US public holiday.',
 '2027-11-25', NULL, 'holiday'),

('Term 3 2027 — Exam & Final Submission Week',
 'End-of-term exams and final assignment submissions due.',
 '2027-12-06', '2027-12-10', 'exam'),

('Jamhuri Day',
 'Kenya public holiday — no classes.',
 '2027-12-12', NULL, 'holiday'),

('Term 3 2027 — Ends',
 'Last day of Term 3. Results published within 2 weeks.',
 '2027-12-10', NULL, 'other'),

('Christmas Break Begins',
 'No classes from this date through the New Year.',
 '2027-12-13', '2027-12-31', 'holiday'),

('Christmas Day',
 'Public holiday.',
 '2027-12-25', NULL, 'holiday'),

('Boxing Day',
 'Public holiday.',
 '2027-12-26', NULL, 'holiday');
