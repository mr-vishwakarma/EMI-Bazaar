-- Add approval_status to track Vendor onboarding/approval state
-- Run this in Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS approval_status text 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'incomplete')) 
DEFAULT 'incomplete';

-- When a vendor completes registration and submits docs, update to 'pending'
-- UPDATE public.users SET approval_status = 'pending' WHERE id = '<vendor_user_id>';

-- When admin approves a vendor:
-- UPDATE public.users SET approval_status = 'approved' WHERE id = '<vendor_user_id>';

-- View all vendors pending approval:
-- SELECT id, email, full_name, approval_status FROM public.users WHERE role = 'vendor';
