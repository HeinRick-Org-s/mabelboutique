-- Create storage bucket for product media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-media',
  'product-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
);

-- RLS Policies for product-media bucket
-- Allow public to view files
CREATE POLICY "Public can view product media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-media');

-- Allow authenticated users (admins) to upload files
CREATE POLICY "Authenticated users can upload product media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-media');

-- Allow authenticated users (admins) to update files
CREATE POLICY "Authenticated users can update product media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-media');

-- Allow authenticated users (admins) to delete files
CREATE POLICY "Authenticated users can delete product media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-media');