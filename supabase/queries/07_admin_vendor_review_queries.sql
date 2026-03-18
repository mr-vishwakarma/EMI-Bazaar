-- ============================================================
-- 07_admin_vendor_review_queries.sql
-- Useful SQL queries for Admin to review vendor applications
-- Run in Supabase SQL Editor as needed
-- ============================================================

-- 1. View ALL submitted vendor profiles with full details
SELECT
    vp.id                  AS profile_id,
    vp.business_name,
    vp.category,
    vp.address,
    vp.gstin,
    vp.pan,
    vp.aadhaar,
    vp.account_no,
    vp.ifsc,
    vp.submitted_at,
    vp.reviewed_at,
    u.id                   AS user_id,
    u.email,
    u.full_name,
    u.approval_status,
    u.created_at           AS account_created_at
FROM public.vendor_profiles vp
JOIN public.users u ON u.id = vp.user_id
ORDER BY vp.submitted_at DESC;


-- 2. View ONLY pending vendors (needs review)
SELECT
    vp.business_name,
    vp.category,
    vp.address,
    vp.gstin,
    vp.pan,
    u.email,
    u.approval_status,
    vp.submitted_at
FROM public.vendor_profiles vp
JOIN public.users u ON u.id = vp.user_id
WHERE u.approval_status = 'pending'
ORDER BY vp.submitted_at ASC;  -- Oldest first (FIFO review)


-- 3. Approve a vendor (replace <user_id> with actual UUID)
-- UPDATE public.users
-- SET
--     approval_status = 'approved',
--     updated_at = now()
-- WHERE id = '<user_id>';

-- Also mark the profile as reviewed:
-- UPDATE public.vendor_profiles
-- SET reviewed_at = now()
-- WHERE user_id = '<user_id>';


-- 4. Decline a vendor
-- UPDATE public.users
-- SET approval_status = 'rejected'
-- WHERE id = '<user_id>';


-- 5. Suspend an already-approved vendor
-- UPDATE public.users
-- SET approval_status = 'rejected'
-- WHERE id = '<user_id>' AND approval_status = 'approved';


-- 6. View summary counts by approval status
SELECT
    approval_status,
    COUNT(*) AS total
FROM public.users
WHERE role = 'vendor'
GROUP BY approval_status;


-- 7. Add document_urls column to vendor_profiles (for storing uploaded doc links)
ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS document_urls jsonb DEFAULT '[]'::jsonb;

-- When vendor uploads docs, the app will store URLs like:
-- [{ "type": "gst_certificate", "url": "https://..." }, { "type": "cancelled_cheque", "url": "..." }]
