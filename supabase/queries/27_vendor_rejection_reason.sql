-- 27_vendor_rejection_reason.sql
-- Add rejection_reason column and update get_admin_vendors RPC to return it

ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Drop function first because return type is changing
DROP FUNCTION IF EXISTS get_admin_vendors(text, text, int, int);

CREATE OR REPLACE FUNCTION get_admin_vendors(
    search_query text,
    status_filter text,
    page_number int,
    page_size int
) RETURNS TABLE (
    user_id uuid,
    email text,
    approval_status text,
    created_at timestamp with time zone,
    profile_id uuid,
    business_name text,
    category text,
    address text,
    gstin text,
    account_no text,
    ifsc text,
    pan text,
    aadhaar text,
    document_urls jsonb,
    logo_url text,
    submitted_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    total_count bigint
) AS $$
BEGIN
    RETURN QUERY 
    WITH filtered_vendors AS (
        SELECT 
            u.id as user_id, 
            u.email, 
            COALESCE(u.approval_status, 'incomplete') as approval_status, 
            u.created_at,
            vp.id as profile_id,
            vp.business_name,
            vp.category,
            vp.address,
            vp.gstin,
            vp.account_no,
            vp.ifsc,
            vp.pan,
            vp.aadhaar,
            vp.document_urls,
            vp.logo_url,
            vp.submitted_at,
            vp.reviewed_at,
            vp.rejection_reason
        FROM public.users u
        LEFT JOIN public.vendor_profiles vp ON u.id = vp.user_id
        WHERE u.role = 'vendor' 
        AND (status_filter = 'all' OR COALESCE(u.approval_status, 'incomplete') = status_filter)
        AND (
            search_query = '' 
            OR u.email ILIKE '%' || search_query || '%' 
            OR vp.business_name ILIKE '%' || search_query || '%'
        )
    ),
    counted_vendors AS (
        SELECT COUNT(*) as total_count FROM filtered_vendors
    )
    SELECT 
        fv.*,
        cv.total_count
    FROM filtered_vendors fv
    CROSS JOIN counted_vendors cv
    ORDER BY fv.created_at DESC
    LIMIT page_size OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
