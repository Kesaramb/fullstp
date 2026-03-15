# Runbook: Fix Build

## When to Use
When `npm run verify` fails at any step.

## Diagnosis by Step

### Step 1 Failure: Payload Type Generation
- Check `payload.config.ts` is valid
- Ensure all collections/globals referenced exist
- Run `npm run generate:types` standalone for error details

### Step 2 Failure: TypeScript
- Read the exact error message — it shows file and line number
- Common causes: missing import, wrong type, stale payload-types.ts
- Fix: correct the type error, then re-run `npm run generate:types`

### Step 3 Failure: ESLint
- Read the linting errors
- Auto-fix where possible: `npx next lint --fix`
- Manual fix for remaining issues

### Step 4 Failure: Build
- Read the build error output
- Common causes: import cycle, missing module, SSR error in client component
- For SSR issues: check if component needs `'use client'` directive
- For missing modules: check import paths and `@/` aliases

### Step 5 Failure: Tests
- Read the test failure output
- Run specific test: `npx vitest run tests/blocks/hero.test.tsx`
- Check if fixture data matches current block fields
- Update fixtures in `tests/fixtures/blocks.ts` if block schema changed

## General Rules
- Fix one error at a time, re-run verify after each fix
- Never skip a failing step
- If stuck after 3 attempts, document the issue in `docs/context/progress.md` as Blocked
