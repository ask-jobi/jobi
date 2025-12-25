"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { trackViewResume } from "@/lib/user-tracking/user-tracking";

interface ResumeThumbnailCardProps {
  thumbnailUrl: string | null;
  applicationId: string;
}

export default function ResumeThumbnailCard({
  thumbnailUrl,
  applicationId
}: ResumeThumbnailCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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

  return (
    <Link href={`/application/${applicationId}`} onClick={handleCardClick}>
      <div className="aspect-[1/1.414] group hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 bg-white border-gray-200">
        <div className="h-full relative bg-white border border-gray-300 rounded-sm shadow-sm overflow-hidden">
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
      </div>
    </Link>
  );
}
