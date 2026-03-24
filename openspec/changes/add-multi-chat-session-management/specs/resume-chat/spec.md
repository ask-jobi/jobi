## ADDED Requirements

### Requirement: Multiple Chat Sessions Per Resume

The system SHALL let a user manage multiple chat sessions for the same resume from the resume chat panel.

#### Scenario: User sees existing sessions for the current resume

- **GIVEN** a resume has multiple chat sessions
- **WHEN** the user opens the chat panel for that resume
- **THEN** the UI shows the available sessions in the session management area
- **AND** the user can switch the active conversation to a selected session

#### Scenario: User creates a new session

- **GIVEN** the user is viewing the chat panel for a resume
- **WHEN** the user creates a new chat session from the session management area
- **THEN** the system creates a separate empty session for that same resume
- **AND** the new session becomes the active session
- **AND** existing sessions remain available for later switching

### Requirement: Session Title Auto-Generation From First User Message

The system SHALL generate a chat session title from the first user message instead of requiring a manual title at session creation time.

#### Scenario: First user message names the session

- **GIVEN** a session is newly created and still has no meaningful title
- **WHEN** the first user message is saved with text content
- **THEN** the system derives the session title from that first user message
- **AND** the title is normalized and truncated to the supported title length

#### Scenario: Existing titled sessions are not renamed

- **GIVEN** a session already has a meaningful non-placeholder title
- **WHEN** additional user messages are saved
- **THEN** the existing session title remains unchanged

#### Scenario: Placeholder title remains until usable text exists

- **GIVEN** a new session has not yet received a usable text message
- **WHEN** the system cannot derive text for the title
- **THEN** the session keeps its placeholder title
- **AND** the system retries title generation when a later usable user message is saved

### Requirement: Chat Panel Uses Session Controls Instead Of Static Header Copy

The system SHALL use the current right-panel chat header area for session management controls instead of rendering a fixed title and subtitle.

#### Scenario: Static chat title is removed

- **WHEN** the user opens the resume chat panel
- **THEN** the UI does not display a fixed localized chat title or subtitle above the conversation
- **AND** the header area is reserved for session management controls and dismiss actions

## MODIFIED Requirements

### Requirement: Truncated Message Filtering

The system SHALL automatically filter out truncated messages from UI and API responses for the active session only.

#### Scenario: Truncated messages hidden in selected session UI

- **GIVEN** a user switches to a specific chat session
- **WHEN** the chat UI renders the message list for that session
- **THEN** truncated messages from that selected session are not displayed
- **AND** messages from other sessions are never mixed into the active conversation

#### Scenario: Truncated messages excluded from history load

- **GIVEN** a conversation with some truncated messages in the database
- **WHEN** loading chat history for the active session
- **THEN** the query filters by `truncated=false`
- **AND** truncated messages are not returned in the results
- **AND** RLS policy enforces this filtering at database level

#### Scenario: Re-open page shows no truncated messages

- **GIVEN** user previously truncated a conversation in one session
- **WHEN** user refreshes or reopens the page and selects that session again
- **THEN** truncated messages are not displayed
- **AND** the conversation appears as it did before truncation
- **AND** token statistics are preserved in the database

#### Scenario: has_tools used for efficient queries

- **GIVEN** a conversation with many messages
- **WHEN** truncating at a message within the active session
- **THEN** the system queries only messages where `has_tools=true`
- **AND** the query uses the filtered index for performance
