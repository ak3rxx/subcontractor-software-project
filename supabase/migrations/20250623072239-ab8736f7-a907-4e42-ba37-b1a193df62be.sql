
CREATE TABLE qa_change_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id uuid NOT NULL REFERENCES qa_inspections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  field_name text NOT NULL,
  old_value text,
  new_value text,
  change_type text NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  item_id text,
  item_description text,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS policy
ALTER TABLE qa_change_history ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX idx_qa_change_history_inspection_id ON qa_change_history(inspection_id);
CREATE INDEX idx_qa_change_history_timestamp ON qa_change_history(timestamp DESC);
