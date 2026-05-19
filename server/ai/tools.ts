import "server-only"
import "pdf-parse/worker"
import { PDFParse } from "pdf-parse"

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

export async function loadPdfToDoc(
  file: File | Blob,
  options: LoadPdfOptions = { splitPages: false }
): Promise<Document[]> {
  // RSC 中：File / Blob → Buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  const pdf = new PDFParse({ data: buffer })

  const data = await pdf.getText()

  await pdf.destroy()

  const docs = data.pages.map((it) => {
    return {
      pageContent: it.text,
      metadata: {
        totalPages: data.total,
        currentPage: it.num
      }
    } as Document
  })

  if (options.splitPages) {
    return docs
  }

  return [
    {
      pageContent: data.text,
      metadata: {
        totalPages: data.total
      }
    } as Document
  ]
}
