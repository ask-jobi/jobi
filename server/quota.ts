import "server-only"
import {createClient} from "@/lib/supabase/server";
import {Database} from "@/types/supabase";

type QuotaObj<Col> = {
  total: number,
  used: number,
  colName: Col
}

type Quota = {
  overallOptimize: QuotaObj<"overall_optimize">,
  partialOptimize: QuotaObj<"partial_optimize">,
  credits: QuotaObj<"credits">
}

type DBQuota = Database["public"]["Tables"]["user_quotas"]["Row"]

type QuotaKey = keyof Quota

export async function getQuotas(): Promise<Quota> {
  const supabase = await createClient()

  const {data: quotas, error} = await supabase
    .from("user_quotas")
    .select("*").single()

  if (error) {
    throw error
  }

  return buildQuotas(quotas)
}

const buildQuotas = (dbQuotas: DBQuota): Quota => {
  return {
    overallOptimize: {
      total: dbQuotas.overall_optimize_quota!!,
      used: dbQuotas.overall_optimize_used!!,
      colName: "overall_optimize"
    },
    partialOptimize: {
      total: dbQuotas.partial_optimize_quota!!,
      used: dbQuotas.partial_optimize_used!!,
      colName: "partial_optimize"
    },
    credits: {
      total: dbQuotas.credits_quota!!,
      used: dbQuotas.credits_used!!,
      colName: "credits"
    }
  }
}

export async function consumeQuota(key: QuotaKey) {
  const supabase = await createClient()
  const {data: dbQuotas, error} = await supabase
    .from("user_quotas")
    .select("*").single()

  if (error) {
    throw error
  }

  const quotas = buildQuotas(dbQuotas)

  const updateParams = verifyAndUpdateQuota(key, quotas)

  await supabase
    .from("user_quotas")
    .update({
      ...updateParams
    })
    .eq('id', dbQuotas.id)
}
function verifyAndUpdateQuota(key: QuotaKey, quotas: Quota) {
  const quotaItem = quotas[key]
  if (quotaItem.used >= quotaItem.total) {
    throw new Error("Limit reached")
  }

  return {
    [`${quotaItem.colName}_used`]: quotaItem.used + 1
  }
}

