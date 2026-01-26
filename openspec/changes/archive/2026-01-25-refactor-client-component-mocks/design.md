# Design: refactor-client-component-mocks

## Core Principle

**`vitest.component-setup.tsx` contains all global mocks. Individual test files should NOT add duplicate mocks for anything already globally mocked.**

## Current Problem

Some test files have inline `vi.mock()` calls for things that are already mocked globally:

```typescript
// In vitest.component-setup.tsx (global)
vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: any) => <button>{children}</button>
}))

// In some test file (duplicate!)
vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: any) => <button data-testid="button">{children}</button>
}))
```

This causes:
- Conflicting mocks
- Maintenance burden
- Inconsistent behavior

## Solution

### 1. Remove global mocks from vitest.component-setup.tsx

Remove these sections entirely:
- All `vi.mock("@/components/ui/*")` blocks
- `vi.mock("lucide-react")` block
- Any mocks that are not strictly necessary

### 2. Add test-id to UI components with unified naming

Add `data-testid` with `ui-` prefix directly to UI components:

| Component | test-id |
|-----------|---------|
| Button | `ui-button` |
| Input | `ui-input` |
| Textarea | `ui-textarea` |
| Label | `ui-label` |
| Card | `ui-card` |
| CardHeader | `ui-card-header` |
| CardContent | `ui-card-content` |
| CardFooter | `ui-card-footer` |
| Badge | `ui-badge` |
| Progress | `ui-progress` |
| Dialog | `ui-dialog` |
| Select | `ui-select` |
| Skeleton | `ui-skeleton` |

```typescript
// components/ui/button.tsx
export function Button({ children, ...props }: ButtonProps) {
  return <button data-testid="ui-button" {...props}>{children}</button>
}
```

### 3. Remove duplicate mocks from test files

Test files should be cleaned up:
- Remove inline `vi.mock("@/components/ui/*")` calls
- Remove inline `vi.mock("lucide-react")` calls
- Remove inline `vi.mock("next-intl")` calls

### 4. Icon components are out of scope

Icon components from `lucide-react` are:
- Not in the code repository
- Should not be asserted via test-id
- No changes needed for icon components

### 5. Tests only assert on tested components

Each test should only make assertions about the component it is testing, not child UI components.

## Migration Strategy

1. Remove duplicate mocks from test files
2. Add test-id attributes to UI components
3. Run tests to verify behavior
4. Remove global mocks from vitest.component-setup.tsx
5. Run full test suite to confirm all tests pass

## Testing Strategy

- All existing tests must pass after refactor
- No new tests added
- No coverage decrease
- Validate with `pnpm test`
