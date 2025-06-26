
-- Phase 1: Database Schema Enhancement
-- Add proper relationships between variations and other modules

-- Add variation tracking to budget items
ALTER TABLE public.budget_items 
ADD COLUMN variation_allowance NUMERIC DEFAULT 0,
ADD COLUMN variation_impact NUMERIC DEFAULT 0,
ADD COLUMN last_variation_update TIMESTAMP WITH TIME ZONE;

-- Add variation tracking to programme milestones
ALTER TABLE public.programme_milestones 
ADD COLUMN variation_time_impact INTEGER DEFAULT 0,
ADD COLUMN affected_by_variations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN baseline_date DATE,
ADD COLUMN variation_adjusted_date DATE;

-- Create variation-milestone relationship table
CREATE TABLE IF NOT EXISTS public.variation_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variation_id UUID REFERENCES public.variations(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.programme_milestones(id) ON DELETE CASCADE,
  time_impact_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(variation_id, milestone_id)
);

-- Create variation-budget impact tracking
CREATE TABLE IF NOT EXISTS public.variation_budget_impacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variation_id UUID REFERENCES public.variations(id) ON DELETE CASCADE,
  budget_item_id UUID REFERENCES public.budget_items(id) ON DELETE CASCADE,
  impact_amount NUMERIC NOT NULL DEFAULT 0,
  impact_type TEXT NOT NULL CHECK (impact_type IN ('increase', 'decrease')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(variation_id, budget_item_id)
);

-- Update variations table to include better status tracking
ALTER TABLE public.variations 
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS submitted_date DATE DEFAULT CURRENT_DATE;

-- Rename the conflicting column to match the new schema
UPDATE public.variations SET submitted_by = requested_by WHERE submitted_by IS NULL;
UPDATE public.variations SET submitted_date = request_date WHERE submitted_date IS NULL;

-- Enable RLS on new tables
ALTER TABLE public.variation_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variation_budget_impacts ENABLE ROW LEVEL SECURITY;

-- Create policies for variation_milestones
CREATE POLICY "Users can view variation milestones for their projects" 
  ON public.variation_milestones 
  FOR SELECT 
  USING (
    variation_id IN (
      SELECT id FROM public.variations v
      WHERE v.project_id IN (
        SELECT id FROM public.projects 
        WHERE project_manager_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create variation milestones for their projects" 
  ON public.variation_milestones 
  FOR INSERT 
  WITH CHECK (
    variation_id IN (
      SELECT id FROM public.variations v
      WHERE v.project_id IN (
        SELECT id FROM public.projects 
        WHERE project_manager_id = auth.uid()
      )
    )
  );

-- Create policies for variation_budget_impacts
CREATE POLICY "Users can view variation budget impacts for their projects" 
  ON public.variation_budget_impacts 
  FOR SELECT 
  USING (
    variation_id IN (
      SELECT id FROM public.variations v
      WHERE v.project_id IN (
        SELECT id FROM public.projects 
        WHERE project_manager_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create variation budget impacts for their projects" 
  ON public.variation_budget_impacts 
  FOR INSERT 
  WITH CHECK (
    variation_id IN (
      SELECT id FROM public.variations v
      WHERE v.project_id IN (
        SELECT id FROM public.projects 
        WHERE project_manager_id = auth.uid()
      )
    )
  );

-- Fix the existing generate_variation_number function to work with the updated schema
CREATE OR REPLACE FUNCTION public.generate_variation_number(project_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  counter INTEGER;
  new_number TEXT;
BEGIN
  -- Get the current count of variations for this project and add 1
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.variations 
  WHERE project_id = project_uuid;
  
  -- Format as VAR-NNNN
  new_number := 'VAR-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Create function to calculate total variation impact on budget
CREATE OR REPLACE FUNCTION public.calculate_project_variation_impact(project_uuid UUID)
RETURNS TABLE(
  total_approved_cost NUMERIC,
  total_pending_cost NUMERIC,
  total_time_impact INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END), 0) as total_approved_cost,
    COALESCE(SUM(CASE WHEN status = 'pending_approval' THEN total_amount ELSE 0 END), 0) as total_pending_cost,
    COALESCE(SUM(CASE WHEN status = 'approved' THEN time_impact ELSE 0 END), 0) as total_time_impact
  FROM public.variations
  WHERE project_id = project_uuid;
END;
$$;
