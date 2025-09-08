
-- First, let's create a new ENUM type to represent the possible subscription statuses.
-- This keeps the data clean and consistent.
CREATE TYPE public.subscription_status AS ENUM ('free', 'pending_payment', 'active', 'expired', 'cancelled');

-- Now, let's add the new columns to the profiles table.
ALTER TABLE public.profiles
ADD COLUMN subscription_status public.subscription_status NOT NULL DEFAULT 'free',
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Add comments for future reference.
COMMENT ON COLUMN public.profiles.subscription_status IS 'The current subscription status of the user, primarily for providers.';
COMMENT ON COLUMN public.profiles.subscription_expires_at IS 'The date and time when the current active subscription expires.';
