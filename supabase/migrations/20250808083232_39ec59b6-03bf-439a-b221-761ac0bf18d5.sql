-- Fix remaining security definer function issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If subscription is active but expired, update it
  IF NEW.subscription_status = 'active' 
     AND NEW.subscription_expires_at IS NOT NULL 
     AND NEW.subscription_expires_at <= now() THEN
    NEW.subscription_status = 'expired';
  END IF;
  
  RETURN NEW;
END;
$function$;