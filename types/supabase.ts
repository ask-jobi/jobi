import {ResumeData} from "@/types/resume";

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
      access_passes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          plan: 'FREE' | 'LITE' | 'PRO'
          source: string
          start_at: string
          end_at: string
          stripe_checkout_session_id: string | null
          // 简历整体优化
          quota_full_optimize: number
          used_full_optimize: number
          // 简历局部优化
          quota_block_optimize: number
          used_block_optimize: number
          // 动机信
          quota_motivation_letter: number
          used_motivation_letter: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string
          plan: 'FREE' | 'LITE' | 'PRO'
          source?: string
          start_at: string
          end_at: string
          stripe_checkout_session_id?: string | null
          quota_full_optimize: number
          quota_block_optimize: number
          quota_motivation_letter: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          plan?: 'FREE' | 'LITE' | 'PRO'
          source?: string
          start_at?: string
          end_at?: string
          stripe_checkout_session_id?: string | null
          quota_full_optimize?: number
          quota_block_optimize?: number
          quota_motivation_letter?: number
        }
        Relationships: [
          {
            foreignKeyName: "access_passes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      job_applications: {
        Row: {
          created_at: string
          id: string
          job_id: string
          optimized_resume_url: string | null
          resume_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          optimized_resume_url?: string | null
          resume_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          optimized_resume_url?: string | null
          resume_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company: string | null
          created_at: string
          description: string
          id: string
          name: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          description: string
          id?: string
          name?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          resume_json: ResumeData | null
          language: string
          upload_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          resume_json?: ResumeData | null
          language?: string
          upload_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          resume_json?: ResumeData | null
          language?: string
          upload_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resumes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quotas: {
        Row: {
          created_at: string
          credits_quota: number | null
          credits_used: number | null
          id: number
          overall_optimize_quota: number | null
          overall_optimize_used: number | null
          partial_optimize_quota: number | null
          partial_optimize_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          credits_quota?: number | null
          credits_used?: number | null
          id?: number
          overall_optimize_quota?: number | null
          overall_optimize_used?: number | null
          partial_optimize_quota?: number | null
          partial_optimize_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          credits_quota?: number | null
          credits_used?: number | null
          id?: number
          overall_optimize_quota?: number | null
          overall_optimize_used?: number | null
          partial_optimize_quota?: number | null
          partial_optimize_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
