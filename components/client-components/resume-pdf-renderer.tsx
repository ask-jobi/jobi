"use client"
import React, { useEffect } from 'react';
import { Page, Document, pdfjs } from 'react-pdf';
import { usePDF } from '@react-pdf/renderer';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();


function ResumePdfRenderer(props: any) {
  const [instance, updatePDF] = usePDF({document: props.pdf})

  useEffect(() => {
    updatePDF(props.pdf)
  }, [props.pdf])

  return (
    <Document
      file={instance.url}
      onLoadSuccess={props.onDocumentLoadSuccess}
      loading={
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
      error={
        <div className="flex items-center justify-center h-full">
          <p className="text-red-400">Failed to load PDF</p>
        </div>
      }
    >
      <Page
        pageNumber={props.currentPage}
        renderAnnotationLayer={false}
        renderTextLayer={false}
        scale={0.7}
        className="max-w-full max-h-full"
      />
    </Document>
  );
}

export default ResumePdfRenderer;
