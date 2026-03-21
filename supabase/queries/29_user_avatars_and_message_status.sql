-- 29_user_avatars_and_message_status.sql
-- Enhancing User Profiles with Avatars and Chat with Status Ticks

-- 1. Add avatar_url to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Add status to chat_messages (complementing is_read)
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent'; -- 'sent', 'delivered', 'seen'

-- 3. Update existing messages to reflect seen status if they are read
UPDATE public.chat_messages SET status = 'seen' WHERE is_read = true;
UPDATE public.chat_messages SET status = 'delivered' WHERE is_read = false;

-- 4. RPC to fetch user profile with role-specific data (unifying avatar logic)
CREATE OR REPLACE FUNCTION get_user_navbar_data(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    role TEXT,
    avatar_url TEXT,
    shop_logo TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.full_name,
        u.role::TEXT,
        u.avatar_url,
        v.logo_url as shop_logo
    FROM public.users u
    LEFT JOIN public.vendor_profiles v ON v.user_id = u.id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
