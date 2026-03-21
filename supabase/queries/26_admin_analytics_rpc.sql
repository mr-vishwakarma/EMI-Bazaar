-- 26_admin_analytics_rpc.sql
-- RPC to fetch global platform analytics for the Admin Dashboard

CREATE OR REPLACE FUNCTION get_admin_analytics()
RETURNS json AS $$
DECLARE
    v_total_vendors bigint;
    v_total_customers bigint;
    v_total_contracts bigint;
    v_total_gmv numeric;
    v_active_contracts bigint;
    v_total_collected numeric;
BEGIN
    -- 1. Total active shops (Approved vendors)
    SELECT count(*) INTO v_total_vendors 
    FROM public.users 
    WHERE role = 'vendor' AND approval_status = 'approved';

    -- 2. Total verified customers
    SELECT count(*) INTO v_total_customers 
    FROM public.customer_profiles 
    WHERE kyc_status = 'verified';

    -- 3. Total EMI Loans Disbursed (Count of all contracts)
    SELECT count(*) INTO v_total_contracts 
    FROM public.emi_contracts;

    -- 4. Total GMV (Sum of contract total amounts)
    SELECT COALESCE(sum(total_amount), 0) INTO v_total_gmv 
    FROM public.emi_contracts;

    -- 5. Active contracts (In-progress)
    SELECT count(*) INTO v_active_contracts 
    FROM public.emi_contracts 
    WHERE status = 'active';

    -- 6. Total Collected (Sum of repayments)
    SELECT COALESCE(sum(amount), 0) INTO v_total_collected 
    FROM public.emi_repayments;

    RETURN json_build_object(
        'totalVendors', v_total_vendors,
        'totalCustomers', v_total_customers,
        'totalContracts', v_total_contracts,
        'totalGMV', v_total_gmv,
        'activeContracts', v_active_contracts,
        'totalCollected', v_total_collected
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
