-- Add YouTube/recording URL to zoom sessions so students can watch past classes
alter table zoom_sessions add column if not exists recording_url text;
