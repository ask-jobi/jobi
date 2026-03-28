# resume-editor-modify Specification

## Purpose
TBD - created by archiving change split-resume-editor-tool. Update Purpose after archive.
## Requirements
### Requirement: resumeEditorModify tool SHALL support rewrite operation

The resumeEditorModify tool SHALL allow AI to rewrite fields of existing blocks in the resume.

#### Scenario: AI rewrites a block field

Given AI needs to update a resume block field
When AI calls `resumeEditorModify` with `operation: "rewrite"`
Then the tool MUST return the modified value with original value for undo

### Requirement: resumeEditorModify tool SHALL support delete operation

The resumeEditorModify tool SHALL allow AI to delete blocks from the resume.

#### Scenario: AI deletes a block

Given AI needs to remove a block from resume
When AI calls `resumeEditorModify` with `operation: "delete"`
Then the tool MUST return the deleted block data for undo

### Requirement: resumeEditorModify tool SHALL support add operation

The resumeEditorModify tool SHALL allow AI to add new blocks to the resume.

#### Scenario: AI adds a new block

Given AI needs to add a new block to resume
When AI calls `resumeEditorModify` with `operation: "add"`
Then the tool MUST return the new block with default values

