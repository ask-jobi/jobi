/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { createWorkspaceToken, workspaceCookie } from "@/lib/workspace/session"
import { middleware } from "@/middleware"

describe("workspace middleware", () => {
  it("creates a signed workspace cookie for a new browser", async () => {
    const response = await middleware(new NextRequest("http://localhost/"))
    const token = response.cookies.get(workspaceCookie.name)?.value

    expect(token).toBeTruthy()
    expect(response.cookies.get(workspaceCookie.name)?.httpOnly).toBe(true)
  })

  it("keeps an existing valid workspace cookie", async () => {
    const token = await createWorkspaceToken("workspace-1")
    const request = new NextRequest("http://localhost/dashboard", {
      headers: { cookie: `${workspaceCookie.name}=${token}` }
    })
    const response = await middleware(request)

    expect(response.cookies.get(workspaceCookie.name)).toBeUndefined()
  })

  it("replaces a tampered workspace cookie", async () => {
    const request = new NextRequest("http://localhost/dashboard", {
      headers: { cookie: `${workspaceCookie.name}=workspace-1.invalid` }
    })
    const response = await middleware(request)

    expect(response.cookies.get(workspaceCookie.name)?.value).not.toBe(
      "workspace-1.invalid"
    )
  })
})
