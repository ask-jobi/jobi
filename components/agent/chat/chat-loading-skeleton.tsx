"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function ChatLoadingSkeleton() {
  return (
    <div className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-[44rem] animate-in py-3 duration-150">
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-6 text-sm">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Skeleton className="h-4 w-3/4 rounded-2xl" />
            <Skeleton className="h-4 w-1/2 rounded-2xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Skeleton className="h-4 w-3/4 rounded-2xl" />
            <Skeleton className="h-4 w-1/2 rounded-2xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}
