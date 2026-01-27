-- Grant insert privilege for auth admin/service role on user credits
GRANT INSERT ON TABLE public.user_credits_mvp TO supabase_auth_admin;
GRANT INSERT ON TABLE public.user_credits_mvp TO service_role;
