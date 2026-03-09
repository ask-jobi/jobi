## ADDED Requirements

### Requirement: Chat Event Logging

The system SHALL log chat events to track resume modifications, summary checkpoints, and rollback operations.

#### Scenario: Log resume modification event

- **WHEN** AI executes a tool that modifies the resume (rewrite, delete, add, reorder) in frontend onToolCall
- **THEN** the frontend calls a Server Action to create a `resume_modification` event with:
  - session_id
  - message_id
  - event_type = 'resume_modification'
  - operation details (operation type, entity, block IDs, etc.)
  - original_value (for rewrite/delete/reorder)
  - new_value (for rewrite/add)
  - created_at timestamp

#### Scenario: Log summary checkpoint event

- **WHEN** AI generates a conversation summary (every 5 messages)
- **THEN** a `summary_checkpoint` event is created with:
  - session_id
  - message_count at checkpoint
  - event_type = 'summary_checkpoint'
  - summary_text (the generated summary)
  - created_at timestamp

#### Scenario: Log rollback event

- **WHEN** user truncates/rolls back conversation
- **THEN** a `rollback` event is created with:
  - session_id
  - truncated_message_id
  - event_type = 'rollback'
  - message_count before rollback
  - created_at timestamp

### Requirement: Event Append-Only

The system SHALL ensure chat events are append-only (no updates or deletes).

#### Scenario: No update operations allowed

- **WHEN** user attempts to update an existing chat_event
- **THEN** the operation fails
- **AND** error is returned

#### Scenario: No delete operations allowed

- **WHEN** user attempts to delete an existing chat_event
- **THEN** the operation fails
- **AND** error is returned

### Requirement: Event Query API

The system SHALL provide an API to query chat events for a session.

#### Scenario: Get all events for session

- **WHEN** GET request is made to `/api/chat/events?session_id=xxx`
- **THEN** returns all events for the session ordered by created_at asc

#### Scenario: Filter events by type

- **WHEN** GET request is made to `/api/chat/events?session_id=xxx&event_type=resume_modification`
- **THEN** returns only events matching the specified event_type
