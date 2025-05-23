"use server"

import { createClient } from "@/lib/supabase/server";

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
  