-- Vendor Profiles Table
-- Stores full registration details submitted by vendors for admin review

CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  business_name text,
  category text,
  address text,
  gstin text,
  account_no text,
  ifsc text,
  pan text,
  aadhaar text,
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.users(id)
);

-- RLS: Vendors can insert/update their own profile
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own profile."
ON public.vendor_profiles
FOR ALL
USING (auth.uid() = user_id);

-- Admins can read all vendor profiles (they have role = 'admin')
CREATE POLICY "Admins can view all vendor profiles."
ON public.vendor_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update vendor profiles (e.g., add reviewed_by, reviewed_at)
CREATE POLICY "Admins can update vendor profiles."
ON public.vendor_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
