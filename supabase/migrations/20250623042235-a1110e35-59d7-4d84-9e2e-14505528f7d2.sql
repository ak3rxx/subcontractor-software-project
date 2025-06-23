
-- Add approval_comments column to variations table
ALTER TABLE public.variations 
ADD COLUMN approval_comments text;
