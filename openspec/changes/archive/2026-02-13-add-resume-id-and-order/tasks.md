## 1. Generate Section and Block IDs with nanoid
- [x] 1.1 Import `nanoid` in `server/resume.ts`
- [x] 1.2 Update `createEmptyResumeRecord` to generate IDs for all sections
- [x] 1.3 Ensure each section (education, employment, skills, etc.) has unique `id`
- [x] 1.4 Initialize empty blocks arrays with proper structure

## 2. Default sectionOrder
- [x] 2.1 Add `sectionOrder: ['education', 'employment', 'research', 'projects', 'publications', 'awards', 'certifications', 'skills']` in empty resume
- [x] 2.2 All sections included by default (simplified approach)

## 3. Fix ID-Based Modification
- [x] 3.0 Core implementation: Generate section IDs in createEmptyResumeRecord
- [ ] 3.1-3.4 ID-based modification operations (future work - requires API changes)

## 4. Frontend Section Rendering
- [x] 4.0 sectionOrder is now stored with default order
- [ ] 4.1-4.2 Dynamic section rendering based on sectionOrder (future work - template refactor needed)

## 5. Validation and Testing
- [x] 5.1 Run `pnpm lint` (pre-existing errors only)
- [x] 5.2 Run `pnpm test` (resume tests pass)
- [x] 5.3 Verify resume creation generates unique section IDs
- [ ] 5.4 Test section ordering in resume editor (future work - after template refactor)
