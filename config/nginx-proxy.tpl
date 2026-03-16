# HestiaCP Nginx Proxy Template for FullStop Tenants
#
# Deploy to: /usr/local/hestia/data/templates/web/nginx/
# Filename:  proxy_{PORT}.tpl  (e.g., proxy_3001.tpl, proxy_3042.tpl)
#
# Usage:
#   v-add-web-domain {user} {domain}
#   v-change-web-domain-tpl {user} {domain} proxy_{PORT}
#   v-add-web-domain-ssl {user} {domain}
#
# HestiaCP variables (auto-replaced):
#   %ip%           — Server IP address
#   %web_port%     — HTTP port (80)
#   %domain_idn%   — Primary domain
#   %alias_idn%    — Domain aliases
#   %docroot%      — Document root path

server {
    listen      %ip%:%web_port%;
    server_name %domain_idn% %alias_idn%;

    error_log   /var/log/%web_system%/domains/%domain%.error.log error;

    location / {
        proxy_pass http://127.0.0.1:%proxy_port%;
        proxy_http_version 1.1;

        # WebSocket support (for HMR in dev, future real-time features)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Forward real client info
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;

        # Timeouts — Next.js SSR can take a moment on cold start
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets — serve directly from .next/static for performance
    location /_next/static/ {
        alias %docroot%/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Public assets
    location /public/ {
        alias %docroot%/public/;
        expires 30d;
    }

    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
    }

    location ~ /\.ht    { return 404; }
    location ~ /\.svn/  { return 404; }
    location ~ /\.git   { return 404; }
    location ~ /\.env   { return 404; }
}
