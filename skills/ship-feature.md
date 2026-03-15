# Skill: Ship Feature

**Purpose:** Ship a completed feature from a feature branch.

## Prerequisites

- All planned work for the feature is complete
- Currently on the feature branch

## Steps

1. Run `npm run verify` -- must pass with zero errors.
2. Run `npm run changed-files` to review the full diff. Confirm only expected
   files are modified. No secrets, no unrelated changes.
3. Stage only the changed files explicitly:
   ```bash
   git add src/blocks/{Name}/config.ts src/blocks/{Name}/Component.tsx ...
   ```
   Never use `git add .` or `git add -A`.
4. Commit with a descriptive conventional message:
   ```bash
   git commit -m "feat: {short description of what was added/changed}"
   ```
5. Push the branch:
   ```bash
   git push -u origin feature/{task-name}
   ```
6. If merging to `main` is appropriate, open a PR. Include:
   - What changed and why
   - How to verify (steps to test)
   - Any guarded actions that were taken
7. Update `docs/context/progress.md` -- mark the task as shipped.

## Verification

- `npm run verify` passed before committing.
- Commit message follows conventional format (`feat:`, `fix:`, `chore:`).
- Branch is pushed to remote.
- `docs/context/progress.md` is updated.
