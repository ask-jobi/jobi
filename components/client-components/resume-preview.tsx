"use client";

import { ResumeData } from "@/types/resume";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { generateResumePdf } from "../resume-pdf-template";
import dynamic from 'next/dynamic';


const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer/lib/react-pdf.browser').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

const ResumePdfRenderer = dynamic(
  () => import('@/components/client-components/resume-pdf-renderer').then(mod => mod.default),
  { ssr: false }
);

interface ResumePreviewProps {
  data: ResumeData;
}

export default function ResumePreview({ data }: ResumePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pdf = useMemo(() => generateResumePdf(data), [data]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setIsLoading(false);
    setNumPages(numPages);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(numPages || 1, prev + 1));
  };

  return (
    <div className="relative">
      <div className="space-y-4 bg-white shadow-lg rounded-lg overflow-hidden p-4">
        <div className="flex flex-col items-center">
          <div className="w-full">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Loading File</p>
              </div>
            )}
            <ResumePdfRenderer
              pdf={pdf}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
              currentPage={currentPage}
            />
          </div>

          <div className="w-full flex items-center justify-between mt-4 px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {numPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage >= (numPages || 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <PDFDownloadLink
              document={pdf}
              fileName={`${data.personalInfo.firstName}_${data.personalInfo.lastName}_Resume.pdf`}
              className="flex items-center gap-2"
            >
              {({ loading }) => (
                <Button
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {loading ? 'Generating PDF...' : 'Export PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>
    </div>
  );
}
