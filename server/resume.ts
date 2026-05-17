"use server"

import { nanoid } from "nanoid"
import { createClient } from "@/lib/supabase/server"
import { ResumeData, ResumeJobDescription } from "@/types/resume"
import { Locale } from "@/lib/i18n/config"
import { JobInfoFormType } from "@/components/forms/job-information-form"
import { rollbackStorage } from "@/server/rollback"
import { buildEmptyResumeData } from "@/lib/templates/section-factories"
import {
  BUCKET_NAME,
  extractFilePathFromPublicUrl,
  getUniqueFileName
} from "./utils"

export async function fetchJobApplication() {
  const supabase = await createClient()

  const { data: jobApplications, error } = await supabase.from(
    "job_applications"
  ).select(`
            id,
            optimized_resume_url,
            created_at,
            resumes:resume_id (
                id,
                upload_url,
                resume_json
            ),
            jobs:job_id (
                id,
                name,
                company,
                description
            )
        `)

  return jobApplications
}

export async function getJobApplicationByResumeId(applicationResumeId: string) {
  const supabase = await createClient()

  const { data: jobApplications, error } = await supabase
    .from("job_applications")
    .select(
      `
          id,
          optimized_resume_url,
          created_at,
          resumes:resume_id (
              id,
              upload_url,
              evaluation_report,
              language,
              resume_json
          ),
          jobs:job_id (
              id,
              name,
              company,
              description
          )
      `
    )
    .eq("resume_id", applicationResumeId)

  if (error) {
    throw new Error(`Failed to fetch job application: ${error.message}`)
  }

  if (!jobApplications || jobApplications.length === 0) {
    throw new Error(`No job application found with resume id: ${applicationResumeId}`)
  }

  if (jobApplications.length > 1) {
    throw new Error(
      `Multiple job applications found with resume id: ${applicationResumeId}`
    )
  }
  return jobApplications[0]
}

export async function getJobApplication(jobApplicationId: string) {
  const supabase = await createClient()

  const { data: jobApplications, error } = await supabase
    .from("job_applications")
    .select(
      `
          id,
          optimized_resume_url,
          created_at,
          resumes:resume_id (
              id,
              upload_url,
              evaluation_report,
              language,
              resume_json
          ),
          jobs:job_id (
              id,
              name,
              company,
              description
          )
      `
    )
    .eq("id", jobApplicationId)

  if (error) {
    throw new Error(`Failed to fetch job application: ${error.message}`)
  }

  if (!jobApplications || jobApplications.length === 0) {
    throw new Error(`No job application found with id: ${jobApplicationId}`)
  }

  if (jobApplications.length > 1) {
    throw new Error(
      `Multiple job applications found with id: ${jobApplicationId}`
    )
  }
  return jobApplications[0]
}

export async function getApplicationResumeData(id: string): Promise<ResumeData> {
  const supabase = await createClient()

  const { data: resume, error } = await supabase
    .from("resumes")
    .select(
      `
      id,
      resume_json
    `
    )
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to fetch resume: ${error.message}`)
  }

  if (!resume || resume.length === 0) {
    throw new Error(`No resume found with id: ${id}`)
  }

  if (resume.length > 1) {
    throw new Error(`Multiple resume found with id: ${id}`)
  }

  return resume[0].resume_json as ResumeData
}

export async function getApplicationResumeForPrint(id: string): Promise<{
  resumeData: ResumeData
  language: Locale
}> {
  const supabase = await createClient()

  const { data: resume, error } = await supabase
    .from("resumes")
    .select(
      `
      id,
      language,
      resume_json
    `
    )
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to fetch resume: ${error.message}`)
  }

  if (!resume || resume.length === 0) {
    throw new Error(`No resume found with id: ${id}`)
  }

  if (resume.length > 1) {
    throw new Error(`Multiple resume found with id: ${id}`)
  }

  return {
    resumeData: resume[0].resume_json as ResumeData,
    language: resume[0].language as Locale
  }
}

