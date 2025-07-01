
export interface PaymentSchedule {
  id: string;
  payment_claim_id: string;
  project_id: string;
  schedule_number: string;
  respondent_company_name: string;
  respondent_abn: string;
  respondent_acn?: string;
  respondent_address: string;
  respondent_suburb: string;
  respondent_postcode: string;
  respondent_email: string;
  scheduled_amount: number;
  withheld_amount: number;
  withholding_reasons: any[];
  contract_clauses?: string;
  supporting_evidence: any[];
  service_method: 'email' | 'post' | 'in-person';
  service_proof?: string;
  service_date?: string;
  pdf_path?: string;
  word_path?: string;
  legal_deadline: string;
  status: 'draft' | 'sent' | 'delivered';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WithholdingSuggestion {
  reason: string;
  suggestion_type: string;
  evidence_count: number;
  confidence_score: number;
}
