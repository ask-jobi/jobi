import AppSidebar from "@/components/app-sidebar";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "@/lib/i18n/navigation";
import {getLocale} from "next-intl/server";


export default async function DashboardLayout({
                                                children,
                                              }: {
  children: React.ReactNode;
}) {
  const supabase = await createClient()
  const locale = await getLocale();

  const {data, error} = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect({
      href: '/auth/login',
      locale
    })
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
