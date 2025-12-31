# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application built with TypeScript that helps users create and manage resumes. The application uses Supabase for backend services, Tailwind CSS for styling, and various modern React libraries for UI components.

Key features include:
- Resume creation and editing with a rich text editor
- AI-powered resume analysis and suggestions
- Job application tracking
- Subscription/payment management

## Common Commands

### Development
- `pnpm dev` - Start the development server
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

### Frontend Structure
- `app/` - Next.js App Router pages and layouts
- `components/` - React components organized by type:
  - `ui/` - Reusable UI components (buttons, forms, cards, etc.)
  - `client-components/` - Client-side only components
  - `blocks/` - Complex component blocks (like the editor)
  - `resume-templates/` - Resume templates and formatting components
- `lib/` - Utility functions and shared logic
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions

### Key Technologies
- **Next.js 15** with App Router
- **React 19** with Server Components
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** for authentication and database
- **React Hook Form** for form handling
- **Zod** for validation
- **Tiptap** rich text editor
- **Stripe** for payments

### Form System
Forms are built using `react-hook-form` and custom UI components:
- Form components are in `components/ui/form.tsx`
- Form fields use a composition pattern with `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, and `FormMessage`
- Validation is handled by Zod schemas

### Testing
- **Jest** for unit and integration tests
- **Playwright** for E2E tests
- Test files are colocated with the components they test when possible
- E2E tests are in the `test/e2e/` directory

## Recent Changes

The JobInformationForm component has been updated to include required field indicators. Each FormLabel now has the Tailwind classes `after:content-['*'] after:text-destructive` to display a red asterisk for required fields.
