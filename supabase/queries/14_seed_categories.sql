-- 14_seed_categories.sql
-- Seed default categories for products

INSERT INTO public.categories (name, icon_name) VALUES 
  ('Mobiles', 'Smartphone'), 
  ('Laptops', 'Laptop'), 
  ('Home Appliances', 'Refrigerator'), 
  ('TVs & Audio', 'Tv'), 
  ('Furniture', 'Sofa'), 
  ('Fashion', 'Shirt')
ON CONFLICT (name) DO NOTHING;
