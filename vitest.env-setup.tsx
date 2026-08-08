import { loadEnvConfig } from "@next/env"
import { vi } from "vitest"

loadEnvConfig(process.cwd())

process.env.WORKSPACE_COOKIE_SECRET = "jobi-test-workspace-secret"
