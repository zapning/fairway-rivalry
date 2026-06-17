#!/usr/bin/env bash
# Rebuild dist/ from the canonical source files.
# Run this before redeploying so dist/ matches the latest changes.

set -e
cd "$(dirname "$0")"

mkdir -p dist
cp "Golf Dashboard.html"   dist/index.html
cp supabase-bridge.js      dist/supabase-bridge.js
cp manifest.json           dist/manifest.json
cp icon-192.svg            dist/icon-192.svg
cp icon-512.svg            dist/icon-512.svg
cp icon-192.png            dist/icon-192.png             2>/dev/null || true
cp icon-512.png            dist/icon-512.png             2>/dev/null || true
cp icon-maskable-512.png   dist/icon-maskable-512.png    2>/dev/null || true
cp apple-touch-icon.png    dist/apple-touch-icon.png     2>/dev/null || true
cp FGL.png                 dist/FGL.png                  2>/dev/null || true
cp logo-header.png         dist/logo-header.png          2>/dev/null || true
cp sw.js                   dist/sw.js 2>/dev/null || true

# Cloudflare Pages config (only created on first run)
[ -f dist/_headers ] || cat > dist/_headers <<EOF
/*
  Cache-Control: public, max-age=0, must-revalidate
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
EOF
[ -f dist/_redirects ] || echo "/*    /index.html   200" > dist/_redirects

echo "Built dist/ ($(du -sh dist | cut -f1))"
ls -la dist/
