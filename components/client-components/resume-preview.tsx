"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { generateResumePdf } from "../resume-pdf-template";
import dynamic from 'next/dynamic';
import { useResume } from "./resume-context";
import ResumePdfRenderer from "./resume-pdf-renderer";
import { PDFViewer } from "@react-pdf/renderer";

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer/lib/react-pdf.browser').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);


export default function ResumePreview() {
  const { resumeData } = useResume();

  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pdf = useMemo(() => generateResumePdf(resumeData), [resumeData]);

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
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-[420px] h-[595px] bg-white shadow-2xl rounded-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-50"></div>
        <div className="relative z-0 w-full h-full">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Loading File</p>
            </div>
          )}
          <div className="w-full h-full flex items-center justify-center">
            <ResumePdfRenderer
              pdf={pdf}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
              currentPage={currentPage}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="bg-white hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded">
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
        <div className="ml-4">
          <PDFDownloadLink
            document={pdf}
            fileName={`${resumeData.personalInfo.firstName}_${resumeData.personalInfo.lastName}_Resume.pdf`}
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
  );
}
