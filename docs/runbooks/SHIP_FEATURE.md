# Runbook: Ship Feature

## When to Use
When a feature is complete and ready to be committed.

## Pre-Flight Checklist
- [ ] Feature works as intended
- [ ] No unrelated changes in diff
- [ ] Tests pass

## Steps

1. **Run verify pipeline**
   ```bash
   npm run verify
   ```
   Must return ALL CHECKS PASSED. If not, fix issues first.

2. **Review changed files**
   ```bash
   npm run changed-files
   ```
   Confirm only expected files are modified.

3. **Stage specific files** (never use `git add .`)
   ```bash
   git add src/blocks/NewBlock/config.ts src/blocks/NewBlock/Component.tsx
   ```

4. **Commit with conventional message**
   ```bash
   git commit -m "feat: add NewBlock with heading and CTA fields"
   ```

5. **Push branch**
   ```bash
   git push -u origin feature/task-name
   ```

6. **Update progress**
   Edit `docs/context/progress.md` — move task from In Progress to Done.

## If Verify Fails
See `docs/runbooks/FIX_BUILD.md`
