import nextEnv from "@next/env"
import { jest } from "@jest/globals"
import { AsyncLocalStorage } from "node:async_hooks"

const loadEnvConfig =
  (nextEnv as any).loadEnvConfig ?? (nextEnv as any).default?.loadEnvConfig

if (typeof loadEnvConfig === "function") {
  loadEnvConfig(process.cwd())
}

if (typeof (globalThis as any).AsyncLocalStorage === "undefined") {
  ;(globalThis as any).AsyncLocalStorage = AsyncLocalStorage
}
jest.mock("server-only", () => ({}))
