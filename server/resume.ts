"use server"

import {createClient} from "@/lib/supabase/server";
import {ResumeData, ResumeJobDescription} from "@/types/resume";
import {Locale} from "@/lib/i18n/config";
import { JobInfoFormType } from "@/components/forms/job-information-form";
import {rollbackStorage} from "@/server/rollback";

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

export async function getResumeData(id: string) {
  const supabase = await createClient()

  const {data: resume, error} = await supabase
    .from("resumes")
    .select(`
      id,
      resume_json
    `)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to fetch resume: ${error.message}`)
  }

  if (!resume || resume.length === 0) {
    throw new Error(`No resume found with id: ${id}`)
  }

  if (resume.length > 1) {
    throw new Error(`Multiple resume found with id: ${id}`)
  }

  return resume[0].resume_json
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

  // 注册回滚：删除文件
  const rollbackCtx = rollbackStorage.getStore()
  rollbackCtx?.addRollback(async () => {
    await supabase.storage.from(BUCKET_NAME).remove([fileName])
  })

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
  const rollbackCtx = rollbackStorage.getStore()

  try {
    const {data: jobData, error: jobError} = await supabase
      .from('jobs')
      .insert(jobInfos)
      .select()
      .single()

    if (jobError) throw jobError
    
    const savedJobId = jobData.id
    rollbackCtx?.addRollback(async () => {
      await supabase.from('jobs').delete().eq('id', savedJobId)
    })

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
    
    const savedResumeId = resumeData.id
    rollbackCtx?.addRollback(async () => {
      await supabase.from('resumes').delete().eq('id', savedResumeId)
    })

    const {data: applicationData, error: applicationError} = await supabase
      .from('job_applications')
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
      await supabase.from('job_applications').delete().eq('id', savedApplicationId)
    })

    return {jobData, resumeData}

  } catch (error: any) {
    // 错误会由外层 rollbackStorage.run() 的回滚逻辑处理
    throw new Error(`Failed to create resume record: ${error.message}`)
  }
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
  const rollbackCtx = rollbackStorage.getStore()

  if (!user.data.user) {
    throw new Error("User not authenticated")
  }

  try {
    const {data: jobData, error: jobError} = await supabase
      .from('jobs')
      .insert(jobInfos)
      .select()
      .single()

    if (jobError) throw jobError
    
    const savedJobId = jobData.id
    rollbackCtx?.addRollback(async () => {
      await supabase.from('jobs').delete().eq('id', savedJobId)
    })

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
    
    const savedResumeId = resumeData.id
    rollbackCtx?.addRollback(async () => {
      await supabase.from('resumes').delete().eq('id', savedResumeId)
    })

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
    
    const savedApplicationId = applicationData.id
      rollbackCtx?.addRollback(async () => {
        await supabase.from('job_applications').delete().eq('id', savedApplicationId)
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
