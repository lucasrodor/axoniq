-- Create tables for Axoniq (MedMind)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS (Managed by Supabase Auth, extending public.users if needed for extra profile data)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- RLS for Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- DECKS (Collections of flashcards)
create table public.decks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Decks
alter table public.decks enable row level security;
create policy "Users can view own decks." on public.decks for select using (auth.uid() = user_id);
create policy "Users can insert own decks." on public.decks for insert with check (auth.uid() = user_id);
create policy "Users can update own decks." on public.decks for update using (auth.uid() = user_id);
create policy "Users can delete own decks." on public.decks for delete using (auth.uid() = user_id);

-- FLASHCARDS
create table public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references public.decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  ease_factor real default 2.5,
  interval integer default 0,
  repetition integer default 0,
  due_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Flashcards
alter table public.flashcards enable row level security;
create policy "Users can view own flashcards via deck." on public.flashcards for select using (exists (select 1 from public.decks where id = flashcards.deck_id and user_id = auth.uid()));
create policy "Users can insert own flashcards via deck." on public.flashcards for insert with check (exists (select 1 from public.decks where id = deck_id and user_id = auth.uid()));
create policy "Users can update own flashcards via deck." on public.flashcards for update using (exists (select 1 from public.decks where id = deck_id and user_id = auth.uid()));
create policy "Users can delete own flashcards via deck." on public.flashcards for delete using (exists (select 1 from public.decks where id = deck_id and user_id = auth.uid()));

-- Set up triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger on_decks_updated before update on public.decks for each row execute procedure public.handle_updated_at();
