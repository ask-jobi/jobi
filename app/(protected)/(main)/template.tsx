"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@radix-ui/react-separator"
import { useTranslations } from "next-intl"

function MainTemplate({ children }: { children: React.ReactNode }) {
  const t = useTranslations()

  const getPageTitle = () => {
    return t("dashboard")
  }

  return (
    <div className="w-full">
      <header className="header group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{getPageTitle()}</h1>
        </div>
      </header>
      {children}
    </div>
  )
}

export default MainTemplate
