"use server"

import {createClient} from "@/lib/supabase/server";
import {JobInfoFormType} from "@/components/client-components/job-information-form";

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
}) {
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
        resume_json: null
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
