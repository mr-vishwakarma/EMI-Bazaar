-- 15_categories_rls_update.sql
-- Allow authenticated vendors to insert new custom categories

CREATE POLICY "Vendors can insert categories." ON public.categories 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
