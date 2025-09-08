-- Add verification and premium fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;

-- Create subscription_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('free', 'pending_payment', 'active', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the column type if needed
ALTER TABLE public.profiles 
ALTER COLUMN subscription_status TYPE subscription_status USING subscription_status::subscription_status;

-- Create app settings table for global configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Insert default premium mode setting
INSERT INTO public.app_settings (setting_key, setting_value) 
VALUES ('premium_mode_enabled', 'false'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create policies for app_settings
CREATE POLICY "Admins can manage app settings" ON public.app_settings
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Everyone can read app settings" ON public.app_settings
  FOR SELECT USING (true);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();