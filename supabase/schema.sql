-- EchoBond database schema
-- Run this in your Supabase SQL editor to set up the tables

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  name text not null,
  personality_type text not null default 'Extroverted',
  interests text[] not null default '{}',
  chat_style text not null default 'Mix of both',
  purpose text not null default 'connection',
  relationship_stage text not null default 'discovery',
  message_count int not null default 0,
  attachment_score int not null default 0,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references users(session_id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  has_memory_callback boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists long_term_memories (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references users(session_id) on delete cascade,
  category text not null,
  content text not null,
  importance int not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references users(session_id) on delete cascade,
  type text not null,
  achieved_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists messages_session_created on messages(session_id, created_at);
create index if not exists memories_session_importance on long_term_memories(session_id, importance desc);
create index if not exists milestones_session on milestones(session_id, achieved_at);

-- Row Level Security (enable but allow service role full access)
alter table users enable row level security;
alter table messages enable row level security;
alter table long_term_memories enable row level security;
alter table milestones enable row level security;
