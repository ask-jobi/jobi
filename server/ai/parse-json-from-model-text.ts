import "server-only"

export function parseJsonFromModelText(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error("Empty model response")
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced) {
      return JSON.parse(fenced[1].trim())
    }

    const start = trimmed.indexOf("{")
    const end = trimmed.lastIndexOf("}")
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }

    throw new Error("Could not parse JSON from model response")
  }
}
