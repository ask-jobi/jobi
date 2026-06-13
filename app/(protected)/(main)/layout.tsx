import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getOptionalVerifiedUserIdentity } from "@/server/auth-helper"
import { redirect } from "next/navigation"
import AppSidebar from "@/components/client-components/app-sidebar"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await getOptionalVerifiedUserIdentity()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <SidebarProvider className="flex">
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-hidden">{children}</SidebarInset>
    </SidebarProvider>
  )
}
