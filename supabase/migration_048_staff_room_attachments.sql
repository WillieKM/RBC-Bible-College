-- Attachments on Staff Room topics and replies.
-- Run this in the Supabase SQL editor after migration_047_staff_room.sql.
--
-- Files live in the existing private "submissions" bucket under
-- staff-room/<uploader_id>/... and are served via short-lived signed URLs.
-- Accessed only via the service-role admin client, so no RLS policies.
create table if not exists staff_room_attachments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references staff_room_posts(id) on delete cascade,
  file_path  text not null,
  file_name  text not null,
  created_at timestamptz not null default now()
);

create index if not exists staff_room_attachments_post_idx on staff_room_attachments (post_id);

alter table staff_room_attachments enable row level security;
-- No policies: only the service-role key (admin client) can read/write this table.
