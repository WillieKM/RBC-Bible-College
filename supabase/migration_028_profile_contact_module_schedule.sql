-- Students can now update their own phone and address via the Settings page.
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists address text;

-- Module files can be scheduled for automatic sending to a specific audience.
-- send_at:       when to send (null = no schedule, send manually)
-- sent_at:       set by the cron once actually sent (prevents re-sending)
-- send_audience: target audience key ("all" | "diploma" | "bachelors" | "masters" | "doctorate")
alter table module_files add column if not exists send_at timestamptz;
alter table module_files add column if not exists sent_at timestamptz;
alter table module_files add column if not exists send_audience text;
