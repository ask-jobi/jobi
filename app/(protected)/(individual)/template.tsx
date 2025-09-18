"use client"
import {Separator} from "@radix-ui/react-separator";
import {ArrowLeft} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";

export default ({
                  children,
                }: {
  children: React.ReactNode;
}) => {
  const router = useRouter()
  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="w-full">
      <header
        className="header group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <Button
            variant="ghost"
            onClick={handleGoBack}>
            <ArrowLeft/>
          </Button>
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">Resume</h1>
        </div>
      </header>
      {children}
    </div>
  )
}
