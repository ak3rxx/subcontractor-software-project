
-- Add email tracking columns to variations table
ALTER TABLE public.variations 
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN email_sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN email_sent_by UUID REFERENCES auth.users(id);
