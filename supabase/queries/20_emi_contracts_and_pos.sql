-- Create emi_contracts table to securely track every EMI transaction
CREATE TABLE IF NOT EXISTS public.emi_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'EMI-XYZ123'
    
    -- Relational Mappings
    customer_id UUID REFERENCES auth.users(id) NOT NULL,
    vendor_id UUID REFERENCES auth.users(id) NOT NULL,
    shop_id UUID REFERENCES public.shops(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    
    -- Finance & Pricing
    product_price NUMERIC NOT NULL,
    down_payment NUMERIC DEFAULT 0,
    principal_amount NUMERIC NOT NULL, -- product_price - down_payment
    interest_rate NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL, -- principal + interest
    
    -- EMI Blueprint 
    emi_amount NUMERIC NOT NULL,
    duration_count INTEGER NOT NULL,
    duration_type VARCHAR(20) NOT NULL, -- 'monthly' or 'weekly'
    
    -- Payment Progress
    paid_installments INTEGER DEFAULT 0,
    total_paid NUMERIC DEFAULT 0,
    next_due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'defaulted', 'pending_approval'

    -- Record Keeping
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.emi_contracts ENABLE ROW LEVEL SECURITY;

-- Vendors can view and update contracts associated with their vendor_id
CREATE POLICY "Vendors can view their contracts" 
    ON public.emi_contracts FOR SELECT 
    USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can insert contracts" 
    ON public.emi_contracts FOR INSERT 
    WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their contracts" 
    ON public.emi_contracts FOR UPDATE 
    USING (auth.uid() = vendor_id);

-- Customers can view only their own contracts
CREATE POLICY "Customers can view their contracts" 
    ON public.emi_contracts FOR SELECT 
    USING (auth.uid() = customer_id);
