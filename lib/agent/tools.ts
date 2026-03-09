import { tool, ToolCallRepairFunction } from "ai"
import { z } from "zod"
import { nanoid } from "nanoid"

const EducationBlockSchema = z.object({
  blockId: z.string().default(() => nanoid()),
  content: z.string().default(""),
  school: z.string().default(""),
  degree: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default("")
})

const EmploymentBlockSchema = z.object({
  blockId: z.string().default(() => nanoid()),
  content: z.string().default(""),
  company: z.string().default(""),
  jobTitle: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default("")
})

const SkillBlockSchema = z.object({
  blockId: z.string().default(() => nanoid()),
  group: z.string().default(""),
  content: z.string().default("")
})

const ProjectBlockSchema = z.object({
  blockId: z.string().default(() => nanoid()),
  title: z.string().default(""),
  content: z.string().default(""),
  role: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional()
})

const ResearchBlockSchema = z.object({
  blockId: z.string().default(() => nanoid()),
  title: z.string().default(""),
  content: z.string().default(""),
  role: z.string().optional(),
  start: z.string().default(""),
  end: z.string().default("")
})

const PublicationBlockSchema = z.object({
  blockId: z.string().default(() => nanoid()),
  title: z.string().default(""),
  date: z.string().default(""),
  description: z.string().optional()
})

const AwardBlockSchema = z.object({
  blockId: z.string().default(() => nanoid()),
  title: z.string().default(""),
  issuer: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional()
})

const CertificationBlockSchema = z.object({
  blockId: z.string().default(() => nanoid()),
  name: z.string().default(""),
  issuer: z.string().optional(),
  date: z.string().optional()
})

const AnyBlockSchema = z.union([
  EducationBlockSchema,
  EmploymentBlockSchema,
  SkillBlockSchema,
  ProjectBlockSchema,
  ResearchBlockSchema,
  PublicationBlockSchema,
  AwardBlockSchema,
  CertificationBlockSchema
])

export const getBlockSchema = (entity: string) => {
  switch (entity) {
    case "education":
      return EducationBlockSchema
    case "employment":
      return EmploymentBlockSchema
    case "skills":
      return SkillBlockSchema
    case "projects":
      return ProjectBlockSchema
    case "research":
      return ResearchBlockSchema
    case "publications":
      return PublicationBlockSchema
    case "awards":
      return AwardBlockSchema
    case "certifications":
      return CertificationBlockSchema
  }
}

const BlockTypeEnum = z.enum([
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

export const BlockTypeWithoutPersonalInfoEnum = z.enum([
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
    entity: BlockTypeEnum,
    id: z.string().describe("The block ID to be modified"),
    field: z.string().describe("The field name to be modified"),
    value: z.string().describe("The new value for the field")
  }),
  z.object({
    operation: z.literal("delete"),
    entity: BlockTypeWithoutPersonalInfoEnum,
    id: z.string().describe("The block ID to be deleted")
  }),
  z.object({
    operation: z.literal("add"),
    entity: BlockTypeWithoutPersonalInfoEnum
  })
])

export const resumeEditorModifyOutputSchema = z.discriminatedUnion(
  "operation",
  [
    z.object({
      operation: z.literal("rewrite"),
      entity: BlockTypeEnum,
      id: z.string().describe("The block ID to be modified"),
      field: z.string().describe("The field name to be modified"),
      value: z.string().describe("The new value for the field"),
      originalValue: z.any()
    }),
    z.object({
      operation: z.literal("delete"),
      entity: BlockTypeWithoutPersonalInfoEnum,
      id: z.string().describe("The block ID to be deleted"),
      originalValue: AnyBlockSchema
    }),
    z.object({
      operation: z.literal("add"),
      entity: BlockTypeWithoutPersonalInfoEnum,
      newBlock: AnyBlockSchema
    })
  ]
)

export const resumeEditorReorderInputSchema = z.object({
  operation: z
    .enum(["reorderBlocks", "reorderSections"])
    .describe("Operation type: reorderBlocks or reorderSections"),
  entity: BlockTypeWithoutPersonalInfoEnum.nullable().describe(
    "Section entity for reordering blocks"
  ),
  orderedBlockIds: z
    .array(z.string())
    .describe("Array of block IDs in desired order (for reorderBlocks)")
    .optional(),
  orderedSectionIds: z
    .array(BlockTypeWithoutPersonalInfoEnum)
    .describe("Array of section IDs in desired order (for reorderSections)")
    .optional()
})

export const resumeEditorReorderOutputSchema = z.object({
  operation: z
    .enum(["reorderBlocks", "reorderSections"])
    .describe("Operation type: reorderBlocks or reorderSections"),
  entity: BlockTypeWithoutPersonalInfoEnum.nullable().describe(
    "Section entity for reordering blocks"
  ),
  orderedBlockIds: z
    .array(z.string())
    .describe("Array of block IDs in desired order (for reorderBlocks)")
    .optional(),
  orderedSectionIds: z
    .array(BlockTypeWithoutPersonalInfoEnum)
    .describe("Array of section IDs in desired order (for reorderSections)")
    .optional(),
  originalValue: z
    .union([z.array(z.string()), z.array(BlockTypeWithoutPersonalInfoEnum)])
    .describe("Original order before reordering")
})

export const tools = {
  resumeEditorModify: tool({
    description:
      "Tool to modify resume blocks: rewrite fields, delete blocks, or add new blocks. " +
      "Supports: " +
      "1) Rewrite block fields - modify any field in a block; " +
      "2) Delete a block - remove a block from a section; " +
      "3) Add a new block - insert a new block into a section. " +
      "The output language MUST remain consistent with the original resume language.",
    inputSchema: resumeEditorModifyInputSchema
  }),
  resumeEditorReorder: tool({
    description:
      "Tool to reorder resume blocks and sections. " +
      "Supports: " +
      "1) Reorder blocks - change order of blocks within a section; " +
      "2) Reorder sections - change order of sections (personalInfo is always first). " +
      "The output language MUST remain consistent with the original resume language.",
    inputSchema: resumeEditorReorderInputSchema
  })
}

export const repairToolCall: ToolCallRepairFunction<typeof tools> = async ({
  toolCall,
  tools,
  error
}) => {
  console.log("toolCall: ", toolCall)

  return toolCall
}
