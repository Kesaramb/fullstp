# Skill: Start Session

**Purpose:** Initialize a new micro-sprint session and present current project state.

## Prerequisites

- Access to the project repo
- `npm install` has been run

## Steps

1. Read `AGENTS.md` to load governance rules.
2. Read `docs/context/activeContext.md` and `docs/context/rules.md`.
3. Run `npm run status` and capture output.
4. Read `docs/context/progress.md` to understand current state.
5. Present the following to the user:
   - Current branch name (`git branch --show-current`)
   - Build health (pass/fail from status output)
   - What is currently in progress
   - Any blockers or open items
6. Wait for task assignment. Do not begin work until a task is given.

## Verification

- All context files were read without errors.
- Status command completed successfully.
- Summary was presented clearly.
