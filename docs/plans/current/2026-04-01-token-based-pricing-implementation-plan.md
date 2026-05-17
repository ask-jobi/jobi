# Token-Based Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert pricing from time-limited feature bundles to token-only plans using the existing chat token accounting pipeline.

**Architecture:** Reuse `access_passes` as the token balance record, make token balance instead of `end_at` determine plan validity, and update purchase flows so paid plans accumulate token balance. Remove feature-based and duration-based pricing presentation from frontend subscription UI and pricing copy.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, Stripe, Vitest, next-intl

---

## File Structure

- Modify: `lib/payment/quota.ts`
  Defines canonical token amounts for `FREE`, `LITE`, and `PRO`.
- Modify: `server/quota.ts`
  Changes active-plan lookup and subscription shaping to token-balance semantics.
- Modify: `app/api/access-passes/create-free/route.ts`
  Grants a one-time free token balance without duration semantics.
- Modify: `app/api/stripe/webhook/route.ts`
  Merges paid token purchases into the user balance instead of replacing a time-limited pass.
- Modify: `lib/payment/stripe-config.ts`
  Converts pricing card config to token-only messaging.
- Modify: `lib/i18n/translations/en.json`
- Modify: `lib/i18n/translations/zh.json`
  Removes time-based and feature-based plan copy.
- Modify: `components/client-components/quota-display.tsx`
  Shows only token plan information in account subscription UI.
- Modify: `components/client-components/compact-plan-display.tsx`
  Shows only token plan information in compact subscription UI.
- Test: `server/quota.test.ts`
- Test: `app/api/stripe/webhook/route.test.ts`
- Test: `components/client-components/__tests__/quota-display.test.tsx`
- Test: `components/client-components/__tests__/compact-plan-display.test.tsx`

### Task 1: Lock Token Amounts in Tests

**Files:**
- Modify: `server/quota.test.ts`
- Modify: `app/api/stripe/webhook/route.test.ts`

- [ ] **Step 1: Write failing tests for the new token amounts**

Add or update assertions so the suite expects:

```ts
FREE: 50_000
LITE: 500_000
PRO: 1_000_000
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test server/quota.test.ts app/api/stripe/webhook/route.test.ts`
Expected: FAIL on outdated token quota expectations and time-based behavior.

- [ ] **Step 3: Update quota constants**

Modify `lib/payment/quota.ts` so `quota_chat_tokens` matches the new plan amounts.

- [ ] **Step 4: Re-run tests**

Run: `pnpm test server/quota.test.ts app/api/stripe/webhook/route.test.ts`
Expected: still FAIL because purchase semantics and active-plan semantics are not updated yet.

### Task 2: Make Active Subscription Depend on Remaining Tokens

**Files:**
- Modify: `server/quota.ts`
- Test: `server/quota.test.ts`

- [ ] **Step 1: Write failing tests for active token-balance lookup**

Add tests that cover:

```ts
// latest pass with remaining tokens is active
// pass with exhausted tokens is inactive
// token plans remain active even if end_at is old
```

- [ ] **Step 2: Run the focused test**

Run: `pnpm test server/quota.test.ts`
Expected: FAIL because `getActiveAccessPass` still filters on `end_at`.

- [ ] **Step 3: Implement minimal logic**

Update `getActiveAccessPass` and any subscription shaping helpers so the active plan is determined by remaining token balance. Keep the existing response shape for now, but make the data token-centric.

- [ ] **Step 4: Run the focused test again**

Run: `pnpm test server/quota.test.ts`
Expected: PASS for token-balance lookup tests.

### Task 3: Convert Free Grant to One-Time Token Balance

**Files:**
- Modify: `app/api/access-passes/create-free/route.ts`
- Test: existing route test if present, otherwise add a focused route test

- [ ] **Step 1: Write a failing test**

Cover:

```ts
// first-time user gets 50_000 tokens
// previous pass history blocks a second free claim
// implementation does not depend on a 3-day trial message
```

- [ ] **Step 2: Run the test to confirm failure**

Run: `pnpm test app/api/access-passes/create-free/route.test.ts`
Expected: FAIL if the test exists or after adding the new test.

- [ ] **Step 3: Implement minimal free-grant behavior**

Keep the one-time history check. Write the free token amount from `QUOTA.FREE`. Stop relying on “trial” semantics in comments and messages.

- [ ] **Step 4: Re-run the free route test**

Run: `pnpm test app/api/access-passes/create-free/route.test.ts`
Expected: PASS

