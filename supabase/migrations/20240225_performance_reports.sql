-- Phase 3: Analytics System
-- Migration: performance_reports, flashcard_reviews

-- =============================================
-- 1. PERFORMANCE REPORTS TABLE
-- =============================================
create table if not exists public.performance_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  analysis_json jsonb not null default '{}'::jsonb,
  summary_markdown text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Performance Reports
alter table public.performance_reports enable row level security;

create policy "Users can view own performance reports."
on public.performance_reports for select
using (auth.uid() = user_id);

create policy "Users can insert own performance reports."
on public.performance_reports for insert
with check (auth.uid() = user_id);

create policy "Users can delete own performance reports."
on public.performance_reports for delete
using (auth.uid() = user_id);


-- =============================================
-- 2. FLASHCARD REVIEWS TABLE (History)
-- =============================================
create table if not exists public.flashcard_reviews (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references public.flashcards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  quality integer not null, -- 1=Again, 3=Hard, 4=Good, 5=Easy
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Flashcard Reviews
alter table public.flashcard_reviews enable row level security;

create policy "Users can view own flashcard reviews."
on public.flashcard_reviews for select
using (auth.uid() = user_id);

create policy "Users can insert own flashcard reviews."
on public.flashcard_reviews for insert
with check (auth.uid() = user_id);

-- No update/delete for history integrity
