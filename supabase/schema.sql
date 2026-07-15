-- 55andMain Database Schema
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

create table if not exists listings (
  id           text primary key,
  title        text not null,
  category     text not null,
  subcategory  text not null,
  description  text not null,
  date         text,
  time         text,
  location     text not null,
  city         text not null,
  state        text not null default 'CT',
  cost         text not null default '',
  senior_discount boolean not null default false,
  contact      text,
  url          text,
  tags         text[] not null default '{}',
  status       text not null default 'pending',
  submitted_by text not null default 'community',
  created_at   timestamptz not null default now()
);

-- Allow anyone to read published listings
create policy "Public can read published listings"
  on listings for select
  using (status = 'published');

-- Enable row-level security
alter table listings enable row level security;

-- Index for fast city + category filtering
create index if not exists listings_city_idx     on listings(city);
create index if not exists listings_category_idx on listings(category);
create index if not exists listings_status_idx   on listings(status);
