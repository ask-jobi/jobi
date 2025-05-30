"use client"
import React, {useState} from 'react';
import { Page, Document, pdfjs } from 'react-pdf';
import {BlobProvider} from "@react-pdf/renderer/lib/react-pdf.browser";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function ResumePdfRenderer(props: any) {

  return (
    <BlobProvider document={props.pdf}>
      {
        (instance) => {
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
              />
            </Document>
          )
        }
      }
    </BlobProvider>
  );
}

export default ResumePdfRenderer;
