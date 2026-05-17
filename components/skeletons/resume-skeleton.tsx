import { Skeleton } from "@/components/ui/skeleton"

export function ResumeSkeleton() {
  return (
    <div className="w-[210mm] bg-white shadow-lg border border-gray-200 overflow-y-auto overflow-x-hidden p-8 min-h-[297mm]">
      {/* Header Section */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Education Section */}
      <div className="mb-6">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Employment Section */}
      <div className="mb-6">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Skills Section */}
      <div className="mb-6">
        <Skeleton className="h-5 w-20 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 mb-2" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-18 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeSkeleton
