"use server"

import { getDatabase } from "@/lib/db/client"
import {
  deleteApplication,
  findApplicationById,
  findApplicationByResumeId,
  getResumeForPrint,
  getResumeState,
  listApplications,
  updateJobDescription
} from "@/server/data/applications"
import {
  requireVerifiedAuthContext,
  requireVerifiedUserIdentity
} from "@/server/auth-helper"
import { commitResumeChange } from "@/server/resume/commit"
import type {
  AuthoritativeResumeState,
  ResumeData,
  ResumeJobDescription
} from "@/types/resume"
import type { Locale } from "@/lib/i18n/config"
import type { RollbackRegistry } from "@/server/intake/types"

export async function fetchJobApplication() {
  const user = await requireVerifiedUserIdentity()
  return listApplications(user.id)
}

export async function getJobApplicationByResumeId(applicationResumeId: string) {
  const user = await requireVerifiedUserIdentity()
  const application = await findApplicationByResumeId(
    user.id,
    applicationResumeId
  )

  if (!application) {
    throw new Error(
      `No job application found with resume id: ${applicationResumeId}`
    )
  }

  return application
}

export async function getJobApplication(jobApplicationId: string) {
  const user = await requireVerifiedUserIdentity()
  const application = await findApplicationById(user.id, jobApplicationId)

  if (!application) {
    throw new Error(`No job application found with id: ${jobApplicationId}`)
  }

  return application
}

export async function getApplicationResumeData(
  id: string
): Promise<AuthoritativeResumeState> {
  const user = await requireVerifiedUserIdentity()
  const state = await getResumeState(user.id, id)

  if (!state) {
    throw new Error(`No resume found with id: ${id}`)
  }

  return state
}

export async function getApplicationResumeForPrint(id: string): Promise<{
  resumeData: ResumeData
  language: Locale
}> {
  const user = await requireVerifiedUserIdentity()
  const result = await getResumeForPrint(user.id, id)

  if (!result) {
    throw new Error(`No resume found with id: ${id}`)
  }

  return result
}

export async function uploadResumeFile(
  _resumeFile: File,
  _rollback?: RollbackRegistry
): Promise<{
  fileName: string | null
  filePath: string | null
  userId: string
}> {
  const user = await requireVerifiedUserIdentity()

  return {
    fileName: null,
    filePath: null,
    userId: user.id
  }
}

export async function updateResumeJobDescription(
  jobDescription: ResumeJobDescription
) {
  const user = await requireVerifiedUserIdentity()
  await updateJobDescription(user.id, jobDescription)
}

export async function saveApplicationResumeChange(
  resumeId: string,
  data: ResumeData,
  options: { baseRevision?: number | null } = {}
) {
  const { db, user } = await requireVerifiedAuthContext()

  return commitResumeChange({
    db,
    actorId: user.id,
    resumeId,
    nextResume: data,
    baseRevision: options.baseRevision
  })
}

export async function deleteJobApplication(jobApplicationId: string) {
  const user = await requireVerifiedUserIdentity()
  await deleteApplication(user.id, jobApplicationId)
}
