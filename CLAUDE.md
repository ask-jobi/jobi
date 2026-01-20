## Project Overview

This is a Next.js 15 application built with TypeScript that helps users create, manage, and optimize resumes with AI-powered features. The application uses Supabase for backend services, Tailwind CSS for styling, and various modern React libraries for UI components.

Key features include:
- Resume creation and editing with Tiptap rich text editor
- AI-powered resume analysis, evaluation, rewriting, and optimization
- Job application tracking and management
- Subscription/payment management with Stripe
- Multiple resume templates with print capabilities
- Internationalization support (English/Chinese)
- Real-time updates with Server-Sent Events (SSE)

## Common Commands

### Development
- `pnpm dev` - Start the development server with Turbopack
- `pnpm dev:test` - Start the development server on port 3001 (for E2E tests)

### Building
- `pnpm build` - Build the application for production

### Testing
- `pnpm test` - Run all Jest unit tests
- `pnpm test [filename]` - Run a specific test file
- `pnpm test --watch` - Run tests in watch mode
- `pnpm e2e-test` - Run all Playwright E2E tests
- `pnpm exec playwright test --ui` - Run Playwright tests in UI mode

### Code Quality
- `pnpm lint` - Run ESLint to check for code issues

## Architecture Overview

### Project Structure
- `app/` - Next.js App Router pages and layouts
  - `(protected)/` - Protected route groups
  - `api/` - API routes
  - `auth/` - Authentication pages
- `components/` - React components organized by type:
  - `ui/` - Reusable UI components (shadcn/ui)
  - `client-components/` - Business logic components
  - `editor/` - Rich text editor components (Tiptap)
  - `forms/` - Form components
  - `resume-templates/` - Resume template components
  - `skeletons/` - Loading skeletons
- `lib/` - Utility functions and configurations
  - `hooks/` - Custom React hooks
  - `i18n/` - Internationalization
  - `payment/` - Stripe integration
  - `store/` - State management (Jotai)
  - `supabase/` - Database client configurations
- `server/` - Server-side logic
  - `ai/` - AI processing and prompts
- `test/` - Testing setup (Jest and Playwright)
- `types/` - TypeScript type definitions

### Key Technologies
- **Next.js 15** with App Router and Turbopack
- **React 19** with Server Components
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **shadcn/ui** component library
- **Supabase** for authentication, database, and storage
- **React Hook Form** for form handling
- **Zod** for validation
- **Tiptap** rich text editor (recently migrated from Lexical)
- **Stripe** for payments
- **Jotai** for client-side state management
- **Google Generative AI (Gemini)** for AI processing
- **next-intl** for internationalization

### Form System
Forms are built using `react-hook-form` and custom UI components:
- Form components are in `components/ui/form.tsx`
- Form fields use a composition pattern with `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, and `FormMessage`
- Validation is handled by Zod schemas
- Required fields display red asterisks using `after:content-['*'] after:text-destructive` Tailwind classes

### State Management
- **Jotai** for client-side state management
- React state for component-level state
- Server Components for data fetching and caching

### AI Integration
- **Google Generative AI (Gemini)** for resume processing
- AI features include: resume analysis, evaluation, rewriting, and optimization
- Real-time AI processing with progress indicators via SSE
- Custom prompts in `server/ai/` directory

### Payment System
- **Stripe** integration for subscription management
- Webhook handling for payment events
- Tiered pricing with different feature levels

### Testing
- **Jest** for unit and integration tests
- **Playwright** for E2E tests
- Test files are colocated with components when possible
- E2E tests are in the `test/e2e/` directory
- Automatic authentication setup for E2E tests

### Internationalization
- **next-intl** for multi-language support
- English and Chinese language support
- Structured translation files in `lib/i18n/`

## Development Guidelines

### Component Patterns
- Use shadcn/ui components as building blocks
- Follow the form composition pattern consistently
- Implement proper loading states with skeleton components
- Use TypeScript for all components with proper type definitions

### Code Quality
- Maintain type safety with comprehensive TypeScript usage
- Follow consistent naming conventions
- Implement proper error handling and user feedback
- Write tests for new features and components

### Database
- Uses Supabase with PostgreSQL
- Tables include: users, resumes, jobs, subscriptions, etc.
- Row Level Security (RLS) implemented for data access control

## Recent Major Changes

### Editor Migration (Q4 2025)
- Migrated from Lexical to Tiptap for rich text editing
- Enhanced editor with floating toolbars and AI integration
- Improved performance and user experience

### AI Enhancement
- Added comprehensive resume evaluation and optimization features
- Implemented real-time AI processing with progress tracking
- Enhanced AI prompts for better resume analysis

### Form Improvements
- Added required field indicators with red asterisks
- Improved form validation and user feedback
- Enhanced accessibility in form components

### UI/UX Updates
- Improved landing page with animations
- Enhanced mobile responsiveness
- Better loading states and error handling

## Environment Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Set up Supabase database and authentication
5. Run development server: `pnpm dev`

## Security Considerations

- Row Level Security (RLS) enabled on Supabase tables
- Environment variables for sensitive data
- Proper authentication and authorization checks
- Input validation with Zod schemas
- Webhook signature verification for Stripe events
