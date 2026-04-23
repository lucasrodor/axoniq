-- Otimização do Dashboard Axoniq
-- Execute este script no SQL Editor do Supabase

-- 1. View para estatísticas de cada Deck
CREATE OR REPLACE VIEW deck_stats_view 
WITH (security_invoker = true) AS
SELECT 
    d.id,
    d.user_id,
    d.title,
    d.folder_id,
    d.created_at,
    COUNT(f.id) FILTER (WHERE f.id IS NOT NULL) as total_cards,
    COUNT(f.id) FILTER (WHERE f.due_date <= NOW()) as due_cards,
    COUNT(f.id) FILTER (WHERE f.interval >= 21) as mastered_cards,
    COUNT(f.id) FILTER (WHERE f.repetition > 0 OR f.interval > 0) as studied_cards
FROM decks d
LEFT JOIN flashcards f ON d.id = f.deck_id
GROUP BY d.id, d.user_id, d.title, d.folder_id, d.created_at;

-- 2. View para estatísticas de Quizzes (com o último score)
CREATE OR REPLACE VIEW quiz_stats_view 
WITH (security_invoker = true) AS
WITH latest_attempts AS (
    SELECT DISTINCT ON (quiz_id, user_id)
        quiz_id,
        user_id,
        score,
        total_questions as attempt_total,
        completed_at
    FROM quiz_attempts
    ORDER BY quiz_id, user_id, completed_at DESC
)
SELECT 
    q.id,
    q.user_id,
    q.title,
    q.folder_id,
    q.created_at,
    q.specialty_tag,
    q.status,
    COUNT(qq.id) FILTER (WHERE qq.id IS NOT NULL) as total_questions,
    la.score as last_score_hit,
    la.attempt_total as last_score_total
FROM quizzes q
LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
LEFT JOIN latest_attempts la ON q.id = la.quiz_id AND q.user_id = la.user_id
GROUP BY q.id, q.user_id, q.title, q.folder_id, q.created_at, q.specialty_tag, q.status, la.score, la.attempt_total;

-- 3. Função para obter progresso global do usuário de forma ultra-rápida
CREATE OR REPLACE FUNCTION get_user_progress_summary(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_cards', COUNT(id),
        'due_today', COUNT(id) FILTER (WHERE due_date <= NOW()),
        'mastered', COUNT(id) FILTER (WHERE interval >= 21),
        'learning', COUNT(id) FILTER (WHERE interval < 7 AND (repetition > 0 OR interval > 0)),
        'new', COUNT(id) FILTER (WHERE repetition = 0 AND interval = 0),
        'studied_total', COUNT(id) FILTER (WHERE repetition > 0 OR interval > 0)
    ) INTO result
    FROM flashcards
    WHERE deck_id IN (SELECT id FROM decks WHERE user_id = p_user_id);
    
    RETURN result;
END;
$$;
