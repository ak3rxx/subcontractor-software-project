
import React from 'react';
import { Variation, VariationFormData } from '@/types/variations';

// Mock data generators
export const createMockVariation = (overrides: Partial<Variation> = {}): Variation => {
  return {
    id: 'var-123',
    project_id: 'proj-123',
    variation_number: 'VAR-001',
    title: 'Test Variation',
    description: 'Test description',
    location: 'Test location',
    requested_by: 'user-123',
    request_date: '2023-01-01',
    cost_impact: 1000,
    time_impact: 5,
    status: 'draft',
    category: 'other',
    trade: 'electrical',
    priority: 'medium',
    client_email: 'client@test.com',
    justification: 'Test justification',
    attachments: [],
    approved_by: undefined,
    approval_date: undefined,
    approval_comments: '',
    email_sent: false,
    email_sent_date: undefined,
    email_sent_by: undefined,
    cost_breakdown: [],
    time_impact_details: {
      requiresNoticeOfDelay: false,
      requiresExtensionOfTime: false
    },
    gst_amount: 0,
    total_amount: 1000,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    requires_eot: false,
    requires_nod: false,
    eot_days: 0,
    nod_days: 0,
    linked_milestones: [],
    linked_tasks: [],
    linked_qa_items: [],
    originating_rfi_id: undefined,
    updated_by: undefined,
    ...overrides
  };
};

export const createMockFormData = (overrides: Partial<VariationFormData> = {}): VariationFormData => {
  return {
    title: 'Test Variation',
    description: 'Test description',
    location: 'Test location',
    category: 'other',
    trade: 'electrical',
    priority: 'medium',
    costImpact: 1000,
    timeImpact: 5,
    clientEmail: 'client@test.com',
    justification: 'Test justification',
    cost_breakdown: [],
    time_impact_details: {
      requiresNoticeOfDelay: false,
      requiresExtensionOfTime: false
    },
    gst_amount: 0,
    total_amount: 1000,
    requires_eot: false,
    requires_nod: false,
    eot_days: 0,
    nod_days: 0,
    linked_milestones: [],
    linked_tasks: [],
    linked_qa_items: [],
    ...overrides
  };
};

// Test data generators
export const generateMockVariations = (count: number): Variation[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockVariation({
      id: `var-${index + 1}`,
      variation_number: `VAR-${String(index + 1).padStart(3, '0')}`,
      title: `Test Variation ${index + 1}`,
      cost_impact: (index + 1) * 1000,
      status: ['draft', 'pending_approval', 'approved', 'rejected'][index % 4] as any,
      priority: ['high', 'medium', 'low'][index % 3] as any
    })
  );
};

// Validation utilities
export const validateVariationData = (variation: Variation): boolean => {
  return !!(
    variation.id &&
    variation.project_id &&
    variation.variation_number &&
    variation.title &&
    variation.status &&
    variation.priority
  );
};

// Test helper functions
export const variationTestHelpers = {
  // Create test scenarios
  createDraftVariation: () => createMockVariation({ status: 'draft' }),
  createPendingVariation: () => createMockVariation({ status: 'pending_approval' }),
  createApprovedVariation: () => createMockVariation({ status: 'approved' }),
  createRejectedVariation: () => createMockVariation({ status: 'rejected' }),
  
  // Create variations with specific properties
  createHighPriorityVariation: () => createMockVariation({ priority: 'high' }),
  createLowCostVariation: () => createMockVariation({ cost_impact: 100 }),
  createHighCostVariation: () => createMockVariation({ cost_impact: 10000 }),
  
  // Validation helpers
  isValidVariation: validateVariationData,
  
  // Filter test data
  filterByStatus: (variations: Variation[], status: string) => 
    variations.filter(v => v.status === status),
  
  filterByPriority: (variations: Variation[], priority: string) => 
    variations.filter(v => v.priority === priority),
    
  // Calculate test summaries
  calculateTestSummary: (variations: Variation[]) => ({
    total: variations.length,
    totalCost: variations.reduce((sum, v) => sum + v.cost_impact, 0),
    averageTime: variations.length > 0 
      ? variations.reduce((sum, v) => sum + v.time_impact, 0) / variations.length 
      : 0
  })
};

// Console-based testing utilities (for development)
export const consoleTestUtils = {
  logVariationSummary: (variations: Variation[]) => {
    console.log('=== Variation Test Summary ===');
    console.log(`Total variations: ${variations.length}`);
    console.log(`Draft: ${variations.filter(v => v.status === 'draft').length}`);
    console.log(`Pending: ${variations.filter(v => v.status === 'pending_approval').length}`);
    console.log(`Approved: ${variations.filter(v => v.status === 'approved').length}`);
    console.log(`Rejected: ${variations.filter(v => v.status === 'rejected').length}`);
  },
  
  logValidationResults: (variations: Variation[]) => {
    const valid = variations.filter(validateVariationData);
    const invalid = variations.filter(v => !validateVariationData(v));
    console.log(`Valid variations: ${valid.length}`);
    console.log(`Invalid variations: ${invalid.length}`);
    if (invalid.length > 0) {
      console.log('Invalid variations:', invalid);
    }
  }
};
