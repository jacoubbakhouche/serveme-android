-- Drop the existing restrictive INSERT policy for messages
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;

-- Create a new simpler policy that allows direct messaging
CREATE POLICY "Users can send direct messages" ON public.messages
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Update the SELECT policy to be more flexible for direct messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

-- Keep the existing direct message reading policy
-- "Users can read their own messages" policy already exists and is correct