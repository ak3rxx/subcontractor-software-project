-- Simple document learning tables without triggers

-- Document parsing feedback table
DROP TABLE IF EXISTS public.document_parsing_feedback CASCADE;
CREATE TABLE IF NOT EXISTS public.document_parsing_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_correct BOOLEAN NOT NULL,
  corrections JSONB,
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document learning patterns table  
DROP TABLE IF EXISTS public.document_learning_patterns CASCADE;
CREATE TABLE IF NOT EXISTS public.document_learning_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID,
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  correction_type TEXT NOT NULL,
  pattern_hint TEXT,
  document_type TEXT,
  success_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 1,
  success_rate DECIMAL(3,2) DEFAULT 0.0,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_parsing_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_learning_patterns ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Users can create their own feedback" 
ON public.document_parsing_feedback FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" 
ON public.document_parsing_feedback FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage learning patterns" 
ON public.document_learning_patterns FOR ALL 
USING (true);

-- Add foreign key constraints
ALTER TABLE public.document_parsing_feedback 
ADD CONSTRAINT fk_document_parsing_feedback_document 
FOREIGN KEY (document_id) REFERENCES public.programme_document_parsing(id) ON DELETE CASCADE;

ALTER TABLE public.document_learning_patterns 
ADD CONSTRAINT fk_document_learning_patterns_document 
FOREIGN KEY (document_id) REFERENCES public.programme_document_parsing(id) ON DELETE CASCADE;