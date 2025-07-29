-- Add new optional fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN url_link TEXT,
ADD COLUMN drawing_number TEXT,
ADD COLUMN location TEXT;