import { ResumeData } from "./resume"
import type {ResumeEvaluationOutput} from "@/lib/evaluation";
import {Locale} from "@/lib/i18n/config";

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
      access_passes: {
        Row: {
          created_at: string | null
          end_at: string
          id: string
          plan: 'FREE' | 'LITE' | 'PRO'
          quota_block_optimize: number
          quota_full_optimize: number
          quota_motivation_letter: number
          source: string
          start_at: string
          stripe_checkout_session_id: string | null
          used_block_optimize: number
          used_full_optimize: number
          used_motivation_letter: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_at: string
          id?: string
          plan: 'FREE' | 'LITE' | 'PRO'
          quota_block_optimize?: number
          quota_full_optimize?: number
          quota_motivation_letter?: number
          source?: string
          start_at: string
          stripe_checkout_session_id?: string | null
          used_block_optimize?: number
          used_full_optimize?: number
          used_motivation_letter?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_at?: string
          id?: string
          plan?: 'FREE' | 'LITE' | 'PRO'
          quota_block_optimize?: number
          quota_full_optimize?: number
          quota_motivation_letter?: number
          source?: string
          start_at?: string
          stripe_checkout_session_id?: string | null
          used_block_optimize?: number
          used_full_optimize?: number
          used_motivation_letter?: number
          user_id?: string
        }
        Relationships: []
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
          evaluation_report: ResumeEvaluationOutput | null
          evaluation_report_refresh_flag?: boolean
          id: string
          job_id: string | null
          language: Locale
          resume_json: ResumeData | null
          upload_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          evaluation_report?: ResumeEvaluationOutput | null
          evaluation_report_refresh_flag?: boolean
          id?: string
          job_id?: string | null
          language?: Locale
          resume_json?: ResumeData | null
          upload_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          evaluation_report?: ResumeEvaluationOutput | null
          evaluation_report_refresh_flag?: boolean
          id?: string
          job_id?: string | null
          language?: Locale
          resume_json?: ResumeData | null
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
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          stripe_customer_id?: string | null
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
