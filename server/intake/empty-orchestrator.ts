import { buildEmptyResumeData } from "@/lib/templates/section-factories"
import { persistApplicationResume } from "./persist"
import { RollbackRegistryImpl } from "./rollback"
import type { Locale } from "@/lib/i18n/config"

export type EmptyResumeInput = {
  actorId: string
  jobInfo: { name: string; company: string; description: string }
  language?: Locale
}

export type EmptyResumeOutput = {
  jobData: { id: string }
  resumeData: { id: string }
  applicationData: { id: string }
}

/**
 * Empty resume creation — shares persist/rollback capability
 * but does NOT share the full uploaded intake orchestration.
 */
export async function createEmptyResume(
  input: EmptyResumeInput
): Promise<EmptyResumeOutput> {
  const language = input.language ?? "en"
  const rollback = new RollbackRegistryImpl()

  const emptyResumeData = buildEmptyResumeData(language)

  try {
    const result = await persistApplicationResume(
      {
        userId: input.actorId,
        jobInfo: input.jobInfo,
        resumeData: emptyResumeData as unknown as Record<string, unknown>,
        resumeLanguage: language,
        uploadedResumePublicUrl: null
      },
      rollback
    )

    return result
  } catch (err) {
    // On failure, attempt rollback
    await rollback.executeAll(async () => {})
    throw err
  }
}
