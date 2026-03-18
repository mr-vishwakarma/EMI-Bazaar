-- EMI Bazaar Main Database Structure
-- This file contains the queries to initialize the core platform data.

-- 1. Create a `shops` table to store Vendor Physical Stores
CREATE TABLE IF NOT EXISTS public.shops (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  rating numeric DEFAULT 5.0,
  reviews_count integer DEFAULT 0,
  lat numeric,
  lng numeric,
  image_url text,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for Shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public shops are easily readable." ON public.shops FOR SELECT USING (true);
CREATE POLICY "Vendors can update their own shop." ON public.shops FOR UPDATE USING (auth.uid() = vendor_id);


-- 2. Create `categories` table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  icon_name text, -- String reference to Lucide icon
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are globally readable." ON public.categories FOR SELECT USING (true);


-- 3. Create `products` table 
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  description text,
  image_url text,
  features jsonb DEFAULT '[]'::jsonb,  -- Array of string features
  is_active boolean DEFAULT true,
  stock_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are globally readable." ON public.products FOR SELECT USING (is_active = true);
-- Vendors can manage their own products via the shop mapping:
CREATE POLICY "Vendors can insert products for their shop." ON public.products FOR INSERT WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE vendor_id = auth.uid())
);
CREATE POLICY "Vendors can update products for their shop." ON public.products FOR UPDATE USING (
    shop_id IN (SELECT id FROM public.shops WHERE vendor_id = auth.uid())
);
