-- Phase 1: Quiz System + Pipeline Refactoring
-- Migration: sources, quizzes, quiz_questions, quiz_attempts + modify decks, flashcards

-- =============================================
-- 1. SOURCES TABLE (Central content storage)
-- =============================================
create table if not exists public.sources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  raw_content text not null,
  file_name text,
  file_type text,
  specialty_tag text default 'Outros',
  status text not null default 'extracted', -- extracted, processing, ready, error
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Sources
alter table public.sources enable row level security;

create policy "Users can view own sources."
on public.sources for select
using (auth.uid() = user_id);

create policy "Users can insert own sources."
on public.sources for insert
with check (auth.uid() = user_id);

create policy "Users can update own sources."
on public.sources for update
using (auth.uid() = user_id);

create policy "Users can delete own sources."
on public.sources for delete
using (auth.uid() = user_id);


-- =============================================
-- 2. QUIZZES TABLE
-- =============================================
create table if not exists public.quizzes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_id uuid references public.sources(id) on delete set null,
  folder_id uuid references public.folders(id) on delete set null,
  title text not null,
  specialty_tag text default 'Outros',
  status text not null default 'generating', -- generating, ready, error
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Quizzes
alter table public.quizzes enable row level security;

create policy "Users can view own quizzes."
on public.quizzes for select
using (auth.uid() = user_id);

create policy "Users can insert own quizzes."
on public.quizzes for insert
with check (auth.uid() = user_id);

create policy "Users can update own quizzes."
on public.quizzes for update
using (auth.uid() = user_id);

create policy "Users can delete own quizzes."
on public.quizzes for delete
using (auth.uid() = user_id);


-- =============================================
-- 3. QUIZ QUESTIONS TABLE
-- =============================================
create table if not exists public.quiz_questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question text not null,
  type text not null default 'multiple_choice', -- multiple_choice, cloze, true_false
  options jsonb not null default '[]'::jsonb,
  correct_answer integer not null default 0, -- index in options array
  explanation text,
  difficulty text default 'medium' -- easy, medium, hard
);

-- RLS for Quiz Questions (via quiz ownership)
alter table public.quiz_questions enable row level security;

create policy "Users can view own quiz questions."
on public.quiz_questions for select
using (exists (select 1 from public.quizzes where id = quiz_questions.quiz_id and user_id = auth.uid()));

create policy "Users can insert own quiz questions."
on public.quiz_questions for insert
with check (exists (select 1 from public.quizzes where id = quiz_id and user_id = auth.uid()));

create policy "Users can update own quiz questions."
on public.quiz_questions for update
using (exists (select 1 from public.quizzes where id = quiz_id and user_id = auth.uid()));

create policy "Users can delete own quiz questions."
on public.quiz_questions for delete
using (exists (select 1 from public.quizzes where id = quiz_id and user_id = auth.uid()));


-- =============================================
-- 4. QUIZ ATTEMPTS TABLE
-- =============================================
create table if not exists public.quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  score integer not null default 0,
  total_questions integer not null default 0,
  answers jsonb not null default '[]'::jsonb, -- [{questionId, selectedAnswer, isCorrect}]
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- RLS for Quiz Attempts
alter table public.quiz_attempts enable row level security;

create policy "Users can view own quiz attempts."
on public.quiz_attempts for select
using (auth.uid() = user_id);

create policy "Users can insert own quiz attempts."
on public.quiz_attempts for insert
with check (auth.uid() = user_id);

create policy "Users can update own quiz attempts."
on public.quiz_attempts for update
using (auth.uid() = user_id);


-- =============================================
-- 5. MODIFY EXISTING TABLES
-- =============================================

-- Add source_id to decks (link deck to its source)
alter table public.decks add column if not exists source_id uuid references public.sources(id) on delete set null;

-- Add specialty_tag to decks
alter table public.decks add column if not exists specialty_tag text default 'Outros';

-- Add type to flashcards (standard or cloze)
alter table public.flashcards add column if not exists type text default 'standard'; -- standard, cloze
