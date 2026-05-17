import { tool, ToolCallRepairFunction } from "ai"
import { z } from "zod"
import { nanoid } from "nanoid"

const EducationEntrySchema = z.object({
  entryId: z.string().default(() => nanoid()),
  content: z.string().default(""),
  school: z.string().default(""),
  degree: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default("")
})

const EmploymentEntrySchema = z.object({
  entryId: z.string().default(() => nanoid()),
  content: z.string().default(""),
  company: z.string().default(""),
  jobTitle: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default("")
})

const SkillEntrySchema = z.object({
  entryId: z.string().default(() => nanoid()),
  group: z.string().default(""),
  content: z.string().default("")
})

const ProjectEntrySchema = z.object({
  entryId: z.string().default(() => nanoid()),
  title: z.string().default(""),
  content: z.string().default(""),
  role: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional()
})

const ResearchEntrySchema = z.object({
  entryId: z.string().default(() => nanoid()),
  title: z.string().default(""),
  content: z.string().default(""),
  role: z.string().optional(),
  start: z.string().default(""),
  end: z.string().default("")
})

const PublicationEntrySchema = z.object({
  entryId: z.string().default(() => nanoid()),
  title: z.string().default(""),
  date: z.string().default(""),
  description: z.string().optional()
})

const AwardEntrySchema = z.object({
  entryId: z.string().default(() => nanoid()),
  title: z.string().default(""),
  issuer: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional()
})

const CertificationEntrySchema = z.object({
  entryId: z.string().default(() => nanoid()),
  name: z.string().default(""),
  issuer: z.string().optional(),
  date: z.string().optional()
})

const AnyEntrySchema = z.union([
  EducationEntrySchema,
  EmploymentEntrySchema,
  SkillEntrySchema,
  ProjectEntrySchema,
  ResearchEntrySchema,
  PublicationEntrySchema,
  AwardEntrySchema,
  CertificationEntrySchema
])

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

const SectionKeyEnum = z.enum([
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

export const resumeEditorModifyInputSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("rewrite"),
    entity: SectionKeyEnum,
    id: z.string().describe("The entry ID to be modified"),
    field: z.string().describe("The field name to be modified"),
    value: z.string().describe("The new value for the field")
  }),
  z.object({
    operation: z.literal("delete"),
    entity: SortableSectionKeyEnum,
    id: z.string().describe("The entry ID to be deleted")
  }),
  z.object({
    operation: z.literal("add"),
    entity: SortableSectionKeyEnum
  })
])

export const resumeEditorModifyOutputSchema = z.discriminatedUnion(
  "operation",
  [
    z.object({
      operation: z.literal("rewrite"),
      entity: SectionKeyEnum,
      id: z.string().describe("The entry ID to be modified"),
      field: z.string().describe("The field name to be modified"),
      value: z.string().describe("The new value for the field"),
      originalValue: z.any()
    }),
    z.object({
      operation: z.literal("delete"),
      entity: SortableSectionKeyEnum,
      id: z.string().describe("The entry ID to be deleted"),
      originalValue: AnyEntrySchema
    }),
    z.object({
      operation: z.literal("add"),
      entity: SortableSectionKeyEnum,
      newEntry: AnyEntrySchema
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

export const tools = {
  resumeEditorModify: tool({
    description:
      "Tool to modify resume entries: rewrite fields, delete entries, or add new entries. " +
      "Supports: " +
      "1) Rewrite entry fields - modify any field in an entry; " +
      "2) Delete an entry - remove an entry from a section; " +
      "3) Add a new entry - insert a new entry into a section. " +
      "The output language MUST remain consistent with the original resume language.",
    inputSchema: resumeEditorModifyInputSchema
  }),
  resumeEditorReorder: tool({
    description:
      "Tool to reorder resume entries and sections. " +
      "Supports: " +
      "1) Reorder entries - change order of entries within a section; " +
      "2) Reorder sections - change order of sections (personalInfo is always first). " +
      "The output language MUST remain consistent with the original resume language.",
    inputSchema: resumeEditorReorderInputSchema
  })
}

export const repairToolCall: ToolCallRepairFunction<typeof tools> = async ({
  toolCall,
  tools: _tools,
  error: _error
}) => {
  console.log("toolCall: ", toolCall)

  return toolCall
}
