import "server-only"
import { createClient } from "@/lib/supabase/server"
import { QUOTA } from "@/lib/payment/quota"
import { Database } from "@/types/supabase"

export type ChatTokenQuota = {
  limit: number
  used: number
}

type DBAccessPass = Database["public"]["Tables"]["access_passes"]["Row"]

// 单个用户允许创建的最大岗位申请数量，防止太多的垃圾数据。
const JOB_APPLICATION_LIMIT = 20

export type UserTokenBalance = {
  plan: "FREE" | "LITE" | "PRO" | null
  chatTokenLimit: number
  chatTokenUsed: number
  chatTokenRemaining: number
}

const EMPTY_CHAT_TOKENS: ChatTokenQuota = {
  used: 0,
  limit: 0
}

const hasRemainingChatTokens = (accessPass: DBAccessPass) => {
  return (accessPass.quota_chat_tokens ?? 0) > (accessPass.used_chat_tokens ?? 0)
}

// 获取用户有效订阅的方法
export async function getActiveAccessPass(
  userId: string
): Promise<DBAccessPass | null> {
  const supabase = await createClient()

  // todo 拆分所有的supabase出去为单独的方法，方便测试进行mock
  const queryResult = await supabase
    .from("access_passes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const error = (queryResult as { error?: { code?: string } })?.error
  if (error && error.code !== "PGRST116") {
    throw error
  }

  const accessPasses = Array.isArray(queryResult)
    ? queryResult
    : Array.isArray((queryResult as { data?: unknown[] })?.data)
      ? ((queryResult as { data: DBAccessPass[] }).data ?? [])
      : (queryResult as { data?: DBAccessPass | null })?.data
        ? [((queryResult as { data: DBAccessPass }).data as DBAccessPass)]
        : []

  if (!Array.isArray(accessPasses)) {
    return null
  }

  return accessPasses.find(hasRemainingChatTokens) ?? null
}

export async function getUserTokenBalance(): Promise<UserTokenBalance> {
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
      chatTokenLimit: 0,
      chatTokenUsed: 0,
      chatTokenRemaining: 0
    }
  }

  const chatTokenQuota = buildChatTokenQuota(accessPass)

  return {
    plan: accessPass.plan,
    chatTokenLimit: chatTokenQuota.limit,
    chatTokenUsed: chatTokenQuota.used,
    chatTokenRemaining: Math.max(chatTokenQuota.limit - chatTokenQuota.used, 0)
  }
}

export const buildChatTokenQuota = (
  accessPass: DBAccessPass | null
): ChatTokenQuota => {
  if (!accessPass) {
    return EMPTY_CHAT_TOKENS
  }

  const minimumPlanQuota =
    accessPass.plan && accessPass.plan in QUOTA
      ? QUOTA[accessPass.plan as keyof typeof QUOTA].quota_chat_tokens
      : 0
  const limit = Math.max(accessPass.quota_chat_tokens ?? 0, minimumPlanQuota)
  const used = accessPass.used_chat_tokens ?? 0

  return {
    limit,
    used
  }
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
