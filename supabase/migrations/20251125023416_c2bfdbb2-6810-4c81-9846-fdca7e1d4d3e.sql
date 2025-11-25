-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can upload product media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update product media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete product media" ON storage.objects;
DROP POLICY IF EXISTS "Product media is publicly accessible" ON storage.objects;

-- Create permissive policies for product-media bucket
CREATE POLICY "Anyone can upload to product-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-media');

CREATE POLICY "Anyone can update product-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-media');

CREATE POLICY "Anyone can delete from product-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-media');

CREATE POLICY "Product media is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-media');