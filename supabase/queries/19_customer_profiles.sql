-- Create customer_profiles table for detailed user information and KYC status
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    address TEXT,
    dob DATE,
    aadhaar_number VARCHAR(20),
    pan_number VARCHAR(20),
    pan_url TEXT,
    aadhaar_url TEXT,
    kyc_status VARCHAR(50) DEFAULT 'unverified', -- 'unverified', 'pending', 'verified', 'rejected'
    credit_limit NUMERIC DEFAULT 15000,
    credit_used NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- If updating an existing table, safely add the new columns
ALTER TABLE public.customer_profiles 
ADD COLUMN IF NOT EXISTS pan_url TEXT,
ADD COLUMN IF NOT EXISTS aadhaar_url TEXT;

-- Drop existing policies to prevent 'already exists' errors when re-running the script
DROP POLICY IF EXISTS "Users view own profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.customer_profiles;

-- Allow users to view and edit their own profiles
CREATE POLICY "Users view own profile" 
    ON public.customer_profiles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile" 
    ON public.customer_profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile" 
    ON public.customer_profiles FOR UPDATE 
    USING (auth.uid() = user_id);
