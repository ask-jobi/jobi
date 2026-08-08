import "server-only"

import { and, count, desc, eq } from "drizzle-orm"

import { getDatabase, type AppDatabase } from "@/lib/db/client"
import { jobApplications, jobs, resumes } from "@/lib/db/schema"
import { normalizeResumeDateRanges } from "@/lib/resume/date-ranges"
import type { Locale } from "@/lib/i18n/config"
import type {
  AuthoritativeResumeState,
  ResumeData,
  ResumeJobDescription
} from "@/types/resume"

type JoinedApplication = {
  id: string
  createdAt: string
  resumeId: string
  resumeJson: ResumeData | null
  currentRevision: number
  evaluationReport: unknown
  evaluationReportRefreshFlag: boolean
  language: Locale
  jobId: string
  jobName: string | null
  jobCompany: string | null
  jobDescription: string
}

function toApplication(row: JoinedApplication) {
  return {
    id: row.id,
    optimized_resume_url: null,
    created_at: row.createdAt,
    resumes: {
      id: row.resumeId,
      upload_url: null,
      resume_json: row.resumeJson
        ? normalizeResumeDateRanges(row.resumeJson)
        : null,
      current_revision: row.currentRevision,
      evaluation_report: row.evaluationReport,
      evaluation_report_refresh_flag: row.evaluationReportRefreshFlag,
      language: row.language
    },
    jobs: {
      id: row.jobId,
      name: row.jobName,
      company: row.jobCompany,
      description: row.jobDescription
    }
  }
}

function applicationSelection() {
  return {
    id: jobApplications.id,
    createdAt: jobApplications.createdAt,
    resumeId: resumes.id,
    resumeJson: resumes.resumeJson,
    currentRevision: resumes.currentRevision,
    evaluationReport: resumes.evaluationReport,
    evaluationReportRefreshFlag: resumes.evaluationReportRefreshFlag,
    language: resumes.language,
    jobId: jobs.id,
    jobName: jobs.name,
    jobCompany: jobs.company,
    jobDescription: jobs.description
  }
}

function joinedApplications(db: AppDatabase) {
  return db
    .select(applicationSelection())
    .from(jobApplications)
    .innerJoin(resumes, eq(jobApplications.resumeId, resumes.id))
    .innerJoin(jobs, eq(jobApplications.jobId, jobs.id))
}

export async function listApplications(userId: string) {
  const db = await getDatabase()
  const rows = await joinedApplications(db)
    .where(eq(jobApplications.userId, userId))
    .orderBy(desc(jobApplications.createdAt))

  return rows.map(toApplication)
}

export async function findApplicationById(userId: string, id: string) {
  const db = await getDatabase()
  const [row] = await joinedApplications(db)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .limit(1)

  return row ? toApplication(row) : null
}

export async function findApplicationByResumeId(
  userId: string,
  resumeId: string
) {
  const db = await getDatabase()
  const [row] = await joinedApplications(db)
    .where(
      and(
        eq(jobApplications.resumeId, resumeId),
        eq(jobApplications.userId, userId)
      )
    )
    .limit(1)

  return row ? toApplication(row) : null
}

export async function getResumeState(
  userId: string,
  resumeId: string
): Promise<AuthoritativeResumeState | null> {
  const db = await getDatabase()
  const [row] = await db
    .select({
      resumeJson: resumes.resumeJson,
      currentRevision: resumes.currentRevision
    })
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1)

  if (!row?.resumeJson) {
    return null
  }

  return {
    resume: normalizeResumeDateRanges(row.resumeJson),
    currentRevision: row.currentRevision
  }
}

export async function getResumeForPrint(userId: string, resumeId: string) {
  const db = await getDatabase()
  const [row] = await db
    .select({ resumeJson: resumes.resumeJson, language: resumes.language })
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1)

  if (!row?.resumeJson) {
    return null
  }

  return {
    resumeData: normalizeResumeDateRanges(row.resumeJson),
    language: row.language
  }
}

export async function getApplicationEditorData(userId: string, id: string) {
  const application = await findApplicationById(userId, id)
  if (!application) {
    return null
  }

  const { resumes: resume, jobs: job, ...rest } = application
  return { ...rest, resume, job }
}

export async function updateJobDescription(
  userId: string,
  jobDescription: ResumeJobDescription
) {
  const db = await getDatabase()
  const { id, ...payload } = jobDescription
  const updated = await db
    .update(jobs)
    .set(payload)
    .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
    .returning({ id: jobs.id })

  if (updated.length === 0) {
    throw new Error(`Job not found with id: ${id}`)
  }

  await db
    .update(resumes)
    .set({ evaluationReportRefreshFlag: true })
    .where(and(eq(resumes.jobId, id), eq(resumes.userId, userId)))
}

export async function deleteApplication(userId: string, id: string) {
  const application = await findApplicationById(userId, id)
  if (!application) {
    throw new Error(`Job application not found with id: ${id}`)
  }

  const db = await getDatabase()
  await db
    .delete(resumes)
    .where(
      and(eq(resumes.id, application.resumes.id), eq(resumes.userId, userId))
    )
  await db
    .delete(jobs)
    .where(and(eq(jobs.id, application.jobs.id), eq(jobs.userId, userId)))
}

export async function countApplications(userId: string, db?: AppDatabase) {
  const client = db ?? (await getDatabase())
  const [row] = await client
    .select({ count: count() })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))

  return row?.count ?? 0
}

export async function getResumeThumbnailData(userId: string, resumeId: string) {
  const db = await getDatabase()
  const [row] = await db
    .select({ resumeJson: resumes.resumeJson, language: resumes.language })
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1)

  return row?.resumeJson
    ? { resumeData: row.resumeJson, language: row.language }
    : null
}
