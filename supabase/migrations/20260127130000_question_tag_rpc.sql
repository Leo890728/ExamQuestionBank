-- =============================================================================
-- Supabase RPC: question_tag relations
-- Created: 2026-01-27
-- =============================================================================

-- Replace all tags for a question
CREATE OR REPLACE FUNCTION public.set_question_tags(
  p_question_id BIGINT,
  p_tag_ids BIGINT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_removed INTEGER;
  v_added INTEGER;
BEGIN
  IF p_question_id IS NULL THEN
    RAISE EXCEPTION 'question_id is required';
  END IF;

  DELETE FROM public.question_tag
  WHERE question_id = p_question_id;
  GET DIAGNOSTICS v_removed = ROW_COUNT;

  IF p_tag_ids IS NULL OR array_length(p_tag_ids, 1) IS NULL THEN
    RETURN json_build_object(
      'question_id', p_question_id,
      'removed', v_removed,
      'added', 0
    );
  END IF;

  INSERT INTO public.question_tag (question_id, tag_id)
  SELECT p_question_id, tag_id
  FROM unnest(p_tag_ids) AS tag_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_added = ROW_COUNT;

  RETURN json_build_object(
    'question_id', p_question_id,
    'removed', v_removed,
    'added', v_added
  );
END;
$$;

-- Add tags to a question
CREATE OR REPLACE FUNCTION public.add_question_tags(
  p_question_id BIGINT,
  p_tag_ids BIGINT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_added INTEGER;
BEGIN
  IF p_question_id IS NULL THEN
    RAISE EXCEPTION 'question_id is required';
  END IF;

  IF p_tag_ids IS NULL OR array_length(p_tag_ids, 1) IS NULL THEN
    RETURN json_build_object(
      'question_id', p_question_id,
      'added', 0
    );
  END IF;

  INSERT INTO public.question_tag (question_id, tag_id)
  SELECT p_question_id, tag_id
  FROM unnest(p_tag_ids) AS tag_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_added = ROW_COUNT;

  RETURN json_build_object(
    'question_id', p_question_id,
    'added', v_added
  );
END;
$$;

-- Remove tags from a question
CREATE OR REPLACE FUNCTION public.remove_question_tags(
  p_question_id BIGINT,
  p_tag_ids BIGINT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_removed INTEGER;
BEGIN
  IF p_question_id IS NULL THEN
    RAISE EXCEPTION 'question_id is required';
  END IF;

  IF p_tag_ids IS NULL OR array_length(p_tag_ids, 1) IS NULL THEN
    RETURN json_build_object(
      'question_id', p_question_id,
      'removed', 0
    );
  END IF;

  DELETE FROM public.question_tag
  WHERE question_id = p_question_id
    AND tag_id = ANY(p_tag_ids);
  GET DIAGNOSTICS v_removed = ROW_COUNT;

  RETURN json_build_object(
    'question_id', p_question_id,
    'removed', v_removed
  );
END;
$$;

-- Add many questions to a tag
CREATE OR REPLACE FUNCTION public.add_tag_questions(
  p_tag_id BIGINT,
  p_question_ids BIGINT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_added INTEGER;
BEGIN
  IF p_tag_id IS NULL THEN
    RAISE EXCEPTION 'tag_id is required';
  END IF;

  IF p_question_ids IS NULL OR array_length(p_question_ids, 1) IS NULL THEN
    RETURN json_build_object(
      'tag_id', p_tag_id,
      'added', 0
    );
  END IF;

  INSERT INTO public.question_tag (question_id, tag_id)
  SELECT question_id, p_tag_id
  FROM unnest(p_question_ids) AS question_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_added = ROW_COUNT;

  RETURN json_build_object(
    'tag_id', p_tag_id,
    'added', v_added
  );
END;
$$;

-- Grants (admin-only)
GRANT EXECUTE ON FUNCTION public.set_question_tags(BIGINT, BIGINT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_question_tags(BIGINT, BIGINT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_question_tags(BIGINT, BIGINT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_tag_questions(BIGINT, BIGINT[]) TO service_role;
