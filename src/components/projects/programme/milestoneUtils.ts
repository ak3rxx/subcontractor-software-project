
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

// Enhanced scheduling and validation utilities

export const validateMilestoneSchedule = (milestone: ProgrammeMilestone, allMilestones: ProgrammeMilestone[]): string[] => {
  const issues: string[] = [];

  // Check if start date is before end date
  if (milestone.start_date_planned && milestone.end_date_planned) {
    const start = new Date(milestone.start_date_planned);
    const end = new Date(milestone.end_date_planned);
    if (start >= end) {
      issues.push('Start date must be before end date');
    }
  }

  // Check dependency constraints
  if (milestone.dependencies && milestone.start_date_planned) {
    milestone.dependencies.forEach(depId => {
      const dependency = allMilestones.find(m => m.id === depId);
      if (dependency?.end_date_planned) {
        const depEnd = new Date(dependency.end_date_planned);
        const milestoneStart = new Date(milestone.start_date_planned!);
        if (milestoneStart <= depEnd) {
          issues.push(`Cannot start before dependency "${dependency.milestone_name}" ends`);
        }
      }
    });
  }

  return issues;
};

export const calculateOptimalStartDate = (
  milestone: ProgrammeMilestone, 
  allMilestones: ProgrammeMilestone[]
): string => {
  if (!milestone.dependencies || milestone.dependencies.length === 0) {
    return milestone.start_date_planned || new Date().toISOString().split('T')[0];
  }

  // Find latest dependency end date
  const latestDepEnd = milestone.dependencies.reduce((latest, depId) => {
    const dependency = allMilestones.find(m => m.id === depId);
    if (dependency?.end_date_planned) {
      const depEnd = new Date(dependency.end_date_planned);
      return depEnd > latest ? depEnd : latest;
    }
    return latest;
  }, new Date());

  // Add one day buffer
  latestDepEnd.setDate(latestDepEnd.getDate() + 1);
  return latestDepEnd.toISOString().split('T')[0];
};

export const getMilestoneHealthScore = (milestone: ProgrammeMilestone): number => {
  let score = 100;

  // Deduct for delays
  if (milestone.status === 'delayed') score -= 30;
  if (milestone.delay_risk_flag) score -= 20;

  // Deduct for overdue milestones
  const dueDate = milestone.end_date_planned || milestone.planned_date;
  if (isOverdue(dueDate)) score -= 25;

  // Deduct for low completion on in-progress milestones
  if (milestone.status === 'in-progress' && milestone.completion_percentage < 50) {
    score -= 15;
  }

  // Boost for completed milestones
  if (milestone.status === 'complete') score = 100;

  return Math.max(0, score);
};

export const identifyResourceConflicts = (milestones: ProgrammeMilestone[]): Array<{
  trade: string;
  conflictingMilestones: ProgrammeMilestone[];
  overlapDays: number;
}> => {
  const conflicts: Array<{
    trade: string;
    conflictingMilestones: ProgrammeMilestone[];
    overlapDays: number;
  }> = [];

  const tradeGroups = groupMilestonesByTrade(milestones);
  
  Object.entries(tradeGroups).forEach(([trade, tradeMilestones]) => {
    for (let i = 0; i < tradeMilestones.length; i++) {
      for (let j = i + 1; j < tradeMilestones.length; j++) {
        const m1 = tradeMilestones[i];
        const m2 = tradeMilestones[j];
        
        if (m1.start_date_planned && m1.end_date_planned && 
            m2.start_date_planned && m2.end_date_planned) {
          const overlap = calculateDateOverlap(
            m1.start_date_planned, m1.end_date_planned,
            m2.start_date_planned, m2.end_date_planned
          );
          
          if (overlap > 0) {
            conflicts.push({
              trade,
              conflictingMilestones: [m1, m2],
              overlapDays: overlap
            });
          }
        }
      }
    }
  });

  return conflicts;
};

export const groupMilestonesByTrade = (milestones: ProgrammeMilestone[]): Record<string, ProgrammeMilestone[]> => {
  return milestones.reduce((groups, milestone) => {
    const trade = milestone.trade || 'General';
    if (!groups[trade]) {
      groups[trade] = [];
    }
    groups[trade].push(milestone);
    return groups;
  }, {} as Record<string, ProgrammeMilestone[]>);
};

export const calculateDateOverlap = (
  start1: string, end1: string,
  start2: string, end2: string
): number => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);

  const overlapStart = new Date(Math.max(s1.getTime(), s2.getTime()));
  const overlapEnd = new Date(Math.min(e1.getTime(), e2.getTime()));

  if (overlapStart <= overlapEnd) {
    return Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  return 0;
};
