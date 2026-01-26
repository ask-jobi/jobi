## ADDED Requirements

### Requirement: No duplicate mocks in test files

Individual test files MUST NOT contain `vi.mock()` calls for modules already globally mocked in `vitest.component-setup.tsx`.

#### Scenario: UI component mocks are only in setup file

Test files MUST NOT contain `vi.mock("@/components/ui/*")` calls.

```typescript
// Bad - duplicate mock
vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: any) => <button>{children}</button>
}))

// Good - rely on global mock or real component
```

#### Scenario: Icon mocks are only in setup file

Test files MUST NOT contain `vi.mock("lucide-react")` calls.

#### Scenario: i18n mocks are only in setup file

Test files MUST NOT contain `vi.mock("next-intl")` calls.

### Requirement: UI components have consistent test-id attributes

UI components MUST have `data-testid` attributes with `ui-` prefix where tests use them for queries.

#### Scenario: Button has ui-button test-id

`components/ui/button.tsx` MUST include `data-testid="ui-button"`.

#### Scenario: Input has ui-input test-id

`components/ui/input.tsx` MUST include `data-testid="ui-input"`.

#### Scenario: Textarea has ui-textarea test-id

`components/ui/textarea.tsx` MUST include `data-testid="ui-textarea"`.

#### Scenario: Card components have ui-* test-ids

Card components in `components/ui/card.tsx` MUST include appropriate `data-testid` attributes:
- `ui-card` for Card
- `ui-card-header` for CardHeader
- `ui-card-content` for CardContent
- `ui-card-footer` for CardFooter

#### Scenario: Progress has ui-progress test-id

`components/ui/progress.tsx` MUST include `data-testid="ui-progress"`.

#### Scenario: Badge has ui-badge test-id

`components/ui/badge.tsx` MUST include `data-testid="ui-badge"`.

### Requirement: Global mocks are removed

`vitest.component-setup.tsx` MUST NOT contain unnecessary mocks.

#### Scenario: UI component mocks are removed

All `vi.mock("@/components/ui/*")` blocks MUST be removed from `vitest.component-setup.tsx`.

#### Scenario: Icon mocks are removed

`vi.mock("lucide-react")` MUST be removed from `vitest.component-setup.tsx`.

### Requirement: Test behavior is preserved

All tests MUST pass after refactoring with identical behavior.

#### Scenario: Tests pass with real components

All 15 existing tests MUST pass after refactoring.

#### Scenario: No new assertions on child components

Tests MUST NOT add new assertions on child UI components that weren't there before.

#### Scenario: Coverage is maintained

Test coverage MUST remain unchanged after refactoring.
