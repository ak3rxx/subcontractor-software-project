// Shared QA status calculation utility
// This ensures consistent status calculation between QA form creation and details modal

export interface ChecklistItem {
  id: string;
  status?: string; // Make optional to match existing interface
  comments?: string;
  evidence_files?: string[] | null;
}

/**
 * Calculate overall QA inspection status based on checklist items and form completion
 */
export const calculateOverallStatus = (
  checklistItems: ChecklistItem[], 
  isFormComplete: boolean = true
): 'pass' | 'fail' | 'pending-reinspection' | 'incomplete-in-progress' => {
  // First check: Are ALL checklist items filled? If not → "incomplete-in-progress"
  const allItemsHaveStatus = checklistItems.every(item => 
    item.status && item.status.trim() !== ''
  );
  
  if (!allItemsHaveStatus) {
    return 'incomplete-in-progress';
  }

  // Second check: Filter out N/A items for pass/fail calculation
  const relevantItems = checklistItems.filter(item => item.status !== 'na');
  
  // Third check: If all items are N/A → "pass"
  if (relevantItems.length === 0) {
    return 'pass';
  }

  // Fourth check: Calculate fail percentage of non-N/A items
  const failedItems = relevantItems.filter(item => item.status === 'fail');
  const failureRate = failedItems.length / relevantItems.length;

  // Final determination: 0% fail = "pass", ≥50% fail = "fail", <50% fail = "pending-reinspection"
  if (failureRate === 0) {
    return 'pass';
  } else if (failureRate >= 0.5) {
    return 'fail';
  } else {
    return 'pending-reinspection';
  }
};

/**
 * Get a user-friendly status display name
 */
export const getStatusDisplayName = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pass': 'Pass',
    'fail': 'Fail',
    'pending-reinspection': 'Pending Reinspection',
    'incomplete-in-progress': 'In Progress',
    'incomplete-draft': 'In Progress' // Legacy support
  };
  
  return statusMap[status] || status;
};

/**
 * Get status badge styling
 */
export const getStatusBadgeStyle = (status: string): string => {
  switch (status) {
    case 'pass':
      return 'bg-green-100 text-green-800';
    case 'fail':
      return 'bg-red-100 text-red-800';
    case 'pending-reinspection':
      return 'bg-orange-100 text-orange-800';
    case 'incomplete-in-progress':
    case 'incomplete-draft':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};