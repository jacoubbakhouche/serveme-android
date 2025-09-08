
-- Add image_urls column to services table to store image links
ALTER TABLE public.services
ADD COLUMN image_urls TEXT[];

-- Create a storage bucket for service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true);

-- Add RLS policies for the new service-images bucket to allow public access and user actions
CREATE POLICY "Service images are publicly viewable."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'service-images' );

CREATE POLICY "Anyone can upload a service image."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'service-images' );

CREATE POLICY "Users can update their own service images."
    ON storage.objects FOR UPDATE
    USING ( auth.uid() = owner AND bucket_id = 'service-images' );

CREATE POLICY "Users can delete their own service images."
    ON storage.objects FOR DELETE
    USING ( auth.uid() = owner AND bucket_id = 'service-images' );

