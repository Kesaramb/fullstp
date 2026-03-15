# Runbook: Start Session

## When to Use
At the beginning of every new AI agent session.

## Steps

1. **Read context**
   ```
   Read docs/context/activeContext.md
   Read docs/context/rules.md
   Read docs/context/progress.md
   ```

2. **Check environment**
   ```bash
   npm run status
   ```

3. **Verify health** (if first session or after long gap)
   ```bash
   npm run doctor
   ```

4. **Present state to user**
   - Current branch
   - Build health (clean/dirty)
   - What's in progress (from progress.md)
   - What's blocked

5. **Wait for task assignment**

## If Environment Is Unhealthy
- Run `npm install` if node_modules missing
- Copy `.env.example` to `.env` if .env missing
- Run `npm run doctor` again to confirm fix
