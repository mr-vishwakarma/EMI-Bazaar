-- Phase 1: Repayment & Ledger System
-- Create the repayments ledger table and process_payment RPC

CREATE TABLE IF NOT EXISTS public.emi_repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.emi_contracts(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES auth.users(id) NOT NULL,
    vendor_id UUID REFERENCES auth.users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'online', -- 'online', 'cash'
    status VARCHAR(50) DEFAULT 'success',
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.emi_repayments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own repayments" ON public.emi_repayments;
CREATE POLICY "Customers can view own repayments" 
    ON public.emi_repayments FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Vendors can view own collections" ON public.emi_repayments;
CREATE POLICY "Vendors can view own collections" 
    ON public.emi_repayments FOR SELECT USING (auth.uid() = vendor_id);

-- RPC to process an EMI payment securely
CREATE OR REPLACE FUNCTION process_emi_payment(
    p_contract_id UUID,
    p_amount NUMERIC,
    p_payment_method VARCHAR DEFAULT 'online'
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_contract record;
    v_new_paid_installments INTEGER;
    v_new_total_paid NUMERIC;
    v_new_status VARCHAR;
    v_new_next_due_date DATE;
BEGIN
    -- Get contract details
    SELECT * INTO v_contract FROM public.emi_contracts WHERE id = p_contract_id;
    
    IF v_contract IS NULL THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;
    
    IF v_contract.status = 'completed' THEN
        RAISE EXCEPTION 'Contract is already fully paid';
    END IF;

    -- Update Contract
    v_new_paid_installments := v_contract.paid_installments + 1;
    v_new_total_paid := v_contract.total_paid + p_amount;
    
    IF v_new_paid_installments >= v_contract.duration_count THEN
        v_new_status := 'completed';
        v_new_next_due_date := v_contract.next_due_date; -- Doesn't matter if completed
    ELSE
        v_new_status := 'active';
        IF v_contract.duration_type = 'monthly' THEN
            v_new_next_due_date := v_contract.next_due_date + INTERVAL '1 month';
        ELSE
            v_new_next_due_date := v_contract.next_due_date + INTERVAL '1 week';
        END IF;
    END IF;

    UPDATE public.emi_contracts 
    SET paid_installments = v_new_paid_installments,
        total_paid = v_new_total_paid,
        status = v_new_status,
        next_due_date = v_new_next_due_date,
        updated_at = NOW()
    WHERE id = p_contract_id;

    -- Insert Repayment Record
    INSERT INTO public.emi_repayments (
        contract_id, customer_id, vendor_id, amount, payment_method
    ) VALUES (
        p_contract_id, v_contract.customer_id, v_contract.vendor_id, p_amount, p_payment_method
    );

    -- Free up customer credit limit proportionally
    UPDATE public.customer_profiles
    SET credit_used = GREATEST(0, credit_used - p_amount)
    WHERE user_id = v_contract.customer_id;

    RETURN json_build_object('success', true, 'status', v_new_status);
END;
$$;
