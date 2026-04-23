-- Database Optimization for Axoniq
-- Performance Indexing for common queries

-- 1. Decks Indexes
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON public.decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_folder_id ON public.decks(folder_id);

-- 2. Flashcards Indexes (Crucial for study sessions and counts)
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_due_date ON public.flashcards(due_date);
CREATE INDEX IF NOT EXISTS idx_flashcards_repetition_interval ON public.flashcards(repetition, interval);

-- 3. Quizzes Indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_folder_id ON public.quizzes(folder_id);

-- 4. Quiz Questions & Attempts
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user ON public.quiz_attempts(quiz_id, user_id);

-- 5. Mind Maps
CREATE INDEX IF NOT EXISTS idx_mind_maps_user_id ON public.mind_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_folder_id ON public.mind_maps(folder_id);

-- 6. Folders & Documents
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- 7. Sources (Multi-source/Multimodal)
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON public.sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_created_at ON public.sources(created_at DESC);
