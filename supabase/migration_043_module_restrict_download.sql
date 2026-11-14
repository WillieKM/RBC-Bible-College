-- Adds restrict_download flag to module_files so admins can block PDF downloads
-- (students can still view the PDF inline but cannot save it).
alter table module_files add column if not exists restrict_download boolean not null default false;
