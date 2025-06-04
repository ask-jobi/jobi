import "server-only"
import {createClient} from "@/lib/supabase/server";


export async function getQuotas() {
  const supabase = await createClient()

  const {data: quotas, error} = await supabase
    .from("user_quotas")
    .select("*").single()

  if (error) {
    throw error
  }

  return {
    overallOptimize: { total: quotas.overall_optimize_quota!!, used: quotas.overall_optimize_used!! },
    partialOptimize: { total: quotas.partial_optimize_quota!!, used: quotas.partial_optimize_used!! },
    credits: { total: quotas.credits_quota!!, used: quotas.credits_used!! }
  }
}
