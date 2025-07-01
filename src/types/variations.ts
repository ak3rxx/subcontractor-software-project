export type VariationStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';
export type VariationPriority = 'high' | 'medium' | 'low';
export type VariationCategory = 'design_change' | 'site_condition' | 'client_request' | 'regulatory' | 'other';

export interface CostBreakdownItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  subtotal: number;
  [key: string]: any; // Index signature for Json compatibility
}

export interface TimeImpactDetails {
  requiresNoticeOfDelay: boolean;
  requiresExtensionOfTime: boolean;
  noticeOfDelayDays?: number;
  extensionOfTimeDays?: number;
  [key: string]: any; // Index signature for Json compatibility
}

export interface VariationAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface VariationAuditEntry {
  id: string;
  variation_id: string;
  user_id: string;
  action_type: string;
  action_timestamp: string;
  comments?: string;
  metadata?: Record<string, any>;
  status_from?: string;
  status_to?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
}

export interface Variation {
  id: string;
  project_id: string;
  variation_number: string;
  title: string;
  description?: string;
  location?: string;
  requested_by?: string;
  request_date: string;
  cost_impact: number;
  time_impact: number;
  status: VariationStatus;
  category?: VariationCategory;
  trade?: string;
  priority: VariationPriority;
  client_email?: string;
  justification?: string;
  attachments: VariationAttachment[];
  approved_by?: string;
  approval_date?: string;
  approval_comments?: string;
  email_sent?: boolean;
  email_sent_date?: string;
  email_sent_by?: string;
  cost_breakdown: CostBreakdownItem[];
  time_impact_details: TimeImpactDetails;
  gst_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  requires_eot: boolean;
  requires_nod: boolean;
  eot_days: number;
  nod_days: number;
  linked_milestones: string[];
  linked_tasks: string[];
  linked_qa_items: string[];
  originating_rfi_id?: string;
  updated_by?: string;
}

export interface VariationFormData {
  title: string;
  description: string;
  location: string;
  category: VariationCategory;
  trade?: string;
  priority: VariationPriority;
  costImpact: number;
  timeImpact: number;
  clientEmail: string;
  justification: string;
  cost_breakdown: CostBreakdownItem[];
  time_impact_details: TimeImpactDetails;
  gst_amount: number;
  total_amount: number;
  requires_eot: boolean;
  requires_nod: boolean;
  eot_days: number;
  nod_days: number;
  linked_milestones: string[];
  linked_tasks: string[];
  linked_qa_items: string[];
}

export interface VariationFilters {
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  categoryFilter?: string;
  tradeFilter?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface VariationSummary {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  totalCostImpact: number;
  averageTimeImpact: number;
}

export class VariationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VariationError';
  }
}
