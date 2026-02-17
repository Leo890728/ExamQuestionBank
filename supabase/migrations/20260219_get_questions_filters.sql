-- =============================================================================
-- Migration: Add category, tag_ids, tag_mode filters to get_questions
-- =============================================================================

-- Need DROP because adding new params changes the signature
DROP FUNCTION IF EXISTS public.get_questions(TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_questions(
  p_subject TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_year INTEGER DEFAULT NULL,
  p_keyword TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
  p_category TEXT DEFAULT NULL,
  p_tag_ids BIGINT[] DEFAULT NULL,
  p_tag_mode TEXT DEFAULT 'or'   -- 'or' = any tag matches, 'and' = all tags must match
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  offset_val INTEGER;
  total_count INTEGER;
  v_tag_count INTEGER;
BEGIN
  offset_val := (p_page - 1) * p_page_size;
  v_tag_count := COALESCE(array_length(p_tag_ids, 1), 0);

  -- Get total count
  SELECT COUNT(*) INTO total_count
  FROM question q
  WHERE (p_subject IS NULL OR q.subject = p_subject)
    AND (p_difficulty IS NULL OR q.difficulty::TEXT = p_difficulty)
    AND (p_type IS NULL OR q.type::TEXT = p_type)
    AND (p_year IS NULL OR q.year = p_year)
    AND (p_keyword IS NULL OR q.content ILIKE '%' || p_keyword || '%')
    AND (p_category IS NULL OR q.category ILIKE '%' || p_category || '%')
    AND (
      v_tag_count = 0
      OR (
        p_tag_mode = 'and'
        AND (
          SELECT COUNT(DISTINCT qt.tag_id)
          FROM question_tag qt
          WHERE qt.question_id = q.id AND qt.tag_id = ANY(p_tag_ids)
        ) = v_tag_count
      )
      OR (
        p_tag_mode <> 'and'
        AND EXISTS (
          SELECT 1 FROM question_tag qt
          WHERE qt.question_id = q.id AND qt.tag_id = ANY(p_tag_ids)
        )
      )
    );

  -- Get questions with options and tags
  SELECT json_build_object(
    'results', COALESCE(json_agg(q_data), '[]'::json),
    'count', total_count,
    'page', p_page,
    'page_size', p_page_size
  ) INTO result
  FROM (
    SELECT json_build_object(
      'id', q.id,
      'content', q.content,
      'explanation', q.explanation,
      'type', q.type,
      'difficulty', q.difficulty,
      'subject', q.subject,
      'category', q.category,
      'year', q.year,
      'source', q.source,
      'created_at', q.created_at,
      'options', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'id', o.id,
            'content', o.content,
            'is_correct', o.is_correct,
            'order', o."order"
          ) ORDER BY o."order"
        ), '[]'::json)
        FROM question_option o
        WHERE o.question_id = q.id
      ),
      'tags', (
        SELECT COALESCE(json_agg(
          json_build_object('id', t.id, 'name', t.name)
        ), '[]'::json)
        FROM question_tag qt
        JOIN tag t ON t.id = qt.tag_id
        WHERE qt.question_id = q.id
      )
    ) AS q_data
    FROM question q
    WHERE (p_subject IS NULL OR q.subject = p_subject)
      AND (p_difficulty IS NULL OR q.difficulty::TEXT = p_difficulty)
      AND (p_type IS NULL OR q.type::TEXT = p_type)
      AND (p_year IS NULL OR q.year = p_year)
      AND (p_keyword IS NULL OR q.content ILIKE '%' || p_keyword || '%')
      AND (p_category IS NULL OR q.category ILIKE '%' || p_category || '%')
      AND (
        v_tag_count = 0
        OR (
          p_tag_mode = 'and'
          AND (
            SELECT COUNT(DISTINCT qt.tag_id)
            FROM question_tag qt
            WHERE qt.question_id = q.id AND qt.tag_id = ANY(p_tag_ids)
          ) = v_tag_count
        )
        OR (
          p_tag_mode <> 'and'
          AND EXISTS (
            SELECT 1 FROM question_tag qt
            WHERE qt.question_id = q.id AND qt.tag_id = ANY(p_tag_ids)
          )
        )
      )
    ORDER BY q.created_at DESC
    LIMIT p_page_size
    OFFSET offset_val
  ) sub;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_questions(
  TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, INTEGER, TEXT, BIGINT[], TEXT
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_questions(
  TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, INTEGER, TEXT, BIGINT[], TEXT
) TO anon;
