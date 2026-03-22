-- 29_user_avatars_and_message_status.sql (Refined)

-- 1. Ensure avatar_url exists of users table (for admins or fallback)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Add status to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- 3. Refined helper to fetch unified profile data
CREATE OR REPLACE FUNCTION get_user_chat_profiles(p_user_ids UUID[])
RETURNS TABLE (
    id UUID,
    name TEXT,
    role TEXT,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.full_name as name,
        u.role::TEXT,
        CASE 
            WHEN u.role = 'vendor' THEN (SELECT v.logo_url FROM public.vendor_profiles v WHERE v.user_id = u.id)
            WHEN u.role = 'customer' THEN (SELECT c.avatar_url FROM public.customer_profiles c WHERE c.user_id = u.id)
            ELSE u.avatar_url 
        END as avatar_url
    FROM public.users u
    WHERE u.id = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
