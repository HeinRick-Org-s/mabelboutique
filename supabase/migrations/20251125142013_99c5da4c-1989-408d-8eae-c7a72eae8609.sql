-- Add stock and visibility fields to products table
ALTER TABLE public.products
ADD COLUMN stock integer NOT NULL DEFAULT 0,
ADD COLUMN is_visible boolean NOT NULL DEFAULT true;

-- Add check constraint to ensure stock is not negative
ALTER TABLE public.products
ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);

-- Add index for better query performance on is_visible
CREATE INDEX idx_products_is_visible ON public.products(is_visible);