/**
 * @vitest-environment node
 */
import { asSchema } from "ai"
import { describe, expect, it } from "vitest"
import { resumeEditorModifyInputSchema } from "@/lib/agent/tools"

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
})
