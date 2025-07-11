import React from 'react';
import { Clock, User, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

interface FieldAuditNoteProps {
  fieldName: string;
  changeHistory: any[];
  className?: string;
}

/**
 * Display brief audit information for a specific field
 * Shows the last change with user and timestamp
 */
const FieldAuditNote: React.FC<FieldAuditNoteProps> = ({ 
  fieldName, 
  changeHistory, 
  className = '' 
}) => {
  // Find the most recent change for this specific field
  const fieldChange = changeHistory
    .filter(change => change.field_name === fieldName)
    .sort((a, b) => new Date(b.timestamp || b.change_timestamp).getTime() - new Date(a.timestamp || a.change_timestamp).getTime())
    [0];

  if (!fieldChange) {
    return null;
  }

  const timestamp = fieldChange.timestamp || fieldChange.change_timestamp;
  const formattedDate = timestamp ? format(new Date(timestamp), 'dd/MM/yy HH:mm') : 'Unknown time';
  const userName = fieldChange.user_name || 'Unknown User';
  
  // Truncate long values for display
  const truncateValue = (value: string, maxLength: number = 30) => {
    if (!value) return '';
    return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
  };

  return (
    <div className={`text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-blue-200 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Edit2 className="h-3 w-3" />
        <span className="font-medium">Last changed:</span>
        <Clock className="h-3 w-3" />
        <span>{formattedDate}</span>
        <User className="h-3 w-3" />
        <span>{userName}</span>
      </div>
      
      {fieldChange.old_value && fieldChange.new_value && (
        <div className="text-xs">
          <span className="text-red-600">From:</span> {truncateValue(fieldChange.old_value, 20)}
          {' → '}
          <span className="text-green-600">To:</span> {truncateValue(fieldChange.new_value, 20)}
        </div>
      )}
    </div>
  );
};

export default FieldAuditNote;