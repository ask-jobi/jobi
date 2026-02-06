## MODIFIED Requirements

### Requirement: Resume Editor Tool
The system SHALL provide a comprehensive tool for AI to edit resume blocks and sections, supporting field modification, block deletion, block addition, block reordering, and section reordering.

#### Scenario: Rewrite block field

- **WHEN** AI calls the tool with operation="rewrite" and specifies entity, id, field, reason, and value
- **THEN** the specified field in the block is updated
- **AND** the original value is returned for potential revert
- **AND** the output language matches the resume language

#### Scenario: Delete a block

- **WHEN** AI calls the tool with operation="delete" and specifies entity and id
- **THEN** the specified block is removed from the section
- **AND** the removed block data is returned for potential revert

#### Scenario: Add a new block

- **WHEN** AI calls the tool with operation="add" and specifies entity and block data
- **THEN** a new block is created in the specified section
- **AND** the new block is assigned a unique ID
- **AND** the new block is added to the end of the section

#### Scenario: Reorder blocks within a section

- **WHEN** AI calls the tool with operation="reorderBlocks" and specifies entity and orderedIds
- **THEN** blocks in the specified section are reordered to match the orderedIds array
- **AND** the original order is preserved for potential revert

#### Scenario: Reorder sections

- **WHEN** AI calls the tool with operation="reorderSections" and specifies orderedSectionIds
- **THEN** the sectionOrder array in the resume is updated
- **AND** sections are reordered to match the orderedSectionIds array
- **AND** personalInfo remains fixed at the first position
- **AND** the original order is preserved for potential revert

### Requirement: Tool Registration
The system SHALL register the resumeEditor tool in the chat API route.

#### Scenario: Resume chat API provides resumeEditor tool

- **WHEN** user starts a resume chat session
- **THEN** the API provides the resumeEditor tool to the AI model
- **AND** the tool can access the current resume data
