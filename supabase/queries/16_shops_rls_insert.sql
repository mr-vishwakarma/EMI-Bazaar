-- 16_shops_rls_insert.sql
-- Allow authenticated vendors to create their shop store

CREATE POLICY "Vendors can insert their own shop." ON public.shops
FOR INSERT WITH CHECK (auth.uid() = vendor_id);
