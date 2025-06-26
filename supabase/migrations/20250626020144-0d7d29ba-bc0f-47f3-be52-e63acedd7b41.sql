
-- Add cost breakdown and enhanced fields to variations table
ALTER TABLE public.variations 
ADD COLUMN cost_breakdown JSONB DEFAULT '[]'::jsonb,
ADD COLUMN time_impact_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN gst_amount NUMERIC DEFAULT 0,
ADD COLUMN total_amount NUMERIC DEFAULT 0;

-- Create organization categories table for AI learning
CREATE TABLE public.organization_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  trade_industry TEXT NOT NULL,
  category_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, category_name)
);

-- Create category learning patterns table
CREATE TABLE public.category_learning_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  trade_industry TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  success_rate NUMERIC DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.organization_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_learning_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_categories
CREATE POLICY "Users can view categories for their organization" 
  ON public.organization_categories 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create categories for their organization" 
  ON public.organization_categories 
  FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update categories in their organization" 
  ON public.organization_categories 
  FOR UPDATE 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS policies for category_learning_patterns
CREATE POLICY "Users can view learning patterns for their organization" 
  ON public.category_learning_patterns 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create learning patterns for their organization" 
  ON public.category_learning_patterns 
  FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Update variation number generation function to include project reference
CREATE OR REPLACE FUNCTION public.generate_variation_number(project_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  counter INTEGER;
  project_number TEXT;
  new_number TEXT;
BEGIN
  -- Get project info for numbering
  SELECT 
    COALESCE(
      LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0'),
      LPAD(EXTRACT(EPOCH FROM created_at)::INTEGER % 1000::TEXT, 3, '0')
    )
  INTO project_number
  FROM public.projects 
  WHERE id = project_uuid;
  
  -- Get the current count of variations for this project and add 1
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.variations 
  WHERE project_id = project_uuid;
  
  -- Format as [PROJECT_NUMBER]-VAR-[VARIATION_NUMBER]
  new_number := COALESCE(project_number, '001') || '-VAR-' || LPAD(counter::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$;

-- Function to get smart categories based on organization
CREATE OR REPLACE FUNCTION public.get_smart_categories(org_id UUID, trade_type TEXT DEFAULT NULL)
RETURNS TABLE(category_name TEXT, usage_count INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oc.category_name,
    oc.usage_count
  FROM public.organization_categories oc
  WHERE oc.organization_id = org_id
    AND oc.is_active = TRUE
    AND (trade_type IS NULL OR oc.trade_industry = trade_type)
  ORDER BY oc.usage_count DESC, oc.category_name ASC;
END;
$$;

-- Function to update category usage
CREATE OR REPLACE FUNCTION public.update_category_usage(org_id UUID, category TEXT, trade TEXT DEFAULT 'general')
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.organization_categories (organization_id, trade_industry, category_name, usage_count)
  VALUES (org_id, trade, category, 1)
  ON CONFLICT (organization_id, category_name)
  DO UPDATE SET 
    usage_count = organization_categories.usage_count + 1,
    updated_at = NOW();
END;
$$;
