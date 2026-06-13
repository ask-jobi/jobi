import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

async function assertSupabaseHealthy(healthUrl: string) {
  let response: Response

  try {
    response = await fetch(healthUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000)
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Local Supabase health check failed for ${healthUrl}. ${reason}. Run 'supabase start' first.`
    )
  }

  if (!response.ok) {
    const body = (await response.text()).slice(0, 200)
    throw new Error(
      `Local Supabase health check failed for ${healthUrl}. Received ${response.status} ${response.statusText}${body ? `: ${body}` : ""}. Run 'supabase start' first.`
    )
  }
}

export default async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL for Playwright E2E. Check your .env.local/.env.test configuration."
    )
  }

  const healthUrl = new URL("/auth/v1/health", supabaseUrl).toString()
  await assertSupabaseHealthy(healthUrl)
}
