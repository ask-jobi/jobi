## ADDED Requirements

### Requirement: Evaluation Optimize Button Hands Off To Chat

The system SHALL keep the evaluation-panel optimize button as a chat entrypoint instead of running a separate one-click resume optimization flow.

#### Scenario: Clicking optimize opens chat and sends the predefined message

- **GIVEN** the user is viewing the evaluation panel for a resume
- **WHEN** the user clicks the "`一键润色简历`" button
- **THEN** the system switches the right panel to the chat view
- **AND** the system resolves the resume's canonical chat session
- **AND** the system automatically sends one predefined optimization message to the agent for that resume

#### Scenario: Automatic handoff message is sent only once per click

- **GIVEN** the optimize button was clicked once
- **WHEN** the chat panel rerenders or the session finishes loading
- **THEN** the predefined optimization message is delivered at most once for that click
- **AND** no duplicate user messages are created

#### Scenario: Handoff reuses localized message content

- **WHEN** the system prepares the predefined optimization message for the handoff
- **THEN** the message content uses the current locale's configured chat copy
- **AND** the button flow does not hardcode user-visible text in the component

### Requirement: One-Click Resume Optimization Flow Is Removed

The system SHALL not expose or execute the legacy one-click resume optimization flow that generated local resume edit previews outside chat.

#### Scenario: Evaluation panel no longer shows local op preview workflow

- **WHEN** the user clicks the optimize button from the evaluation panel
- **THEN** the UI does not show the old suggestion list, diff preview, or apply/undo/skip controls
- **AND** the optimization continues through the chat experience only

#### Scenario: Legacy one-click optimization endpoint is removed from product flow

- **WHEN** the evaluation optimize action is triggered
- **THEN** the frontend does not request `/api/resume/ops-from-evaluation`
- **AND** the legacy endpoint is no longer required to support the product behavior

#### Scenario: Removed flow does not consume fullOptimize quota

- **WHEN** the user starts resume optimization from the retained evaluation button
- **THEN** the system does not consume `fullOptimize` quota
- **AND** any usage accounting follows the resume chat flow instead
