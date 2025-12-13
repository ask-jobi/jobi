import "server-only"
import { PDFParse } from "pdf-parse";
import { Document } from "@langchain/core/documents";

type LoadPdfOptions = {
  splitPages?: boolean;
};

export async function loadPdfToDoc(
  file: File | Blob,
  options: LoadPdfOptions = { splitPages: false }
): Promise<Document[]> {
  // RSC 中：File / Blob → Buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  const pdf = new PDFParse({data: buffer})

  const data = await pdf.getText()

  await pdf.destroy()

  const docs = data.pages.map(it => {
    return new Document({
      pageContent: it.text,
      metadata: {
        totalPages: data.total,
        currentPage: it.num
      },
    })
  })

  if (options.splitPages) {
    return docs
  }

  return [
    new Document({
      pageContent: data.text,
      metadata: {
        totalPages: data.total
      },
    })
  ]
}
