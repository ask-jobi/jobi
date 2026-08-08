import { sql } from "drizzle-orm"
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core"

import type { Locale } from "@/lib/i18n/config"
import type { MessagePart } from "@/types/chat"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import type { ResumeData } from "@/types/resume"

const createdAt = () =>
  text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)

export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    createdAt: createdAt(),
    name: text("name"),
    company: text("company"),
    description: text("description").notNull()
  },
  (table) => [index("jobs_user_id_idx").on(table.userId)]
)

export const resumes = sqliteTable(
  "resumes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    jobId: text("job_id").references(() => jobs.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    resumeJson: text("resume_json", {
      mode: "json"
    }).$type<ResumeData | null>(),
    language: text("language").$type<Locale>().notNull().default("en"),
    evaluationReport: text("evaluation_report", {
      mode: "json"
    }).$type<ResumeEvaluationOutput | null>(),
    evaluationReportRefreshFlag: integer("evaluation_report_refresh_flag", {
      mode: "boolean"
    })
      .notNull()
      .default(false),
    currentRevision: integer("current_revision").notNull().default(1)
  },
  (table) => [
    index("resumes_user_id_idx").on(table.userId),
    index("resumes_job_id_idx").on(table.jobId)
  ]
)

export const jobApplications = sqliteTable(
  "job_applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    createdAt: createdAt(),
    resumeId: text("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" })
  },
  (table) => [
    index("job_applications_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
    uniqueIndex("job_applications_resume_unique").on(table.resumeId),
    uniqueIndex("job_applications_job_unique").on(table.jobId)
  ]
)

export const resumeChatSessions = sqliteTable(
  "resume_chat_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    resumeId: text("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["active", "completed", "archived"]
    })
      .notNull()
      .default("active"),
    title: text("title"),
    createdAt: createdAt(),
    updatedAt: createdAt(),
    conversationSummary: text("conversation_summary")
  },
  (table) => [
    uniqueIndex("resume_chat_sessions_resume_unique").on(table.resumeId),
    index("resume_chat_sessions_user_updated_idx").on(
      table.userId,
      table.updatedAt
    )
  ]
)

export const resumeChatMessages = sqliteTable(
  "resume_chat_messages",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => resumeChatSessions.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    parts: text("parts", { mode: "json" }).$type<MessagePart>().notNull(),
    truncated: integer("truncated", { mode: "boolean" })
      .notNull()
      .default(false),
    hasTools: integer("has_tools", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt()
  },
  (table) => [
    index("resume_chat_messages_session_created_idx").on(
      table.sessionId,
      table.createdAt
    ),
    index("resume_chat_messages_active_idx")
      .on(table.sessionId, table.createdAt)
      .where(sql`${table.truncated} = 0`)
  ]
)

export const chatEvents = sqliteTable(
  "chat_events",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => resumeChatSessions.id, { onDelete: "cascade" }),
    messageId: text("message_id").references(() => resumeChatMessages.id, {
      onDelete: "set null"
    }),
    eventType: text("event_type", {
      enum: [
        "summary_checkpoint",
        "rollback",
        "tool_call",
        "tool_result",
        "tool_failed"
      ]
    }).notNull(),
    eventData: text("event_data", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
    createdAt: createdAt()
  },
  (table) => [
    index("chat_events_session_created_idx").on(
      table.sessionId,
      table.createdAt
    ),
    index("chat_events_message_idx").on(table.messageId)
  ]
)

export const resumeSnapshots = sqliteTable(
  "resumes_snapshot",
  {
    id: text("id").primaryKey(),
    resumeId: text("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull(),
    resumeJson: text("resume_json", { mode: "json" })
      .$type<ResumeData>()
      .notNull(),
    eventId: text("event_id").references(() => chatEvents.id, {
      onDelete: "set null"
    }),
    createdAt: createdAt()
  },
  (table) => [
    uniqueIndex("resumes_snapshot_resume_revision_unique").on(
      table.resumeId,
      table.revision
    ),
    index("resumes_snapshot_event_idx").on(table.eventId)
  ]
)

export const schema = {
  jobs,
  resumes,
  jobApplications,
  resumeChatSessions,
  resumeChatMessages,
  chatEvents,
  resumeSnapshots
}

export type Database = typeof schema
export type JobRow = typeof jobs.$inferSelect
export type ResumeRow = typeof resumes.$inferSelect
export type JobApplicationRow = typeof jobApplications.$inferSelect
export type ChatSessionRow = typeof resumeChatSessions.$inferSelect
export type ChatMessageRow = typeof resumeChatMessages.$inferSelect
export type ChatEventRow = typeof chatEvents.$inferSelect
export type ResumeSnapshotRow = typeof resumeSnapshots.$inferSelect
