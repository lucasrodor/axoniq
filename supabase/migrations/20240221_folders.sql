-- Migration to add Folder support

create table if not exists public.folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add folder_id to decks
alter table public.decks add column if not exists folder_id uuid references public.folders(id) on delete set null;

-- Enable RLS for Folders
alter table public.folders enable row level security;

create policy "Users can view own folders." 
on public.folders for select 
using (auth.uid() = user_id);

create policy "Users can insert own folders." 
on public.folders for insert 
with check (auth.uid() = user_id);

create policy "Users can update own folders." 
on public.folders for update 
using (auth.uid() = user_id);

create policy "Users can delete own folders." 
on public.folders for delete 
using (auth.uid() = user_id);
