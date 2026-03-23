import { ResumeData } from "./resume"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import { Locale } from "@/lib/i18n/config"
import { MessagePart } from "@/types/chat"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ChatSessionStatus = "active" | "completed" | "archived"

export type Database = {
  public: {
    Tables: {
      access_passes: {
        Row: {
          created_at: string | null
          end_at: string
          id: string
          plan: "FREE" | "LITE" | "PRO"
          quota_block_optimize: number
          quota_chat_tokens: number
          quota_full_optimize: number
          quota_motivation_letter: number
          source: string
          start_at: string
          stripe_checkout_session_id: string | null
          used_block_optimize: number
          used_chat_tokens: number
          used_full_optimize: number
          used_motivation_letter: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_at: string
          id?: string
          plan: "FREE" | "LITE" | "PRO"
          quota_block_optimize?: number
          quota_chat_tokens?: number
          quota_full_optimize?: number
          quota_motivation_letter?: number
          source?: string
          start_at: string
          stripe_checkout_session_id?: string | null
          used_block_optimize?: number
          used_chat_tokens?: number
          used_full_optimize?: number
          used_motivation_letter?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_at?: string
          id?: string
          plan?: "FREE" | "LITE" | "PRO"
          quota_block_optimize?: number
          quota_chat_tokens?: number
          quota_full_optimize?: number
          quota_motivation_letter?: number
          source?: string
          start_at?: string
          stripe_checkout_session_id?: string | null
          used_block_optimize?: number
          used_chat_tokens?: number
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
          }
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
          }
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
      resume_chat_sessions: {
        Row: {
          id: string
          user_id: string
          resume_id: string
          status: ChatSessionStatus
          title: string | null
          total_input_tokens: number
          total_output_tokens: number
          total_cached_tokens: number
          total_reasoning_tokens: number
          created_at: string
          updated_at: string
          conversation_summary: string | null
        }
        Insert: {
          id?: string
          user_id: string
          resume_id: string
          status?: ChatSessionStatus
          title?: string | null
          total_input_tokens?: number
          total_output_tokens?: number
          total_cached_tokens?: number
          total_reasoning_tokens?: number
          created_at?: string
          updated_at?: string
          conversation_summary?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          resume_id?: string
          status?: ChatSessionStatus
          title?: string | null
          total_input_tokens?: number
          total_output_tokens?: number
          total_cached_tokens?: number
          total_reasoning_tokens?: number
          created_at?: string
          updated_at?: string
          conversation_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_chat_sessions_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          }
        ]
      }
      resume_chat_messages: {
        Row: {
          id: string
          session_id: string
          role: "user" | "assistant" | "system"
          parts: MessagePart
          truncated: boolean
          has_tools: boolean
          created_at: string
          input_tokens: number
          output_tokens: number
          cached_tokens: number
          reasoning_tokens: number
        }
        Insert: {
          id?: string
          session_id: string
          role: "user" | "assistant" | "system"
          parts: MessagePart
          truncated?: boolean
          has_tools?: boolean
          created_at?: string
          input_tokens?: number
          output_tokens?: number
          cached_tokens?: number
          reasoning_tokens?: number
        }
        Update: {
          id?: string
          session_id?: string
          role?: "user" | "assistant" | "system"
          parts?: MessagePart
          truncated?: boolean
          has_tools?: boolean
          created_at?: string
          input_tokens?: number
          output_tokens?: number
          cached_tokens?: number
          reasoning_tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "resume_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "resume_chat_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_events: {
        Row: {
          id: string
          session_id: string
          message_id: string | null
          event_type: "resume_modification" | "summary_checkpoint" | "rollback"
          event_data: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          message_id?: string | null
          event_type: "resume_modification" | "summary_checkpoint" | "rollback"
          event_data?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          message_id?: string | null
          event_type?: "resume_modification" | "summary_checkpoint" | "rollback"
          event_data?: Record<string, unknown>
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "resume_chat_sessions"
            referencedColumns: ["id"]
          }
        ]
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
type DefaultSchema = Database["public"]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {}
  }
} as const
