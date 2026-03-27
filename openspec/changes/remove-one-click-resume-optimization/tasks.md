## 1. Spec

- [x] 1.1 Validate the `resume-chat` delta for evaluation-to-chat handoff behavior
- [x] 1.2 Confirm this change does not conflict with active resume-chat proposals

## 2. Implementation

- [x] 2.1 Replace the evaluation-panel one-click optimize action with a chat handoff action
- [x] 2.2 Open the chat panel and send exactly one predefined optimization message after the canonical session is ready
- [x] 2.3 Remove the legacy one-click optimize preview/apply/undo/skip UI state and tests
- [x] 2.4 Remove the `/api/resume/ops-from-evaluation` endpoint and the AI op-generation flow that only served one-click optimization
- [x] 2.5 Stop consuming or exposing `fullOptimize` product UI quota for this removed feature while leaving unrelated quota behavior unchanged
- [x] 2.6 Add or update tests for the button handoff flow and the removed endpoint/UI behavior

## 3. Validation

- [x] 3.1 Run `openspec validate remove-one-click-resume-optimization --strict --no-interactive`
- [x] 3.2 Run targeted tests for evaluation panel, chat handoff, and affected subscription/quota UI
