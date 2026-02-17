-- =============================================================================
-- Migration: Admin check for question CRUD + unify add_question p_ prefix
--            + new toggle_bookmark RPC
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. DROP old add_question (param names change → signature changes)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.add_question(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, SMALLINT, TEXT, JSONB, BIGINT[], UUID, TEXT
);

-- ---------------------------------------------------------------------------
-- 2. Recreate add_question with p_ prefix + admin check
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_question(
    p_content TEXT,
    p_explanation TEXT DEFAULT NULL,
    p_question_type TEXT DEFAULT NULL,
    p_difficulty TEXT DEFAULT NULL,
    p_subject TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_year SMALLINT DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_options JSONB DEFAULT '[]'::jsonb,
    p_tag_ids BIGINT[] DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_question_id BIGINT;
    v_type public.question_type;
    v_difficulty public.question_difficulty;
    v_options JSONB;
    v_has_options BOOLEAN;
BEGIN
    -- Admin check
    IF NOT (auth.jwt()->'user_metadata'->>'is_admin')::boolean IS TRUE THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_content IS NULL OR btrim(p_content) = '' THEN
        RAISE EXCEPTION 'content is required';
    END IF;

    v_options := COALESCE(p_options, '[]'::jsonb);
    v_has_options := CASE
        WHEN jsonb_typeof(v_options) = 'array' THEN jsonb_array_length(v_options) > 0
        ELSE false
    END;

    IF p_question_type IN ('essay', 'multipleChoice') THEN
        v_type := p_question_type::public.question_type;
    ELSE
        v_type := CASE WHEN v_has_options THEN 'multipleChoice' ELSE 'essay' END;
    END IF;

    IF p_difficulty = 'medium' THEN
        v_difficulty := 'normal';
    ELSIF p_difficulty IN ('easy', 'normal', 'hard', 'insane') THEN
        v_difficulty := p_difficulty::public.question_difficulty;
    ELSE
        v_difficulty := 'normal';
    END IF;

    INSERT INTO public.question (
        content, explanation, type, difficulty,
        subject, category, year, source, creator
    )
    VALUES (
        btrim(p_content),
        NULLIF(btrim(p_explanation), ''),
        v_type,
        v_difficulty,
        NULLIF(btrim(p_subject), ''),
        NULLIF(btrim(p_category), ''),
        p_year,
        NULLIF(btrim(p_source), ''),
        auth.uid()
    )
    RETURNING id INTO v_question_id;

    IF v_has_options THEN
        INSERT INTO public.question_option (question_id, content, is_correct, "order")
        SELECT
            v_question_id,
            btrim(COALESCE(opt->>'content', '')),
            COALESCE((opt->>'is_correct')::boolean, false),
            COALESCE((opt->>'order')::smallint, ord::smallint)
        FROM jsonb_array_elements(v_options) WITH ORDINALITY AS t(opt, ord)
        WHERE btrim(COALESCE(opt->>'content', '')) <> '';
    END IF;

    IF p_tag_ids IS NOT NULL AND array_length(p_tag_ids, 1) > 0 THEN
        INSERT INTO public.question_tag (question_id, tag_id)
        SELECT v_question_id, unnest(p_tag_ids)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN v_question_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_question(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, SMALLINT, TEXT, JSONB, BIGINT[]
) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Recreate update_question with admin check
-- ---------------------------------------------------------------------------
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
    -- Admin check
    IF NOT (auth.jwt()->'user_metadata'->>'is_admin')::boolean IS TRUE THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

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

-- GRANT already exists from original migration, no change needed

-- ---------------------------------------------------------------------------
-- 4. Recreate delete_question with admin check
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_question(p_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row_count INTEGER;
BEGIN
    -- Admin check
    IF NOT (auth.jwt()->'user_metadata'->>'is_admin')::boolean IS TRUE THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

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

-- GRANT already exists from original migration, no change needed

-- ---------------------------------------------------------------------------
-- 5. New: toggle_bookmark RPC (available to all authenticated users)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_bookmark(p_question_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_existing_id BIGINT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_question_id IS NULL THEN
        RAISE EXCEPTION 'question_id is required';
    END IF;

    SELECT id INTO v_existing_id
    FROM public.bookmark
    WHERE user_id = v_user_id AND question_id = p_question_id;

    IF v_existing_id IS NOT NULL THEN
        DELETE FROM public.bookmark WHERE id = v_existing_id;
        RETURN json_build_object('bookmarked', false);
    ELSE
        INSERT INTO public.bookmark (user_id, question_id)
        VALUES (v_user_id, p_question_id);
        RETURN json_build_object('bookmarked', true);
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_bookmark(BIGINT) TO authenticated;
