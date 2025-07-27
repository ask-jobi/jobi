import {LayoutDashboard, Settings} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "./ui/sidebar";
import { Progress } from "./ui/progress";
import { Logo } from "./ui/logo";
import {getQuotas} from "@/server/quota";
import { LogoutButton } from "./logout-button";
import {useTranslations} from "next-intl";
import {getTranslations} from "next-intl/server";

const QuotaCard = async () => {
  const quotaData= await getQuotas();
  const t = await getTranslations()

  return (
    <div className="mx-4 my-2">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t("credits")}</span>
          <span className="text-gray-900">{quotaData.credits.used}/{quotaData.credits.total}</span>
        </div>
        <Progress value={(quotaData.credits.used / quotaData.credits.total) * 100}/>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t("overallOptimized")}</span>
          <span className="text-gray-900">{quotaData.overallOptimize.used}/{quotaData.overallOptimize.total}</span>
        </div>
        <Progress value={(quotaData.overallOptimize.used / quotaData.overallOptimize.total) * 100}/>
      </div>
    </div>
  );
};

const items = [
  {
    title: "dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
];

export default function AppSidebar() {
  const t = useTranslations()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Logo size="lg"/>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon/>
                      <span>{t(item.title)}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
       
        <SidebarMenu>
          <SidebarMenuItem>
          <QuotaCard />
            <SidebarMenuButton asChild>
              <a href="/settings">
                <Settings />
                <span>{t('settings')}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <LogoutButton />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
