/**
 * @vitest-environment node
 */
import { asSchema } from "ai"
import { describe, expect, it } from "vitest"
import {
  resumeEditorModifyInputSchema,
  resumeEditorModifyOutputSchema
} from "@/lib/agent/tools"

describe("resume chat tool schemas", () => {
  it("exposes resumeEditorModify as a root JSON object schema", () => {
    expect(asSchema(resumeEditorModifyInputSchema).jsonSchema).toMatchObject({
      type: "object"
    })
  })

  it("keeps operation-specific validation for resumeEditorModify inputs", () => {
    expect(
      resumeEditorModifyInputSchema.safeParse({
        operation: "rewrite",
        entity: "education",
        id: "entry-1",
        field: "content",
        value: "Updated content"
      }).success
    ).toBe(true)

    expect(
      resumeEditorModifyInputSchema.safeParse({
        operation: "rewrite",
        entity: "education",
        id: "entry-1",
        value: "Updated content"
      }).success
    ).toBe(false)

    expect(
      resumeEditorModifyInputSchema.safeParse({
        operation: "delete",
        entity: "personalInfo",
        id: "pi-1"
      }).success
    ).toBe(false)
  })

  it("preserves canonical project date ranges in resumeEditorModify outputs", () => {
    const result = resumeEditorModifyOutputSchema.safeParse({
      operation: "add",
      entity: "projects",
      newEntry: {
        entryId: "project-1",
        title: "Compiler Notes",
        role: "Maintainer",
        content: "Built a tiny compiler.",
        date: {
          start: "2024-01",
          end: "2024-06",
          isCurrent: false
        }
      }
    })

    expect(result.success).toBe(true)
    if (!result.success || result.data.operation !== "add") {
      throw new Error("Expected project output schema to parse")
    }
    expect(result.data.newEntry).toMatchObject({
      date: {
        start: "2024-01",
        end: "2024-06",
        isCurrent: false
      }
    })
  })

  it("preserves canonical research date ranges in resumeEditorModify outputs", () => {
    const result = resumeEditorModifyOutputSchema.safeParse({
      operation: "add",
      entity: "research",
      newEntry: {
        entryId: "research-1",
        title: "Distributed Systems Lab",
        role: "Research Assistant",
        content: "Studied consensus protocols.",
        date: {
          start: "2023-09",
          end: "",
          isCurrent: true
        }
      }
    })

    expect(result.success).toBe(true)
    if (!result.success || result.data.operation !== "add") {
      throw new Error("Expected research output schema to parse")
    }
    expect(result.data.newEntry).toMatchObject({
      date: {
        start: "2023-09",
        end: "",
        isCurrent: true
      }
    })
  })
})
