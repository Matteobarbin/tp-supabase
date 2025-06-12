-- Create game_scores table
create table if not exists public.game_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  score integer not null,
  moves integer not null,
  time_seconds integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.game_scores enable row level security;

-- Create policy to allow users to view their own scores
create policy "Users can view their own scores"
  on public.game_scores
  for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own scores
create policy "Users can insert their own scores"
  on public.game_scores
  for insert
  with check (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists game_scores_user_id_idx on public.game_scores(user_id);
create index if not exists game_scores_created_at_idx on public.game_scores(created_at desc); 