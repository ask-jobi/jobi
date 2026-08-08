import "server-only"

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

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs")

class DOMMatrixPolyfill {
  a = 1
  b = 0
  c = 0
  d = 1
  e = 0
  f = 0

  constructor(values?: ArrayLike<number>) {
    if (!values) return
    ;[this.a, this.b, this.c, this.d, this.e, this.f] = [
      values[0] ?? 1,
      values[1] ?? 0,
      values[2] ?? 0,
      values[3] ?? 1,
      values[4] ?? 0,
      values[5] ?? 0
    ]
  }

  scaleSelf(scaleX = 1, scaleY = scaleX) {
    this.a *= scaleX
    this.b *= scaleX
    this.c *= scaleY
    this.d *= scaleY
    return this
  }

  translateSelf(tx = 0, ty = 0) {
    this.e += tx
    this.f += ty
    return this
  }
}

let pdfJsModulePromise: Promise<PdfJsModule> | undefined

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsModulePromise) {
    if (typeof globalThis.DOMMatrix === "undefined") {
      Object.defineProperty(globalThis, "DOMMatrix", {
        configurable: true,
        value: DOMMatrixPolyfill
      })
    }

    pdfJsModulePromise = (async () => {
      // Register the bundled worker before loading pdf.js. This makes pdf.js use
      // its in-process worker, which is compatible with Cloudflare Workers.
      await import("pdfjs-dist/legacy/build/pdf.worker.mjs")
      return import("pdfjs-dist/legacy/build/pdf.mjs")
    })()
  }

  return pdfJsModulePromise
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
  const { getDocument } = await loadPdfJs()
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
