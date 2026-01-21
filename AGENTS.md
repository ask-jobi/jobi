# AGENTS.md - Coding Guidelines for Jobi

## Common Commands

### Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm dev:test` - Start dev server on port 3001 (for E2E tests)

### Building
- `pnpm build` - Build application for production

### Testing
- `pnpm test` - Run all Jest unit tests
- `pnpm test [filename]` - Run a specific test file
- `pnpm test --watch` - Run tests in watch mode
- `pnpm e2e-test` - Run all Playwright E2E tests
- `pnpm exec playwright test --ui` - Run Playwright tests in UI mode

### Code Quality
- `pnpm lint` - Run ESLint to check for code issues
- `pnpm format` - Format all files with Prettier
- `pnpm format:check` - Check formatting without modifying

## Code Style Guidelines

### TypeScript
- Use TypeScript for all components and functions
- Avoid `any` - use proper type definitions or `unknown` with type guards
- Use interfaces for props, avoid type aliases for complex objects
- Generate Supabase types: `types/supabase.ts` must stay synced with database schema

### Component Patterns
- Page components in `app/`, UI components in `components/ui/`, business components in `components/client-components/`
- Use named exports instead of default exports for components
- Pure function components only - no class components
- Props via TypeScript interfaces

### State Management
- Use Jotai for cross-component shared state (store in `lib/store/`)
- Use React state for component-local state
- Replace React Context with Jotai atoms

### Forms & Validation
- All form validation with Zod (no yup/joi)
- Use react-hook-form + @hookform/resolvers/zod
- Place validation schemas in `lib/` or `components/client-components/forms/`
- Required fields show red asterisks: `after:content-['*'] after:text-destructive`

### UI & Styling
- Use Shadcn UI and Radix primitives - don't build custom UI components
- All styling with Tailwind CSS - no inline styles or CSS/SASS/LESS files
- Use tailwind-merge for class concatenation to avoid conflicts
- Use next-themes for dark/light mode
- Use motion library for animations, avoid direct DOM manipulation
- Responsive design with Tailwind responsive utility classes

### Next.js Conventions
- Add "use client" only when browser APIs are needed, prefer Server Components
- Data fetching, routing, rendering per Next.js official docs
- Use nuqs for URL state management
- Optimize Web Vitals: use next/image, avoid layout shifts
- API routes in `app/api/`, business logic in `server/`
- SSR/SSG first, CSR only when necessary
- Never access `window`/`document` in Server Components

### Backend & Supabase
- All backend (auth, database) via Supabase SDK
- Authentication flows must use Supabase SDK
- Never store sensitive info in plaintext
- In route.ts, only validate params and call server layer functions
- Never directly manipulate database in frontend - use API or server layer

### File Structure & Naming
- Component directories: lowercase with hyphens (e.g., `resume-templates`)
- File names match exported component name
- Reusable hooks, types, utils go in `lib/hooks/`, `types/`, `lib/utils.ts`

### Testing
- Unit tests for all new components
- Create integration tests for API routes (with real Supabase database)
- Use testing-library/react for component tests
- Test descriptions must be in English
- Consider edge cases and boundary conditions

### Imports
- Group imports: React/Next.js → External libraries → Internal components/utils
- Use path aliases (`@/` or `~//`)
- Avoid relative imports beyond two levels

### Error Handling
- Proper error boundaries and user feedback
- Validate all inputs with Zod schemas
- Webhook handlers must verify signatures (Stripe)
- Log errors appropriately without exposing sensitive data
