-- Add fee to programs table
alter table programs add column if not exists fee numeric(10, 2) default null;
