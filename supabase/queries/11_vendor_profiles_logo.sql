-- Add logo_url column to vendor_profiles
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS logo_url text;
