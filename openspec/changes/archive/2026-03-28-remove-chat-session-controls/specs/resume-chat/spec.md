## MODIFIED Requirements

### Requirement: Single Chat Session Per Resume

The system SHALL expose exactly one implicit chat session for each resume in the product experience, without rendering session-specific header controls in the resume chat panel.

#### Scenario: Opening chat resolves the canonical session

- **WHEN** the user opens chat for a resume
- **THEN** the system loads that resume's canonical chat session automatically
- **AND** the user does not need to select from multiple sessions

#### Scenario: Missing session is created implicitly

- **GIVEN** a resume does not yet have a chat session
- **WHEN** the user opens the chat experience or sends the first message
- **THEN** the system creates one canonical session automatically
- **AND** that session is used for all subsequent chat operations on the resume

#### Scenario: Users cannot create or switch sessions from the UI

- **WHEN** the user uses the resume chat panel
- **THEN** the UI does not display a session list
- **AND** the UI does not provide a control to create another session
- **AND** the active conversation remains the single canonical session for that resume

#### Scenario: Resume chat panel does not render session header controls

- **WHEN** the user opens the resume chat panel
- **THEN** the panel does not render a session title header
- **AND** the panel does not render a header loading indicator for session metadata
- **AND** the panel does not render a close or dismiss action that exists only within the removed chat session controls
