-- Fix the database schema for document learning and workflow automation

-- Document parsing feedback table (fixed schema)
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
  correction_type TEXT NOT NULL, -- milestone, trade, zone
  pattern_hint TEXT,
  document_type TEXT,
  success_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 1,
  success_rate DECIMAL(3,2) DEFAULT 0.0,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_parsing_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_learning_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_parsing_feedback
CREATE POLICY "Users can create their own feedback" 
ON public.document_parsing_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" 
ON public.document_parsing_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for document_learning_patterns
CREATE POLICY "System can manage learning patterns" 
ON public.document_learning_patterns 
FOR ALL 
USING (true);

-- Add foreign key constraints
ALTER TABLE public.document_parsing_feedback 
ADD CONSTRAINT fk_document_parsing_feedback_document 
FOREIGN KEY (document_id) REFERENCES public.programme_document_parsing(id) ON DELETE CASCADE;

ALTER TABLE public.document_learning_patterns 
ADD CONSTRAINT fk_document_learning_patterns_document 
FOREIGN KEY (document_id) REFERENCES public.programme_document_parsing(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_feedback_document_id ON public.document_parsing_feedback(document_id);
CREATE INDEX IF NOT EXISTS idx_document_feedback_user_id ON public.document_parsing_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_correction_type ON public.document_learning_patterns(correction_type);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_document_feedback_updated_at
BEFORE UPDATE ON public.document_parsing_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();