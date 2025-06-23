
-- Create function to get QA change history (fixed column name)
CREATE OR REPLACE FUNCTION public.get_qa_change_history(p_inspection_id uuid)
RETURNS TABLE (
  id uuid,
  change_timestamp timestamp with time zone,
  user_id uuid,
  user_name text,
  field_name text,
  old_value text,
  new_value text,
  change_type text,
  item_id text,
  item_description text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qch.id,
    qch.timestamp,
    qch.user_id,
    COALESCE(p.full_name, p.email, 'Unknown User') as user_name,
    qch.field_name,
    qch.old_value,
    qch.new_value,
    qch.change_type,
    qch.item_id,
    qch.item_description
  FROM qa_change_history qch
  LEFT JOIN profiles p ON p.id = qch.user_id
  WHERE qch.inspection_id = p_inspection_id
  ORDER BY qch.timestamp DESC;
END;
$$;

-- Create function to record QA changes
CREATE OR REPLACE FUNCTION public.record_qa_change(
  p_inspection_id uuid,
  p_user_id uuid,
  p_field_name text,
  p_old_value text DEFAULT NULL,
  p_new_value text DEFAULT NULL,
  p_change_type text DEFAULT 'update',
  p_item_id text DEFAULT NULL,
  p_item_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_record_id uuid;
BEGIN
  INSERT INTO qa_change_history (
    inspection_id,
    user_id,
    field_name,
    old_value,
    new_value,
    change_type,
    item_id,
    item_description
  ) VALUES (
    p_inspection_id,
    p_user_id,
    p_field_name,
    p_old_value,
    p_new_value,
    p_change_type,
    p_item_id,
    p_item_description
  )
  RETURNING id INTO new_record_id;
  
  RETURN new_record_id;
END;
$$;
