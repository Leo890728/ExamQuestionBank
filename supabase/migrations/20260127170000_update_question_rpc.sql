-- =============================================================================
-- Supabase RPC: update_question / delete_question
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_question(
    p_id BIGINT,
    p_content TEXT,
    p_explanation TEXT DEFAULT NULL,
    p_question_type TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_subject TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_year SMALLINT DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_options JSONB DEFAULT NULL,
    p_tag_ids BIGINT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_type public.question_type;
    v_difficulty public.question_difficulty;
    v_options JSONB;
    v_has_options BOOLEAN;
    v_row_count INTEGER;
BEGIN
    IF p_id IS NULL THEN
        RAISE EXCEPTION 'id is required';
    END IF;

    IF p_content IS NULL OR btrim(p_content) = '' THEN
        RAISE EXCEPTION 'content is required';
    END IF;

    v_options := p_options;
    v_has_options := CASE
        WHEN v_options IS NULL THEN false
        WHEN jsonb_typeof(v_options) = 'array' THEN jsonb_array_length(v_options) > 0
        ELSE false
    END;

    IF p_question_type IN ('essay', 'multipleChoice') THEN
        v_type := p_question_type::public.question_type;
    ELSIF v_has_options THEN
        v_type := 'multipleChoice';
    ELSE
        v_type := 'essay';
    END IF;

    IF p_difficulty = 'medium' THEN
        v_difficulty := 'normal';
    ELSIF p_difficulty IN ('easy', 'normal', 'hard', 'insane') THEN
        v_difficulty := p_difficulty::public.question_difficulty;
    ELSE
        v_difficulty := 'normal';
    END IF;

    UPDATE public.question
    SET
        content = btrim(p_content),
        explanation = NULLIF(btrim(p_explanation), ''),
        type = v_type,
        difficulty = v_difficulty,
        subject = NULLIF(btrim(p_subject), ''),
        category = NULLIF(btrim(p_category), ''),
        year = p_year,
        source = NULLIF(btrim(p_source), '')
    WHERE id = p_id;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    IF v_row_count = 0 THEN
        RAISE EXCEPTION 'question not found';
    END IF;

    IF p_options IS NOT NULL THEN
        DELETE FROM public.question_option WHERE question_id = p_id;
        IF v_has_options THEN
            INSERT INTO public.question_option (question_id, content, is_correct, "order")
            SELECT
                p_id,
                btrim(COALESCE(opt->>'content', '')),
                COALESCE((opt->>'is_correct')::boolean, false),
                COALESCE((opt->>'order')::smallint, ord::smallint)
            FROM jsonb_array_elements(v_options) WITH ORDINALITY AS t(opt, ord)
            WHERE btrim(COALESCE(opt->>'content', '')) <> '';
        END IF;
    END IF;

    IF p_tag_ids IS NOT NULL THEN
        DELETE FROM public.question_tag WHERE question_id = p_id;
        IF array_length(p_tag_ids, 1) > 0 THEN
            INSERT INTO public.question_tag (question_id, tag_id)
            SELECT p_id, unnest(p_tag_ids)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN json_build_object('id', p_id, 'success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_question(
    BIGINT,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    SMALLINT,
    TEXT,
    JSONB,
    BIGINT[]
) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_question(p_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row_count INTEGER;
BEGIN
    IF p_id IS NULL THEN
        RAISE EXCEPTION 'id is required';
    END IF;

    DELETE FROM public.question WHERE id = p_id;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    IF v_row_count = 0 THEN
        RAISE EXCEPTION 'question not found';
    END IF;

    RETURN json_build_object('id', p_id, 'success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_question(BIGINT) TO authenticated;
