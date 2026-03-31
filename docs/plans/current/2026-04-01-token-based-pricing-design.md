# Token-Based Pricing Design

**Date:** 2026-04-01

**Goal:** Simplify pricing into three token-only plans and remove time-based and feature-based plan messaging from the product.

## Context

The codebase already tracks chat token consumption end-to-end:

- `app/api/chat/resume/route.ts` checks chat quota before model execution and records token usage after each response.
- `server/quota.ts` builds token quota data from `access_passes.quota_chat_tokens` and `access_passes.used_chat_tokens`.
- `app/api/chat-sessions/[id]/token-usage/route.ts` and `app/api/user/subscription/route.ts` expose token usage to the frontend.

The current mismatch is in the product model and presentation:

- pricing copy still sells feature bundles and limited-time passes
- Stripe webhook still creates time-limited passes
- account UI still shows non-token quotas such as resume optimization and motivation letter usage

## Product Decision

Adopt strict token-balance pricing.

Plans:

- `FREE`: 50,000 tokens
- `LITE`: 500,000 tokens
- `PRO`: 1,000,000 tokens

Rules:

- plans are defined by token amount only
- plans are not time-limited
- `FREE` can only be claimed once per user
- `LITE` and `PRO` can be purchased repeatedly
- repeated paid purchases should add token balance instead of overwriting the remaining balance

## Non-Goals

- no ledger or wallet refactor in this iteration
- no removal of the underlying `access_passes` table
- no rewrite of the existing chat token accounting pipeline
- no removal of old quota columns from the database schema in this iteration

## Proposed Implementation

### 1. Keep `access_passes` as the storage model

Reuse the existing `access_passes` table as the active token balance record.

Interpretation changes:

- `quota_chat_tokens` = total token balance granted so far
- `used_chat_tokens` = total consumed tokens
- `end_at` is no longer used to determine validity for token plans

This avoids a billing-system rewrite while still delivering a real token-balance product.

### 2. Change active plan selection

`getActiveAccessPass` currently filters on `end_at > now()`. That must change.

The active plan should instead be the latest user record that still has remaining tokens:

- `quota_chat_tokens > used_chat_tokens`
- newest matching record wins

This makes token balance, not time, the source of truth.

### 3. Change purchase semantics

Current behavior deletes active passes and inserts a new one with a fixed duration.

New behavior:

- `FREE`: create a single one-time token grant if the user has never had any pass
- `LITE`/`PRO`: if the user already has an active token balance record, increase its `quota_chat_tokens` by the purchased amount and update `plan` to the most recently purchased plan
- if no active record exists, create a new record with the purchased token amount

This preserves unused tokens across repeat purchases.

### 4. Remove time-based product messaging

Pricing and subscription UI should only show:

- plan name
- price
- total tokens
- used tokens
- remaining tokens

Remove all plan messaging around:

- resume optimization counts
- motivation letter counts
- PDF export
- highlight suggestions
- 3 / 14 / 30 day validity
- “full features” plan framing

### 5. Keep old quota columns inert

Existing resume-related quota columns remain in the schema for compatibility, but the pricing model and account UI stop presenting them as plan entitlements.

This keeps the current change bounded. A later cleanup can remove dead plan quota logic if desired.

## Affected Areas

### Backend

- `lib/payment/quota.ts`
- `server/quota.ts`
- `app/api/access-passes/create-free/route.ts`
- `app/api/stripe/webhook/route.ts`

### Frontend

- `lib/payment/stripe-config.ts`
- `app/pricing/page.tsx`
- `components/client-components/pricing-card.tsx`
- `components/client-components/quota-display.tsx`
- `components/client-components/compact-plan-display.tsx`
- `lib/i18n/translations/en.json`
- `lib/i18n/translations/zh.json`

### Tests

- `server/quota.test.ts`
- `app/api/stripe/webhook/route.test.ts`
- `components/client-components/__tests__/quota-display.test.tsx`
- `components/client-components/__tests__/compact-plan-display.test.tsx`
- any pricing-card or free-pass tests affected by copy or semantics changes

## Risks

### Purchase merge behavior

If webhook logic still replaces passes instead of adding balance, users can lose unused tokens on repeat purchase.

### “Active plan” lookup

If any code path still depends on `end_at`, token plans may appear inactive even when balance remains.

### UI mismatch

If account UI still renders old quotas, the product will continue to feel like a feature bundle instead of a token plan.

## Validation

The implementation is correct when:

- chat requests are blocked only when token balance is exhausted
- free users receive exactly 50,000 tokens once
- Lite purchases add 500,000 tokens
- Pro purchases add 1,000,000 tokens
- repeated paid purchases do not erase unused tokens
- pricing page and account UI show token-based plans only
- no visible plan copy references feature bundles or duration-based access
