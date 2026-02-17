-- Exam CRUD RPC functions
-- create_exam, update_exam, delete_exam, add_exam_question, remove_exam_question

-- Helper: check if current user is admin
-- Used inline in each function since PL/pgSQL doesn't support reusable helpers across functions easily.

-- ============================================
-- create_exam
-- ============================================
CREATE OR REPLACE FUNCTION public.create_exam(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_time_limit INT DEFAULT 60,
  p_publish BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_row public.exam%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.exam (name, description, time_limit, publish, creator)
  VALUES (
    COALESCE(NULLIF(TRIM(p_name), ''), 'Untitled Exam'),
    NULLIF(TRIM(COALESCE(p_description, '')), ''),
    COALESCE(p_time_limit, 60),
    COALESCE(p_publish, false),
    v_user_id
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'description', v_row.description,
    'time_limit', v_row.time_limit,
    'publish', v_row.publish,
    'creator', v_row.creator,
    'created_at', v_row.created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_exam(TEXT, TEXT, INT, BOOLEAN) TO authenticated;

-- ============================================
-- update_exam
-- ============================================
CREATE OR REPLACE FUNCTION public.update_exam(
  p_id BIGINT,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_time_limit INT DEFAULT NULL,
  p_publish BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_row public.exam%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_is_admin := COALESCE(
    (auth.jwt()->'user_metadata'->>'is_admin')::boolean,
    false
  );

  IF NOT v_is_admin THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.exam WHERE id = p_id AND creator = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Exam not found or access denied';
    END IF;
  END IF;

  UPDATE public.exam
  SET
    name        = COALESCE(NULLIF(TRIM(p_name), ''), name),
    description = CASE WHEN p_description IS NOT NULL THEN NULLIF(TRIM(p_description), '') ELSE description END,
    time_limit  = COALESCE(p_time_limit, time_limit),
    publish     = COALESCE(p_publish, publish),
    updated_at  = now()
  WHERE id = p_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Exam not found';
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'description', v_row.description,
    'time_limit', v_row.time_limit,
    'publish', v_row.publish,
    'creator', v_row.creator,
    'created_at', v_row.created_at,
    'updated_at', v_row.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_exam(BIGINT, TEXT, TEXT, INT, BOOLEAN) TO authenticated;

-- ============================================
-- delete_exam
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_exam(
  p_id BIGINT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_deleted_id BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_is_admin := COALESCE(
    (auth.jwt()->'user_metadata'->>'is_admin')::boolean,
    false
  );

  IF NOT v_is_admin THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.exam WHERE id = p_id AND creator = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Exam not found or access denied';
    END IF;
  END IF;

  DELETE FROM public.exam WHERE id = p_id RETURNING id INTO v_deleted_id;

  IF v_deleted_id IS NULL THEN
    RAISE EXCEPTION 'Exam not found';
  END IF;

  RETURN json_build_object('success', true, 'id', v_deleted_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_exam(BIGINT) TO authenticated;

-- ============================================
-- add_exam_question
-- ============================================
CREATE OR REPLACE FUNCTION public.add_exam_question(
  p_exam_id BIGINT,
  p_question_id BIGINT,
  p_order SMALLINT DEFAULT 1,
  p_points DECIMAL(5,2) DEFAULT 1.0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_new_id BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_is_admin := COALESCE(
    (auth.jwt()->'user_metadata'->>'is_admin')::boolean,
    false
  );

  IF NOT v_is_admin THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.exam WHERE id = p_exam_id AND creator = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Exam not found or access denied';
    END IF;
  END IF;

  INSERT INTO public.exam_question (exam_id, question_id, "order", points)
  VALUES (p_exam_id, p_question_id, p_order, COALESCE(p_points, 1.0))
  RETURNING id INTO v_new_id;

  RETURN json_build_object('success', true, 'id', v_new_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_exam_question(BIGINT, BIGINT, SMALLINT, DECIMAL) TO authenticated;

-- ============================================
-- remove_exam_question
-- ============================================
CREATE OR REPLACE FUNCTION public.remove_exam_question(
  p_exam_id BIGINT,
  p_exam_question_id BIGINT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_deleted_id BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_is_admin := COALESCE(
    (auth.jwt()->'user_metadata'->>'is_admin')::boolean,
    false
  );

  IF NOT v_is_admin THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.exam WHERE id = p_exam_id AND creator = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Exam not found or access denied';
    END IF;
  END IF;

  DELETE FROM public.exam_question
  WHERE id = p_exam_question_id AND exam_id = p_exam_id
  RETURNING id INTO v_deleted_id;

  IF v_deleted_id IS NULL THEN
    RAISE EXCEPTION 'Exam question not found';
  END IF;

  RETURN json_build_object('success', true, 'id', v_deleted_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_exam_question(BIGINT, BIGINT) TO authenticated;
