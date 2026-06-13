import { z } from "zod"
import { nanoid } from "nanoid"

// ── Entry Schemas ────────────────────────────────────────────────────────

export const EducationEntrySchema = z
  .object({
    entryId: z.string().default(() => nanoid()),
    content: z.string().default(""),
    school: z.string().default(""),
    degree: z.string().default(""),
    start: z.string().optional(),
    end: z.string().optional()
  })
  .strict()

export const EmploymentEntrySchema = z
  .object({
    entryId: z.string().default(() => nanoid()),
    content: z.string().default(""),
    company: z.string().default(""),
    jobTitle: z.string().default(""),
    start: z.string().optional(),
    end: z.string().optional()
  })
  .strict()

export const SkillEntrySchema = z
  .object({
    entryId: z.string().default(() => nanoid()),
    group: z.string().default(""),
    content: z.string().default("")
  })
  .strict()

export const ProjectEntrySchema = z
  .object({
    entryId: z.string().default(() => nanoid()),
    title: z.string().default(""),
    content: z.string().default(""),
    role: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional()
  })
  .strict()

export const ResearchEntrySchema = z
  .object({
    entryId: z.string().default(() => nanoid()),
    title: z.string().default(""),
    content: z.string().default(""),
    role: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional()
  })
  .strict()

export const PublicationEntrySchema = z
  .object({
    entryId: z.string().default(() => nanoid()),
    title: z.string().default(""),
    date: z.string().default(""),
    description: z.string().optional()
  })
  .strict()

export const AwardEntrySchema = z
  .object({
    entryId: z.string().default(() => nanoid()),
    title: z.string().default(""),
    issuer: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional()
  })
  .strict()

export const CertificationEntrySchema = z
  .object({
    entryId: z.string().default(() => nanoid()),
    name: z.string().default(""),
    issuer: z.string().optional(),
    date: z.string().optional()
  })
  .strict()

export const AnyEntrySchema = z.union([
  EducationEntrySchema,
  EmploymentEntrySchema,
  SkillEntrySchema,
  ProjectEntrySchema,
  ResearchEntrySchema,
  PublicationEntrySchema,
  AwardEntrySchema,
  CertificationEntrySchema
])

// ── Section Enums ─────────────────────────────────────────────────────────

export const SectionKeyEnum = z.enum([
  "personalInfo",
  "education",
  "employment",
  "research",
  "projects",
  "publications",
  "awards",
  "certifications",
  "skills"
])

export const SortableSectionKeyEnum = z.enum([
  "education",
  "employment",
  "research",
  "projects",
  "publications",
  "awards",
  "certifications",
  "skills"
])

// ── Entry Schema Lookup ───────────────────────────────────────────────────

export const getEntrySchema = (entity: string) => {
  switch (entity) {
    case "education":
      return EducationEntrySchema
    case "employment":
      return EmploymentEntrySchema
    case "skills":
      return SkillEntrySchema
    case "projects":
      return ProjectEntrySchema
    case "research":
      return ResearchEntrySchema
    case "publications":
      return PublicationEntrySchema
    case "awards":
      return AwardEntrySchema
    case "certifications":
      return CertificationEntrySchema
  }
}

// ── Tool Input / Output Schemas ───────────────────────────────────────────

export const resumeEditorModifyInputSchema = z
  .object({
    operation: z
      .enum(["rewrite", "delete", "add"])
      .describe("Operation type: rewrite, delete, or add"),
    entity: SectionKeyEnum,
    id: z
      .string()
      .describe("The entry ID to be modified or deleted")
      .optional(),
    field: z.string().describe("The field name to be modified").optional(),
    value: z.string().describe("The new value for the field").optional()
  })
  .superRefine((input, ctx) => {
    if (input.operation === "rewrite") {
      if (!input.id) {
        ctx.addIssue({
          code: "custom",
          path: ["id"],
          message: "id is required for rewrite operations"
        })
      }

      if (!input.field) {
        ctx.addIssue({
          code: "custom",
          path: ["field"],
          message: "field is required for rewrite operations"
        })
      }

      if (input.value === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: "value is required for rewrite operations"
        })
      }

      return
    }

    if (input.entity === "personalInfo") {
      ctx.addIssue({
        code: "custom",
        path: ["entity"],
        message: "personalInfo only supports rewrite operations"
      })
    }

    if (input.operation === "delete" && !input.id) {
      ctx.addIssue({
        code: "custom",
        path: ["id"],
        message: "id is required for delete operations"
      })
    }
  })

