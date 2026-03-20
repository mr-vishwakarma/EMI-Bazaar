-- Run this query in your Supabase SQL Editor to support MULTIPLE dynamic EMI plans per product.

-- Drop the old individual columns if they exist (from the previous attempt)
ALTER TABLE public.products 
DROP COLUMN IF EXISTS emi_duration_type,
DROP COLUMN IF EXISTS emi_duration_count,
DROP COLUMN IF EXISTS interest_rate;

-- Add the new JSONB column to store an array of customized plans
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS emi_plans JSONB DEFAULT '[]'::jsonb;

-- Optional: Add a default base 6-month No-Cost plan for existing products if they don't have plans configured
UPDATE public.products 
SET emi_plans = '[{"id": "default-6mo", "type": "monthly", "duration": 6, "interestRate": 0}]'::jsonb
WHERE emi_plans IS NULL OR jsonb_array_length(emi_plans) = 0;
