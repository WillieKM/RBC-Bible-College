-- Prayer board: requests + "I'm praying" interactions

create table if not exists prayer_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  body text not null,
  is_anonymous boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists prayer_interactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references prayer_requests(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(request_id, user_id)
);

alter table prayer_requests enable row level security;
alter table prayer_interactions enable row level security;

-- Authenticated users can read all requests
create policy "prayer_requests_read" on prayer_requests
  for select to authenticated using (true);

-- Users can post their own requests
create policy "prayer_requests_insert" on prayer_requests
  for insert to authenticated with check (author_id = auth.uid());

-- Authors can delete their own requests
create policy "prayer_requests_delete" on prayer_requests
  for delete to authenticated using (author_id = auth.uid());

-- Authenticated users can read who is praying
create policy "prayer_interactions_read" on prayer_interactions
  for select to authenticated using (true);

-- Users can add their own "praying" mark
create policy "prayer_interactions_insert" on prayer_interactions
  for insert to authenticated with check (user_id = auth.uid());

-- Users can remove their own "praying" mark
create policy "prayer_interactions_delete" on prayer_interactions
  for delete to authenticated using (user_id = auth.uid());
