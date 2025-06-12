-- Create summaries table
create table if not exists public.summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  original_text text not null,
  summary text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.summaries enable row level security;

-- Create policy to allow users to view their own summaries
create policy "Users can view their own summaries"
  on public.summaries
  for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own summaries
create policy "Users can insert their own summaries"
  on public.summaries
  for insert
  with check (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists summaries_user_id_idx on public.summaries(user_id);
create index if not exists summaries_created_at_idx on public.summaries(created_at desc); 