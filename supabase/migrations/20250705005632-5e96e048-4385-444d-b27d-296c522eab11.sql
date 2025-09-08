-- Function to automatically handle expired subscriptions
CREATE OR REPLACE FUNCTION public.handle_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update expired subscriptions
  UPDATE public.profiles
  SET subscription_status = 'expired'
  WHERE subscription_status = 'active'
    AND subscription_expires_at <= now();
END;
$$;

-- Create a trigger function to check expiry on every read
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If subscription is active but expired, update it
  IF NEW.subscription_status = 'active' 
     AND NEW.subscription_expires_at IS NOT NULL 
     AND NEW.subscription_expires_at <= now() THEN
    NEW.subscription_status = 'expired';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that runs before any SELECT on profiles
CREATE OR REPLACE TRIGGER check_subscription_expiry_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_subscription_expiry();

-- Create a view that automatically handles expired subscriptions on read
CREATE OR REPLACE VIEW public.active_providers AS
SELECT 
  p.*,
  CASE 
    WHEN p.subscription_status = 'active' AND p.subscription_expires_at <= now() 
    THEN 'expired'::subscription_status
    ELSE p.subscription_status
  END as current_subscription_status,
  CASE 
    WHEN p.subscription_status = 'active' AND p.subscription_expires_at <= now()
    THEN false
    ELSE (p.subscription_status = 'active' OR (p.is_verified AND p.subscription_status = 'free'))
  END as is_subscription_active
FROM public.profiles p
WHERE p.is_provider = true;