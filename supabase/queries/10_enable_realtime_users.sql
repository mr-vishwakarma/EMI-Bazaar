-- Enable Realtime for users table so vendor dashboard updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
