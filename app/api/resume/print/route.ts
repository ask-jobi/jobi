import "server-only"
import puppeteer, { type BrowserWorker } from "@cloudflare/puppeteer"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

export const runtime = "nodejs"

type CloudflareBrowserEnv = {
  MYBROWSER?: BrowserWorker
}

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin
}

async function launchBrowser() {
  const { env } = getCloudflareContext()
  const browserBinding = (env as CloudflareBrowserEnv).MYBROWSER

  if (!browserBinding) {
    throw new Error(
      "Cloudflare Browser Run binding MYBROWSER is not configured"
    )
  }

  return puppeteer.launch(browserBinding)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const resumeId = searchParams.get("id")

  if (!resumeId) {
    return new Response("Missing resume id", { status: 400 })
  }

  const baseUrl = getBaseUrl(request)
  const targetUrl = `${baseUrl}/resume-print/${resumeId}`
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined

  try {
    browser = await launchBrowser()
    const page = await browser.newPage()

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    if (allCookies.length > 0) {
      await page.setCookie(
        ...allCookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          url: baseUrl,
          path: "/"
        }))
      )
    }

    await page.goto(targetUrl, { waitUntil: "networkidle0" })
    await page.evaluateHandle("document.fonts.ready")
    await page.waitForSelector("[data-resume-ready]", {
      timeout: 10_000
    })

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm"
      }
    })

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf"
      }
    })
  } catch (err) {
    console.error("export resume failed: ", err)
    return new Response("export resume failed", { status: 500 })
  } finally {
    await browser?.close()
  }
}
