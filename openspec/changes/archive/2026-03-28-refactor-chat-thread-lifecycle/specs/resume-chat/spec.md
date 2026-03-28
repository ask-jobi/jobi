## ADDED Requirements

### Requirement: Chat Thread Lifecycle Readiness

The system SHALL model resume chat initialization with a single thread lifecycle state so that message execution is gated by explicit readiness instead of multiple independent boolean checks.

#### Scenario: Thread becomes ready only after history is synchronized

- **GIVEN** the user opens the resume chat panel
- **WHEN** the system resolves the canonical session and loads chat history
- **THEN** the thread does not enter the ready state until the loaded history has been synchronized into the active chat runtime

#### Scenario: Thread readiness drives message execution

- **WHEN** the thread is not yet ready
- **THEN** the system does not execute outgoing chat actions immediately
- **AND** message execution waits until the lifecycle reaches ready

### Requirement: Pending Chat Actions Queue

The system SHALL use a unified pending action mechanism for chat actions that are requested before the thread is ready.

#### Scenario: Handoff waits in pending actions

- **GIVEN** the user triggers the evaluation-panel optimize handoff before the chat thread is ready
- **WHEN** the thread is still resolving session, loading history, or synchronizing history
- **THEN** the system stores the handoff as a pending action
- **AND** executes it exactly once after the thread becomes ready

#### Scenario: User send before readiness is queued

- **GIVEN** the user types a message before the chat thread is ready
- **WHEN** the user submits the message
- **THEN** the system stores that send request as a pending action
- **AND** executes it exactly once after the thread becomes ready

#### Scenario: Pending action respects resume scope

- **GIVEN** a pending chat action was created for one resume
- **WHEN** the user navigates to another resume before the action is executed
- **THEN** the system does not execute the pending action in the other resume's chat thread

## MODIFIED Requirements

### Requirement: Evaluation Optimize Button Hands Off To Chat

The system SHALL keep the evaluation-panel optimize button as a chat entrypoint instead of running a separate one-click resume optimization flow.

#### Scenario: Clicking optimize opens chat and sends the predefined message

- **GIVEN** the user is viewing the evaluation panel for a resume
- **WHEN** the user clicks the "`一键润色简历`" button
- **THEN** the system switches the right panel to the chat view
- **AND** the system resolves the resume's canonical chat session
- **AND** the system queues one predefined optimization message for that resume
- **AND** the system sends that message only after the chat thread becomes ready

#### Scenario: Automatic handoff message is sent only once per click

- **GIVEN** the optimize button was clicked once
- **WHEN** the chat thread transitions through initialization states before becoming ready
- **THEN** the predefined optimization message is delivered at most once for that click
- **AND** no duplicate user messages are created

#### Scenario: Handoff reuses localized message content

- **WHEN** the system prepares the predefined optimization message for the handoff
- **THEN** the message content uses the current locale's configured chat copy
- **AND** the button flow does not hardcode user-visible text in the component
