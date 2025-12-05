"use server"

import {createClient} from "@/lib/supabase/server";
import {JobInfoFormType} from "@/components/client-components/job-information-form";
import {ResumeData, ResumeJobDescription} from "@/types/resume";
import {Locale} from "@/lib/i18n/config";

export async function fetchJobApplication() {
  const supabase = await createClient()

  const {data: jobApplications, error} = await supabase
    .from('job_applications')
    .select(`
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

  return jobApplications;
}

export async function getJobApplication(jobApplicationId: string) {
  const supabase = await createClient()

  const {data: jobApplications, error} = await supabase
  .from('job_applications')
  .select(`
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
      `)
    .eq('id', jobApplicationId)

  if (error) {
    throw new Error(`Failed to fetch job application: ${error.message}`)
  }

  if (!jobApplications || jobApplications.length === 0) {
    throw new Error(`No job application found with id: ${jobApplicationId}`)
  }

  if (jobApplications.length > 1) {
    throw new Error(`Multiple job applications found with id: ${jobApplicationId}`)
  }
  return jobApplications[0]
}


const BUCKET_NAME = 'upload-resumes'

async function getUniqueFileName(supabase: any, userId: string, originalFileName: string): Promise<string> {
  const fileExt = originalFileName.split('.').pop();
  const baseName = originalFileName.slice(0, -(fileExt!.length + 1));
  let counter = 0;
  let fileName = `${userId}/${originalFileName}`;

  while (true) {
    const {data, error} = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(userId, {
        search: counter === 0 ? originalFileName : `${baseName}-${counter}.${fileExt}`
      });

    if (error) {
      throw new Error(`Failed to check file existence: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    counter++;
    fileName = `${userId}/${baseName}-${counter}.${fileExt}`;
  }

  return fileName;
}

export async function uploadResumeFile(resumeFile: File) {
  const supabase = await createClient()
  const user = await supabase.auth.getUser()

  if (!user.data.user) {
    throw new Error("User not authenticated")
  }

  // 获取唯一的文件名
  const fileName = await getUniqueFileName(supabase, user.data.user.id, resumeFile.name);

  const {data: uploadData, error: uploadError} = await supabase
    .storage
    .from(BUCKET_NAME)
    .upload(fileName, resumeFile)

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`)
  }

  const {data: {publicUrl}} = supabase
    .storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName)

  return {
    fileName,
    publicUrl,
    userId: user.data.user.id
  }
}

export async function createResumeRecord(jobInfos: JobInfoFormType, uploadResult: {
  fileName: string,
  publicUrl: string,
  userId: string
}, resumeJsonData: ResumeData, language: Locale) {
  const supabase = await createClient()
  const createdIds: { jobId?: string, resumeId?: string } = {}

  try {
    const {data: jobData, error: jobError} = await supabase
      .from('jobs')
      .insert(jobInfos)
      .select()
      .single()

    if (jobError) throw jobError
    createdIds.jobId = jobData.id

    const {data: resumeData, error: resumeError} = await supabase
      .from('resumes')
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
    createdIds.resumeId = resumeData.id

    const {error: applicationError} = await supabase
      .from('job_applications')
      .insert({
        user_id: uploadResult.userId,
        resume_id: resumeData.id,
        job_id: jobData.id,
        optimized_resume_url: null
      })

    if (applicationError) throw applicationError

    return {jobData, resumeData}

  } catch (error: any) {
    // 统一处理回滚
    await rollbackChanges(supabase, createdIds, uploadResult.fileName)
    throw new Error(`Failed to create resume record: ${error.message}`)
  }
}

async function rollbackChanges(
  supabase: any,
  createdIds: { jobId?: string, resumeId?: string },
  fileName: string
) {
  if (createdIds.resumeId) {
    await supabase.from('resumes').delete().eq('id', createdIds.resumeId)
  }
  if (createdIds.jobId) {
    await supabase.from('jobs').delete().eq('id', createdIds.jobId)
  }
  await supabase.storage.from(BUCKET_NAME).remove([fileName])
}

export async function updateResumeJobDescription(jobDescription: ResumeJobDescription) {
  const supabase = await createClient()
  const {id, ...payload} = jobDescription
  const {error} = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', id)

  if (error) throw error

  const { error: flagError } = await supabase
    .from('resumes')
    .update({ evaluation_report_refresh_flag: true })
    .eq('job_id', id)

  if (flagError) {
    throw new Error(`Failed to mark evaluation refresh flag: ${flagError.message}`)
  }
}

export async function saveResumeChange(resumeId: string, data: ResumeData) {
  const supabase = await createClient()
  const {error} = await supabase
    .from('resumes')
    .update({ resume_json: data, evaluation_report_refresh_flag: true })
    .eq('id', resumeId)

  if (error) throw error;
}

export async function createEmptyResumeRecord(jobInfos: JobInfoFormType) {
  const supabase = await createClient()
  const user = await supabase.auth.getUser()

  if (!user.data.user) {
    throw new Error("User not authenticated")
  }

  const createdIds: { jobId?: string, resumeId?: string, applicationId?: string } = {}

  try {
    const {data: jobData, error: jobError} = await supabase
      .from('jobs')
      .insert(jobInfos)
      .select()
      .single()

    if (jobError) throw jobError
    createdIds.jobId = jobData.id

    // 创建空的简历数据
    const emptyResumeData: ResumeData = {
      personalInfo: {
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      },
      education: {
        title: "Education History",
        order: 0,
        blocks: []
      },
      employment: {
        title: "Employment History",
        order: 1,
        blocks: []
      },
      skills: {
        title: "Skills",
        order: 2,
        blocks: []
      }
    };

    const {data: resumeData, error: resumeError} = await supabase
      .from('resumes')
      .insert({
        user_id: user.data.user.id,
        job_id: jobData.id,
        upload_url: null, // 空简历没有上传文件
        language: 'en', // 默认英语
        resume_json: emptyResumeData
      })
      .select()
      .single()

    if (resumeError) throw resumeError
    createdIds.resumeId = resumeData.id

    const {data: applicationData, error: applicationError} = await supabase
      .from('job_applications')
      .insert({
        user_id: user.data.user.id,
        resume_id: resumeData.id,
        job_id: jobData.id,
        optimized_resume_url: null
      })
      .select()
      .single()

    if (applicationError) throw applicationError
    createdIds.applicationId = applicationData.id

    // TODO Evaluate and save (do not block user in empty creation; still await here to persist immediately)
    // await evaluateAndSaveResume(resumeData.id, emptyResumeData, jobData.description)

    return {
      jobData,
      resumeData,
      applicationData
    }

  } catch (error: any) {
    // 统一处理回滚
    await rollbackEmptyResumeChanges(supabase, createdIds)
    throw new Error(`Failed to create empty resume record: ${error.message}`)
  }
}

async function rollbackEmptyResumeChanges(
  supabase: any,
  createdIds: { jobId?: string, resumeId?: string, applicationId?: string }
) {
  if (createdIds.applicationId) {
    await supabase.from('job_applications').delete().eq('id', createdIds.applicationId)
  }
  if (createdIds.resumeId) {
    await supabase.from('resumes').delete().eq('id', createdIds.resumeId)
  }
  if (createdIds.jobId) {
    await supabase.from('jobs').delete().eq('id', createdIds.jobId)
  }
}
