
-- Create a table for reviews
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_review UNIQUE (provider_id, user_id)
);

-- Enable RLS for the reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews table
CREATE POLICY "Reviews are viewable by everyone."
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own reviews."
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews."
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews."
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

-- Create a function to update provider's rating
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_provider_id := OLD.provider_id;
  ELSE
    v_provider_id := NEW.provider_id;
  END IF;

  WITH stats AS (
    SELECT
      COALESCE(AVG(rating), 0) as avg_rating,
      COUNT(id) as review_count
    FROM public.reviews
    WHERE provider_id = v_provider_id
  )
  UPDATE public.profiles
  SET
    rating = stats.avg_rating,
    review_count = stats.review_count
  FROM stats
  WHERE id = v_provider_id;

  RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$;

-- Create a trigger to call the function after a review is inserted, updated, or deleted
CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE PROCEDURE public.update_provider_rating();

