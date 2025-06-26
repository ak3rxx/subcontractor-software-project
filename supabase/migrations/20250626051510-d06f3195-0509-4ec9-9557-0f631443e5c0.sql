
-- First, add the trade column to variations table if it doesn't exist
ALTER TABLE public.variations ADD COLUMN IF NOT EXISTS trade TEXT;

-- Now add the trade constraint
ALTER TABLE public.variations ADD CONSTRAINT variations_trade_check 
CHECK (trade IN (
  'partitions', 'electrical', 'plumbing', 'hvac', 'flooring', 
  'roofing', 'structural', 'finishes', 'fire_services', 'landscaping',
  'carpentry', 'tiling', 'painting', 'rendering', 'builder', 'other'
));

-- Update the category constraint to include trade-specific categories for new trades
ALTER TABLE public.variations DROP CONSTRAINT IF EXISTS variations_category_check;
ALTER TABLE public.variations ADD CONSTRAINT variations_category_check 
CHECK (category IN (
  -- Partitions
  'partitions', 'wall_framing', 'ceiling', 'patching', 'sheeting', 'feature_items',
  -- Electrical  
  'electrical', 'power_points', 'lighting', 'distribution_boards', 'cabling', 'testing',
  -- Plumbing
  'plumbing', 'fixtures', 'pipework', 'drainage', 'hot_water', 'gas_services',
  -- HVAC
  'hvac', 'ductwork', 'equipment', 'controls', 'commissioning', 'maintenance',
  -- Flooring
  'flooring', 'preparation', 'installation', 'finishing', 'repairs', 'transitions',
  -- Roofing
  'roofing', 'structure', 'waterproofing', 'gutters', 'flashing', 'insulation',
  -- Structural
  'structural', 'concrete', 'steel', 'timber', 'reinforcement', 'connections',
  -- Finishes
  'finishes', 'painting', 'tiling', 'plastering', 'joinery', 'hardware',
  -- Fire Services
  'fire_services', 'detection', 'suppression', 'exits', 'doors', 'certification',
  -- Landscaping
  'landscaping', 'softworks', 'hardworks', 'irrigation', 'lighting_landscape', 'maintenance_landscape',
  -- Carpentry
  'carpentry', 'framing', 'trim_work', 'cabinetry', 'doors_windows', 'formwork',
  -- Tiling
  'tiling', 'floor_tiles', 'wall_tiles', 'waterproofing_tiling', 'grouting', 'tile_repairs',
  -- Painting
  'painting', 'surface_prep', 'primer', 'interior_painting', 'exterior_painting', 'specialty_coatings',
  -- Rendering
  'rendering', 'base_coat', 'float_coat', 'texture_coat', 'acrylic_render', 'cement_render',
  -- Builder (General)
  'builder', 'coordination', 'supervision', 'quality_control', 'project_management', 'compliance',
  -- Legacy categories (keeping for backward compatibility)
  'partitions_ceilings', 'doors_hardware', 'door_jambs', 'other'
));

-- Create table for AI learning of new trades
CREATE TABLE IF NOT EXISTS public.ai_trade_learning (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  suggested_trade TEXT NOT NULL,
  description_context TEXT NOT NULL,
  usage_frequency INTEGER DEFAULT 1,
  confidence_score NUMERIC DEFAULT 0.5,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on AI trade learning table
ALTER TABLE public.ai_trade_learning ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for AI trade learning
CREATE POLICY "Users can view AI trade suggestions for their organization" 
  ON public.ai_trade_learning 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create AI trade suggestions for their organization" 
  ON public.ai_trade_learning 
  FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update AI trade suggestions in their organization" 
  ON public.ai_trade_learning 
  FOR UPDATE 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Function to suggest new trade based on description analysis
CREATE OR REPLACE FUNCTION public.suggest_trade_from_description(
  description_text TEXT,
  org_id UUID
)
RETURNS TABLE(suggested_trade TEXT, confidence NUMERIC)
LANGUAGE plpgsql
AS $$
DECLARE
  trade_keywords JSONB := '{
    "carpentry": ["wood", "timber", "frame", "cabinet", "door", "window", "trim", "joinery"],
    "tiling": ["tile", "ceramic", "porcelain", "grout", "waterproof", "bathroom", "kitchen"],
    "painting": ["paint", "primer", "coating", "brush", "roller", "spray", "color", "finish"],
    "rendering": ["render", "plaster", "cement", "acrylic", "texture", "external", "finish"],
    "builder": ["coordinate", "manage", "supervise", "quality", "compliance", "general"],
    "electrical": ["wire", "power", "light", "switch", "outlet", "circuit", "voltage"],
    "plumbing": ["pipe", "water", "drain", "fixture", "toilet", "sink", "tap", "leak"],
    "hvac": ["air", "heating", "cooling", "duct", "ventilation", "temperature", "climate"]
  }'::jsonb;
  
  trade_name TEXT;
  keywords TEXT[];
  keyword TEXT;
  match_count INTEGER;
  max_matches INTEGER := 0;
  best_trade TEXT := 'other';
  confidence_score NUMERIC := 0.0;
  total_words INTEGER;
BEGIN
  -- Convert description to lowercase for matching
  description_text := LOWER(description_text);
  total_words := array_length(string_to_array(description_text, ' '), 1);
  
  -- Loop through each trade and count keyword matches
  FOR trade_name IN SELECT jsonb_object_keys(trade_keywords)
  LOOP
    keywords := ARRAY(SELECT jsonb_array_elements_text(trade_keywords->trade_name));
    match_count := 0;
    
    FOREACH keyword IN ARRAY keywords
    LOOP
      IF description_text LIKE '%' || keyword || '%' THEN
        match_count := match_count + 1;
      END IF;
    END LOOP;
    
    -- Update best match if this trade has more matches
    IF match_count > max_matches THEN
      max_matches := match_count;
      best_trade := trade_name;
      confidence_score := LEAST(match_count::NUMERIC / array_length(keywords, 1), 1.0);
    END IF;
  END LOOP;
  
  -- Store the suggestion for learning
  IF confidence_score > 0.3 THEN
    INSERT INTO public.ai_trade_learning (
      organization_id, 
      suggested_trade, 
      description_context, 
      confidence_score
    ) VALUES (
      org_id, 
      best_trade, 
      LEFT(description_text, 500), 
      confidence_score
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN QUERY SELECT best_trade, confidence_score;
END;
$$;

-- Function to learn and auto-approve frequently suggested trades
CREATE OR REPLACE FUNCTION public.auto_approve_frequent_trades()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-approve trades that have been suggested 5+ times with confidence > 0.6
  UPDATE public.ai_trade_learning 
  SET is_approved = TRUE, updated_at = NOW()
  WHERE usage_frequency >= 5 
    AND confidence_score > 0.6 
    AND is_approved = FALSE;
END;
$$;
