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
      budget_items: {
        Row: {
          budgeted_cost: number
          created_at: string | null
          description: string
          id: string
          notes: string | null
          project_id: string | null
          quantity: number | null
          trade_category: string
          unit: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          budgeted_cost: number
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          project_id?: string | null
          quantity?: number | null
          trade_category: string
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          budgeted_cost?: number
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          quantity?: number | null
          trade_category?: string
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
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
          created_at: string | null
          id: string
          license_count: number
          name: string
          slug: string
          subscription_end_date: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          active_users_count?: number
          created_at?: string | null
          id?: string
          license_count?: number
          name: string
          slug: string
          subscription_end_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          active_users_count?: number
          created_at?: string | null
          id?: string
          license_count?: number
          name?: string
          slug?: string
          subscription_end_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
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
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      programme_milestones: {
        Row: {
          actual_date: string | null
          completion_percentage: number | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          id: string
          milestone_name: string
          notes: string | null
          planned_date: string
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_date?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          milestone_name: string
          notes?: string | null
          planned_date: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_date?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          milestone_name?: string
          notes?: string | null
          planned_date?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
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
      variations: {
        Row: {
          approval_comments: string | null
          approval_date: string | null
          approved_by: string | null
          category: string | null
          client_email: string | null
          cost_impact: number | null
          created_at: string | null
          description: string | null
          email_sent: boolean | null
          email_sent_by: string | null
          email_sent_date: string | null
          id: string
          justification: string | null
          location: string | null
          priority: string | null
          project_id: string | null
          request_date: string | null
          requested_by: string | null
          status: string | null
          time_impact: number | null
          title: string
          updated_at: string | null
          variation_number: string
        }
        Insert: {
          approval_comments?: string | null
          approval_date?: string | null
          approved_by?: string | null
          category?: string | null
          client_email?: string | null
          cost_impact?: number | null
          created_at?: string | null
          description?: string | null
          email_sent?: boolean | null
          email_sent_by?: string | null
          email_sent_date?: string | null
          id?: string
          justification?: string | null
          location?: string | null
          priority?: string | null
          project_id?: string | null
          request_date?: string | null
          requested_by?: string | null
          status?: string | null
          time_impact?: number | null
          title: string
          updated_at?: string | null
          variation_number: string
        }
        Update: {
          approval_comments?: string | null
          approval_date?: string | null
          approved_by?: string | null
          category?: string | null
          client_email?: string | null
          cost_impact?: number | null
          created_at?: string | null
          description?: string | null
          email_sent?: boolean | null
          email_sent_by?: string | null
          email_sent_date?: string | null
          id?: string
          justification?: string | null
          location?: string | null
          priority?: string | null
          project_id?: string | null
          request_date?: string | null
          requested_by?: string | null
          status?: string | null
          time_impact?: number | null
          title?: string
          updated_at?: string | null
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_inspection_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_variation_number: {
        Args: { project_uuid: string }
        Returns: string
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
