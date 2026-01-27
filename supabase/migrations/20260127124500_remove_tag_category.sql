-- =============================================================================
-- Supabase: remove tag category and update tag RPCs
-- Created: 2026-01-27
-- =============================================================================

-- Drop old overloaded functions that reference tag.category
DROP FUNCTION IF EXISTS public.get_tags(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.create_tag(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_tag(BIGINT, TEXT, TEXT);

-- Remove column and index
DROP INDEX IF EXISTS idx_tag_category;
ALTER TABLE public.tag DROP COLUMN IF EXISTS category;

-- Recreate tag RPCs without category
CREATE OR REPLACE FUNCTION public.get_tags(
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  v_limit INTEGER;
  v_offset INTEGER;
  total_count INTEGER;
BEGIN
  v_limit := COALESCE(p_limit, 50);
  v_limit := LEAST(GREATEST(v_limit, 1), 100);
  v_offset := COALESCE(p_offset, 0);
  IF v_offset < 0 THEN
    v_offset := 0;
  END IF;

  SELECT COUNT(*) INTO total_count
  FROM public.tag t
  WHERE (p_search IS NULL OR t.name ILIKE '%' || p_search || '%');

  SELECT json_build_object(
    'results', COALESCE(json_agg(tag_data), '[]'::json),
    'count', total_count,
    'limit', v_limit,
    'offset', v_offset
  ) INTO result
  FROM (
    SELECT json_build_object(
      'id', t.id,
      'name', t.name,
      'created_at', t.created_at
    ) AS tag_data
    FROM public.tag t
    WHERE (p_search IS NULL OR t.name ILIKE '%' || p_search || '%')
    ORDER BY t.name ASC
    LIMIT v_limit
    OFFSET v_offset
  ) sub;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tag_detail(p_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', t.id,
    'name', t.name,
    'created_at', t.created_at
  ) INTO result
  FROM public.tag t
  WHERE t.id = p_id;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_tag(
  p_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  result JSON;
BEGIN
  v_name := btrim(p_name);
  IF v_name IS NULL OR v_name = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;

  INSERT INTO public.tag (name)
  VALUES (v_name)
  ON CONFLICT (name)
  DO UPDATE SET name = EXCLUDED.name
  RETURNING json_build_object(
    'id', id,
    'name', name,
    'created_at', created_at,
    'inserted', (xmax = 0)
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_tag(
  p_id BIGINT,
  p_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  result JSON;
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'id is required';
  END IF;

  v_name := btrim(p_name);
  IF v_name IS NULL OR v_name = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;

  UPDATE public.tag
  SET name = v_name
  WHERE id = p_id
  RETURNING json_build_object(
    'id', id,
    'name', name,
    'created_at', created_at
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_tag(p_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  DELETE FROM public.tag
  WHERE id = p_id
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Tag not found');
  END IF;

  RETURN json_build_object('success', TRUE, 'id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tags(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tag_detail(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tag(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tag(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tag(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tags(TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tag_detail(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_tag(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_tag(BIGINT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_tag(BIGINT) TO service_role;
