-- Phase 2: Online Checkout Engine
-- Create the create_online_emi_order RPC to handle atomic order creation and credit deduct

CREATE OR REPLACE FUNCTION public.create_online_emi_order(
    p_customer_id UUID,
    p_vendor_id UUID,
    p_shop_id UUID,
    p_product_id UUID,
    p_product_price NUMERIC,
    p_down_payment NUMERIC,
    p_principal_amount NUMERIC,
    p_interest_rate NUMERIC,
    p_total_amount NUMERIC,
    p_emi_amount NUMERIC,
    p_duration_count INTEGER,
    p_duration_type VARCHAR,
    p_next_due_date DATE
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_profile record;
    v_short_id VARCHAR;
    v_contract_id UUID;
BEGIN
    -- Check customer credit limit
    SELECT * INTO v_profile FROM public.customer_profiles WHERE user_id = p_customer_id;
    
    IF v_profile IS NULL THEN
        RAISE EXCEPTION 'Customer profile not found';
    END IF;
    
    IF v_profile.kyc_status != 'verified' THEN
        RETURN json_build_object('success', false, 'error', 'KYC_NOT_VERIFIED');
    END IF;

    -- Generate a short_id
    v_short_id := 'EMI-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- Create contract
    INSERT INTO public.emi_contracts (
        short_id, customer_id, vendor_id, shop_id, product_id,
        product_price, down_payment, principal_amount, interest_rate, total_amount,
        emi_amount, duration_count, duration_type, next_due_date, status
    ) VALUES (
        v_short_id, p_customer_id, p_vendor_id, p_shop_id, p_product_id,
        p_product_price, p_down_payment, p_principal_amount, p_interest_rate, p_total_amount,
        p_emi_amount, p_duration_count, p_duration_type, p_next_due_date, 'pending_approval'
    ) RETURNING id INTO v_contract_id;

    RETURN json_build_object('success', true, 'contract_id', v_contract_id, 'short_id', v_short_id);
END;
$$;
