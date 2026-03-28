## 1. Spec

- [ ] 1.1 Validate the `resume-chat` delta for thread lifecycle and pending action behavior
- [ ] 1.2 Confirm the new lifecycle model is compatible with the existing single-session resume-chat direction

## 2. Implementation

- [ ] 2.1 Introduce a single thread lifecycle state model for resume chat initialization
- [ ] 2.2 Route evaluation handoff through a unified pending action pipeline
- [ ] 2.3 Route user send attempts made before thread readiness through the same pending action pipeline
- [ ] 2.4 Align Composer interactivity and send execution with lifecycle readiness
- [ ] 2.5 Remove obsolete boolean gating and refs replaced by the lifecycle model
- [ ] 2.6 Add or update tests for lifecycle transitions, handoff delivery, and queued user sends

## 3. Validation

- [ ] 3.1 Run `openspec validate refactor-chat-thread-lifecycle --strict --no-interactive`
- [ ] 3.2 Run targeted tests for chat lifecycle, handoff, composer sending, and token usage rendering