### Task 4: Make Paid Purchases Accumulate Token Balance

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`
- Test: `app/api/stripe/webhook/route.test.ts`

- [ ] **Step 1: Write failing webhook tests**

Add or update tests for:

```ts
// Lite purchase grants 500_000 tokens
// Pro purchase grants 1_000_000 tokens
// repeat purchase adds to existing remaining balance
// webhook no longer deletes active balance records just because they are "current"
```

- [ ] **Step 2: Run the webhook test**

Run: `pnpm test app/api/stripe/webhook/route.test.ts`
Expected: FAIL on old duration and replacement semantics.

- [ ] **Step 3: Implement minimal webhook changes**

Use the existing access pass record if it still has remaining tokens. Increase `quota_chat_tokens` by the purchased amount, preserve `used_chat_tokens`, and set `plan` to the newly purchased plan. If no active balance exists, insert a new record.

- [ ] **Step 4: Re-run the webhook test**

Run: `pnpm test app/api/stripe/webhook/route.test.ts`
Expected: PASS

### Task 5: Simplify Pricing Copy and Card Config

**Files:**
- Modify: `lib/payment/stripe-config.ts`
- Modify: `lib/i18n/translations/en.json`
- Modify: `lib/i18n/translations/zh.json`
- Test: `components/client-components/__tests__/pricing-card.test.tsx` if impacted

- [ ] **Step 1: Write or update a failing UI copy test if one exists**

Expect pricing content to reference only token amounts and plan names, not resume optimization, PDF export, highlight suggestions, or duration-based access.

- [ ] **Step 2: Run the test**

Run: `pnpm test components/client-components/__tests__/pricing-card.test.tsx`
Expected: FAIL if copy assertions exist.

- [ ] **Step 3: Implement minimal copy changes**

Update pricing config and translations so each plan presents:

```ts
FREE -> 50,000 tokens
LITE -> 500,000 tokens
PRO -> 1,000,000 tokens
```

Keep prices intact unless product requirements change them separately.

- [ ] **Step 4: Re-run affected pricing tests**

Run: `pnpm test components/client-components/__tests__/pricing-card.test.tsx`
Expected: PASS or unchanged if no text assertions exist.

### Task 6: Remove Non-Token Quotas from Subscription UI

**Files:**
- Modify: `components/client-components/quota-display.tsx`
- Modify: `components/client-components/compact-plan-display.tsx`
- Modify: `lib/i18n/translations/en.json`
- Modify: `lib/i18n/translations/zh.json`
- Test: `components/client-components/__tests__/quota-display.test.tsx`
- Test: `components/client-components/__tests__/compact-plan-display.test.tsx`

- [ ] **Step 1: Write failing component tests**

Add assertions that the UI:

```ts
// shows total, used, and remaining tokens
// does not show block optimization counts
// does not show motivation letter counts
// does not show duration-based plan names
```

- [ ] **Step 2: Run the component tests**

Run: `pnpm test components/client-components/__tests__/quota-display.test.tsx components/client-components/__tests__/compact-plan-display.test.tsx`
Expected: FAIL on old UI assumptions.

- [ ] **Step 3: Implement minimal UI changes**

Render token-only plan details. Keep navigation actions intact. Rename plan labels away from `freeTrial`, `lite14Days`, and `pro30Days`.

- [ ] **Step 4: Re-run the component tests**

Run: `pnpm test components/client-components/__tests__/quota-display.test.tsx components/client-components/__tests__/compact-plan-display.test.tsx`
Expected: PASS

### Task 7: Run Verification

**Files:**
- No code changes

- [ ] **Step 1: Run the targeted test suite**

Run:

```bash
pnpm test server/quota.test.ts
pnpm test app/api/stripe/webhook/route.test.ts
pnpm test components/client-components/__tests__/quota-display.test.tsx
pnpm test components/client-components/__tests__/compact-plan-display.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run broader regression checks if pricing-card or free-pass tests changed**

Run:

```bash
pnpm test components/client-components/__tests__/pricing-card.test.tsx
pnpm test app/api/access-passes/create-free/route.test.ts
```

Expected: PASS where files exist.

- [ ] **Step 3: Run formatting/lint if required by touched files**

Run: `pnpm lint`
Expected: PASS or only unrelated pre-existing issues.

- [ ] **Step 4: Perform UI regression on pricing/subscription flows**

Use the project’s Playwright guidance to verify:

- pricing page renders token-only plans
- free claim flow still works
- paid checkout entry still works
- subscription display shows token-only usage

