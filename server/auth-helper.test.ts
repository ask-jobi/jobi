/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDatabase } from "@/lib/db/client"
import { createWorkspaceToken, workspaceCookie } from "@/lib/workspace/session"
import { verifySessionOwnership } from "@/server/ai/chat/history"
import {
  getOptionalExistingUserIdentity,
  getOptionalVerifiedUserIdentity,
  requireExistingAuthContext,
  requireVerifiedAuthContext,
  requireVerifiedUserIdentity,
  verifyOwnership
} from "./auth-helper"
import { cookies } from "next/headers"

vi.mock("next/headers", () => ({ cookies: vi.fn() }))
vi.mock("@/lib/db/client", () => ({ getDatabase: vi.fn() }))
vi.mock("@/server/ai/chat/history", () => ({
  verifySessionOwnership: vi.fn()
}))

function setCookieValue(value: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn(() =>
      value ? { name: workspaceCookie.name, value } : undefined
    )
  } as never)
}

describe("auth-helper workspace identity", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    setCookieValue(await createWorkspaceToken("workspace-1"))
    vi.mocked(getDatabase).mockResolvedValue({} as never)
  })

  it("returns a verified workspace identity", async () => {
    await expect(requireVerifiedUserIdentity()).resolves.toEqual({
      id: "workspace-1"
    })
    await expect(getOptionalVerifiedUserIdentity()).resolves.toEqual({
      id: "workspace-1"
    })
    await expect(getOptionalExistingUserIdentity()).resolves.toEqual({
      id: "workspace-1"
    })
  })

  it("rejects a missing or tampered cookie", async () => {
    setCookieValue("workspace-1.invalid-signature")

    await expect(requireVerifiedUserIdentity()).rejects.toMatchObject({
      message: "Unauthorized",
      statusCode: 401
    })
    await expect(getOptionalVerifiedUserIdentity()).resolves.toBeNull()
  })

  it("returns a database context for the verified workspace", async () => {
    const db = {} as never
    vi.mocked(getDatabase).mockResolvedValue(db)

    await expect(requireVerifiedAuthContext()).resolves.toEqual({
      db,
      user: { id: "workspace-1" }
    })
    await expect(requireExistingAuthContext()).resolves.toEqual({
      db,
      user: { id: "workspace-1" }
    })
  })

  it("rejects sessions owned by another workspace", async () => {
    vi.mocked(verifySessionOwnership).mockResolvedValue(false)

    await expect(
      verifyOwnership("session-1", "workspace-1")
    ).rejects.toMatchObject({ statusCode: 403 })
  })
})
