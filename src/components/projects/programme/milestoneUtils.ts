
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';

// Legacy type alias for backward compatibility
export type Milestone = ProgrammeMilestone;

export const isWithinDays = (dateString: string | undefined, days: number): boolean => {
  if (!dateString) return false;
  
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffInTime = targetDate.getTime() - today.getTime();
  const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
  
  return diffInDays >= 0 && diffInDays <= days;
};

export const isOverdue = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  
  const targetDate = new Date(dateString);
  const today = new Date();
  
  return targetDate < today;
};

export const getMilestoneStatusColor = (status: string): string => {
  switch (status) {
    case 'complete':
      return 'bg-green-100 text-green-800';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    case 'delayed':
      return 'bg-red-100 text-red-800';
    case 'upcoming':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const calculateDaysUntilDue = (dateString: string | undefined): number => {
  if (!dateString) return 0;
  
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffInTime = targetDate.getTime() - today.getTime();
  
  return Math.ceil(diffInTime / (1000 * 3600 * 24));
};

// Legacy function name for backward compatibility
export const getDaysUntil = (dateString: string | undefined): number => {
  return calculateDaysUntilDue(dateString);
};

export const getUpcomingMilestones = (milestones: ProgrammeMilestone[], days: number = 7): ProgrammeMilestone[] => {
  return milestones.filter(milestone => {
    const dueDate = milestone.end_date_planned || milestone.planned_date;
    return milestone.status !== 'complete' && isWithinDays(dueDate, days);
  });
};

export const getOverdueMilestones = (milestones: ProgrammeMilestone[]): ProgrammeMilestone[] => {
  return milestones.filter(milestone => {
    const dueDate = milestone.end_date_planned || milestone.planned_date;
    return milestone.status !== 'complete' && isOverdue(dueDate);
  });
};

export const getCriticalPathMilestones = (milestones: ProgrammeMilestone[]): ProgrammeMilestone[] => {
  return milestones.filter(milestone => milestone.critical_path);
};

export const getDelayRiskMilestones = (milestones: ProgrammeMilestone[]): ProgrammeMilestone[] => {
  return milestones.filter(milestone => milestone.delay_risk_flag);
};

export const sortMilestonesByDate = (milestones: ProgrammeMilestone[]): ProgrammeMilestone[] => {
  return [...milestones].sort((a, b) => {
    const dateA = new Date(a.start_date_planned || a.planned_date);
    const dateB = new Date(b.start_date_planned || b.planned_date);
    return dateA.getTime() - dateB.getTime();
  });
};

export const groupMilestonesByCategory = (milestones: ProgrammeMilestone[]): Record<string, ProgrammeMilestone[]> => {
  return milestones.reduce((groups, milestone) => {
    const category = milestone.category || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(milestone);
    return groups;
  }, {} as Record<string, ProgrammeMilestone[]>);
};

export const calculateProjectProgress = (milestones: ProgrammeMilestone[]): number => {
  if (milestones.length === 0) return 0;
  
  const totalCompletion = milestones.reduce((sum, milestone) => sum + milestone.completion_percentage, 0);
  return Math.round(totalCompletion / milestones.length);
};
