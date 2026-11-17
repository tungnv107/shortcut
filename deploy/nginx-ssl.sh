#!/bin/sh
# Adapter for the existing Nginx Proxy Manager installation on this VPS.
set -eu
MS_DOMAIN=media-saver.161.118.222.102.sslip.io
MS_NPM=npm-app-1
MS_DATA=/home/ubuntu/npm/data
MS_CUSTOM="$MS_DATA/nginx/custom"
MS_CONFIG="$MS_CUSTOM/media-saver-servers.conf"
MS_INCLUDE='include /data/nginx/custom/media-saver-servers.conf;'
MS_BACKUP="/home/ubuntu/media-saver/backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$MS_BACKUP" "$MS_CUSTOM"
cp -p "$MS_CUSTOM/http.conf" "$MS_BACKUP/http.conf"
if [ -f "$MS_CONFIG" ]; then cp -p "$MS_CONFIG" "$MS_BACKUP/media-saver-servers.conf"; fi
if ! grep -Fqx "$MS_INCLUDE" "$MS_CUSTOM/http.conf"; then printf '\n%s\n' "$MS_INCLUDE" >> "$MS_CUSTOM/http.conf"; fi
cat > "$MS_CONFIG" <<'NGINX'
server {
  listen 80;
  server_name media-saver.161.118.222.102.sslip.io;
  access_log off;
  location ^~ /.well-known/acme-challenge/ { root /data/letsencrypt-acme-challenge; }
  location / { return 404; }
}
NGINX
if ! docker exec "$MS_NPM" nginx -t; then
  cp -p "$MS_BACKUP/http.conf" "$MS_CUSTOM/http.conf"
  if [ -f "$MS_BACKUP/media-saver-servers.conf" ]; then cp -p "$MS_BACKUP/media-saver-servers.conf" "$MS_CONFIG"; fi
  exit 1
fi
docker exec "$MS_NPM" nginx -s reload
docker exec "$MS_NPM" /opt/certbot/bin/certbot certonly --non-interactive --agree-tos --register-unsafely-without-email \
  --webroot -w /data/letsencrypt-acme-challenge --cert-name media-saver -d "$MS_DOMAIN"
cat > "$MS_CONFIG" <<'NGINX'
server {
  listen 80;
  server_name media-saver.161.118.222.102.sslip.io;
  access_log off;
  location ^~ /.well-known/acme-challenge/ { root /data/letsencrypt-acme-challenge; }
  location / { return 301 https://$host$request_uri; }
}
server {
  listen 443 ssl;
  server_name media-saver.161.118.222.102.sslip.io;
  ssl_certificate /etc/letsencrypt/live/media-saver/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/media-saver/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  access_log off;
  client_max_body_size 16k;
  resolver 127.0.0.11 valid=30s ipv6=off;
  location / {
    set $media_saver_upstream http://media-saver:8787;
    proxy_pass $media_saver_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_buffering off;
    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;
  }
}
NGINX
docker exec "$MS_NPM" nginx -t
docker exec "$MS_NPM" nginx -s reload
cat > /etc/cron.d/media-saver-cert <<'CRON'
17 4 * * * root docker exec npm-app-1 /opt/certbot/bin/certbot renew --cert-name media-saver --quiet --deploy-hook "nginx -s reload"
CRON
chmod 644 /etc/cron.d/media-saver-cert
printf 'HTTPS ready: https://%s\n' "$MS_DOMAIN"
