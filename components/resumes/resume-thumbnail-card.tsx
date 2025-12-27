"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { trackViewResume } from "@/lib/user-tracking/user-tracking";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button";
import {useTranslations} from "next-intl";

interface ResumeThumbnailCardProps {
  thumbnailUrl: string | null;
  applicationId: string;
}

export default function ResumeThumbnailCard({
  thumbnailUrl,
  applicationId
}: ResumeThumbnailCardProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleCardClick = () => {
    // 跟踪用户点击简历卡片的事件
    trackViewResume({
      applicationId,
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/application/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: applicationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete job application");
      }

      toast.success("Job application deleted successfully");
      setIsDeleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete job application";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="aspect-[1/1.414] group hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 bg-white border-gray-200 relative">
        <Link href={`/application/${applicationId}`} onClick={handleCardClick} className="block h-full">
          <div className="h-full relative bg-white border border-gray-300 rounded-sm shadow-sm overflow-hidden">
            {/* 删除按钮 - hover 时显示 */}
            <button
              onClick={handleDeleteClick}
              className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md hover:shadow-lg"
              aria-label="Delete job application"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>

            {/* 加载状态 */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <p className="text-xs text-gray-500">Previewing...</p>
                </div>
              </div>
            )}

            {/* 错误状态 */}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <p className="text-xs text-gray-500">Error</p>
                </div>
              </div>
            )}

            {/* 缩略图 */}
            {thumbnailUrl && !hasError && (
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={thumbnailUrl}
                  alt="Resume thumbnail"
                  fill
                  className="object-cover"
                  unoptimized
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
            )}

            {/* 无预览状态 */}
            {!thumbnailUrl && !hasError && (
              <div className="aspect-[3/4] w-full flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-10 bg-gray-300 rounded-sm"></div>
                  <p className="text-xs text-gray-500">No Preview</p>
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("modal.deleteJobAppTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("modal.deleteJobAppDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("button.cancel")}</AlertDialogCancel>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("button.delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
