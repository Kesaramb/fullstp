# Skill: Plan Feature

**Purpose:** Create a structured plan for a new feature before writing any code.

## Prerequisites

- Session initialized via `start-session` skill
- Task assignment received from user

## Steps

1. Create a feature branch:
   ```bash
   git checkout -b feature/{task-name}
   ```
2. Create a plan file at `plans/{task-name}.md` with this structure:
   ```markdown
   # Plan: {Task Name}
   ## Goal
   One-sentence description of what this feature delivers.
   ## Steps
   1. Step one (3-7 steps total)
   2. ...
   ## Files to Modify
   - src/blocks/... (reason)
   - src/collections/... (reason)
   ## Verification Criteria
   - [ ] npm run verify passes
   - [ ] Specific acceptance criteria
   ```
3. Present the plan to the user for review.
4. Wait for explicit approval before writing any code.
5. If changes are requested, update the plan and re-present.

## Verification

- Branch exists and is checked out.
- Plan file exists at `plans/{task-name}.md`.
- Plan has all four sections: Goal, Steps, Files to Modify, Verification Criteria.
- User has approved the plan.
