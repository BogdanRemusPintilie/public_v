export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
      loan_data: {
        Row: {
          created_at: string
          credit_score: number
          dataset_name: string | null
          file_name: string | null
          id: string
          interest_rate: number
          loan_amount: number
          loan_type: string
          ltv: number
          opening_balance: number
          pd: number | null
          term: number
          updated_at: string
          user_id: string | null
          worksheet_name: string | null
        }
        Insert: {
          created_at?: string
          credit_score: number
          dataset_name?: string | null
          file_name?: string | null
          id?: string
          interest_rate: number
          loan_amount: number
          loan_type: string
          ltv: number
          opening_balance: number
          pd?: number | null
          term: number
          updated_at?: string
          user_id?: string | null
          worksheet_name?: string | null
        }
        Update: {
          created_at?: string
          credit_score?: number
          dataset_name?: string | null
          file_name?: string | null
          id?: string
          interest_rate?: number
          loan_amount?: number
          loan_type?: string
          ltv?: number
          opening_balance?: number
          pd?: number | null
          term?: number
          updated_at?: string
          user_id?: string | null
          worksheet_name?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          offer_name: string
          shared_with_emails: string[] | null
          status: string | null
          structure_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          offer_name: string
          shared_with_emails?: string[] | null
          status?: string | null
          structure_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          offer_name?: string
          shared_with_emails?: string[] | null
          status?: string | null
          structure_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_loan_data_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_dataset_summaries: {
        Args: Record<PropertyKey, never>
        Returns: {
          dataset_name: string
          record_count: number
          total_value: number
          avg_interest_rate: number
          high_risk_count: number
          created_at: string
        }[]
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
    Enums: {},
  },
} as const
