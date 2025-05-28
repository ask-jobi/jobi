import AppSidebar from "@/components/app-sidebar";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";

export default async function DashboardLayout({
                                                children,
                                              }: {
  children: React.ReactNode;
}) {
  const supabase = await createClient()

  const {data, error} = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  return (
    <SidebarProvider className="flex">
      <AppSidebar/>
      <SidebarInset className="flex-1 overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
