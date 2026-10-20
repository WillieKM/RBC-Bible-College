-- Staff Room: a private discussion board for lecturers and admins.
-- Run this in the Supabase SQL editor after migration_046_dual_role_policies.sql.
--
-- Top-level posts have a title and parent_id = null; replies point at their
-- post via parent_id. Accessed only via the service-role admin client (the
-- app checks the user is staff), so no RLS policies are needed.
create table if not exists staff_room_posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid references profiles(id) on delete set null,
  parent_id  uuid references staff_room_posts(id) on delete cascade,
  title      text,
  body       text not null,
  pinned     boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists staff_room_posts_parent_idx
  on staff_room_posts (parent_id, created_at);

alter table staff_room_posts enable row level security;
-- No policies: only the service-role key (admin client) can read/write this table.
