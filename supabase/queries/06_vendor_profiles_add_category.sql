-- Fix: Add 'category' column to vendor_profiles if not already present
-- Run this in Supabase SQL Editor AFTER running 05_vendor_profiles_table.sql

ALTER TABLE public.vendor_profiles 
ADD COLUMN IF NOT EXISTS category text;

-- (Optional) View all submitted vendor profiles:
-- SELECT vp.business_name, vp.category, vp.address, vp.gstin, vp.pan, u.email, u.approval_status
-- FROM public.vendor_profiles vp
-- JOIN public.users u ON u.id = vp.user_id
-- ORDER BY vp.submitted_at DESC;
