import {LayoutDashboard, Settings, LogOut} from "lucide-react";
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
import {getQuotas} from "@/server/quota";
import { LogoutButton } from "./logout-button";

const QuotaCard = async () => {
  const quotaData= await getQuotas();

  return (
    <div className="mx-4 my-2">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Credits</span>
          <span className="text-gray-900">{quotaData.credits.used}/{quotaData.credits.total}</span>
        </div>
        <Progress value={(quotaData.credits.used / quotaData.credits.total) * 100}/>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Overall Optimize</span>
          <span className="text-gray-900">{quotaData.overallOptimize.used}/{quotaData.overallOptimize.total}</span>
        </div>
        <Progress value={(quotaData.overallOptimize.used / quotaData.overallOptimize.total) * 100}/>
      </div>
    </div>
  );
};

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
];

export default function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader/>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className="data-[slot=sidebar-menu-button]:!p-1.5"
          >
            <a href="/">
              <span className="text-base font-semibold">Jobi AI</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <QuotaCard />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon/>
                      <span>{item.title}</span>
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
            <SidebarMenuButton asChild>
              <a href="#">
                <Settings />
                <span>设置</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <LogoutButton />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
