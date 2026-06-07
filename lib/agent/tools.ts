import { tool } from "ai"
import {
  resumeEditorModifyInputExamples,
  resumeEditorModifyInputSchema,
  resumeEditorModifyOutputSchema,
  resumeEditorReorderInputExamples,
  resumeEditorReorderInputSchema,
  resumeEditorReorderOutputSchema
} from "./schema"

export {
  // Entry schemas
  DateRangeSchema,
  EducationEntrySchema,
  EmploymentEntrySchema,
  SkillEntrySchema,
  ProjectEntrySchema,
  ResearchEntrySchema,
  PublicationEntrySchema,
  AwardEntrySchema,
  CertificationEntrySchema,
  AnyEntrySchema,
  // Section enums
  SectionKeyEnum,
  SortableSectionKeyEnum,
  // Entry lookup
  getEntrySchema,
  // Tool schemas
  resumeEditorModifyInputSchema,
  resumeEditorModifyOutputSchema,
  resumeEditorReorderInputSchema,
  resumeEditorReorderOutputSchema,
  // Input examples
  resumeEditorModifyInputExamples,
  resumeEditorReorderInputExamples
} from "./schema"

export const resumeEditorModifyToolDescription =
  "Tool to modify resume entries: rewrite fields, delete entries, or add new entries. " +
  "Supports: " +
  "1) Rewrite entry fields - modify any field in an entry; " +
  "2) Delete an entry - remove an entry from a section; " +
  "3) Add a new entry - insert a new entry into a section. " +
  "For education, employment, projects, and research dates, you may rewrite flat date fields " +
  "such as start, end, date.start, or date.end; the server stores them as canonical date ranges. " +
  "The output language MUST remain consistent with the original resume language."

export const resumeEditorReorderToolDescription =
  "Tool to reorder resume entries and sections. " +
  "Supports: " +
  "1) Reorder entries - change order of entries within a section; " +
  "2) Reorder sections - change order of sections (personalInfo is always first). " +
  "The output language MUST remain consistent with the original resume language."

export const tools = {
  resumeEditorModify: tool({
    description: resumeEditorModifyToolDescription,
    inputSchema: resumeEditorModifyInputSchema,
    outputSchema: resumeEditorModifyOutputSchema,
    strict: true,
    inputExamples: resumeEditorModifyInputExamples
  }),
  resumeEditorReorder: tool({
    description: resumeEditorReorderToolDescription,
    inputSchema: resumeEditorReorderInputSchema,
    outputSchema: resumeEditorReorderOutputSchema,
    strict: true,
    inputExamples: resumeEditorReorderInputExamples
  })
}
