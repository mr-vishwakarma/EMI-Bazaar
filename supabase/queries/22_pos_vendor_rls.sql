-- Allow vendors to view, insert, and update customer profiles during POS checkout
-- This resolves the "new row violates row-level security policy" error

-- 1. Vendor Select Policy
DROP POLICY IF EXISTS "Vendors can view customer profiles" ON public.customer_profiles;
CREATE POLICY "Vendors can view customer profiles"
ON public.customer_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid() AND public.users.role = 'vendor'
  )
);

-- 2. Vendor Insert Policy
DROP POLICY IF EXISTS "Vendors can insert customer profiles" ON public.customer_profiles;
CREATE POLICY "Vendors can insert customer profiles"
ON public.customer_profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid() AND public.users.role = 'vendor'
  )
);

-- 3. Vendor Update Policy
DROP POLICY IF EXISTS "Vendors can update customer profiles" ON public.customer_profiles;
CREATE POLICY "Vendors can update customer profiles"
ON public.customer_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid() AND public.users.role = 'vendor'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid() AND public.users.role = 'vendor'
  )
);
