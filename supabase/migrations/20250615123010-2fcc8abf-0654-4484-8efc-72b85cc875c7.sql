
-- Create a table for chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Add comments for clarity
COMMENT ON TABLE public.messages IS 'Stores chat messages between users.';
COMMENT ON COLUMN public.messages.sender_id IS 'The user who sent the message.';
COMMENT ON COLUMN public.messages.receiver_id IS 'The user who is receiving the message.';
COMMENT ON COLUMN public.messages.read_at IS 'Timestamp when the message was read by the receiver.';

-- Create indexes for faster queries on conversations
CREATE INDEX messages_sender_receiver_idx ON public.messages (sender_id, receiver_id);

-- Enable Row Level Security (RLS) on the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read messages where they are the sender or receiver
CREATE POLICY "Users can read their own messages"
  ON public.messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy: Allow users to send messages as themselves
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Policy: Allow users to mark messages as read
CREATE POLICY "Users can update read_at for messages they received"
    ON public.messages
    FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- Prepare table for real-time by setting REPLICA IDENTITY
-- This is needed so we can get the old record data on updates/deletes.
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
