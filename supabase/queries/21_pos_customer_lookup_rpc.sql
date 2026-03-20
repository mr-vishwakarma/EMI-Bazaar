-- ==========================================
-- DEBUG: Run this first to see stored phones
-- ==========================================
SELECT id, full_name, phone, email, role 
FROM public.users 
WHERE role = 'customer'
ORDER BY created_at DESC;

-- ==========================================
-- FIXED RPC: Drop and recreate with flexible
-- phone matching (handles all formats)
-- ==========================================
DROP FUNCTION IF EXISTS public.get_customer_by_phone(TEXT);

CREATE OR REPLACE FUNCTION public.get_customer_by_phone(p_phone TEXT)
RETURNS SETOF json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    result json;
    -- Normalize: strip everything except digits
    clean_input TEXT := regexp_replace(p_phone, '[^0-9]', '', 'g');
BEGIN
    SELECT row_to_json(t) INTO result
    FROM (
        SELECT
            u.id::text                                          AS user_id,
            COALESCE(u.full_name, '')                          AS full_name,
            COALESCE(u.email, '')                              AS email,
            COALESCE(cp.kyc_status, 'unverified')             AS kyc_status,
            COALESCE(cp.avatar_url, '')                        AS avatar_url,
            COALESCE(cp.pan_number, '')                        AS pan_number,
            COALESCE(cp.pan_url, '')                           AS pan_url,
            COALESCE(cp.aadhaar_number, '')                    AS aadhaar_number,
            COALESCE(cp.aadhaar_url, '')                       AS aadhaar_url,
            COALESCE(cp.credit_limit, 15000)::numeric          AS credit_limit,
            COALESCE(cp.credit_used, 0)::numeric               AS credit_used,
            COALESCE(cp.id::text, '')                          AS profile_id
        FROM public.users u
        LEFT JOIN public.customer_profiles cp ON cp.user_id = u.id
        WHERE
            -- Match raw stored value
            u.phone = p_phone OR cp.phone = p_phone
            -- Match digits-only stripped version against digits-only stored value
            OR regexp_replace(u.phone, '[^0-9]', '', 'g') = clean_input
            OR regexp_replace(cp.phone, '[^0-9]', '', 'g') = clean_input
            -- Match last 10 digits (handles country prefix differences)
            OR RIGHT(regexp_replace(u.phone, '[^0-9]', '', 'g'), 10) = RIGHT(clean_input, 10)
            OR RIGHT(regexp_replace(cp.phone, '[^0-9]', '', 'g'), 10) = RIGHT(clean_input, 10)
        -- No role restriction so test users without role also match; filter client-side
        LIMIT 1
    ) t;

    IF result IS NULL THEN
        RETURN;
    END IF;

    RETURN NEXT result;
    RETURN;
END;
$$;

-- Grant access to authenticated users (vendors are authenticated)
GRANT EXECUTE ON FUNCTION public.get_customer_by_phone(TEXT) TO authenticated;

-- ==========================================
-- Quick test (replace with your phone number)
-- ==========================================
-- SELECT * FROM public.get_customer_by_phone('9876543210');
