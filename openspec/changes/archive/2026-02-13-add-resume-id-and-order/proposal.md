# Change: Fix Resume Modification to Use Section and Block IDs

## Why

The ResumeData model now includes:
- `id` field in `PersonalInfo` and all `SectionBlock` types (education, employment, skills, etc.)
- `id` field in all block types (EducationBlock, EmploymentBlock, etc.)
- `sectionOrder` array defining the order of sections

Existing code needs to be fixed to:
- Use `nanoid` to generate IDs for sections and blocks when creating new resumes
- Modify resume operations should locate and modify data by section ID and block ID
- Provide default `sectionOrder` for new resumes

## What Changes

- Use `nanoid` to generate IDs for sections (EducationHistory, EmploymentHistory, etc.) and their blocks
- Update `createEmptyResumeRecord` to generate proper section and block IDs
- Modify resume operations to use section and block IDs for identification
- Ensure all new resumes have default `sectionOrder`
- Fix any code relying on index-based access to use ID-based access

## Impact

- Affected code:
  - `server/resume.ts` - createEmptyResumeRecord function
  - Frontend components modifying resume sections/blocks
  - Any code using index to access resume data
- Dependencies: `nanoid` is already installed (v5.1.6)
