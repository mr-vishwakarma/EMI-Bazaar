-- Fix RLS constraints on `users` table to avoid recursive policy errors
-- Run this in Supabase SQL Editor

-- 1. Create a secure function to check for admin role without triggering circular RLS references
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Drop existing admin policies if any
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- 3. Replace the basic "Users can view their own profile" with a more comprehensive one
DROP POLICY IF EXISTS "Users can view their own profile." ON public.users;
CREATE POLICY "Users and admins can view profiles"
ON public.users
FOR SELECT
USING (
  id = auth.uid() OR public.is_admin()
);

-- 4. Replace the "Users can update their own profile" with a comprehensive one
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
CREATE POLICY "Users and admins can update profiles"
ON public.users
FOR UPDATE
USING (
  id = auth.uid() OR public.is_admin()
)
WITH CHECK (
  id = auth.uid() OR public.is_admin()
);
