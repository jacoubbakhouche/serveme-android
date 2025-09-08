-- Fix critical database security issues

-- 1. Fix all security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_admin_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin' 
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_expired_subscriptions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update expired subscriptions
  UPDATE public.profiles
  SET subscription_status = 'expired'
  WHERE subscription_status = 'active'
    AND subscription_expires_at <= now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_provider_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.deactivate_expired_ads()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.ads
  SET is_active = false
  WHERE expires_at <= now() AND is_active = true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  conv_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conv_id
  FROM public.conversations
  WHERE (participant_1 = user1_id AND participant_2 = user2_id)
     OR (participant_1 = user2_id AND participant_2 = user1_id);
  
  -- If not found, create new conversation
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (participant_1, participant_2)
    VALUES (user1_id, user2_id)
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$function$;

-- 2. Add content length constraints for security
ALTER TABLE public.services 
ADD CONSTRAINT services_title_length CHECK (char_length(title) <= 200),
ADD CONSTRAINT services_description_length CHECK (char_length(description) <= 2000);

ALTER TABLE public.service_requests 
ADD CONSTRAINT service_requests_title_length CHECK (char_length(title) <= 200),
ADD CONSTRAINT service_requests_description_length CHECK (char_length(description) <= 2000);

ALTER TABLE public.messages 
ADD CONSTRAINT messages_content_length CHECK (char_length(content) <= 1000);

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_comment_length CHECK (char_length(comment) <= 500);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_full_name_length CHECK (char_length(full_name) <= 100),
ADD CONSTRAINT profiles_phone_length CHECK (char_length(phone) <= 20);

-- 3. Add rate limiting table for authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  last_attempt timestamp with time zone NOT NULL DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_ip_time ON public.auth_rate_limit(ip_address, last_attempt);

-- Enable RLS on rate limiting table
ALTER TABLE public.auth_rate_limit ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate limit data
CREATE POLICY "Admins can view rate limit data" ON public.auth_rate_limit
FOR SELECT USING (is_admin());

-- 4. Add audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON public.audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (is_admin());

-- Admins can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (true);