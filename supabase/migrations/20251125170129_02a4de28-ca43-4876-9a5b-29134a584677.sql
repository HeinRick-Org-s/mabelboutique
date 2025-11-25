-- Add variants column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- Remove old columns that will be replaced by variants
ALTER TABLE products DROP COLUMN IF EXISTS sizes;
ALTER TABLE products DROP COLUMN IF EXISTS colors;
ALTER TABLE products DROP COLUMN IF EXISTS stock;

-- Create index on variants for better query performance
CREATE INDEX IF NOT EXISTS idx_products_variants ON products USING GIN (variants);

COMMENT ON COLUMN products.variants IS 'Array of product variants with color, size, and stock. Format: [{"color": "Blue", "size": "M", "stock": 10}]';