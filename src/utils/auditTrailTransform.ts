
import { AuditTrailEntry, DatabaseAuditEntry } from '@/types/auditTrail';

// Helper function to validate and transform database response
export const transformAuditEntry = (dbEntry: DatabaseAuditEntry): AuditTrailEntry => {
  const validActionTypes = ['create', 'edit', 'submit', 'approve', 'reject', 'unlock', 'email_sent', 'file_upload', 'file_delete', 'file_update'];
  const actionType = validActionTypes.includes(dbEntry.action_type) 
    ? dbEntry.action_type as AuditTrailEntry['action_type']
    : 'edit'; // fallback to 'edit' for invalid types

  return {
    id: dbEntry.id,
    user_id: dbEntry.user_id,
    user_name: dbEntry.user_name,
    action_type: actionType,
    field_name: dbEntry.field_name,
    old_value: dbEntry.old_value,
    new_value: dbEntry.new_value,
    status_from: dbEntry.status_from,
    status_to: dbEntry.status_to,
    comments: dbEntry.comments,
    metadata: dbEntry.metadata,
    action_timestamp: dbEntry.action_timestamp
  };
};
