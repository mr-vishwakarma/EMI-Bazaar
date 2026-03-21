-- 30_razorpay_transactions.sql
-- Create Razorpay transactions table and update existing tables

-- 1. Create razorpay_transactions table
CREATE TABLE IF NOT EXISTS public.razorpay_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users(id),
    contract_id     UUID REFERENCES public.emi_contracts(id),   -- optional, for repayments
    order_id        TEXT NOT NULL,         -- Razorpay order_id (created server-side)
    payment_id      TEXT,                  -- Razorpay payment_id (after success)
    signature       TEXT,                  -- Razorpay signature (for verification)
    amount          NUMERIC NOT NULL,      -- Amount in PAISE (e.g. 50000 = ₹500)
    currency        TEXT DEFAULT 'INR',
    status          TEXT DEFAULT 'created', -- 'created' | 'paid' | 'failed' | 'refunded'
    receipt_number  TEXT,                  -- Human-readable receipt (e.g. RCP-2024-0001)
    purpose         TEXT,                  -- 'emi_repayment' | 'checkout'
    metadata        JSONB,                 -- Extra info: product_id, emi_number, etc.
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.razorpay_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own transactions
CREATE POLICY "Users can view their own transactions"
    ON public.razorpay_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins view all transactions"
    ON public.razorpay_transactions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 2. Update emi_repayments table
-- Add a column to link a repayment to a transaction
ALTER TABLE public.emi_repayments 
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.razorpay_transactions(id);

-- 3. Auto-incrementing Receipt Number
CREATE SEQUENCE IF NOT EXISTS receipt_seq START 1001;

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := 'RCP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('receipt_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_receipt_number ON public.razorpay_transactions;
CREATE TRIGGER trg_generate_receipt_number
    BEFORE INSERT ON public.razorpay_transactions
    FOR EACH ROW
    EXECUTE FUNCTION generate_receipt_number();
