import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/components/client-components/app-sidebar"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider className="flex">
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-hidden">{children}</SidebarInset>
    </SidebarProvider>
  )
}
