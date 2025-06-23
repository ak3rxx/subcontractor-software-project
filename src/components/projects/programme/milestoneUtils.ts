
export interface Milestone {
  id: number;
  name: string;
  dueDate: string;
  status: 'complete' | 'in-progress' | 'pending' | 'overdue';
  linkedModule: string;
  priority: 'high' | 'normal' | 'low' | 'medium';
  assignedTo: string;
  daysOverdue: number;
}

export const isWithinDays = (dateString: string, days: number) => {
  const targetDate = new Date(dateString);
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return targetDate >= today && targetDate <= futureDate;
};

export const getDaysUntil = (dateString: string) => {
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getSampleMilestones = (): Milestone[] => [
  {
    id: 1,
    name: 'Foundation Completion',
    dueDate: '2024-02-15',
    status: 'complete',
    linkedModule: 'QA/ITP',
    priority: 'high',
    assignedTo: 'John Smith',
    daysOverdue: 0
  },
  {
    id: 2,
    name: 'Framing Complete',
    dueDate: '2024-03-01',
    status: 'in-progress',
    linkedModule: 'Material Handover',
    priority: 'high',
    assignedTo: 'Sarah Johnson',
    daysOverdue: 0
  },
  {
    id: 3,
    name: 'Roof Installation',
    dueDate: '2024-03-15',
    status: 'pending',
    linkedModule: 'Delivery Schedule',
    priority: 'normal',
    assignedTo: 'Mike Davis',
    daysOverdue: 0
  },
  {
    id: 4,
    name: 'Electrical First Fix',
    dueDate: '2024-01-20',
    status: 'overdue',
    linkedModule: 'RFI',
    priority: 'high',
    assignedTo: 'Lisa Wang',
    daysOverdue: 3
  },
  {
    id: 5,
    name: 'Plumbing Rough-in',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    linkedModule: 'QA/ITP',
    priority: 'high',
    assignedTo: 'Tom Wilson',
    daysOverdue: 0
  },
  {
    id: 6,
    name: 'Insulation Installation',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    linkedModule: 'Material Handover',
    priority: 'medium',
    assignedTo: 'Emma Brown',
    daysOverdue: 0
  },
  {
    id: 7,
    name: 'Drywall Installation',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    linkedModule: 'Delivery Schedule',
    priority: 'medium',
    assignedTo: 'Chris Green',
    daysOverdue: 0
  },
  {
    id: 8,
    name: 'Flooring Installation',
    dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    linkedModule: 'Material Handover',
    priority: 'normal',
    assignedTo: 'Alex Turner',
    daysOverdue: 0
  }
];
