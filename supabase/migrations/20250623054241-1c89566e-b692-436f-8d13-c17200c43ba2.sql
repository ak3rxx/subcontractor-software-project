
-- Add time_impact column to variations table
ALTER TABLE public.variations 
ADD COLUMN time_impact integer DEFAULT 0;
