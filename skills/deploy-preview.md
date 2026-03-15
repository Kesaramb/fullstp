# Skill: Deploy Preview

**Purpose:** Build and deploy a preview Docker image for stakeholder review.

## Prerequisites

- Feature branch is up to date and pushed
- `npm run verify` passes
- Docker is available on the host

## Steps

1. Run `npm run verify` -- must pass before building.
2. Determine a tag for the image (use branch name or short commit hash):
   ```bash
   TAG=$(git rev-parse --short HEAD)
   ```
3. Build the Docker image:
   ```bash
   docker build -t fullstp-tenant:$TAG .
   ```
4. Run the container with test configuration:
   ```bash
   docker run -d --name preview-$TAG \
     -p 3000:3000 \
     -e DATABASE_URI=file:./data/preview.db \
     -e PAYLOAD_SECRET=preview-secret-$(date +%s) \
     fullstp-tenant:$TAG
   ```
5. Verify the deployment:
   - Container starts without errors (`docker logs preview-$TAG`)
   - Admin panel loads at `http://localhost:3000/admin`
   - Homepage renders at `http://localhost:3000`
6. Report the preview URL and container ID to the user.
7. Remind user: this is a preview only. Production deployment is a guarded
   action requiring explicit approval through the deployment flow.

## Verification

- Docker image built successfully.
- Container is running and healthy.
- Admin panel and homepage are accessible.
- Preview URL was reported to the user.
