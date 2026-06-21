-- Replace single fee with per-region fees on programs
-- Add region to student profiles (carried from application at approval)

-- programs: rename fee -> fee_international, add fee_usa
alter table programs rename column fee to fee_international;
alter table programs add column if not exists fee_usa numeric(10, 2) default null;

-- profiles: store student region so we know which fee to invoice
alter table profiles add column if not exists region text default null;
