import "server-only";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import {cookies, headers} from "next/headers";
import {NextRequest} from "next/server";

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url)
  const resumeId = searchParams.get('id')

  if (!resumeId) {
    return new Response("Missing resume id", { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const targetUrl = `${baseUrl}/resume-print/${resumeId}`;

  console.log("[print] launching browser");
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
  });
  console.log("[print] browser launched");

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
  await page.goto(targetUrl);

  await page.evaluateHandle("document.fonts.ready");

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
}
