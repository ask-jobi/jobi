import { loadEnvConfig } from "@next/env"
import { vi } from "vitest"

loadEnvConfig(process.cwd())

// Set required environment variables for tests
process.env.STRIPE_SECRET_KEY = "sk_test_mock_key"
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock_publishable_key"
process.env.SUPABASE_SECRET_KEY = "mock_secret_key"
