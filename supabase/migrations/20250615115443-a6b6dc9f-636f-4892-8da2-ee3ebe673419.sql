
-- Create table for provider portfolio
CREATE TABLE public.provider_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_portfolios ENABLE ROW LEVEL SECURITY;

-- Policy: Providers can view their own portfolio items
CREATE POLICY "Providers can view their own portfolio"
ON public.provider_portfolios
FOR SELECT
USING (auth.uid() = provider_id);

-- Policy: Providers can insert their own portfolio items
CREATE POLICY "Providers can create their own portfolio items"
ON public.provider_portfolios
FOR INSERT
WITH CHECK (auth.uid() = provider_id);

-- Policy: Providers can update their own portfolio items
CREATE POLICY "Providers can update their own portfolio items"
ON public.provider_portfolios
FOR UPDATE
USING (auth.uid() = provider_id);

-- Policy: Providers can delete their own portfolio items
CREATE POLICY "Providers can delete their own portfolio items"
ON public.provider_portfolios
FOR DELETE
USING (auth.uid() = provider_id);

-- Create a storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for portfolio-images bucket
-- Allow public read access
CREATE POLICY "Portfolio images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'portfolio-images' );

-- Allow authenticated users (providers) to upload to their folder
CREATE POLICY "Providers can upload their own portfolio images."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Allow providers to update their own images
CREATE POLICY "Providers can update their own portfolio images."
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Allow providers to delete their own images
CREATE POLICY "Providers can delete their own portfolio images."
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1] );
