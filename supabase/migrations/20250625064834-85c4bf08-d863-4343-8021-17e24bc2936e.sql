
-- Extend the existing programme_milestones table to match the specification
ALTER TABLE programme_milestones 
ADD COLUMN start_date_planned date,
ADD COLUMN end_date_planned date,
ADD COLUMN start_date_actual date,
ADD COLUMN end_date_actual date,
ADD COLUMN linked_tasks uuid[],
ADD COLUMN linked_itps uuid[],
ADD COLUMN linked_deliveries uuid[],
ADD COLUMN linked_handovers uuid[],
ADD COLUMN critical_path boolean DEFAULT false,
ADD COLUMN delay_risk_flag boolean DEFAULT false,
ADD COLUMN priority text DEFAULT 'medium',
ADD COLUMN assigned_to uuid,
ADD COLUMN category text;

-- Create programme_templates table for reusable project templates
CREATE TABLE programme_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  project_type text,
  template_data jsonb NOT NULL,
  created_by uuid REFERENCES auth.users,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create programme_uploads table for tracking PDF/MPP file processing
CREATE TABLE programme_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  original_filename text NOT NULL,
  file_path text,
  upload_status text DEFAULT 'pending',
  processing_result jsonb,
  uploaded_by uuid REFERENCES auth.users,
  uploaded_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone
);

-- Create ai_learning_patterns table for storing AI training data
CREATE TABLE ai_learning_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type text NOT NULL,
  project_type text,
  trade_category text,
  pattern_data jsonb NOT NULL,
  success_rate numeric DEFAULT 0,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE programme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_patterns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for programme_templates
CREATE POLICY "Users can view programme templates" 
  ON programme_templates 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create programme templates" 
  ON programme_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own programme templates" 
  ON programme_templates 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Create RLS policies for programme_uploads
CREATE POLICY "Users can view their programme uploads" 
  ON programme_uploads 
  FOR SELECT 
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can create programme uploads" 
  ON programme_uploads 
  FOR INSERT 
  WITH CHECK (auth.uid() = uploaded_by);

-- Create RLS policies for ai_learning_patterns
CREATE POLICY "Users can view ai learning patterns" 
  ON ai_learning_patterns 
  FOR SELECT 
  USING (true);

CREATE POLICY "System can manage ai learning patterns" 
  ON ai_learning_patterns 
  FOR ALL 
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_programme_milestones_project_id ON programme_milestones(project_id);
CREATE INDEX idx_programme_milestones_status ON programme_milestones(status);
CREATE INDEX idx_programme_milestones_dates ON programme_milestones(start_date_planned, end_date_planned);
CREATE INDEX idx_programme_templates_project_type ON programme_templates(project_type);
CREATE INDEX idx_programme_uploads_project_id ON programme_uploads(project_id);
CREATE INDEX idx_ai_learning_patterns_type ON ai_learning_patterns(pattern_type, project_type);
