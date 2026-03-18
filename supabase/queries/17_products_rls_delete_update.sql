-- 17_products_rls_delete_update.sql
-- Allow vendors to update and delete their own products

-- Drop policies to avoid 'already exists' error when running multiple times
DROP POLICY IF EXISTS "Vendors can update products for their shop." ON public.products;
DROP POLICY IF EXISTS "Vendors can delete products for their shop." ON public.products;

CREATE POLICY "Vendors can update products for their shop." ON public.products FOR UPDATE USING (
    shop_id IN (SELECT id FROM public.shops WHERE vendor_id = auth.uid())
);

CREATE POLICY "Vendors can delete products for their shop." ON public.products FOR DELETE USING (
    shop_id IN (SELECT id FROM public.shops WHERE vendor_id = auth.uid())
);
