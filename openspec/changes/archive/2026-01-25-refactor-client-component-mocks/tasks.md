# Tasks: refactor-client-component-mocks

## Phase 1: Remove duplicate mocks from test files

- [x] Remove inline `vi.mock("@/components/ui/*")` from all test files
- [x] Remove inline `vi.mock("lucide-react")` from all test files
- [x] Remove inline `vi.mock("next-intl")` from all test files

## Phase 2: Add test-id to UI components

- [x] Add `data-testid="ui-button"` to `components/ui/button.tsx`
- [x] Add `data-testid="ui-input"` to `components/ui/input.tsx`
- [x] Add `data-testid="ui-textarea"` to `components/ui/textarea.tsx`
- [x] Add `data-testid="ui-label"` to `components/ui/label.tsx`
- [x] Add test-ids to Card components in `components/ui/card.tsx`
- [x] Add `data-testid="ui-badge"` to `components/ui/badge.tsx`
- [x] Add `data-testid="ui-progress"` to `components/ui/progress.tsx`
- [x] Add test-ids to Dialog components in `components/ui/dialog.tsx`
- [x] Add test-ids to Select components in `components/ui/select.tsx`
- [x] Add `data-testid="skeleton"` to `components/ui/skeleton.tsx`

## Phase 3: Update test files to use new test-ids

- [x] Update tests that used old test-id patterns to use new `ui-*` pattern

## Phase 4: Remove global mocks

- [x] Remove `vi.mock("@/components/ui/*")` from `vitest.component-setup.tsx`
- [x] Remove `vi.mock("lucide-react")` from `vitest.component-setup.tsx`

## Phase 5: Validation

- [x] Run `pnpm test` to verify all tests pass (225 tests passing)
- [x] Verify test coverage maintained
- [x] Lint passes with `pnpm lint`
