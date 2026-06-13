# Paddle Checkout Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the paid Stripe checkout path with Paddle Billing checkout while preserving the existing token grant model.

**Architecture:** Keep the existing pricing page and token balance model. Paid cards open Paddle Checkout with `customData` containing the Supabase user id and plan; a new Paddle webhook verifies `paddle-signature`, handles `transaction.completed`, records an idempotency row, and grants tokens through the existing Supabase tables.

**Tech Stack:** Next.js route handlers, React client components, Paddle.js, Paddle Node SDK, Supabase service-role client, Vitest.

---

### Task 1: Paddle Dependencies And Config

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.env.example`
- Create: `lib/payment/paddle-config.ts`

- [x] Install `@paddle/paddle-js` and `@paddle/paddle-node-sdk`.
- [x] Add Paddle env placeholders to `.env.example`.
- [x] Create `lib/payment/paddle-config.ts` with Lite and Pro `pri_...` env mappings.
- [x] Run a small env-loading check.

### Task 2: Paddle Webhook

**Files:**
- Create: `app/api/paddle/webhook/route.ts`
- Test: `app/api/paddle/webhook/route.test.ts`

- [x] Write failing tests for `transaction.completed` token grants, invalid metadata, duplicate transaction id, and database rollback.
- [x] Implement Paddle webhook signature verification using `@paddle/paddle-node-sdk`.
- [x] Reuse the current access pass accumulation behavior.
- [x] Run `pnpm exec vitest app/api/paddle/webhook/route.test.ts`.

### Task 3: Checkout Status

**Files:**
- Create: `app/api/paddle/checkout-status/route.ts`
- Modify: `components/client-components/payment-success-actions.tsx`
- Modify: `app/payment/success/page.tsx`

- [x] Add a Paddle transaction status endpoint backed by the existing checkout event table.
- [x] Accept `transaction_id` on the success page.
- [x] Poll the Paddle checkout status endpoint when `transaction_id` is present.
- [x] Run the payment success action tests.

### Task 4: Pricing Checkout

**Files:**
- Modify: `app/pricing/page.tsx`
- Modify: `components/client-components/pricing-card.tsx`
- Modify tests under `components/client-components/__tests__/`

- [x] Switch pricing config import to Paddle config.
- [x] Initialize Paddle.js for paid plans.
- [x] Open Paddle Checkout with price id, user email, `successUrl`, and `customData`.
- [x] Preserve free-plan behavior and login redirect.
- [x] Run pricing card tests.

### Task 5: Documentation And Verification

**Files:**
- Modify: `STRIPE_SETUP.md` or add Paddle setup docs if needed.

- [x] Document Paddle sandbox variables and webhook setup.
- [x] Run targeted payment tests.
- [x] Report any verification blocked by local Node version.
