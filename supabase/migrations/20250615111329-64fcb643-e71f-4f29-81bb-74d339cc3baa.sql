
ALTER TABLE public.profiles
ADD COLUMN rating numeric(2, 1) DEFAULT 0.0,
ADD COLUMN review_count integer DEFAULT 0,
ADD COLUMN specialties text[] DEFAULT '{}';