export const resumeEditorModifyOutputSchema = z.discriminatedUnion(
  "operation",
  [
    z.object({
      operation: z.literal("rewrite"),
      entity: SectionKeyEnum,
      id: z.string().describe("The entry ID to be modified"),
      field: z.string().describe("The field name to be modified"),
      value: z.any().describe("The new value for the field"),
      originalValue: z.any()
    }),
    z.object({
      operation: z.literal("delete"),
      entity: SortableSectionKeyEnum,
      id: z.string().describe("The entry ID to be deleted"),
      originalValue: AnyEntrySchema,
      originalIndex: z.number().int().nonnegative().optional(),
      originalSectionOrder: z.array(SortableSectionKeyEnum).optional()
    }),
    z.object({
      operation: z.literal("add"),
      entity: SortableSectionKeyEnum,
      newEntry: AnyEntrySchema,
      createdSection: z.boolean().optional(),
      sectionDidNotExistBefore: z.boolean().optional()
    })
  ]
)

export const resumeEditorReorderInputSchema = z.object({
  operation: z
    .enum(["reorderEntries", "reorderSections"])
    .describe("Operation type: reorderEntries or reorderSections"),
  entity: SortableSectionKeyEnum.nullable().describe(
    "Section entity for reordering entries"
  ),
  orderedEntryIds: z
    .array(z.string())
    .describe("Array of entry IDs in desired order (for reorderEntries)")
    .optional(),
  orderedSectionIds: z
    .array(SortableSectionKeyEnum)
    .describe("Array of section IDs in desired order (for reorderSections)")
    .optional()
})

export const resumeEditorReorderOutputSchema = z.object({
  operation: z
    .enum(["reorderEntries", "reorderSections"])
    .describe("Operation type: reorderEntries or reorderSections"),
  entity: SortableSectionKeyEnum.nullable().describe(
    "Section entity for reordering entries"
  ),
  orderedEntryIds: z
    .array(z.string())
    .describe("Array of entry IDs in desired order (for reorderEntries)")
    .optional(),
  orderedSectionIds: z
    .array(SortableSectionKeyEnum)
    .describe("Array of section IDs in desired order (for reorderSections)")
    .optional(),
  originalValue: z
    .union([z.array(z.string()), z.array(SortableSectionKeyEnum)])
    .describe("Original order before reordering")
})

// ── Tool Input Examples ───────────────────────────────────────────────────

export const resumeEditorModifyInputExamples = [
  {
    input: {
      operation: "rewrite",
      entity: "employment",
      id: "entry-id",
      field: "content",
      value: "Improved bullet content tailored to the target job."
    }
  },
  {
    input: {
      operation: "rewrite",
      entity: "personalInfo",
      id: "personal-info-id",
      field: "firstName",
      value: "Ada"
    }
  },
  {
    input: {
      operation: "rewrite",
      entity: "projects",
      id: "entry-id",
      field: "end",
      value: "Present"
    }
  },
  {
    input: {
      operation: "delete",
      entity: "projects",
      id: "entry-id"
    }
  },
  {
    input: {
      operation: "add",
      entity: "projects"
    }
  }
] satisfies Array<{ input: z.infer<typeof resumeEditorModifyInputSchema> }>

export const resumeEditorReorderInputExamples = [
  {
    input: {
      operation: "reorderEntries",
      entity: "employment",
      orderedEntryIds: ["entry-id-2", "entry-id-1"]
    }
  },
  {
    input: {
      operation: "reorderSections",
      entity: null,
      orderedSectionIds: ["employment", "projects", "education", "skills"]
    }
  }
] satisfies Array<{ input: z.infer<typeof resumeEditorReorderInputSchema> }>

// ── Chat Event Data Schemas ───────────────────────────────────────────────
// Validated in server/chat-events.ts before writing to chat_events.event_data

export const toolCallEventDataSchema = z.object({
  toolCallId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
  baseVersion: z.number().optional()
})

export const toolResultEventDataSchema = z.object({
  toolCallId: z.string(),
  toolName: z.string(),
  output: z.unknown(),
  snapshotId: z.string(),
  baseVersion: z.number(),
  nextVersion: z.number()
})

export const toolFailedEventDataSchema = z.object({
  toolCallId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
  baseVersion: z.number(),
  error: z.string()
})

export const summaryCheckpointEventDataSchema = z.object({
  summary_text: z.string()
})

export const rollbackEventDataSchema = z.object({})
