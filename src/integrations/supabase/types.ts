export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      dataset_shares: {
        Row: {
          created_at: string | null
          dataset_name: string
          id: string
          owner_id: string
          shared_with_email: string
          shared_with_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dataset_name: string
          id?: string
          owner_id: string
          shared_with_email: string
          shared_with_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dataset_name?: string
          id?: string
          owner_id?: string
          shared_with_email?: string
          shared_with_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      etl_jobs: {
        Row: {
          created_at: string | null
          file_url: string
          id: string
          mime_type: string
          needs_ocr: boolean | null
          status: string | null
          updated_at: string | null
          user_id: string
          warnings: Json | null
        }
        Insert: {
          created_at?: string | null
          file_url: string
          id?: string
          mime_type: string
          needs_ocr?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          warnings?: Json | null
        }
        Update: {
          created_at?: string | null
          file_url?: string
          id?: string
          mime_type?: string
          needs_ocr?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          warnings?: Json | null
        }
        Relationships: []
      }
      investor_reports: {
        Row: {
          asset_class: string | null
          created_at: string
          currency: string | null
          deal_name: string
          etl_job_id: string | null
          extract_json_id: string | null
          extracted_data: Json | null
          file_name: string
          file_path: string
          file_sha256: string | null
          file_size: number | null
          file_type: string | null
          id: string
          issuer: string | null
          jurisdiction: string | null
          notes: string | null
          period_end: string | null
          period_start: string | null
          publish_date: string | null
          raw_pdf_id: string | null
          report_type: string | null
          sts_compliant: boolean | null
          sustainability_labelled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_class?: string | null
          created_at?: string
          currency?: string | null
          deal_name: string
          etl_job_id?: string | null
          extract_json_id?: string | null
          extracted_data?: Json | null
          file_name: string
          file_path: string
          file_sha256?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          issuer?: string | null
          jurisdiction?: string | null
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          publish_date?: string | null
          raw_pdf_id?: string | null
          report_type?: string | null
          sts_compliant?: boolean | null
          sustainability_labelled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_class?: string | null
          created_at?: string
          currency?: string | null
          deal_name?: string
          etl_job_id?: string | null
          extract_json_id?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          file_sha256?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          issuer?: string | null
          jurisdiction?: string | null
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          publish_date?: string | null
          raw_pdf_id?: string | null
          report_type?: string | null
          sts_compliant?: boolean | null
          sustainability_labelled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investors: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          investor: string
          overview: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          investor: string
          overview?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          investor?: string
          overview?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loan_data: {
        Row: {
          created_at: string
          dataset_name: string | null
          file_name: string | null
          id: string
          interest_rate: number
          lgd: number
          loan_amount: number
          ltv: number
          opening_balance: number
          pd: number | null
          remaining_term: number
          term: number
          updated_at: string
          user_id: string
          worksheet_name: string | null
        }
        Insert: {
          created_at?: string
          dataset_name?: string | null
          file_name?: string | null
          id?: string
          interest_rate: number
          lgd: number
          loan_amount: number
          ltv: number
          opening_balance: number
          pd?: number | null
          remaining_term: number
          term: number
          updated_at?: string
          user_id: string
          worksheet_name?: string | null
        }
        Update: {
          created_at?: string
          dataset_name?: string | null
          file_name?: string | null
          id?: string
          interest_rate?: number
          lgd?: number
          loan_amount?: number
          ltv?: number
          opening_balance?: number
          pd?: number | null
          remaining_term?: number
          term?: number
          updated_at?: string
          user_id?: string
          worksheet_name?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          additional_comments: string | null
          comments: string | null
          created_at: string
          id: string
          issuer_business_focus: string | null
          issuer_nationality: string | null
          issuer_overview: string | null
          offer_name: string
          shared_with_emails: string[] | null
          status: string | null
          structure_consumer_finance: boolean | null
          structure_figures: string | null
          structure_id: string
          structure_sts: boolean | null
          structure_synthetic: boolean | null
          structure_true_sale: boolean | null
          structure_type: string | null
          target_investors: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_comments?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          issuer_business_focus?: string | null
          issuer_nationality?: string | null
          issuer_overview?: string | null
          offer_name: string
          shared_with_emails?: string[] | null
          status?: string | null
          structure_consumer_finance?: boolean | null
          structure_figures?: string | null
          structure_id: string
          structure_sts?: boolean | null
          structure_synthetic?: boolean | null
          structure_true_sale?: boolean | null
          structure_type?: string | null
          target_investors?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_comments?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          issuer_business_focus?: string | null
          issuer_nationality?: string | null
          issuer_overview?: string | null
          offer_name?: string
          shared_with_emails?: string[] | null
          status?: string | null
          structure_consumer_finance?: boolean | null
          structure_figures?: string | null
          structure_id?: string
          structure_sts?: boolean | null
          structure_synthetic?: boolean | null
          structure_true_sale?: boolean | null
          structure_type?: string | null
          target_investors?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_offers_structure_id"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "tranche_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          company_type: Database["public"]["Enums"]["company_type"] | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tranche_structures: {
        Row: {
          additional_transaction_costs: number | null
          cost_percentage: number
          created_at: string
          dataset_name: string
          id: string
          structure_name: string
          total_cost: number
          tranches: Json
          updated_at: string
          user_id: string
          weighted_avg_cost_bps: number
        }
        Insert: {
          additional_transaction_costs?: number | null
          cost_percentage?: number
          created_at?: string
          dataset_name: string
          id?: string
          structure_name: string
          total_cost?: number
          tranches: Json
          updated_at?: string
          user_id: string
          weighted_avg_cost_bps?: number
        }
        Update: {
          additional_transaction_costs?: number | null
          cost_percentage?: number
          created_at?: string
          dataset_name?: string
          id?: string
          structure_name?: string
          total_cost?: number
          tranches?: Json
          updated_at?: string
          user_id?: string
          weighted_avg_cost_bps?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["app_user_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["app_user_type"]
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["app_user_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      copy_filtered_dataset: {
        Args: {
          p_max_interest_rate?: number
          p_max_lgd?: number
          p_max_loan_amount?: number
          p_max_pd?: number
          p_max_remaining_term?: number
          p_min_interest_rate?: number
          p_min_lgd?: number
          p_min_loan_amount?: number
          p_min_pd?: number
          p_min_remaining_term?: number
          p_new_dataset: string
          p_source_dataset: string
          p_user_id: string
        }
        Returns: {
          records_copied: number
        }[]
      }
      create_loan_data_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_dataset_summaries_optimized: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_interest_rate: number
          created_at: string
          dataset_name: string
          high_risk_count: number
          record_count: number
          total_value: number
        }[]
      }
      get_loan_size_distribution: {
        Args: {
          dataset_name_param: string
          max_interest_rate?: number
          max_lgd?: number
          max_loan_amount?: number
          max_pd?: number
          max_remaining_term?: number
          min_interest_rate?: number
          min_lgd?: number
          min_loan_amount?: number
          min_pd?: number
          min_remaining_term?: number
        }
        Returns: {
          count: number
          range_name: string
        }[]
      }
      get_maturity_distribution: {
        Args: {
          dataset_name_param: string
          max_interest_rate?: number
          max_lgd?: number
          max_loan_amount?: number
          max_pd?: number
          max_remaining_term?: number
          min_interest_rate?: number
          min_lgd?: number
          min_loan_amount?: number
          min_pd?: number
          min_remaining_term?: number
        }
        Returns: {
          count: number
          range_name: string
        }[]
      }
      get_portfolio_summary: {
        Args:
          | { dataset_name_param: string }
          | {
              dataset_name_param: string
              max_interest_rate?: number
              max_lgd?: number
              max_loan_amount?: number
              max_pd?: number
              max_remaining_term?: number
              min_interest_rate?: number
              min_lgd?: number
              min_loan_amount?: number
              min_pd?: number
              min_remaining_term?: number
            }
        Returns: {
          avg_interest_rate: number
          high_risk_loans: number
          total_records: number
          total_value: number
        }[]
      }
      get_user_datasets_distinct: {
        Args: { input_user_id: string }
        Returns: {
          dataset_name: string
          user_id: string
        }[]
      }
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          company: string
          company_type: Database["public"]["Enums"]["company_type"]
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_user_type"]
      }
      get_user_unique_datasets: {
        Args: { input_user_id: string }
        Returns: {
          dataset_name: string
          user_id: string
        }[]
      }
      has_company_access: {
        Args: {
          _company_type: Database["public"]["Enums"]["company_type"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_type: {
        Args: {
          _type: Database["public"]["Enums"]["app_user_type"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "viewer"
      app_user_type: "investor" | "issuer"
      company_type: "seer_capital" | "general"
      user_role: "admin" | "company_user" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "viewer"],
      app_user_type: ["investor", "issuer"],
      company_type: ["seer_capital", "general"],
      user_role: ["admin", "company_user", "viewer"],
    },
  },
} as const
