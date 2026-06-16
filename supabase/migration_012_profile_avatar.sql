-- Add avatar_url to profiles so student passport photos appear on their profile
alter table profiles add column if not exists avatar_url text;
