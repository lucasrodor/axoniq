-- Phase 4: Mental Maps
-- Migration: mind_maps table

create table if not exists public.mind_maps (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_id uuid references public.sources(id) on delete set null,
  folder_id uuid references public.folders(id) on delete set null,
  title text not null,
  data_json jsonb not null default '{}'::jsonb, -- Stores { nodes: [], edges: [] }
  specialty_tag text not null default 'Geral',
  status text not null default 'ready', -- 'generating', 'ready', 'error'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Mind Maps
alter table public.mind_maps enable row level security;

create policy "Users can view own mind maps."
on public.mind_maps for select
using (auth.uid() = user_id);

create policy "Users can insert own mind maps."
on public.mind_maps for insert
with check (auth.uid() = user_id);

create policy "Users can update own mind maps."
on public.mind_maps for update
using (auth.uid() = user_id);

create policy "Users can delete own mind maps."
on public.mind_maps for delete
using (auth.uid() = user_id);