export async function uploadResumeFile(resumeFile: File) {
  const supabase = await createClient()
  const user = await supabase.auth.getUser()

  if (!user.data.user) {
    throw new Error("User not authenticated")
  }

  // 获取唯一的文件名
  const fileName = await getUniqueFileName(
    supabase,
    user.data.user.id,
    resumeFile.name
  )

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, resumeFile)

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`)
  }

  // 注册回滚：删除文件
  const rollbackCtx = rollbackStorage.getStore()
  rollbackCtx?.addRollback(async () => {
    await supabase.storage.from(BUCKET_NAME).remove([fileName])
  })

  const {
    data: { publicUrl }
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)

  return {
    fileName,
    publicUrl,
    userId: user.data.user.id
  }
}

export async function createApplicationResumeRecord(
  jobInfos: JobInfoFormType,
  uploadResult: {
    fileName: string
    publicUrl: string
    userId: string
  },
  resumeJsonData: ResumeData,
  language: Locale
) {
  const supabase = await createClient()
  const rollbackCtx = rollbackStorage.getStore()

  try {
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .insert(jobInfos)
      .select()
      .single()

    if (jobError) throw jobError

    const savedJobId = jobData.id
    rollbackCtx?.addRollback(async () => {
      await supabase.from("jobs").delete().eq("id", savedJobId)
    })

    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .insert({
        user_id: uploadResult.userId,
        job_id: jobData.id,
        upload_url: uploadResult.publicUrl,
        language: language,
        resume_json: resumeJsonData
      })
      .select()
      .single()

    if (resumeError) throw resumeError

    const savedResumeId = resumeData.id
    rollbackCtx?.addRollback(async () => {
      await supabase.from("resumes").delete().eq("id", savedResumeId)
    })

    const { data: applicationData, error: applicationError } = await supabase
      .from("job_applications")
      .insert({
        user_id: uploadResult.userId,
        resume_id: resumeData.id,
        job_id: jobData.id,
        optimized_resume_url: null
      })
      .select()
      .single()

    if (applicationError) throw applicationError

    const savedApplicationId = applicationData.id
    rollbackCtx?.addRollback(async () => {
      await supabase
        .from("job_applications")
        .delete()
        .eq("id", savedApplicationId)
    })

    return { jobData, resumeData, applicationData }
  } catch (error: any) {
    // 错误会由外层 rollbackStorage.run() 的回滚逻辑处理
    throw new Error(`Failed to create resume record: ${error.message}`)
  }
}

export async function updateResumeJobDescription(
  jobDescription: ResumeJobDescription
) {
  const supabase = await createClient()
  const { id, ...payload } = jobDescription
  const { error } = await supabase.from("jobs").update(payload).eq("id", id)

  if (error) throw error

  const { error: flagError } = await supabase
    .from("resumes")
    .update({ evaluation_report_refresh_flag: true })
    .eq("job_id", id)

  if (flagError) {
    throw new Error(
      `Failed to mark evaluation refresh flag: ${flagError.message}`
    )
  }
}

export async function saveApplicationResumeChange(resumeId: string, data: ResumeData) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("resumes")
    .update({ resume_json: data, evaluation_report_refresh_flag: true })
    .eq("id", resumeId)

  if (error) throw error
}

export async function createEmptyApplicationResumeRecord(
  jobInfos: JobInfoFormType,
  language: Locale = "en"
) {
  const supabase = await createClient()
  const user = await supabase.auth.getUser()
  const rollbackCtx = rollbackStorage.getStore()

  if (!user.data.user) {
    throw new Error("User not authenticated")
  }

  try {
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .insert(jobInfos)
      .select()
      .single()

    if (jobError) throw jobError

    const savedJobId = jobData.id
    rollbackCtx?.addRollback(async () => {
      await supabase.from("jobs").delete().eq("id", savedJobId)
    })

    const emptyResumeData = buildEmptyResumeData(language)

    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.data.user.id,
        job_id: jobData.id,
        upload_url: null, // 空简历没有上传文件
        language,
        resume_json: emptyResumeData
      })
      .select()
      .single()

    if (resumeError) throw resumeError

    const savedResumeId = resumeData.id
    rollbackCtx?.addRollback(async () => {
      await supabase.from("resumes").delete().eq("id", savedResumeId)
    })

    const { data: applicationData, error: applicationError } = await supabase
      .from("job_applications")
      .insert({
        user_id: user.data.user.id,
        resume_id: resumeData.id,
        job_id: jobData.id,
        optimized_resume_url: null
      })
      .select()
      .single()

    if (applicationError) throw applicationError

    const savedApplicationId = applicationData.id
    rollbackCtx?.addRollback(async () => {
      await supabase
        .from("job_applications")
        .delete()
        .eq("id", savedApplicationId)
    })

    // TODO Evaluate and save (do not block user in empty creation; still await here to persist immediately)
    // await evaluateAndSaveResume(resumeData.id, emptyResumeData, jobData.description)

    return {
      jobData,
      resumeData,
      applicationData
    }
  } catch (error: any) {
    throw new Error(`Failed to create empty resume record: ${error.message}`)
  }
}

export async function deleteJobApplication(jobApplicationId: string) {
  const supabase = await createClient()
  const user = await supabase.auth.getUser()

  if (!user.data.user) {
    throw new Error("User not authenticated")
  }

  // 先验证该 jobApplication 是否存在且属于当前用户，同时获取关联的 resume 信息
  const { data: jobApplication, error: fetchError } = await supabase
    .from("job_applications")
    .select(
      `
      id, 
      resumes:resume_id (
        id,
        upload_url
      ),
      jobs:job_id (
        id
      )
    `
    )
    .eq("id", jobApplicationId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch job application: ${fetchError.message}`)
  }

  if (!jobApplication) {
    throw new Error(`Job application not found with id: ${jobApplicationId}`)
  }

  console.log(jobApplication)

  const { error: deleteError } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", jobApplicationId)

  if (deleteError) {
    throw new Error(`Failed to delete job application: ${deleteError.message}`)
  }

  const { error: deleteResumeError } = await supabase
    .from("resumes")
    .delete()
    .eq("id", jobApplication.resumes.id)

  if (deleteResumeError) {
    throw new Error(`Failed to delete resume: ${deleteResumeError.message}`)
  }

  const { error: deleteJobError } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobApplication.jobs.id)

  if (deleteJobError) {
    throw new Error(`Failed to delete job: ${deleteJobError.message}`)
  }

  if (jobApplication.resumes.upload_url) {
    const filePath = extractFilePathFromPublicUrl(
      jobApplication.resumes.upload_url
    )
    if (filePath) {
      const { error: fileDeleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])

      if (fileDeleteError) {
        console.warn(
          `Failed to delete resume file (${filePath}):`,
          fileDeleteError.message
        )
      }
    }
  }
}
