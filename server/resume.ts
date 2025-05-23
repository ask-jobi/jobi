"use server"

import { createClient } from "@/lib/supabase/server";
import {JobInfoFormType} from "@/components/client-components/job-information-form";

export async function fetchResume() {
    const supabase = await createClient()

    const { data: resumes, error } = await supabase
        .from('resumes')
        .select(`
            id,
            resume_json,
            upload_url,
            created_at,
            jobs (
                id,
                name,
                company,
                description
            )
        `)

    return resumes;
}
const BUCKET_NAME = 'upload-resumes'
export async function saveJobInfoAndUploadResume(jobInfos: JobInfoFormType, resumeFile: File) {
    const supabase = await createClient()
    const user = await supabase.auth.getUser()

    if (!user.data.user) {
        throw new Error("User not authenticated")
    }

    const fileName = `${user.data.user.id}/${resumeFile.name}`
    const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(fileName, resumeFile)

    console.log('uploadData', uploadData)

    if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase
        .storage
        .from('resumes')
        .getPublicUrl(fileName)

    const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert(jobInfos)
        .select()
        .single()

    if (jobError) {
        await supabase.storage.from(BUCKET_NAME).remove([fileName])
        throw new Error(`Failed to insert job: ${jobError.message}`)
    }

    const { error: resumeError } = await supabase
        .from('resumes')
        .insert({
            user_id: user.data.user.id,
            job_id: jobData.id,
            upload_url: publicUrl,
            resume_json: null // TODO 暂时为null，后续可以添加简历解析功能
        })

    if (resumeError) {
        await supabase.storage.from(BUCKET_NAME).remove([fileName])
        await supabase.from('jobs').delete().eq('id', jobData.id)
        throw new Error(`Failed to insert resume: ${resumeError.message}`)
    }

}
