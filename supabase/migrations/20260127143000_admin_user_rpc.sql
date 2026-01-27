-- Admin user management RPCs

CREATE OR REPLACE FUNCTION public.assert_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND COALESCE((u.raw_user_meta_data->>'is_admin')::boolean, false) = true
  ) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_users_admin()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  PERFORM public.assert_admin();

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    COALESCE((u.raw_user_meta_data->>'is_admin')::boolean, false) AS is_admin
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_admin(
  p_user_id uuid,
  p_is_admin boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  PERFORM public.assert_admin();

  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_admin}',
    to_jsonb(p_is_admin),
    true
  )
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.assert_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_users_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_user_admin(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_users_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_admin(uuid, boolean) TO authenticated;
