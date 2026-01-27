-- Fix auth.users trigger to bypass RLS safely
CREATE OR REPLACE FUNCTION public.initialize_user_credits_mvp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits_mvp (user_id, credits, total_earned)
  VALUES (NEW.id, 100, 100)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure trigger uses the updated function
DROP TRIGGER IF EXISTS trigger_initialize_user_credits_mvp ON auth.users;
CREATE TRIGGER trigger_initialize_user_credits_mvp
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.initialize_user_credits_mvp();
