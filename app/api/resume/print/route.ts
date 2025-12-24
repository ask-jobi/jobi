import "server-only";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import {cookies, headers} from "next/headers";
import {NextRequest} from "next/server";

export const runtime = "nodejs";

const isVercel = !!process.env.VERCEL;
export async function launchBrowser() {
  if (!isVercel) {
    const puppeteerLocal = await import("puppeteer");
    return puppeteerLocal.launch({
      headless: true,
    });
  }

  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
  });
}

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url)
  const resumeId = searchParams.get('id')

  if (!resumeId) {
    return new Response("Missing resume id", { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const targetUrl = `${baseUrl}/resume-print/${resumeId}`;

  try {
    const browser = await launchBrowser()

    const domain = (await headers()).get("host")?.split(":")[0];
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll()
    await browser.setCookie(...allCookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: domain ?? "localhost",
      path: "/"
    })))

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle0" });

    await page.evaluateHandle("document.fonts.ready");
    await page.waitForSelector('[data-resume-ready]', {
      timeout: 10_000,
    })

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
    });

    await browser.close();
    // TODO 简历的打印的文件名需要调整？
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"'
      },
    });
  } catch (err) {
    console.error("print resume failed: ", err);
    return new Response(null, { status: 204 })
  }
}
