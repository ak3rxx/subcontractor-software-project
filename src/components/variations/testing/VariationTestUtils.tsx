
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// Test wrapper
export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Common test utilities
export const variationTestUtils = {
  // Render with test wrapper
  renderWithWrapper: (component: React.ReactElement) => {
    return render(component, { wrapper: TestWrapper });
  },

  // Wait for async operations
  waitForLoadingToFinish: async () => {
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  },

  // Fire events
  clickButton: (buttonText: string) => {
    const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
    fireEvent.click(button);
  },

  // Form helpers
  fillInput: (labelText: string, value: string) => {
    const input = screen.getByLabelText(new RegExp(labelText, 'i'));
    fireEvent.change(input, { target: { value } });
  },

  // Assertions
  expectElementToBeVisible: (text: string) => {
    expect(screen.getByText(new RegExp(text, 'i'))).toBeInTheDocument();
  },

  expectElementNotToBeVisible: (text: string) => {
    expect(screen.queryByText(new RegExp(text, 'i'))).not.toBeInTheDocument();
  }
};
