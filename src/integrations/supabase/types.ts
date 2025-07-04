export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      actual_costs: {
        Row: {
          actual_cost: number
          budget_item_id: string | null
          cost_date: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          notes: string | null
          project_id: string | null
          related_reference: string | null
          status: string | null
          trade_category: string
        }
        Insert: {
          actual_cost: number
          budget_item_id?: string | null
          cost_date: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          notes?: string | null
          project_id?: string | null
          related_reference?: string | null
          status?: string | null
          trade_category: string
        }
        Update: {
          actual_cost?: number
          budget_item_id?: string | null
          cost_date?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          related_reference?: string | null
          status?: string | null
          trade_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "actual_costs_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actual_costs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actual_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_patterns: {
        Row: {
          created_at: string | null
          id: string
          pattern_data: Json
          pattern_type: string
          project_type: string | null
          success_rate: number | null
          trade_category: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pattern_data: Json
          pattern_type: string
          project_type?: string | null
          success_rate?: number | null
          trade_category?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pattern_data?: Json
          pattern_type?: string
          project_type?: string | null
          success_rate?: number | null
          trade_category?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      ai_trade_learning: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          description_context: string
          id: string
          is_approved: boolean | null
          organization_id: string
          suggested_trade: string
          updated_at: string | null
          usage_frequency: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          description_context: string
          id?: string
          is_approved?: boolean | null
          organization_id: string
          suggested_trade: string
          updated_at?: string | null
          usage_frequency?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          description_context?: string
          id?: string
          is_approved?: boolean | null
          organization_id?: string
          suggested_trade?: string
          updated_at?: string | null
          usage_frequency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_trade_learning_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          budgeted_cost: number
          created_at: string | null
          description: string
          id: string
          last_variation_update: string | null
          notes: string | null
          originating_variation_id: string | null
          project_id: string | null
          quantity: number | null
          reference_number: string | null
          trade_category: string
          unit: string | null
          unit_cost: number | null
          updated_at: string | null
          variation_allowance: number | null
          variation_impact: number | null
        }
        Insert: {
          budgeted_cost: number
          created_at?: string | null
          description: string
          id?: string
          last_variation_update?: string | null
          notes?: string | null
          originating_variation_id?: string | null
          project_id?: string | null
          quantity?: number | null
          reference_number?: string | null
          trade_category: string
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          variation_allowance?: number | null
          variation_impact?: number | null
        }
        Update: {
          budgeted_cost?: number
          created_at?: string | null
          description?: string
          id?: string
          last_variation_update?: string | null
          notes?: string | null
          originating_variation_id?: string | null
          project_id?: string | null
          quantity?: number | null
          reference_number?: string | null
          trade_category?: string
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          variation_allowance?: number | null
          variation_impact?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      category_learning_patterns: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          pattern_data: Json
          success_rate: number | null
          trade_industry: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          pattern_data: Json
          success_rate?: number | null
          trade_industry: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          pattern_data?: Json
          success_rate?: number | null
          trade_industry?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "category_learning_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          created_at: string | null
          document_type: string | null
          file_path: string | null
          file_size: number | null
          id: string
          name: string
          notes: string | null
          project_id: string | null
          status: string | null
          tags: string[] | null
          upload_date: string | null
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string | null
          document_type?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          name: string
          notes?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          upload_date?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string | null
          document_type?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          name?: string
          notes?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          upload_date?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          flag_name: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flag_name?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_states: {
        Row: {
          completed_steps: Json | null
          created_at: string | null
          current_step: string | null
          id: string
          is_completed: boolean | null
          organization_id: string
          role: string
          tour_preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          is_completed?: boolean | null
          organization_id: string
          role: string
          tour_preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          is_completed?: boolean | null
          organization_id?: string
          role?: string
          tour_preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_states_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_categories: {
        Row: {
          category_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          trade_industry: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          trade_industry: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          trade_industry?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invitation_token: string | null
          invited_by: string
          organization_id: string
          role: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_by: string
          organization_id: string
          role?: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_by?: string
          organization_id?: string
          role?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string | null
          default_folder_structure: Json | null
          email_templates: Json | null
          id: string
          logo_url: string | null
          notification_settings: Json | null
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_folder_structure?: Json | null
          email_templates?: Json | null
          id?: string
          logo_url?: string | null
          notification_settings?: Json | null
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_folder_structure?: Json | null
          email_templates?: Json | null
          id?: string
          logo_url?: string | null
          notification_settings?: Json | null
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active_users_count: number
          address: string | null
          branding_settings: Json | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          emergency_contact: string | null
          id: string
          is_trial: boolean | null
          license_count: number
          name: string
          slug: string
          subscription_end_date: string | null
          subscription_status: string | null
          trial_end_date: string | null
          updated_at: string | null
        }
        Insert: {
          active_users_count?: number
          address?: string | null
          branding_settings?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          id?: string
          is_trial?: boolean | null
          license_count?: number
          name: string
          slug: string
          subscription_end_date?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Update: {
          active_users_count?: number
          address?: string | null
          branding_settings?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          id?: string
          is_trial?: boolean | null
          license_count?: number
          name?: string
          slug?: string
          subscription_end_date?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_claims: {
        Row: {
          claim_amount: number
          claim_description: string | null
          claim_number: string
          claim_received_date: string
          claimant_abn: string
          claimant_acn: string | null
          claimant_address: string
          claimant_company_name: string
          claimant_email: string
          claimant_postcode: string
          claimant_suburb: string
          contract_number: string | null
          created_at: string | null
          created_by: string | null
          id: string
          project_id: string | null
          status: string
          supporting_documents: Json | null
          updated_at: string | null
        }
        Insert: {
          claim_amount?: number
          claim_description?: string | null
          claim_number: string
          claim_received_date: string
          claimant_abn: string
          claimant_acn?: string | null
          claimant_address: string
          claimant_company_name: string
          claimant_email: string
          claimant_postcode: string
          claimant_suburb: string
          contract_number?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
          status?: string
          supporting_documents?: Json | null
          updated_at?: string | null
        }
        Update: {
          claim_amount?: number
          claim_description?: string | null
          claim_number?: string
          claim_received_date?: string
          claimant_abn?: string
          claimant_acn?: string | null
          claimant_address?: string
          claimant_company_name?: string
          claimant_email?: string
          claimant_postcode?: string
          claimant_suburb?: string
          contract_number?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
          status?: string
          supporting_documents?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedule_audit_trail: {
        Row: {
          action_description: string | null
          action_timestamp: string | null
          action_type: string
          days_remaining: number | null
          deadline_status: string | null
          id: string
          metadata: Json | null
          payment_claim_id: string | null
          payment_schedule_id: string | null
          risk_level: string | null
          user_id: string | null
        }
        Insert: {
          action_description?: string | null
          action_timestamp?: string | null
          action_type: string
          days_remaining?: number | null
          deadline_status?: string | null
          id?: string
          metadata?: Json | null
          payment_claim_id?: string | null
          payment_schedule_id?: string | null
          risk_level?: string | null
          user_id?: string | null
        }
        Update: {
          action_description?: string | null
          action_timestamp?: string | null
          action_type?: string
          days_remaining?: number | null
          deadline_status?: string | null
          id?: string
          metadata?: Json | null
          payment_claim_id?: string | null
          payment_schedule_id?: string | null
          risk_level?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedule_audit_trail_payment_claim_id_fkey"
            columns: ["payment_claim_id"]
            isOneToOne: false
            referencedRelation: "payment_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_audit_trail_payment_schedule_id_fkey"
            columns: ["payment_schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          contract_clauses: string | null
          created_at: string | null
          created_by: string | null
          id: string
          legal_deadline: string
          payment_claim_id: string | null
          pdf_path: string | null
          project_id: string | null
          respondent_abn: string
          respondent_acn: string | null
          respondent_address: string
          respondent_company_name: string
          respondent_email: string
          respondent_postcode: string
          respondent_suburb: string
          schedule_number: string
          scheduled_amount: number
          service_date: string | null
          service_method: string
          service_proof: string | null
          status: string
          supporting_evidence: Json | null
          updated_at: string | null
          withheld_amount: number
          withholding_reasons: Json | null
          word_path: string | null
        }
        Insert: {
          contract_clauses?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          legal_deadline: string
          payment_claim_id?: string | null
          pdf_path?: string | null
          project_id?: string | null
          respondent_abn: string
          respondent_acn?: string | null
          respondent_address: string
          respondent_company_name: string
          respondent_email: string
          respondent_postcode: string
          respondent_suburb: string
          schedule_number: string
          scheduled_amount?: number
          service_date?: string | null
          service_method?: string
          service_proof?: string | null
          status?: string
          supporting_evidence?: Json | null
          updated_at?: string | null
          withheld_amount?: number
          withholding_reasons?: Json | null
          word_path?: string | null
        }
        Update: {
          contract_clauses?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          legal_deadline?: string
          payment_claim_id?: string | null
          pdf_path?: string | null
          project_id?: string | null
          respondent_abn?: string
          respondent_acn?: string | null
          respondent_address?: string
          respondent_company_name?: string
          respondent_email?: string
          respondent_postcode?: string
          respondent_suburb?: string
          schedule_number?: string
          scheduled_amount?: number
          service_date?: string | null
          service_method?: string
          service_proof?: string | null
          status?: string
          supporting_evidence?: Json | null
          updated_at?: string | null
          withheld_amount?: number
          withholding_reasons?: Json | null
          word_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_payment_claim_id_fkey"
            columns: ["payment_claim_id"]
            isOneToOne: false
            referencedRelation: "payment_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_developer: boolean
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_developer?: boolean
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_developer?: boolean
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      programme_milestones: {
        Row: {
          actual_date: string | null
          affected_by_variations: Json | null
          assigned_to: string | null
          baseline_date: string | null
          category: string | null
          completion_percentage: number | null
          created_at: string | null
          critical_path: boolean | null
          delay_risk_flag: boolean | null
          dependencies: string[] | null
          description: string | null
          end_date_actual: string | null
          end_date_planned: string | null
          id: string
          linked_deliveries: string[] | null
          linked_handovers: string[] | null
          linked_itps: string[] | null
          linked_tasks: string[] | null
          milestone_name: string
          notes: string | null
          planned_date: string
          priority: string | null
          project_id: string | null
          reference_number: string | null
          start_date_actual: string | null
          start_date_planned: string | null
          status: string | null
          trade: string | null
          updated_at: string | null
          variation_adjusted_date: string | null
          variation_time_impact: number | null
        }
        Insert: {
          actual_date?: string | null
          affected_by_variations?: Json | null
          assigned_to?: string | null
          baseline_date?: string | null
          category?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          critical_path?: boolean | null
          delay_risk_flag?: boolean | null
          dependencies?: string[] | null
          description?: string | null
          end_date_actual?: string | null
          end_date_planned?: string | null
          id?: string
          linked_deliveries?: string[] | null
          linked_handovers?: string[] | null
          linked_itps?: string[] | null
          linked_tasks?: string[] | null
          milestone_name: string
          notes?: string | null
          planned_date: string
          priority?: string | null
          project_id?: string | null
          reference_number?: string | null
          start_date_actual?: string | null
          start_date_planned?: string | null
          status?: string | null
          trade?: string | null
          updated_at?: string | null
          variation_adjusted_date?: string | null
          variation_time_impact?: number | null
        }
        Update: {
          actual_date?: string | null
          affected_by_variations?: Json | null
          assigned_to?: string | null
          baseline_date?: string | null
          category?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          critical_path?: boolean | null
          delay_risk_flag?: boolean | null
          dependencies?: string[] | null
          description?: string | null
          end_date_actual?: string | null
          end_date_planned?: string | null
          id?: string
          linked_deliveries?: string[] | null
          linked_handovers?: string[] | null
          linked_itps?: string[] | null
          linked_tasks?: string[] | null
          milestone_name?: string
          notes?: string | null
          planned_date?: string
          priority?: string | null
          project_id?: string | null
          reference_number?: string | null
          start_date_actual?: string | null
          start_date_planned?: string | null
          status?: string | null
          trade?: string | null
          updated_at?: string | null
          variation_adjusted_date?: string | null
          variation_time_impact?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programme_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          project_type: string | null
          template_data: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          project_type?: string | null
          template_data: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_type?: string | null
          template_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      programme_uploads: {
        Row: {
          file_path: string | null
          id: string
          original_filename: string
          processed_at: string | null
          processing_result: Json | null
          project_id: string | null
          upload_status: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_path?: string | null
          id?: string
          original_filename: string
          processed_at?: string | null
          processing_result?: Json | null
          project_id?: string | null
          upload_status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_path?: string | null
          id?: string
          original_filename?: string
          processed_at?: string | null
          processing_result?: Json | null
          project_id?: string | null
          upload_status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_completion: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          estimated_completion: string | null
          id: string
          name: string
          organization_id: string | null
          project_manager_id: string | null
          project_number: number
          project_type: string | null
          site_address: string | null
          start_date: string | null
          status: string | null
          total_budget: number | null
          updated_at: string | null
        }
        Insert: {
          actual_completion?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_completion?: string | null
          id?: string
          name: string
          organization_id?: string | null
          project_manager_id?: string | null
          project_number: number
          project_type?: string | null
          site_address?: string | null
          start_date?: string | null
          status?: string | null
          total_budget?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_completion?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_completion?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          project_manager_id?: string | null
          project_number?: number
          project_type?: string | null
          site_address?: string | null
          start_date?: string | null
          status?: string | null
          total_budget?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_change_history: {
        Row: {
          change_type: string
          created_at: string | null
          field_name: string
          id: string
          inspection_id: string
          item_description: string | null
          item_id: string | null
          new_value: string | null
          old_value: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          change_type: string
          created_at?: string | null
          field_name: string
          id?: string
          inspection_id: string
          item_description?: string | null
          item_id?: string | null
          new_value?: string | null
          old_value?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          change_type?: string
          created_at?: string | null
          field_name?: string
          id?: string
          inspection_id?: string
          item_description?: string | null
          item_id?: string | null
          new_value?: string | null
          old_value?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_change_history_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "qa_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_change_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_checklist_items: {
        Row: {
          comments: string | null
          created_at: string | null
          description: string
          evidence_files: string[] | null
          id: string
          inspection_id: string
          item_id: string
          requirements: string
          status: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          description: string
          evidence_files?: string[] | null
          id?: string
          inspection_id: string
          item_id: string
          requirements: string
          status?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          description?: string
          evidence_files?: string[] | null
          id?: string
          inspection_id?: string
          item_id?: string
          requirements?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_checklist_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "qa_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_inspections: {
        Row: {
          created_at: string | null
          created_by: string
          digital_signature: string
          id: string
          inspection_date: string
          inspection_number: string
          inspection_type: string
          inspector_name: string
          is_fire_door: boolean | null
          location_reference: string
          organization_id: string | null
          overall_status: string
          project_id: string
          project_name: string
          task_area: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          digital_signature: string
          id?: string
          inspection_date: string
          inspection_number: string
          inspection_type: string
          inspector_name: string
          is_fire_door?: boolean | null
          location_reference: string
          organization_id?: string | null
          overall_status: string
          project_id: string
          project_name: string
          task_area: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          digital_signature?: string
          id?: string
          inspection_date?: string
          inspection_number?: string
          inspection_type?: string
          inspector_name?: string
          is_fire_door?: boolean | null
          location_reference?: string
          organization_id?: string | null
          overall_status?: string
          project_id?: string
          project_name?: string
          task_area?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_inspections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rfis: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          reference_number: string | null
          response: string | null
          response_date: string | null
          rfi_number: string
          status: string | null
          submitted_by: string | null
          submitted_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          reference_number?: string | null
          response?: string | null
          response_date?: string | null
          rfi_number: string
          status?: string | null
          submitted_by?: string | null
          submitted_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          reference_number?: string | null
          response?: string | null
          response_date?: string | null
          rfi_number?: string
          status?: string | null
          submitted_by?: string | null
          submitted_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfis_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_assignment_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          existing_role: string | null
          id: string
          organization_id: string
          reason: string | null
          requested_by: string | null
          requested_role: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          existing_role?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          requested_by?: string | null
          requested_role?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          existing_role?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          requested_by?: string | null
          requested_role?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignment_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_projects: {
        Row: {
          created_at: string | null
          folder_structure: Json | null
          id: string
          organization_id: string
          project_name: string
          project_type: string | null
          template_data: Json | null
        }
        Insert: {
          created_at?: string | null
          folder_structure?: Json | null
          id?: string
          organization_id: string
          project_name?: string
          project_type?: string | null
          template_data?: Json | null
        }
        Update: {
          created_at?: string | null
          folder_structure?: Json | null
          id?: string
          organization_id?: string
          project_name?: string
          project_type?: string | null
          template_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sample_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_diagnostics: {
        Row: {
          check_type: string
          created_at: string
          details: Json | null
          id: string
          message: string
          status: string
        }
        Insert: {
          check_type: string
          created_at?: string
          details?: Json | null
          id?: string
          message: string
          status: string
        }
        Update: {
          check_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          message?: string
          status?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_date: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          reference_number: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          reference_number?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          reference_number?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_notes: {
        Row: {
          author_id: string | null
          created_at: string | null
          id: string
          note: string
          note_type: string | null
          priority: string | null
          project_id: string | null
          tags: string[] | null
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          note: string
          note_type?: string | null
          priority?: string | null
          project_id?: string | null
          tags?: string[] | null
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          note?: string
          note_type?: string | null
          priority?: string | null
          project_id?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "team_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding_state: {
        Row: {
          completed_steps: Json
          created_at: string
          current_step: string | null
          id: string
          is_completed: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_steps?: Json
          created_at?: string
          current_step?: string | null
          id?: string
          is_completed?: boolean
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_steps?: Json
          created_at?: string
          current_step?: string | null
          id?: string
          is_completed?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      variation_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          uploaded_at: string | null
          uploaded_by: string | null
          variation_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          variation_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variation_attachments_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      variation_audit_trail: {
        Row: {
          action_timestamp: string | null
          action_type: string
          comments: string | null
          created_at: string | null
          field_name: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          status_from: string | null
          status_to: string | null
          user_id: string
          variation_id: string
        }
        Insert: {
          action_timestamp?: string | null
          action_type: string
          comments?: string | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          status_from?: string | null
          status_to?: string | null
          user_id: string
          variation_id: string
        }
        Update: {
          action_timestamp?: string | null
          action_type?: string
          comments?: string | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          status_from?: string | null
          status_to?: string | null
          user_id?: string
          variation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variation_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variation_audit_trail_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      variation_budget_impacts: {
        Row: {
          budget_item_id: string | null
          created_at: string
          id: string
          impact_amount: number
          impact_type: string
          variation_id: string | null
        }
        Insert: {
          budget_item_id?: string | null
          created_at?: string
          id?: string
          impact_amount?: number
          impact_type: string
          variation_id?: string | null
        }
        Update: {
          budget_item_id?: string | null
          created_at?: string
          id?: string
          impact_amount?: number
          impact_type?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variation_budget_impacts_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variation_budget_impacts_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      variation_edit_history: {
        Row: {
          created_at: string | null
          edit_reason: string | null
          edited_by: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          variation_id: string | null
        }
        Insert: {
          created_at?: string | null
          edit_reason?: string | null
          edited_by?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          variation_id?: string | null
        }
        Update: {
          created_at?: string | null
          edit_reason?: string | null
          edited_by?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variation_edit_history_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      variation_milestones: {
        Row: {
          created_at: string
          id: string
          milestone_id: string | null
          time_impact_days: number
          variation_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          milestone_id?: string | null
          time_impact_days?: number
          variation_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          milestone_id?: string | null
          time_impact_days?: number
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variation_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "programme_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variation_milestones_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["id"]
          },
        ]
      }
      variations: {
        Row: {
          approval_comments: string | null
          approval_date: string | null
          approved_by: string | null
          category: string | null
          client_email: string | null
          cost_breakdown: Json | null
          cost_impact: number | null
          created_at: string | null
          description: string | null
          email_sent: boolean | null
          email_sent_by: string | null
          email_sent_date: string | null
          eot_days: number | null
          gst_amount: number | null
          id: string
          justification: string | null
          linked_finance_impacts: Json | null
          linked_milestones: Json | null
          linked_programme_milestones: Json | null
          linked_qa_items: Json | null
          linked_tasks: Json | null
          location: string | null
          nod_days: number | null
          originating_rfi_id: string | null
          pdf_generated_at: string | null
          pdf_generated_by: string | null
          priority: string | null
          project_id: string | null
          request_date: string | null
          requested_by: string | null
          requires_eot: boolean | null
          requires_nod: boolean | null
          status: string | null
          submitted_by: string | null
          submitted_date: string | null
          time_impact: number | null
          time_impact_details: Json | null
          title: string
          total_amount: number | null
          trade: string | null
          updated_at: string | null
          updated_by: string | null
          variation_number: string
        }
        Insert: {
          approval_comments?: string | null
          approval_date?: string | null
          approved_by?: string | null
          category?: string | null
          client_email?: string | null
          cost_breakdown?: Json | null
          cost_impact?: number | null
          created_at?: string | null
          description?: string | null
          email_sent?: boolean | null
          email_sent_by?: string | null
          email_sent_date?: string | null
          eot_days?: number | null
          gst_amount?: number | null
          id?: string
          justification?: string | null
          linked_finance_impacts?: Json | null
          linked_milestones?: Json | null
          linked_programme_milestones?: Json | null
          linked_qa_items?: Json | null
          linked_tasks?: Json | null
          location?: string | null
          nod_days?: number | null
          originating_rfi_id?: string | null
          pdf_generated_at?: string | null
          pdf_generated_by?: string | null
          priority?: string | null
          project_id?: string | null
          request_date?: string | null
          requested_by?: string | null
          requires_eot?: boolean | null
          requires_nod?: boolean | null
          status?: string | null
          submitted_by?: string | null
          submitted_date?: string | null
          time_impact?: number | null
          time_impact_details?: Json | null
          title: string
          total_amount?: number | null
          trade?: string | null
          updated_at?: string | null
          updated_by?: string | null
          variation_number: string
        }
        Update: {
          approval_comments?: string | null
          approval_date?: string | null
          approved_by?: string | null
          category?: string | null
          client_email?: string | null
          cost_breakdown?: Json | null
          cost_impact?: number | null
          created_at?: string | null
          description?: string | null
          email_sent?: boolean | null
          email_sent_by?: string | null
          email_sent_date?: string | null
          eot_days?: number | null
          gst_amount?: number | null
          id?: string
          justification?: string | null
          linked_finance_impacts?: Json | null
          linked_milestones?: Json | null
          linked_programme_milestones?: Json | null
          linked_qa_items?: Json | null
          linked_tasks?: Json | null
          location?: string | null
          nod_days?: number | null
          originating_rfi_id?: string | null
          pdf_generated_at?: string | null
          pdf_generated_by?: string | null
          priority?: string | null
          project_id?: string | null
          request_date?: string | null
          requested_by?: string | null
          requires_eot?: boolean | null
          requires_nod?: boolean | null
          status?: string | null
          submitted_by?: string | null
          submitted_date?: string | null
          time_impact?: number | null
          time_impact_details?: Json | null
          title?: string
          total_amount?: number | null
          trade?: string | null
          updated_at?: string | null
          updated_by?: string | null
          variation_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "variations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variations_originating_rfi_id_fkey"
            columns: ["originating_rfi_id"]
            isOneToOne: false
            referencedRelation: "rfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variations_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_approve_frequent_trades: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_business_days: {
        Args: { start_date: string; days_to_add: number }
        Returns: string
      }
      calculate_project_variation_impact: {
        Args: { project_uuid: string }
        Returns: {
          total_approved_cost: number
          total_pending_cost: number
          total_time_impact: number
        }[]
      }
      check_organization_access: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      cleanup_old_audit_trail: {
        Args: { retention_days?: number }
        Returns: number
      }
      generate_inspection_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_payment_schedule_number: {
        Args: { project_uuid: string }
        Returns: string
      }
      generate_project_number: {
        Args: { org_id?: string }
        Returns: number
      }
      generate_qa_inspection_number: {
        Args: { project_uuid: string }
        Returns: string
      }
      generate_variation_number: {
        Args: { project_uuid: string }
        Returns: string
      }
      get_qa_change_history: {
        Args: { p_inspection_id: string }
        Returns: {
          id: string
          change_timestamp: string
          user_id: string
          user_name: string
          field_name: string
          old_value: string
          new_value: string
          change_type: string
          item_id: string
          item_description: string
        }[]
      }
      get_smart_categories: {
        Args: { org_id: string; trade_type?: string }
        Returns: {
          category_name: string
          usage_count: number
        }[]
      }
      get_user_organization_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_user_primary_org: {
        Args: { user_id?: string }
        Returns: string
      }
      get_user_role_in_org: {
        Args: { org_id: string; user_id?: string }
        Returns: string
      }
      get_variation_audit_history: {
        Args: { p_variation_id: string }
        Returns: {
          id: string
          user_id: string
          user_name: string
          action_type: string
          field_name: string
          old_value: string
          new_value: string
          status_from: string
          status_to: string
          comments: string
          metadata: Json
          action_timestamp: string
        }[]
      }
      get_variation_audit_history_paginated: {
        Args: { p_variation_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          user_id: string
          user_name: string
          action_type: string
          field_name: string
          old_value: string
          new_value: string
          status_from: string
          status_to: string
          comments: string
          metadata: Json
          action_timestamp: string
          total_count: number
        }[]
      }
      get_withholding_suggestions: {
        Args: { project_uuid: string }
        Returns: {
          reason: string
          suggestion_type: string
          evidence_count: number
          confidence_score: number
        }[]
      }
      is_org_admin: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      is_org_admin_simple: {
        Args: { org_id: string; user_id?: string }
        Returns: boolean
      }
      log_variation_change: {
        Args: {
          p_variation_id: string
          p_user_id: string
          p_action_type: string
          p_field_name?: string
          p_old_value?: string
          p_new_value?: string
          p_status_from?: string
          p_status_to?: string
          p_comments?: string
          p_metadata?: Json
        }
        Returns: string
      }
      record_qa_change: {
        Args: {
          p_inspection_id: string
          p_user_id: string
          p_field_name: string
          p_old_value?: string
          p_new_value?: string
          p_change_type?: string
          p_item_id?: string
          p_item_description?: string
        }
        Returns: string
      }
      record_variation_edit: {
        Args: {
          p_variation_id: string
          p_field_name: string
          p_old_value?: string
          p_new_value?: string
          p_edit_reason?: string
        }
        Returns: string
      }
      suggest_trade_from_description: {
        Args: { description_text: string; org_id: string }
        Returns: {
          suggested_trade: string
          confidence: number
        }[]
      }
      update_category_usage: {
        Args: { org_id: string; category: string; trade?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
