---
name: HestiaCP Server Management
description: CLI reference for HestiaCP web hosting panel — web domains, databases, SSL, proxy templates, and deployment patterns used by FullStop factory
version: 1.0.0
---

# HestiaCP CLI Reference for FullStop Deployments

HestiaCP is the open-source control panel managing web domains, databases, SSL, and nginx on the FullStop production server. All commands run as root via SSH. The binary path is `/usr/local/hestia/bin/`.

## Web Domain Lifecycle

```bash
# Create virtual host (auto-assigns www alias unless "none" specified)
v-add-web-domain USER DOMAIN [IP] [RESTART] [ALIASES] [PROXY_EXTENSIONS]
# Example: v-add-web-domain admin lotus-lane.167.86.81.161.nip.io 167.86.81.161

# Delete domain and all configs (nginx, aliases, SSL, FTP)
v-delete-web-domain USER DOMAIN [RESTART]

# Suspend domain (returns 410 Gone, preserves data — reversible)
v-suspend-web-domain USER DOMAIN [RESTART]

# Restore a suspended domain
v-unsuspend-web-domain USER DOMAIN [RESTART]

# Regenerate nginx configs from templates (run after proxy/SSL changes)
v-rebuild-web-domain USER DOMAIN
# IMPORTANT: Always run after v-change-web-domain-proxy-tpl or SSL changes

# List all domains (formats: plain, json, csv, shell)
v-list-web-domains USER [FORMAT]
```

## SSL / TLS (Let's Encrypt)

```bash
# Issue Let's Encrypt certificate (requires DNS resolving to server IP)
v-add-letsencrypt-domain USER DOMAIN [ALIASES] [MAIL]
# NOTE: nip.io domains resolve automatically — LE works out of the box
# Rate limit: 50 certs per registered domain per week

# Force HTTPS redirect (301 from HTTP to HTTPS)
v-add-web-domain-ssl-force USER DOMAIN [RESTART] [QUIET]

# Enable HSTS header (tells browsers to always use HTTPS)
v-add-web-domain-ssl-hsts USER DOMAIN [RESTART] [QUIET]

# Remove SSL certificate
v-delete-web-domain-ssl USER DOMAIN [RESTART]

# Manual SSL (provide your own cert files)
v-add-web-domain-ssl USER DOMAIN SSL_DIR [SSL_HOME] [RESTART]
```

**FullStop SSL sequence** (run after domain is rebuilt and app is running):
```bash
v-add-letsencrypt-domain admin ${domain}
v-add-web-domain-ssl-force admin ${domain}
```

## Proxy Templates (Nginx)

```bash
# Apply a proxy template to domain
v-change-web-domain-proxy-tpl USER DOMAIN TEMPLATE [EXTENSIONS] [RESTART]
# Example: v-change-web-domain-proxy-tpl admin my-app.nip.io nodeapp3012

# Enable proxy support for a domain
v-add-web-domain-proxy USER DOMAIN [TEMPLATE] [EXTENSIONS] [RESTART]
```

**Template location:** `/usr/local/hestia/data/templates/web/nginx/`

Each template has two files:
- `{name}.tpl` — HTTP config
- `{name}.stpl` — HTTPS config

**FullStop per-port template creation pattern:**
```bash
# Copy base template and replace port
cp /usr/local/hestia/data/templates/web/nginx/nodeapp.tpl \
   /usr/local/hestia/data/templates/web/nginx/nodeapp${PORT}.tpl
cp /usr/local/hestia/data/templates/web/nginx/nodeapp.stpl \
   /usr/local/hestia/data/templates/web/nginx/nodeapp${PORT}.stpl
sed -i "s/proxy_pass http:\/\/127.0.0.1:3001/proxy_pass http:\/\/127.0.0.1:${PORT}/" \
   /usr/local/hestia/data/templates/web/nginx/nodeapp${PORT}.tpl
sed -i "s/proxy_pass http:\/\/127.0.0.1:3001/proxy_pass http:\/\/127.0.0.1:${PORT}/" \
   /usr/local/hestia/data/templates/web/nginx/nodeapp${PORT}.stpl
# Then apply:
v-change-web-domain-proxy-tpl admin ${DOMAIN} nodeapp${PORT}
```

## Database Management

```bash
# Create database (HestiaCP prefixes user: admin + mydb → admin_mydb)
v-add-database USER DATABASE DBUSER DBPASS [TYPE] [HOST] [CHARSET]
# Example: v-add-database admin lotus_lane lotus_lane 'SecurePass123' pgsql
# Creates: database=admin_lotus_lane, user=admin_lotus_lane

# Delete database (use full prefixed name)
v-delete-database USER DATABASE
# Example: v-delete-database admin admin_lotus_lane

# Reset database password
v-change-database-password USER DATABASE DBPASS
# Example: v-change-database-password admin admin_lotus_lane 'NewPass456'
```

**Connection string format:** `postgresql://admin_{slug}:{password}@localhost:5432/admin_{slug}`

## Domain Aliases

```bash
# Add alias domains (comma-separated)
v-add-web-domain-alias USER DOMAIN ALIASES [RESTART]

# Remove an alias
v-delete-web-domain-alias USER DOMAIN ALIAS [RESTART]
```

## FullStop Deploy Sequence

The standard 12-step deployment:

1. `v-add-database admin {slug} {slug} '{pass}' pgsql`
2. `v-add-web-domain admin {domain} {ip}`
3. Create nginx proxy template (copy + sed + `v-change-web-domain-proxy-tpl`)
4. Clone golden-image application files
5. Write `.env` and `ecosystem.config.cjs`
6. `pnpm install`
7. `pnpm build` (standalone output)
8. Copy static assets to `.next/standalone/`
9. `npx payload migrate`
10. `pm2 start ecosystem.config.cjs && pm2 save`
11. Health check + create admin user
12. `chown -R admin:admin /home/admin/web/{domain}/`
13. `v-rebuild-web-domain admin {domain}`
14. `v-add-letsencrypt-domain admin {domain}` (best-effort)
15. `v-add-web-domain-ssl-force admin {domain}` (if SSL succeeded)

**Cleanup on failure** (reverse order):
```bash
pm2 delete "${domain}" 2>/dev/null || true
v-delete-web-domain admin ${domain}
v-delete-database admin admin_${slug}
```

## Common Error Strings

| Error | Meaning | Recovery |
|-------|---------|----------|
| `Error: web domain {d} exists` | Domain already registered | Skip or delete first |
| `Error: database admin_{d} exists` | DB already created | Reset password instead |
| `Error: letsencrypt verification failed` | DNS not resolving or rate limited | Skip SSL, log warning |
| `Error: web domain {d} doesn't exist` | Operating on missing domain | Skip cleanup step |
| `Error: user 'admin' doesn't exist` | HestiaCP user issue | Check HestiaCP install |

## Important Notes

- All domain files live at `/home/admin/web/{domain}/`
- Node app files at `/home/admin/web/{domain}/nodeapp/`
- PM2 processes run as root, files owned by admin
- Always `v-rebuild-web-domain` after proxy or SSL changes
- nip.io provides automatic wildcard DNS: `*.{IP}.nip.io` → `{IP}`
- Port range: 3001-4000 (first unused port assigned per tenant)
