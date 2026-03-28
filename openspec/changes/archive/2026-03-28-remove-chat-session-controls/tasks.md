## 1. Implementation
- [x] 1.1 Remove `ChatSessionControls` from the resume chat panel layout
- [x] 1.2 Delete the `ChatSessionControls` component and its dedicated test coverage
- [x] 1.3 Remove chat-header-specific state sync, loading UI, and unused i18n keys that become dead code after the component is removed
- [x] 1.4 Verify the chat panel still opens and sends messages through the canonical session flow without header controls

## 2. Validation
- [x] 2.1 Run `openspec validate remove-chat-session-controls --strict --no-interactive`
- [x] 2.2 Run the relevant unit tests or document any gaps if test execution is deferred
