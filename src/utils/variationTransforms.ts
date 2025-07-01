
import { Variation, VariationFormData, CostBreakdownItem, TimeImpactDetails } from '@/types/variations';
import { VariationError } from '@/types/variations';

export const parseCostBreakdown = (data: any): CostBreakdownItem[] => {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      id: item?.id || '',
      description: item?.description || '',
      quantity: Number(item?.quantity) || 0,
      rate: Number(item?.rate) || 0,
      subtotal: Number(item?.subtotal) || 0,
    }));
  }
  return [];
};

export const parseTimeImpactDetails = (data: any): TimeImpactDetails => {
  if (!data || typeof data !== 'object') {
    return { requiresNoticeOfDelay: false, requiresExtensionOfTime: false };
  }
  return {
    requiresNoticeOfDelay: Boolean(data.requiresNoticeOfDelay),
    requiresExtensionOfTime: Boolean(data.requiresExtensionOfTime),
    noticeOfDelayDays: data.noticeOfDelayDays ? Number(data.noticeOfDelayDays) : undefined,
    extensionOfTimeDays: data.extensionOfTimeDays ? Number(data.extensionOfTimeDays) : undefined,
  };
};

export const transformDatabaseToVariation = (item: any): Variation => {
  try {
    return {
      id: item.id,
      project_id: item.project_id,
      variation_number: item.variation_number,
      title: item.title,
      description: item.description,
      location: item.location || '',
      requested_by: item.requested_by,
      request_date: item.request_date || item.created_at.split('T')[0],
      cost_impact: item.cost_impact || 0,
      time_impact: item.time_impact || 0,
      status: item.status,
      category: item.category || '',
      trade: item.trade || undefined,
      priority: item.priority || 'medium',
      client_email: item.client_email || '',
      justification: item.justification || '',
      attachments: [],
      approved_by: item.approved_by,
      approval_date: item.approval_date,
      approval_comments: item.approval_comments || '',
      email_sent: item.email_sent || false,
      email_sent_date: item.email_sent_date,
      email_sent_by: item.email_sent_by,
      cost_breakdown: parseCostBreakdown(item.cost_breakdown),
      time_impact_details: parseTimeImpactDetails(item.time_impact_details),
      gst_amount: item.gst_amount || 0,
      total_amount: item.total_amount || 0,
      requires_eot: item.requires_eot || false,
      requires_nod: item.requires_nod || false,
      eot_days: item.eot_days || 0,
      nod_days: item.nod_days || 0,
      linked_milestones: item.linked_milestones || [],
      linked_tasks: item.linked_tasks || [],
      linked_qa_items: item.linked_qa_items || [],
      originating_rfi_id: item.originating_rfi_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      updated_by: item.updated_by
    };
  } catch (error) {
    throw new VariationError(
      'Failed to transform database item to variation',
      'TRANSFORM_ERROR',
      { item, error }
    );
  }
};

export const transformFormToDatabase = (formData: VariationFormData, projectId: string, userId: string): any => {
  return {
    project_id: projectId,
    title: formData.title,
    description: formData.description,
    location: formData.location,
    requested_by: userId,
    updated_by: userId,
    cost_impact: parseFloat(formData.costImpact.toString()) || formData.total_amount || 0,
    time_impact: parseInt(formData.timeImpact.toString()) || 0,
    priority: formData.priority || 'medium',
    status: 'draft',
    category: formData.category,
    trade: formData.trade,
    client_email: formData.clientEmail,
    justification: formData.justification,
    cost_breakdown: formData.cost_breakdown || [],
    time_impact_details: formData.time_impact_details || { requiresNoticeOfDelay: false, requiresExtensionOfTime: false },
    gst_amount: formData.gst_amount || 0,
    total_amount: formData.total_amount || 0,
    requires_eot: formData.requires_eot || false,
    requires_nod: formData.requires_nod || false,
    eot_days: formData.eot_days || 0,
    nod_days: formData.nod_days || 0,
    linked_milestones: formData.linked_milestones || [],
    linked_tasks: formData.linked_tasks || [],
    linked_qa_items: formData.linked_qa_items || []
  };
};

export const calculateVariationSummary = (variations: Variation[]) => {
  return variations.reduce((summary, variation) => {
    summary.total++;
    summary[variation.status]++;
    summary.totalCostImpact += variation.cost_impact;
    summary.averageTimeImpact += variation.time_impact;
    return summary;
  }, {
    total: 0,
    draft: 0,
    pending_approval: 0,
    approved: 0,
    rejected: 0,
    totalCostImpact: 0,
    averageTimeImpact: 0
  });
};

export const formatCurrency = (amount: number): string => {
  if (amount >= 0) {
    return `+$${amount.toLocaleString()}`;
  }
  return `-$${Math.abs(amount).toLocaleString()}`;
};

export const validateVariationForm = (formData: VariationFormData): string[] => {
  const errors: string[] = [];

  if (!formData.title.trim()) {
    errors.push('Title is required');
  }

  if (!formData.description.trim()) {
    errors.push('Description is required');
  }

  if (formData.total_amount < 0) {
    errors.push('Total amount cannot be negative');
  }

  if (formData.clientEmail && !/\S+@\S+\.\S+/.test(formData.clientEmail)) {
    errors.push('Invalid email format');
  }

  return errors;
};
