
export interface AuditTrailEntry {
  id: string;
  user_id: string;
  user_name: string;
  action_type: 'create' | 'edit' | 'submit' | 'approve' | 'reject' | 'unlock' | 'email_sent';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  status_from?: string;
  status_to?: string;
  comments?: string;
  metadata: any;
  action_timestamp: string;
}

// Database response interface
export interface DatabaseAuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  status_from?: string;
  status_to?: string;
  comments?: string;
  metadata: any;
  action_timestamp: string;
}
