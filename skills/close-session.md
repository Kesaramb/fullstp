# Skill: Close Session

**Purpose:** Clean up at the end of a working session.

## Prerequisites

- Current task is complete or explicitly paused

## Steps

1. Run `npm run verify` -- must pass. If it fails, fix issues before closing.
2. Update `docs/context/progress.md`:
   - Mark completed items as done
   - Note any items left in progress
   - Add "Next steps" if work continues in a future session
3. If any new patterns or lessons were discovered during the session, append
   them to `docs/context/lessons.md` with the date and a short description.
4. Run `npm run generate:types` to ensure generated types are fresh.
5. Present a session summary to the user:
   - What was accomplished
   - Files created or modified
   - Current build/test status
   - Recommended next steps

## Verification

- `npm run verify` passes.
- `docs/context/progress.md` is up to date.
- Types are freshly generated.
- Session summary was presented.
