#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p .secrets cookies
chmod 700 .secrets cookies
for name in api_token setup_token; do
  if [ ! -s ".secrets/$name" ]; then
    openssl rand -hex 32 > ".secrets/$name"
    chmod 444 ".secrets/$name"
  fi
done
docker compose -p media-saver -f compose.yaml -f deploy/compose.npm.yaml up -d --build
