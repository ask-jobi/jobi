# Change: Enhance Resume Block Tool

## Why
The current `rewriteBlockTool` only supports modifying individual fields within a block. Users need more comprehensive block-level operations to manage resume content through AI, including deleting blocks, adding new blocks, and reordering blocks/sections.

## What Changes
- Extend `rewriteBlockTool` to support:
  1. **Rewrite block fields** - Already implemented, modify any field in a block (e.g., content, school, company, etc.)
  2. **Delete a block** - Remove a specific block from a section
  3. **Add a new block** - Insert a new block into a specific section
  4. **Adjust block order** - Reorder blocks within a section
  5. **Adjust section order** - Reorder sections in the resume

- **BREAKING**: Rename tool from `rewriteBlockTool` to `resumeEditorTool` to reflect expanded capabilities

## Impact
- Affected specs: `resume-chat` (AI resume optimization)
- Affected code: `lib/agent/tools.ts`
