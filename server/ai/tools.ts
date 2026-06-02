import "server-only"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

export interface Document {
  pageContent: string
  metadata: {
    totalPages: number
    currentPage?: number
  }
}

type LoadPdfOptions = {
  splitPages?: boolean
}

type PdfTextItem = {
  str: string
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof (item as { str: unknown }).str === "string"
  )
}

async function readPdfPages(data: Uint8Array) {
  const loadingTask = getDocument({
    data,
    useWorkerFetch: false,
    useSystemFonts: true
  })
  const pdf = await loadingTask.promise

  try {
    const pages: string[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const textContent = await page.getTextContent()
      const pageText = (textContent.items as unknown[])
        .filter(isPdfTextItem)
        .map((item) => item.str)
        .join(" ")
        .trim()

      pages.push(pageText)
    }

    return pages
  } finally {
    await pdf.cleanup()
  }
}

export async function loadPdfToDoc(
  file: File | Blob,
  options: LoadPdfOptions = { splitPages: false }
): Promise<Document[]> {
  const data = new Uint8Array(await file.arrayBuffer())
  const pages = await readPdfPages(data)
  const totalPages = pages.length

  const docs = pages.map((pageContent, index) => {
    return {
      pageContent,
      metadata: {
        totalPages,
        currentPage: index + 1
      }
    } as Document
  })

  if (options.splitPages) {
    return docs
  }

  return [
    {
      pageContent: pages.join("\n\n"),
      metadata: {
        totalPages
      }
    } as Document
  ]
}
