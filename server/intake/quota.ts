import { createClient } from "@/lib/supabase/server"
import { QUOTA } from "@/lib/payment/quota"
import type { TokenUsage } from "@/lib/agent/token-usage"
import type { UsageAuthorization } from "./types"

/**
 * Shared usage authorization / accounting capability.
 * Independent of any specific orchestration flow.
 *
 * Contract:
 * - authorizeUsage: gate whether a new intake may start right now
 * - recordAuthorizedUsage: record actual consumption (may exceed limit once started)
 * - No reservation; once authorized, the entire intake is allowed to complete.
 * - Billed usage is never rolled back.
 */

export async function authorizeUsage(
  actorId: string,
  _scope: "resume-parse"
): Promise<UsageAuthorization | null> {
  const supabase = await createClient()

  const { data: accessPass, error } = await supabase
    .from("access_passes")
    .select("id, plan, quota_chat_tokens, used_chat_tokens")
    .eq("user_id", actorId)
    .maybeSingle()

  if (error || !accessPass) {
    // no active pass — allow (no quota to enforce)
    return null
  }

  const planQuota =
    accessPass.plan && accessPass.plan in QUOTA
      ? QUOTA[accessPass.plan as keyof typeof QUOTA].quota_chat_tokens
      : 0
  const limit = Math.max(accessPass.quota_chat_tokens ?? 0, planQuota)
  const used = accessPass.used_chat_tokens ?? 0

  // Soft limit: block new starts once exhausted, but allow an authorized run
  // to record its full actual usage even if it crosses the limit.
  return {
    accessPassId: accessPass.id,
    authorized: used < limit,
    used,
    limit
  }
}

export async function recordAuthorizedUsage(
  authorization: UsageAuthorization,
  usage: TokenUsage
): Promise<void> {
  if (usage.totalTokens <= 0) return

  const supabase = await createClient()
  let attempts = 0

  while (attempts < 3) {
    const { data: pass, error: selectError } = await supabase
      .from("access_passes")
      .select("used_chat_tokens")
      .eq("id", authorization.accessPassId)
      .single()

    if (selectError) throw selectError

    const currentUsed = pass?.used_chat_tokens ?? 0
    const nextUsed = currentUsed + usage.totalTokens

    const { data: updated, error: updateError } = await supabase
      .from("access_passes")
      .update({ used_chat_tokens: nextUsed })
      .eq("id", authorization.accessPassId)
      .eq("used_chat_tokens", currentUsed)
      .select("used_chat_tokens")
      .maybeSingle()

    if (updateError) throw updateError

    if (updated) return // success

    attempts += 1
  }

  throw new Error("Failed to record token usage after retries")
}
