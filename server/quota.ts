import "server-only"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/supabase"

type QuotaObj<Col> = {
  total: number
  used: number
  colName: Col
}

export type Quota = {
  fullOptimize: QuotaObj<"full_optimize">
  blockOptimize: QuotaObj<"block_optimize">
  motivationLetter: QuotaObj<"motivation_letter">
}

export type ChatTokenQuota = {
  limit: number
  used: number
}

type DBAccessPass = Database["public"]["Tables"]["access_passes"]["Row"]

type QuotaKey = keyof Quota
// 单个用户允许创建的最大岗位申请数量，防止太多的垃圾数据。
const JOB_APPLICATION_LIMIT = 20

export type UserSubscription = {
  plan: "FREE" | "LITE" | "PRO" | null
  expiryDate: string | null
  isActive: boolean
  quotas: Quota
  chatTokenLimit: number
}

const EMPTY_QUOTAS: Quota = {
  fullOptimize: { used: 0, total: 0, colName: "full_optimize" },
  blockOptimize: { used: 0, total: 0, colName: "block_optimize" },
  motivationLetter: { used: 0, total: 0, colName: "motivation_letter" }
}

const EMPTY_CHAT_TOKENS: ChatTokenQuota = {
  used: 0,
  limit: 0
}

// 获取用户有效订阅的方法
export async function getActiveAccessPass(
  userId: string
): Promise<DBAccessPass | null> {
  const supabase = await createClient()

  // todo 拆分所有的supabase出去为单独的方法，方便测试进行mock
  const { data: accessPass, error } = await supabase
    .from("access_passes")
    .select("*")
    .eq("user_id", userId)
    .gt("end_at", new Date().toISOString())
    .order("end_at", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") {
    throw error
  }

  return accessPass
}

// 新增：获取用户订阅信息
export async function getUserSubscription(): Promise<UserSubscription> {
  const supabase = await createClient()

  // 获取当前用户
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("用户未登录")
  }

  // 获取用户有效订阅
  const accessPass = await getActiveAccessPass(user.id)

  // 如果没有有效订阅，返回默认值
  if (!accessPass) {
    return {
      plan: null,
      expiryDate: null,
      isActive: false,
      quotas: EMPTY_QUOTAS,
      chatTokenLimit: 0
    }
  }

  return {
    plan: accessPass.plan,
    expiryDate: accessPass.end_at,
    isActive: true,
    quotas: buildQuotas(accessPass),
    chatTokenLimit: buildChatTokenQuota(accessPass).limit
  }
}

export const buildQuotas = (accessPass: DBAccessPass): Quota => {
  return {
    fullOptimize: {
      total: accessPass.quota_full_optimize!!,
      used: accessPass.used_full_optimize!!,
      colName: "full_optimize"
    },
    blockOptimize: {
      total: accessPass.quota_block_optimize!!,
      used: accessPass.used_block_optimize!!,
      colName: "block_optimize"
    },
    motivationLetter: {
      total: accessPass.quota_motivation_letter!!,
      used: accessPass.used_motivation_letter!!,
      colName: "motivation_letter"
    }
  }
}

export const buildChatTokenQuota = (
  accessPass: DBAccessPass | null
): ChatTokenQuota => {
  if (!accessPass) {
    return EMPTY_CHAT_TOKENS
  }

  const limit = accessPass.quota_chat_tokens ?? 0
  const used = accessPass.used_chat_tokens ?? 0

  return {
    limit,
    used
  }
}

export async function consumeQuota(key: QuotaKey) {
  const supabase = await createClient()
  const { data: accessPass, error } = await supabase
    .from("access_passes")
    .select("*")
    .single()

  if (error) {
    throw error
  }

  const quotas = buildQuotas(accessPass)

  const updateParams = verifyAndUpdateQuota(key, quotas)

  const { error: updateError } = await supabase
    .from("access_passes")
    .update({
      ...updateParams
    })
    .eq("id", accessPass.id)

  if (updateError) {
    throw updateError
  }

  console.log("consuming quota", key, "success")
}

export function verifyChatTokenQuota(used: number, limit: number): void {
  if (limit <= 0) {
    return
  }

  if (used >= limit) {
    throw new Error("Chat token limit reached")
  }
}

export async function consumeChatTokens(
  accessPassId: string,
  tokenCount: number
): Promise<number> {
  if (tokenCount <= 0) {
    return 0
  }

  const supabase = await createClient()
  let attempts = 0

  while (attempts < 3) {
    const { data: accessPass, error: selectError } = await supabase
      .from("access_passes")
      .select("used_chat_tokens")
      .eq("id", accessPassId)
      .single()

    if (selectError) {
      throw selectError
    }

    const currentUsedTokens = accessPass?.used_chat_tokens ?? 0
    const nextUsedTokens = currentUsedTokens + tokenCount

    const { data: updatedPass, error: updateError } = await supabase
      .from("access_passes")
      .update({
        used_chat_tokens: nextUsedTokens
      })
      .eq("id", accessPassId)
      .eq("used_chat_tokens", currentUsedTokens)
      .select("used_chat_tokens")
      .maybeSingle()

    if (updateError) {
      throw updateError
    }

    if (updatedPass) {
      return updatedPass.used_chat_tokens ?? nextUsedTokens
    }

    attempts += 1
  }

  throw new Error("Failed to update chat token usage")
}

export function verifyQuota(key: QuotaKey, quotas: Quota): void {
  const quotaItem = quotas[key]
  if (quotaItem.used >= quotaItem.total) {
    throw new Error("Limit reached")
  }
}

export function verifyAndUpdateQuota(key: QuotaKey, quotas: Quota) {
  const quotaItem = quotas[key]
  if (quotaItem.used >= quotaItem.total) {
    throw new Error("Limit reached")
  }

  return {
    [`used_${quotaItem.colName}`]: quotaItem.used + 1
  }
}

// 目前不做配额的限制，但是需要限制用户申请岗位的数量， 未来考虑设计进配额
export async function verifyJobApplicationLimit() {
  const supabase = await createClient()

  // 获取当前用户
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("User not logged in")
  }

  const { data: jobApplications, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)

  if (error) {
    throw error
  }

  if (jobApplications.length >= JOB_APPLICATION_LIMIT) {
    throw new Error(
      "You have reached the maximum job application limit, please try to delete some jobs you have applied for."
    )
  }
}
