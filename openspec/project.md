# Project Context

## Purpose

Jobi is a job application management platform that helps users create, optimize, and manage resumes for job applications. Key features include:
- AI-powered resume building and optimization
- Resume parsing from PDF documents
- Job application tracking
- Resume printing and export
- Subscription-based premium features (via Stripe)

Preview: [jobi-beta.vercel.app](https://jobi-beta.vercel.app)
Production: [www.hellojobi.com](https://www.hellojobi.com)

## Tech Stack

### Core Framework
- **Next.js 15** - App Router, Server Components, Turbopack
- **TypeScript 5** - Strict mode, no `any` allowed
- **React 19** - Server Components first approach

### UI & Styling
- **Tailwind CSS 4** - All styling, no inline styles
- **Shadcn UI** - Radix UI primitives with Tailwind
- **motion** - Animations
- **lucide-react** - Icons

### State Management
- **Jotai** - Cross-component shared state
- **React state** - Component-local state
- **nuqs** - URL state management

### Forms & Validation
- **react-hook-form** - Form handling
- **Zod** - Schema validation

### Backend & Database
- **Supabase** - Auth, database, real-time
- **Supabase SSR** - Next.js integration
- **Stripe** - Payments and subscriptions

### AI & Document Processing
- **@ai-sdk/google** - Google AI integration
- **TipTap** - Rich text editor for resumes
- **pdf-parse** - PDF parsing
- **puppeteer** - Resume PDF generation

### Testing
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **@testing-library/react** - Component testing

### Internationalization
- **next-intl** - i18n support

## Project Conventions

### Code Style

- **No comments** in code unless explicitly requested
- **No emojis** in code or commit messages
- **Imports ordered**: React/Next.js → External libraries → Internal components/utils
- **Path aliases**: Use `@/` for root imports, avoid relative imports beyond 2 levels
- **File naming**: lowercase with hyphens for directories, PascalCase for components

### Component Patterns

- **Named exports** only, no default exports
- **Pure function components** - no class components
- **Props via TypeScript interfaces**
- **Page components**: `app/`
- **UI components**: `components/ui/`
- **Business components**: `components/client-components/`

### Architecture Patterns

- **Server Components first** - Add "use client" only when browser APIs needed
- **Server layer**: `server/` directory for business logic
- **API routes**: `app/api/` - validate params, call server layer
- **No direct DB access from frontend** - Use API or server layer
- **SSR/SSG first**, CSR only when necessary
- **No `window`/`document` in Server Components**

### State Management Rules

- **Jotai atoms** for cross-component state (`lib/store/`)
- **React state** for component-local state
- **Replace Context with Jotai** - No new React Context

### Form Validation

- **Zod schemas** in `lib/` or `components/client-components/forms/`
- **react-hook-form + @hookform/resolvers/zod**
- **Required fields**: `after:content-['*'] after:text-destructive`

### File Structure

```
app/                    # Next.js App Router pages
components/
  ├── ui/              # Shadcn UI primitives
  ├── client-components/ # Client-side business components
  ├── forms/           # Form components with validation
  ├── editor/          # TipTap editor components
  ├── resumes/         # Resume-related components
  ├── jobs/            # Job tracking components
  └── blocks/          # Block-based editor components
lib/
  ├── hooks/           # Custom React hooks
  ├── store/           # Jotai atoms
  ├── utils.ts         # Utility functions (cn, etc.)
  ├── supabase/        # Supabase client configuration
  └── payment/         # Payment-related utilities
server/                # Backend business logic
types/                 # TypeScript type definitions
openspec/              # OpenSpec documentation
test/                  # Test files and helpers
```

## Git Workflow

- **Feature branches**: `feature/description`
- **Bug fixes**: `fix/description`
- **Commits**: Conventional commits (feat, fix, chore, docs, etc.)
- **Pre-commit hooks**: Husky + lint-staged + prettier
- **Never commit secrets** - .env files are gitignored

## Testing Strategy

### Unit Tests (Vitest)
- **Location**: Alongside source files (`*.test.ts`)
- **API tests**: `app/api/**/route.test.ts` - real Supabase database
- **Component tests**: `@testing-library/react`
- **Test language**: English only

### E2E Tests (Playwright)
- **Location**: `test/e2e/`
- **Port**: 3001 (development server uses 3000)
- **Auth**: Auto-login via `auth.setup.ts`
- **Test users**: `mock_normal@mail.com` / `mock_normal`

### Running Tests

```bash
pnpm test              # All unit tests
pnpm test --watch      # Watch mode
pnpm e2e-test          # All E2E tests
pnpm exec playwright test --ui  # UI mode
```

## Domain Context

### Resume Building
- Block-based TipTap editor
- Drag-and-drop with @dnd-kit
- PDF export via Puppeteer
- AI optimization suggestions

### Job Application Tracking
- Job listing management
- Application status workflow
- Resume-job matching

### Quota System
- AI usage quotas per user
- Subscription tiers
- Stripe integration for billing

## Important Constraints

- **No `any` type** - Use proper types or `unknown` with guards
- **No inline styles** - Tailwind only
- **No React Context** - Use Jotai atoms
- **No direct DB in frontend** - Server layer only
- **No browser APIs in Server Components**
- **Validate all inputs** with Zod schemas
- **Webhook handlers must verify signatures** (Stripe)

## External Dependencies

### Services
- **Supabase** - Auth & database (project-ref: antnnixumdyjbmqacvhv)
- **Stripe** - Payment processing
- **Google AI** - AI-powered resume optimization

### Development Tools
- **Docker** - Local Supabase
- **puppeteer browsers** - Chrome for PDF generation

### Database
- **PostgreSQL** via Supabase
- **Real-time subscriptions** for live updates
- **RLS policies** for row-level security

## Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Turbopack, port 3000) |
| `pnpm dev:test` | Start dev server for E2E tests (port 3001) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint check |
| `pnpm format` | Prettier formatting |
| `pnpm format:check` | Check formatting |
| `pnpm test` | Run Vitest unit tests |
| `pnpm e2e-test` | Run Playwright E2E tests |
| `supabase migration new <name>` | Create database migration |
| `supabase migration up` | Apply migrations locally |
| `supabase migration up --linked` | Apply migrations to remote |
