import { updateSession } from "@/lib/supabase/proxy"
import { type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/:path*",
    "/settings/:path*",
    "/application/:path*",
    "/payment/:path*",
    "/resume-print/:path*",
    "/api/((?!stripe/webhook).*)"
  ]
}
