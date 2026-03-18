    -- Product Upgrades for Quick EMI Search
    -- Adds a unique short_tag for physical store search and image_gallery for multiple angles.

    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_tag text UNIQUE;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_gallery jsonb DEFAULT '[]'::jsonb;

    -- Create an index to make short_tag queries super fast since it will be widely used across apps
    CREATE INDEX IF NOT EXISTS products_short_tag_idx ON public.products(short_tag);
