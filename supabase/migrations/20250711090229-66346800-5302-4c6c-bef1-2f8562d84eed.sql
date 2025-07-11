-- Enable real-time for qa_change_history table
ALTER TABLE qa_change_history REPLICA IDENTITY FULL;

-- Add qa_change_history to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE qa_change_history;