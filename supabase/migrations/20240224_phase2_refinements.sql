-- Migration: Add option_explanations to quiz_questions
-- Allows detailed feedback for each alternative in multiple choice questions.

alter table public.quiz_questions 
add column if not exists option_explanations jsonb default '[]'::jsonb;

comment on column public.quiz_questions.option_explanations is 'Array of explanations corresponding to each option in the options array.';
