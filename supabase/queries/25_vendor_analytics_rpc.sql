/*******************************************************************************
 * 25_vendor_analytics_rpc.sql
 * Unified analytics for vendors to see performance over time.
 ******************************************************************************/

CREATE OR REPLACE FUNCTION public.get_vendor_analytics(p_vendor_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_revenue NUMERIC := 0;
    v_total_collected NUMERIC := 0;
    v_active_contracts INTEGER := 0;
    v_completed_contracts INTEGER := 0;
    v_total_customers INTEGER := 0;
    v_sales_chart json;
    v_repayments_chart json;
BEGIN
    -- 1. Total lifetime revenue from all non-rejected contracts
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_revenue 
    FROM public.emi_contracts 
    WHERE vendor_id = p_vendor_id AND status != 'rejected';

    -- 2. Total lifetime collections
    SELECT COALESCE(SUM(amount), 0) INTO v_total_collected
    FROM public.emi_repayments 
    WHERE vendor_id = p_vendor_id;

    -- 3. Static counts
    SELECT COUNT(*) INTO v_active_contracts FROM public.emi_contracts WHERE vendor_id = p_vendor_id AND status IN ('active', 'defaulted');
    SELECT COUNT(*) INTO v_completed_contracts FROM public.emi_contracts WHERE vendor_id = p_vendor_id AND status = 'completed';
    SELECT COUNT(DISTINCT customer_id) INTO v_total_customers FROM public.emi_contracts WHERE vendor_id = p_vendor_id;

    -- 4. Sales History (last 6 months)
    WITH sales_history AS (
        SELECT 
            TO_CHAR(date_trunc('month', created_at), 'Month') as month_name,
            SUM(total_amount) as sales,
            date_trunc('month', created_at) as sort_date
        FROM public.emi_contracts
        WHERE vendor_id = p_vendor_id AND status != 'rejected'
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY 1, 3
        ORDER BY 3 ASC
    )
    SELECT json_agg(json_build_object('name', substring(TRIM(month_name) from 1 for 3), 'value', sales)) INTO v_sales_chart FROM sales_history;

    -- 5. Repayments History (last 6 months)
    WITH reps_history AS (
        SELECT 
            TO_CHAR(date_trunc('month', paid_at), 'Month') as month_name,
            SUM(amount) as collected,
            date_trunc('month', paid_at) as sort_date
        FROM public.emi_repayments
        WHERE vendor_id = p_vendor_id
          AND paid_at >= NOW() - INTERVAL '12 months'
        GROUP BY 1, 3
        ORDER BY 3 ASC
    )
    SELECT json_agg(json_build_object('name', substring(TRIM(month_name) from 1 for 3), 'value', collected)) INTO v_repayments_chart FROM reps_history;

    RETURN json_build_object(
        'totalRevenue', v_total_revenue,
        'totalCollected', v_total_collected,
        'activeContracts', v_active_contracts,
        'completedContracts', v_completed_contracts,
        'totalCustomers', v_total_customers,
        'salesData', COALESCE(v_sales_chart, '[]'::json),
        'repaymentsData', COALESCE(v_repayments_chart, '[]'::json)
    );
END;
$$;
