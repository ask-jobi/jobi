## ADDED Requirements

### Requirement: Message Truncation

The system SHALL allow users to truncate the conversation at any user message, removing all subsequent messages and reverting their tool modifications.

#### Scenario: User clicks truncation button

- **WHEN** user clicks the truncation button on a user message
- **THEN** all messages from the selected message onward are marked as truncated
- **AND** all tool executions from truncated messages are reverted
- **AND** the selected message content is copied to the input box
- **AND** the user can edit and resend the message

#### Scenario: Truncation preserves token statistics

- **GIVEN** a conversation with 10 messages and 1000 total tokens
- **WHEN** user truncates at message 5
- **THEN** messages 5-10 remain in the database with truncated=true
- **AND** token statistics still reflect all 10 messages
- **AND** new messages continue from the same session

### Requirement: Truncation Button UI

The system SHALL display a truncation button on user messages.

#### Scenario: Button appears on user messages

- **WHEN** a message with role="user" is rendered
- **THEN** a truncation button (↩️) is displayed
- **AND** the button is labeled "回溯"

#### Scenario: Button does not appear on AI messages

- **WHEN** a message with role="assistant" is rendered
- **THEN** no truncation button is displayed

#### Scenario: Button disabled during streaming

- **WHEN** the chat is streaming a response
- **THEN** truncation buttons are disabled
- **AND** tooltips show "Wait for response before truncating"

### Requirement: Tool Execution Revert

The system SHALL revert all tool executions from truncated messages to ensure resume consistency.

#### Scenario: Revert multiple tool executions

- **GIVEN** a conversation where AI made 3 tool modifications in messages 3, 4, and 5
- **WHEN** user truncates at message 2
- **THEN** all 3 tool executions are reverted
- **AND** the resume returns to its state before message 3

#### Scenario: Revert preserves non-truncated executions

- **GIVEN** a conversation with tool executions in messages 1, 2, 3, 4, and 5
- **WHEN** user truncates at message 3
- **THEN** tool executions from messages 1, 2, and 3 remain applied
- **AND** tool executions from messages 4 and 5 are reverted

#### Scenario: Original values extracted from message parts

- **GIVEN** a message containing tool result parts with originalValue field
- **WHEN** truncation is triggered
- **THEN** the system parses the parts to extract originalValue
- **AND** resume fields are restored to the extracted originalValue
- **AND** no separate tool execution table is required

### Requirement: Truncation API

The system SHALL provide an API endpoint to handle conversation truncation.

#### Scenario: Truncate endpoint accepts message ID

- **WHEN** POST request is made to `/api/chat/truncate` with messageId
- **THEN** the system identifies all messages from messageId onward
- **AND** marks them as truncated
- **AND** reverts all tool executions from those messages
- **AND** returns the copied text content

#### Scenario: Truncate endpoint validates ownership

- **WHEN** user requests to truncate a message they do not own
- **THEN** the API returns 403 Forbidden
- **AND** no messages are modified

#### Scenario: Truncate endpoint handles concurrent requests

- **WHEN** two truncation requests are made simultaneously
- **THEN** only the first request succeeds
- **AND** the second request returns 409 Conflict
- **AND** no messages are in inconsistent state

### Requirement: Input Box Population

The system SHALL copy the truncated message content to the input box.

#### Scenario: Text content copied to input

- **GIVEN** a user message containing text "Improve my experience section"
- **WHEN** user truncates at this message
- **THEN** the input box contains "Improve my experience section"
- **AND** the user can edit the text before resending

#### Scenario: Multipart message content concatenated

- **GIVEN** a user message with multiple text parts
- **WHEN** user truncates at this message
- **THEN** all text parts are concatenated with newlines
- **AND** the result is placed in the input box

#### Scenario: Tool calls are not copied

- **GIVEN** a user message containing tool calls
- **WHEN** user truncates at this message
- **THEN** only text parts are copied to input
- **AND** tool calls are ignored

### Requirement: Message has_tools Flag

The system SHALL track whether a message contains tool calls using the has_tools column.

#### Scenario: has_tools set on message save

- **WHEN** a message is saved to the database
- **THEN** the system checks the parts for tool-* types
- **AND** sets has_tools=true if any tool part exists
- **AND** sets has_tools=false if no tool parts exist

### Requirement: Truncated Message Filtering

The system SHALL automatically filter out truncated messages from UI and API responses.

#### Scenario: Truncated messages hidden in UI

- **GIVEN** a conversation with some truncated messages
- **WHEN** the chat UI renders the message list
- **THEN** truncated messages are not displayed
- **AND** only messages where truncated=false are shown

#### Scenario: Truncated messages excluded from history load

- **GIVEN** a conversation with some truncated messages in the database
- **WHEN** loading chat history
- **THEN** the query filters by truncated=false
- **AND** truncated messages are not returned in the results
- **AND** RLS policy enforces this filtering at database level

#### Scenario: Re-open page shows no truncated messages

- **GIVEN** user previously truncated a conversation
- **WHEN** user refreshes or reopens the page
- **THEN** truncated messages are not displayed
- **AND** the conversation appears as it did before truncation
- **AND** token statistics are preserved in the database

#### Scenario: has_tools used for efficient queries

- **GIVEN** a conversation with many messages
- **WHEN** truncating at a message
- **THEN** the system queries only messages where has_tools=true
- **AND** the query uses the filtered index for performance
