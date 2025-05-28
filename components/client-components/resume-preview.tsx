"use client";

import { ResumeData } from "@/types/resume";
import { useEffect, useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas-pro";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { generateResumeHtml } from "../resume-html-template";
import { createPDF } from "jspdf-pro"

interface ResumePreviewProps {
  data: ResumeData;
}

export default function ResumePreview({ data }: ResumePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null); // 用于生成 Canvas 的隐藏内容
  const visibleCanvasRef = useRef<HTMLCanvasElement>(null); // 显示用的 Canvas
  const [fullRenderedCanvas, setFullRenderedCanvas] = useState<HTMLCanvasElement | null>(null); // 完整的 Canvas
  const [currentPage, setCurrentPage] = useState(0); // 当前页码 (0-indexed)
  const [pageCount, setPageCount] = useState(0); // 总页数
  const [isLoading, setIsLoading] = useState(true);

  const scale = 2; // 保持 2x 缩放以获得更清晰的 Canvas
  const mmToPx = 3.78; // 1mm ≈ 3.78px (近似值，根据 DPI 可能有差异)
  const a4WidthPx = 210 * mmToPx;
  const a4HeightPx = 297 * mmToPx;
  const a4HeightPxScaled = a4HeightPx * scale; // A4 高度（像素，考虑缩放）
  const a4WidthPxScaled = a4WidthPx * scale; // A4 宽度（像素，考虑缩放）

  // effect 用于生成完整的 Canvas
  useEffect(() => {
    const previewElement = previewRef.current;
    if (!previewElement) return;

    setIsLoading(true);
    setFullRenderedCanvas(null); // 清空之前的完整 Canvas
    setCurrentPage(0);
    setPageCount(0);

    // 确保用于生成 canvas 的元素有正确的宽度，高度自适应
    const contentElement = previewElement.querySelector('.resume-content') as HTMLElement;
    if (!contentElement) return;
    contentElement.style.width = `${a4WidthPx}px`; // 设置为 A4 宽度 (非缩放)
    contentElement.style.height = 'auto'; // 允许高度自适应

    html2canvas(contentElement, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        const clonedContent = clonedDoc.querySelector('.resume-content') as HTMLElement;
        if (clonedContent) {
          // 确保克隆的内容有正确的样式
          clonedContent.style.width = `${a4WidthPx}px`;
          clonedContent.style.height = 'auto';
          clonedContent.style.fontSize = '11pt';
          clonedContent.style.lineHeight = '1.5';
          clonedContent.style.color = '#000000';
          clonedContent.style.padding = '2rem';
          clonedContent.style.boxSizing = 'border-box';
        }
      }
    }).then((renderedCanvas) => {
      setFullRenderedCanvas(renderedCanvas);
      // 获取完整渲染的 Canvas 尺寸
      const totalHeight = renderedCanvas.height;
      // 计算需要分割的页数，向上取整确保内容不会被裁切
      setPageCount(Math.max(1, Math.ceil(totalHeight / a4HeightPxScaled)));
      setIsLoading(false);
    }).catch((error) => {
      console.error("html2canvas rendering error:", error);
      setIsLoading(false);
    });

  }, [data, a4WidthPx, a4HeightPxScaled]); // 当 data 或尺寸相关变量变化时重新渲染

  useEffect(() => {
    const visibleCanvas = visibleCanvasRef.current;
    const fullCanvas = fullRenderedCanvas;

    if (!visibleCanvas || !fullCanvas) return;

    const ctx = visibleCanvas.getContext('2d');
    if (!ctx) return;

    // 设置可见 Canvas 的尺寸
    visibleCanvas.width = a4WidthPxScaled;
    visibleCanvas.height = a4HeightPxScaled;

    // 计算当前页在完整 Canvas 中的裁剪区域
    const sourceY = currentPage * a4HeightPxScaled;
    const remainingHeight = fullCanvas.height - sourceY;
    const sourceHeight = Math.min(a4HeightPxScaled, remainingHeight);

    // 清空可见 Canvas
    ctx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);

    ctx.drawImage(
      fullCanvas,
      0, sourceY, // 源图像裁剪起点 (x, y)
      fullCanvas.width, sourceHeight, // 源图像裁剪尺寸 (width, height)
      0, 0, // 目标图像起点 (x, y)
      visibleCanvas.width, sourceHeight // 目标图像尺寸 (width, height)
    );

    // 如果当前页是最后一页且内容高度小于 A4 高度，则不需要重复绘制
    if (currentPage === pageCount - 1 && sourceHeight < a4HeightPxScaled) {
      // 最后一页，内容不足一页，不需要额外处理
      return;
    }
  }, [fullRenderedCanvas, currentPage, a4HeightPxScaled, a4WidthPxScaled, pageCount]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(pageCount - 1, prev + 1));
  }, [pageCount]);

  const handleExportPDF = useCallback(async () => {
    if (!fullRenderedCanvas) return;

    setIsLoading(true);
    try {
        createPDF(previewRef.current!!)
            .margin({top: 40, bottom: 40})
            .toPdf(`${data.personalInfo.firstName}_${data.personalInfo.lastName}_Resume.pdf`)
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fullRenderedCanvas, data.personalInfo.firstName, data.personalInfo.lastName, a4HeightPxScaled]);

  return (
    <div className="relative">
      <div ref={previewRef} className="absolute -left-[9999px]">
        {generateResumeHtml(data)}
      </div>

      <div className="space-y-4 bg-white shadow-lg rounded-lg overflow-hidden p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[297mm] bg-gray-50">
            <p className="text-gray-400">Generating preview...</p>
          </div>
        ) : fullRenderedCanvas ? (
          <div className="flex flex-col items-center">
            {/* 导出按钮 */}
            <div className="w-full flex justify-end mb-4">
              <Button
                onClick={handleExportPDF}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>

            {/* Canvas 容器保持 A4 比例 */}
            <div className="relative w-full" style={{ paddingBottom: '141.4%' }}>
              <canvas
                ref={visibleCanvasRef}
                className="absolute inset-0 w-full h-full"
              />
            </div>
            
            {/* 分页控制 */}
            {pageCount > 1 && (
              <div className="flex items-center justify-center mt-4 space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 0}
                  size="icon"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage + 1} of {pageCount}
                </span>
                <Button 
                  variant="outline" 
                  onClick={handleNextPage} 
                  disabled={currentPage === pageCount - 1}
                  size="icon"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[297mm] bg-gray-50">
            <p className="text-gray-400">Preview not available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
