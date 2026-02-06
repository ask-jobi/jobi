# ResumeEditorReorder Tool Specification

## ADDED Requirements

### Requirement: resumeEditorReorder tool SHALL support reorderBlocks operation

The resumeEditorReorder tool SHALL allow AI to reorder blocks within a section.

#### Scenario: AI reorders blocks within a section

Given AI needs to change the order of blocks in a section
When AI calls `resumeEditorReorder` with `operation: "reorderBlocks"`
Then the tool MUST return the new order and original order for undo

### Requirement: resumeEditorReorder tool SHALL support reorderSections operation

The resumeEditorReorder tool SHALL allow AI to reorder sections in the resume.

#### Scenario: AI reorders sections

Given AI needs to change the order of resume sections
When AI calls `resumeEditorReorder` with `operation: "reorderSections"`
Then the tool MUST return the new section order and original order for undo
