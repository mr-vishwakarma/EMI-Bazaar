-- How to manually promote a user to 'admin' role in Supabase

-- STEP 1: First, create your Admin user manually in the Supabase Dashboard
-- (Authentication -> Add user -> Create new user). 
-- Use an email like 'admin@emibazaar.com'.

-- STEP 2: Run this exact update query to change their role from 'customer' to 'admin'.
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@emibazaar.com';

-- Now you can login successfully via the Admin tab on your website!
