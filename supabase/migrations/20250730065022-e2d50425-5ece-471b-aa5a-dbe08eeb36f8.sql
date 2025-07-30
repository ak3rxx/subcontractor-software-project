-- Enhanced PDF Parsing & AI Learning System Database Setup (Fixed)

-- First check if organizations table exists and has proper structure
-- The migration failed because organization_id reference was incorrect

-- Create document learning patterns table (enhanced) - without org reference for now
CREATE TABLE IF NOT EXISTS public.document_learning_patterns_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  correction_type TEXT NOT NULL, -- 'milestone', 'trade', 'zone', 'date', 'description'
  pattern_hint TEXT, -- Why this correction was made
  document_type TEXT, -- 'ms_project', 'gantt', 'spreadsheet', 'schedule', 'general'
  confidence_improvement NUMERIC DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  context_keywords TEXT[], -- Related words found near this correction
  document_id UUID,
  user_id UUID,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document parsing feedback table (enhanced) - without org reference for now
CREATE TABLE IF NOT EXISTS public.document_parsing_feedback_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  original_confidence NUMERIC,
  user_assessed_confidence NUMERIC,
  corrections JSONB,
  user_notes TEXT,
  feedback_type TEXT DEFAULT 'manual', -- 'manual', 'auto_validation', 'bulk_correction'
  time_to_review INTEGER, -- seconds spent reviewing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI learning insights table
CREATE TABLE IF NOT EXISTS public.ai_learning_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL, -- 'pattern_recognition', 'quality_improvement', 'suggestion'
  insight_data JSONB NOT NULL,
  confidence_score NUMERIC DEFAULT 0,
  applied_count INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'deprecated', 'testing'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document processing analytics
CREATE TABLE IF NOT EXISTS public.document_processing_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID,
  processing_method TEXT, -- 'pdf_vision', 'pdf_traditional', 'spreadsheet', 'image_ocr'
  extraction_quality_score NUMERIC,
  ai_model_used TEXT,
  processing_time_ms INTEGER,
  confidence_before_learning NUMERIC,
  confidence_after_learning NUMERIC,
  learned_patterns_applied INTEGER DEFAULT 0,
  success_indicators JSONB, -- What made this successful
  failure_indicators JSONB, -- What caused issues
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create smart suggestions table
CREATE TABLE IF NOT EXISTS public.document_smart_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_type TEXT NOT NULL, -- 'missing_milestone', 'trade_clarification', 'zone_suggestion', 'date_validation'
  suggested_value TEXT,
  context_data JSONB,
  confidence_score NUMERIC DEFAULT 0,
  user_action TEXT, -- 'accepted', 'rejected', 'modified', 'pending'
  user_feedback TEXT,
  document_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_patterns_enh_type ON public.document_learning_patterns_enhanced(correction_type);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_enh_success ON public.document_learning_patterns_enhanced(success_rate DESC, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_enh_correct ON public.document_parsing_feedback_enhanced(is_correct);
CREATE INDEX IF NOT EXISTS idx_insights_type ON public.ai_learning_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_suggestions_pending ON public.document_smart_suggestions(user_action);

-- Enable RLS
ALTER TABLE public.document_learning_patterns_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_parsing_feedback_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_processing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_smart_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all users for now (can be refined later)
CREATE POLICY "Users can manage enhanced learning patterns" ON public.document_learning_patterns_enhanced
  FOR ALL USING (true);

CREATE POLICY "Users can manage enhanced feedback" ON public.document_parsing_feedback_enhanced
  FOR ALL USING (true);

CREATE POLICY "Users can view insights" ON public.ai_learning_insights
  FOR ALL USING (true);

CREATE POLICY "Users can view analytics" ON public.document_processing_analytics
  FOR ALL USING (true);

CREATE POLICY "Users can manage suggestions" ON public.document_smart_suggestions
  FOR ALL USING (true);

-- Enhanced learning functions
CREATE OR REPLACE FUNCTION public.apply_enhanced_learning_patterns(
  p_extracted_text TEXT,
  p_document_type TEXT DEFAULT 'general'
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  patterns RECORD;
  suggestions JSONB := '{"milestones": [], "trades": [], "zones": [], "improvements": []}'::jsonb;
  pattern_count INTEGER := 0;
BEGIN
  -- Get relevant learning patterns
  FOR patterns IN 
    SELECT 
      correction_type,
      corrected_text,
      pattern_hint,
      success_rate,
      context_keywords
    FROM public.document_learning_patterns_enhanced 
    WHERE (document_type = p_document_type OR document_type = 'general')
      AND success_rate > 0.3
      AND usage_count >= 1
    ORDER BY success_rate DESC, usage_count DESC
    LIMIT 50
  LOOP
    -- Check if pattern context matches
    IF patterns.context_keywords IS NOT NULL THEN
      -- Simple keyword matching - can be enhanced with more sophisticated NLP
      FOR i IN 1..array_length(patterns.context_keywords, 1) LOOP
        IF p_extracted_text ILIKE '%' || patterns.context_keywords[i] || '%' THEN
          suggestions := jsonb_set(
            suggestions,
            ARRAY[patterns.correction_type],
            (suggestions->patterns.correction_type) || jsonb_build_object(
              'suggestion', patterns.corrected_text,
              'hint', patterns.pattern_hint,
              'confidence', patterns.success_rate
            )
          );
          pattern_count := pattern_count + 1;
          EXIT; -- Found match, move to next pattern
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  -- Add metadata
  suggestions := jsonb_set(suggestions, '{applied_patterns_count}', to_jsonb(pattern_count));
  
  RETURN suggestions;
END;
$$;

-- Function to calculate real confidence score based on extraction quality
CREATE OR REPLACE FUNCTION public.calculate_enhanced_confidence(
  p_extracted_text TEXT,
  p_milestones_count INTEGER DEFAULT 0,
  p_trades_count INTEGER DEFAULT 0,
  p_zones_count INTEGER DEFAULT 0,
  p_processing_method TEXT DEFAULT 'unknown'
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  base_confidence NUMERIC := 0.1;
  text_quality_score NUMERIC := 0;
  data_richness_score NUMERIC := 0;
  method_bonus NUMERIC := 0;
  final_confidence NUMERIC;
BEGIN
  -- Text quality assessment
  IF LENGTH(p_extracted_text) > 500 THEN
    text_quality_score := 0.3;
  ELSIF LENGTH(p_extracted_text) > 200 THEN
    text_quality_score := 0.2;
  ELSIF LENGTH(p_extracted_text) > 50 THEN
    text_quality_score := 0.1;
  END IF;
  
  -- Data richness assessment
  data_richness_score := LEAST(
    (p_milestones_count * 0.1) + 
    (p_trades_count * 0.05) + 
    (p_zones_count * 0.05), 
    0.4
  );
  
  -- Processing method bonus
  CASE p_processing_method
    WHEN 'pdf_vision' THEN method_bonus := 0.2;
    WHEN 'spreadsheet' THEN method_bonus := 0.3;
    WHEN 'image_ocr' THEN method_bonus := 0.1;
    ELSE method_bonus := 0;
  END CASE;
  
  final_confidence := base_confidence + text_quality_score + data_richness_score + method_bonus;
  
  -- Cap at 0.95 to never be overconfident
  RETURN LEAST(final_confidence, 0.95);
END;
$$;