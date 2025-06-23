
-- Add missing columns to variations table
ALTER TABLE public.variations 
ADD COLUMN location TEXT,
ADD COLUMN category TEXT CHECK (category IN ('electrical', 'plumbing', 'structural', 'fixtures', 'finishes', 'other')),
ADD COLUMN client_email TEXT,
ADD COLUMN justification TEXT;
