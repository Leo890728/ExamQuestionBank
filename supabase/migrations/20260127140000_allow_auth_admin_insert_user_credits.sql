-- Allow auth admin to insert user credits (for auth.users trigger)
CREATE POLICY "Auth admin can insert credits"
  ON public.user_credits_mvp
  FOR INSERT
  TO supabase_auth_admin
  WITH CHECK (true);
