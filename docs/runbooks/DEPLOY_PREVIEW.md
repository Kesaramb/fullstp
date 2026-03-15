# Runbook: Deploy Preview

## When to Use
To test a build in a Docker container before production deployment.

## Prerequisites
- Docker installed and running
- All checks pass (`npm run verify`)

## Steps

1. **Run preview deployment**
   ```bash
   npm run deploy:preview
   ```
   This will:
   - Run the full verify pipeline
   - Build a Docker image tagged with timestamp
   - Start a container on port 3001

2. **Verify the preview**
   - Homepage: http://localhost:3001
   - Admin panel: http://localhost:3001/admin
   - Check that blocks render correctly
   - Check that admin panel loads and is functional

3. **Clean up when done**
   ```bash
   docker stop fullstp-preview-{tag}
   docker rm fullstp-preview-{tag}
   ```

## Troubleshooting

### Container exits immediately
- Check logs: `docker logs fullstp-preview-{tag}`
- Common: missing PAYLOAD_SECRET env var
- Common: SQLite file permissions

### Admin panel 404
- Ensure `(payload)` route group exists in `src/app/`
- Check that `@payloadcms/next` is installed

### Port already in use
- Change port: run with `-p 3002:3000` instead
- Or stop existing container on port 3001
