import { NextRequest } from "next/server"
import { ResumeData } from "@/types/resume"
import { Locale } from "@/lib/i18n/config"
import {
  getResumeThumbnailSections,
  type ThumbnailEntrySummary
} from "@/lib/resume-thumbnail"
import { requireVerifiedUserIdentity } from "@/server/auth-helper"
import { getResumeThumbnailData } from "@/server/data/applications"

const THUMBNAIL_WIDTH = 600
const THUMBNAIL_HEIGHT = 824
const PAGE_PADDING = 32
const CONTENT_WIDTH = THUMBNAIL_WIDTH - PAGE_PADDING * 2

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function normalizeText(value?: string) {
  return (value ?? "").replace(/\s+/g, " ").trim()
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

function renderText({
  value,
  x,
  y,
  size,
  weight = 400,
  color = "#4b5563",
  maxLength = 80,
  anchor = "start"
}: {
  value?: string
  x: number
  y: number
  size: number
  weight?: number
  color?: string
  maxLength?: number
  anchor?: "start" | "end"
}) {
  const text = truncateText(normalizeText(value), maxLength)

  if (!text) {
    return ""
  }

  return `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escapeXml(text)}</text>`
}

function renderTag(value: string, x: number, y: number) {
  const text = truncateText(normalizeText(value), 22)

  if (!text) {
    return { svg: "", width: 0 }
  }

  const width = Math.min(150, text.length * 6 + 18)
  const svg = [
    `<rect x="${x}" y="${y - 13}" width="${width}" height="18" rx="9" fill="#f3f4f6" />`,
    renderText({
      value: text,
      x: x + 9,
      y,
      size: 10,
      color: "#4b5563",
      maxLength: 22
    })
  ].join("")

  return { svg, width }
}

function renderEntry(entry: ThumbnailEntrySummary, y: number) {
  const elements: string[] = []
  elements.push(
    renderText({
      value: entry.heading,
      x: PAGE_PADDING,
      y,
      size: 14,
      weight: 700,
      color: "#111827",
      maxLength: 44
    })
  )

  if (entry.meta) {
    elements.push(
      renderText({
        value: entry.meta,
        x: THUMBNAIL_WIDTH - PAGE_PADDING,
        y,
        size: 11,
        color: "#6b7280",
        maxLength: 24,
        anchor: "end"
      })
    )
  }

  let nextY = y + 18

  if (entry.subheading) {
    elements.push(
      renderText({
        value: entry.subheading,
        x: PAGE_PADDING,
        y: nextY,
        size: 12,
        color: "#6b7280",
        maxLength: 62
      })
    )
    nextY += 18
  }

  if (entry.tags && entry.tags.length > 0) {
    let tagX = PAGE_PADDING
    const tagY = nextY

    for (const tag of entry.tags.slice(0, 6)) {
      const renderedTag = renderTag(tag, tagX, tagY)
      if (!renderedTag.svg) {
        continue
      }
      if (tagX + renderedTag.width > PAGE_PADDING + CONTENT_WIDTH) {
        break
      }
      elements.push(renderedTag.svg)
      tagX += renderedTag.width + 6
    }

    nextY += 24
  }

  return { svg: elements.join(""), nextY: nextY + 8 }
}

function renderResumeThumbnailSvg(resumeData: ResumeData, language: Locale) {
  const sections = getResumeThumbnailSections(resumeData, language)
  const personalInfo = resumeData.personalInfo
  const elements: string[] = [
    `<rect width="100%" height="100%" fill="#ffffff" />`,
    `<rect x="0" y="0" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" fill="none" stroke="#e5e7eb" />`
  ]
  let y = 58

  elements.push(
    renderText({
      value: `${personalInfo.firstName} ${personalInfo.lastName}`,
      x: PAGE_PADDING,
      y,
      size: 26,
      weight: 700,
      color: "#111827",
      maxLength: 36
    })
  )
  y += 28

  elements.push(
    renderText({
      value: personalInfo.email,
      x: PAGE_PADDING,
      y,
      size: 12,
      color: "#6b7280",
      maxLength: 52
    })
  )
  y += 18

  elements.push(
    renderText({
      value: personalInfo.phone,
      x: PAGE_PADDING,
      y,
      size: 12,
      color: "#6b7280",
      maxLength: 32
    })
  )
  y += 34

  for (const section of sections) {
    if (y > THUMBNAIL_HEIGHT - 56) {
      break
    }

    elements.push(
      renderText({
        value: section.title,
        x: PAGE_PADDING,
        y,
        size: 16,
        weight: 700,
        color: "#111827",
        maxLength: 42
      }),
      `<line x1="${PAGE_PADDING}" y1="${y + 8}" x2="${THUMBNAIL_WIDTH - PAGE_PADDING}" y2="${y + 8}" stroke="#e5e7eb" stroke-width="2" />`
    )
    y += 30

    for (const entry of section.entries.slice(0, 3)) {
      if (y > THUMBNAIL_HEIGHT - 44) {
        break
      }
      const renderedEntry = renderEntry(entry, y)
      elements.push(renderedEntry.svg)
      y = renderedEntry.nextY
    }

    y += 8
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" viewBox="0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}" role="img" aria-label="Resume thumbnail">${elements.join("")}</svg>`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get("resume_id")

    if (!resumeId) {
      return new Response("Missing resume data", { status: 400 })
    }

    const user = await requireVerifiedUserIdentity()
    const resumeData = await getResumeThumbnailData(user.id, resumeId)

    if (!resumeData) {
      return new Response("Resume not found", { status: 404 })
    }

    const parsedData: ResumeData = resumeData.resumeData
    const language = (resumeData.language as Locale) ?? "en"
    const svg = renderResumeThumbnailSvg(parsedData, language)

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "private, max-age=300"
      }
    })
  } catch (error) {
    console.error("Error generating thumbnail:", error)
    return new Response("Error generating thumbnail", { status: 500 })
  }
}
