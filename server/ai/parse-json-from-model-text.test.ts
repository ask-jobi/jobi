/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest"
import { parseJsonFromModelText } from "./parse-json-from-model-text"

describe("parseJsonFromModelText", () => {
  it("parses raw JSON", () => {
    expect(parseJsonFromModelText('{"a":1}')).toEqual({ a: 1 })
  })

  it("parses fenced JSON", () => {
    expect(parseJsonFromModelText('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it("parses JSON embedded in prose", () => {
    expect(
      parseJsonFromModelText('Here is the result:\n{"a":1}\nThanks.')
    ).toEqual({ a: 1 })
  })

  it("throws on empty text", () => {
    expect(() => parseJsonFromModelText("   ")).toThrow("Empty model response")
  })
})
