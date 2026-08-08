import "server-only"

import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1"

import { schema, type Database } from "@/lib/db/schema"

export type AppDatabase = DrizzleD1Database<Database>

export async function getDatabase(): Promise<AppDatabase> {
  const { env } = await getCloudflareContext({ async: true })

  if (!env.DB) {
    throw new Error(
      "D1 database binding DB is unavailable. Apply local migrations and check wrangler.jsonc."
    )
  }

  return drizzle(env.DB, { schema })
}
