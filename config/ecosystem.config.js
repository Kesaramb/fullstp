/**
 * PM2 Ecosystem Config — Phase 1 (0-100 tenants)
 *
 * Each tenant is a separate PM2 process running the same Golden Image code
 * on a unique port (3001-4000). Caddy routes by hostname to localhost:{port}.
 *
 * Usage:
 *   pm2 start config/ecosystem.config.js   # start all configured tenants
 *   pm2 reload config/ecosystem.config.js  # zero-downtime reload
 *   pm2 delete tenant-acme                 # remove a specific tenant
 *
 * Port allocation:
 *   Port 3000 — reserved (dev)
 *   Port 3001-4000 — tenant pool (1000 slots)
 *
 * Provisioning:
 *   Use scripts/provision-tenant.sh to add tenants dynamically.
 *   That script appends an entry to this file and calls `pm2 reload`.
 */

module.exports = {
  apps: [
    // ── Tenant entries are managed by scripts/provision-tenant.sh ──
    // Each entry follows this template:
    //
    // {
    //   name: 'tenant-{TENANT_ID}',
    //   script: '.next/standalone/server.js',
    //   cwd: '/var/fullstp/tenants/{TENANT_ID}',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   max_memory_restart: '512M',
    //   env: {
    //     NODE_ENV: 'production',
    //     PORT: {PORT},
    //     HOSTNAME: '0.0.0.0',
    //     PAYLOAD_SECRET: '{PAYLOAD_SECRET}',
    //     DATABASE_URI: 'file:/var/fullstp/tenants/{TENANT_ID}/data/database.db',
    //     NEXT_PUBLIC_SITE_URL: 'https://{DOMAIN}',
    //     R2_ENDPOINT: process.env.R2_ENDPOINT,
    //     R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    //     R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    //     R2_BUCKET: process.env.R2_BUCKET,
    //   },
    //   error_file: '/var/log/fullstp/{TENANT_ID}/err.log',
    //   out_file: '/var/log/fullstp/{TENANT_ID}/out.log',
    //   time: true,
    // },
  ],
}
