import { NextResponse, type NextRequest } from "next/server"

import {
  createWorkspaceToken,
  verifyWorkspaceToken,
  workspaceCookie
} from "@/lib/workspace/session"

export async function middleware(request: NextRequest) {
  const currentToken = request.cookies.get(workspaceCookie.name)?.value
  const currentWorkspaceId = await verifyWorkspaceToken(currentToken)

  if (currentWorkspaceId) {
    return NextResponse.next()
  }

  const token = await createWorkspaceToken()
  request.cookies.set(workspaceCookie.name, token)
  const response = NextResponse.next({
    request: { headers: request.headers }
  })
  response.cookies.set(workspaceCookie.name, token, workspaceCookie.options)
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
}
