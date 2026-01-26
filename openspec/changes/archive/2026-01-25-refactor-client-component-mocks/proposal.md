# Proposal: refactor-client-component-mocks

## Why

The current test setup has unnecessary mocks and inconsistencies:

1. **`vitest.component-setup.tsx`** mocks all UI components and icons globally
2. **Individual test files** duplicate some of these mocks
3. **Icon components** are mocked but tests shouldn't assert on them anyway
4. **test-id attributes** are not consistently applied to UI components

This refactoring will:
- Remove duplicate mocks from test files
- Remove unnecessary global mocks from `vitest.component-setup.tsx`
- Add consistent test-id attributes to UI components (prefix: `ui-`)
- Keep all test behavior unchanged

## Summary

Refactor client component test mocks by removing duplicates, removing unnecessary global mocks, and adding consistent test-id attributes to UI components. All tests must pass with identical behavior after refactoring.

## What Changes

- Remove duplicate `vi.mock()` calls from individual test files
- Remove UI component and icon mocks from `vitest.component-setup.tsx`
- Add `data-testid` attributes with `ui-` prefix to UI components
- Update test files to use new test-id patterns

## Scope

- `vitest.component-setup.tsx` - Remove unnecessary mocks
- `components/ui/*.tsx` - Add consistent test-id attributes
- `components/client-components/__tests__/*.test.tsx` - Remove duplicate mocks

## Out of Scope

- Any changes to `server/` or `lib/` files
- Adding new tests
- Modifying component logic or behavior
- Changes to E2E tests
- Icon components (outside code scope, no test-id needed)
