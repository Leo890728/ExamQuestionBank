-- =============================================================================
-- Unified AI Context Retrieval (Cross-Project)
-- Created: 2026-02-04
-- Description: Enables AI to pull context from BOTH exam notes and legal notes
--              for richer responses across the entire ecosystem
-- =============================================================================

-- ============================================
-- RPC: Unified AI Context Retrieval
-- ============================================

CREATE OR REPLACE FUNCTION public.get_unified_ai_context(
    p_user_id UUID,
    query_embedding vector(1536),
    p_threshold float DEFAULT 0.65,
    p_max_per_source int DEFAULT 5
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'exam_notes', COALESCE((
            SELECT json_agg(json_build_object(
                'id', n.id,
                'title', n.title,
                'content', n.content,
                'source_type', n.source_type,
                'source_metadata', n.source_metadata,
                'tags', n.tags,
                'similarity', 1 - (ne.embedding <=> query_embedding),
                'created_at', n.created_at
            ) ORDER BY ne.embedding <=> query_embedding)
            FROM public.exam_note n
            JOIN public.exam_note_embedding ne ON ne.note_id = n.id
            WHERE n.user_id = p_user_id
            AND n.is_archived = false
            AND 1 - (ne.embedding <=> query_embedding) > p_threshold
            LIMIT p_max_per_source
        ), '[]'::json),
        'legal_notes', COALESCE((
            SELECT json_agg(json_build_object(
                'id', n.id,
                'title', n.title,
                'content', n.content,
                'highlighted_text', n.highlighted_text,
                'source_type', n.source_type,
                'source_url', n.source_url,
                'source_metadata', n.source_metadata,
                'tags', n.tags,
                'similarity', 1 - (ne.embedding <=> query_embedding),
                'created_at', n.created_at
            ) ORDER BY ne.embedding <=> query_embedding)
            FROM public.legal_note n
            JOIN public.legal_note_embedding ne ON ne.note_id = n.id
            WHERE n.user_id = p_user_id
            AND n.is_archived = false
            AND 1 - (ne.embedding <=> query_embedding) > p_threshold
            LIMIT p_max_per_source
        ), '[]'::json),
        'questions', COALESCE((
            SELECT json_agg(json_build_object(
                'id', q.id,
                'content', q.content,
                'subject', q.subject,
                'year', q.year,
                'difficulty', q.difficulty,
                'similarity', 1 - (qe.embedding <=> query_embedding),
                'created_at', q.created_at
            ) ORDER BY qe.embedding <=> query_embedding)
            FROM public.question q
            JOIN public.question_embedding qe ON qe.question_id = q.id
            WHERE 1 - (qe.embedding <=> query_embedding) > p_threshold
            LIMIT p_max_per_source
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_unified_ai_context IS 'Retrieves relevant context from exam notes, legal notes, and questions for AI conversations';

GRANT EXECUTE ON FUNCTION public.get_unified_ai_context TO authenticated;

-- ============================================
-- RPC: Search All Notes (Cross-Project Full-Text Search)
-- ============================================

CREATE OR REPLACE FUNCTION public.search_all_notes(
    p_user_id UUID,
    p_search_query TEXT,
    p_limit int DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'exam_notes', COALESCE((
            SELECT json_agg(json_build_object(
                'id', n.id,
                'title', n.title,
                'content', n.content,
                'source_type', n.source_type,
                'tags', n.tags,
                'created_at', n.created_at,
                'source', 'exam'
            ))
            FROM public.exam_note n
            WHERE n.user_id = p_user_id
            AND n.is_archived = false
            AND (
                n.title ILIKE '%' || p_search_query || '%'
                OR n.content ILIKE '%' || p_search_query || '%'
                OR p_search_query = ANY(n.tags)
            )
            ORDER BY n.created_at DESC
            LIMIT p_limit
        ), '[]'::json),
        'legal_notes', COALESCE((
            SELECT json_agg(json_build_object(
                'id', n.id,
                'title', n.title,
                'content', n.content,
                'highlighted_text', n.highlighted_text,
                'source_type', n.source_type,
                'tags', n.tags,
                'created_at', n.created_at,
                'source', 'legal'
            ))
            FROM public.legal_note n
            WHERE n.user_id = p_user_id
            AND n.is_archived = false
            AND (
                n.title ILIKE '%' || p_search_query || '%'
                OR n.content ILIKE '%' || p_search_query || '%'
                OR n.highlighted_text ILIKE '%' || p_search_query || '%'
                OR p_search_query = ANY(n.tags)
            )
            ORDER BY n.created_at DESC
            LIMIT p_limit
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.search_all_notes IS 'Full-text search across both exam notes and legal notes';

GRANT EXECUTE ON FUNCTION public.search_all_notes TO authenticated;

-- ============================================
-- RPC: Get All Notes Summary (Analytics)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_notes_summary(
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'exam_notes', json_build_object(
            'total', COALESCE((SELECT COUNT(*) FROM public.exam_note WHERE user_id = p_user_id AND is_archived = false), 0),
            'pinned', COALESCE((SELECT COUNT(*) FROM public.exam_note WHERE user_id = p_user_id AND is_pinned = true AND is_archived = false), 0),
            'with_flashcards', COALESCE((
                SELECT COUNT(DISTINCT note_id)
                FROM public.exam_note_flashcard
                WHERE user_id = p_user_id
            ), 0),
            'by_source_type', COALESCE((
                SELECT json_object_agg(source_type, count)
                FROM (
                    SELECT source_type, COUNT(*) as count
                    FROM public.exam_note
                    WHERE user_id = p_user_id AND is_archived = false
                    GROUP BY source_type
                ) sub
            ), '{}'::json)
        ),
        'legal_notes', json_build_object(
            'total', COALESCE((SELECT COUNT(*) FROM public.legal_note WHERE user_id = p_user_id AND is_archived = false), 0),
            'pinned', COALESCE((SELECT COUNT(*) FROM public.legal_note WHERE user_id = p_user_id AND is_pinned = true AND is_archived = false), 0),
            'with_flashcards', COALESCE((
                SELECT COUNT(DISTINCT note_id)
                FROM public.legal_note_flashcard
                WHERE user_id = p_user_id
            ), 0),
            'by_source_type', COALESCE((
                SELECT json_object_agg(source_type, count)
                FROM (
                    SELECT source_type, COUNT(*) as count
                    FROM public.legal_note
                    WHERE user_id = p_user_id AND is_archived = false
                    GROUP BY source_type
                ) sub
            ), '{}'::json)
        ),
        'combined', json_build_object(
            'total_notes', COALESCE((
                SELECT COUNT(*) FROM public.exam_note WHERE user_id = p_user_id AND is_archived = false
            ), 0) + COALESCE((
                SELECT COUNT(*) FROM public.legal_note WHERE user_id = p_user_id AND is_archived = false
            ), 0),
            'total_flashcards', COALESCE((
                SELECT COUNT(*) FROM public.exam_note_flashcard WHERE user_id = p_user_id
            ), 0) + COALESCE((
                SELECT COUNT(*) FROM public.legal_note_flashcard WHERE user_id = p_user_id
            ), 0)
        )
    ) INTO result;

    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_notes_summary IS 'Analytics summary of all notes across both projects';

GRANT EXECUTE ON FUNCTION public.get_notes_summary TO authenticated;

-- ============================================
-- VIEW: Combined Recent Notes (Optional)
-- ============================================

-- This is a convenience view for dashboards showing recent activity across both projects
-- Note: Views don't inherit RLS, so we rely on the function to enforce security

CREATE OR REPLACE FUNCTION public.get_recent_notes(
    p_user_id UUID,
    p_limit int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    content TEXT,
    source VARCHAR,  -- 'exam' or 'legal'
    source_type VARCHAR,
    tags TEXT[],
    is_pinned BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    (
        SELECT
            n.id,
            n.title,
            n.content,
            'exam'::VARCHAR as source,
            n.source_type,
            n.tags,
            n.is_pinned,
            n.created_at
        FROM public.exam_note n
        WHERE n.user_id = p_user_id AND n.is_archived = false

        UNION ALL

        SELECT
            n.id,
            n.title,
            n.content,
            'legal'::VARCHAR as source,
            n.source_type,
            n.tags,
            n.is_pinned,
            n.created_at
        FROM public.legal_note n
        WHERE n.user_id = p_user_id AND n.is_archived = false
    )
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_recent_notes IS 'Get most recent notes from both exam and legal domains combined';

GRANT EXECUTE ON FUNCTION public.get_recent_notes TO authenticated;
