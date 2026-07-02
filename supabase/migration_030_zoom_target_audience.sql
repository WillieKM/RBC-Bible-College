-- Replace per-program FK targeting with a simple audience string so the
-- admin sees clean options (All / Doctorate / Bachelor's / Master's /
-- Diploma / Certificate) rather than a list of every named program.
alter table zoom_sessions add column if not exists target_audience text not null default 'all';
