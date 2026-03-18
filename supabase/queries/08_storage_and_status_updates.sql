-- ============================================================
-- 08_storage_and_status_updates.sql
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add 'suspended' to valid approval_status values
--    (Supabase doesn't enforce enums by default on text columns,
--     but this comment documents the expected values)
-- Valid values: 'incomplete' | 'pending' | 'approved' | 'rejected' | 'suspended'

-- 2. Make sure vendor_profiles has document_urls column
ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS document_urls jsonb DEFAULT '[]'::jsonb;

-- 3. Make sure reviewed_at and reviewed_by exist on vendor_profiles
ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS review_note text;

-- 4. Create Supabase Storage bucket for vendor documents
-- Name: vendor-documents
-- Public: true (so admin can see documents via public URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. RLS for storage: Clean up existing policies first to avoid "already exists" errors
DROP POLICY IF EXISTS "Vendors can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all vendor documents" ON storage.objects;

-- Re-create policies
CREATE POLICY "Vendors can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-documents' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Vendors can read their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vendor-documents' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Admins can read all vendor documents
CREATE POLICY "Admins can read all vendor documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vendor-documents' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 6. Useful query: View all vendor profiles with full details + doc count
SELECT
    vp.id                                          AS profile_id,
    vp.business_name,
    vp.category,
    vp.address,
    vp.gstin,
    vp.pan,
    vp.aadhaar,
    vp.account_no,
    vp.ifsc,
    jsonb_array_length(COALESCE(vp.document_urls, '[]'::jsonb)) AS doc_count,
    vp.submitted_at,
    vp.reviewed_at,
    vp.review_note,
    u.id                                           AS user_id,
    u.email,
    u.approval_status,
    u.created_at                                   AS account_created_at
FROM public.vendor_profiles vp
JOIN public.users u ON u.id = vp.user_id
ORDER BY
    CASE u.approval_status
        WHEN 'pending'    THEN 1
        WHEN 'incomplete' THEN 2
        WHEN 'approved'   THEN 3
        WHEN 'suspended'  THEN 4
        ELSE 5
    END,
    vp.submitted_at ASC;
