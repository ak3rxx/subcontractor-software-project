
import { VariationStatus, VariationPriority, VariationCategory } from '@/types/variations';

export const VARIATION_STATUS_OPTIONS: { value: VariationStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' }
];

export const VARIATION_PRIORITY_OPTIONS: { value: VariationPriority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'red' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'low', label: 'Low', color: 'green' }
];

export const VARIATION_CATEGORY_OPTIONS: { value: VariationCategory; label: string }[] = [
  { value: 'design_change', label: 'Design Change' },
  { value: 'site_condition', label: 'Site Condition' },
  { value: 'client_request', label: 'Client Request' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'other', label: 'Other' }
];

export const VARIATION_TRADE_OPTIONS = [
  'Concrete',
  'Steel',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Carpentry',
  'Masonry',
  'Roofing',
  'Insulation',
  'Drywall',
  'Painting',
  'Landscaping'
];

export const DEFAULT_VARIATION_FORM_DATA = {
  title: '',
  description: '',
  location: '',
  category: 'other' as VariationCategory,
  trade: '',
  priority: 'medium' as VariationPriority,
  costImpact: 0,
  timeImpact: 0,
  clientEmail: '',
  justification: '',
  cost_breakdown: [],
  time_impact_details: {
    requiresNoticeOfDelay: false,
    requiresExtensionOfTime: false
  },
  gst_amount: 0,
  total_amount: 0,
  requires_eot: false,
  requires_nod: false,
  eot_days: 0,
  nod_days: 0,
  linked_milestones: [],
  linked_tasks: [],
  linked_qa_items: []
};

export const VARIATION_STATUS_WORKFLOW = {
  draft: ['pending_approval'],
  pending_approval: ['approved', 'rejected', 'draft'],
  approved: ['pending_approval'], // Can revert for corrections
  rejected: ['pending_approval', 'draft']
};
