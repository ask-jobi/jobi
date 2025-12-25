import {LayoutDashboard, Settings, Briefcase} from "lucide-react";
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
} from "../ui/sidebar";
import { Logo } from "../ui/logo";
import { LogoutButton } from "./logout-button";
import {useTranslations} from "next-intl";
import { CompactPlanDisplay } from "./compact-plan-display";

const items = [
  {
    title: "dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "jobs",
    url: "/jobs",
    icon: Briefcase,
  },
];

export default function AppSidebar() {
  const t = useTranslations()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Logo size="md"/>
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
            <CompactPlanDisplay />
          </SidebarMenuItem>
          <SidebarMenuItem>
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
