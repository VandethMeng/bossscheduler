#!/usr/bin/env bash
# Used by GitHub Actions and manual deploys on the EC2 server.
set -euo pipefail

APP_ROOT="${APP_ROOT:-$HOME/bossscheduler}"
BRANCH="${BRANCH:-main}"

echo "==> Deploying from ${APP_ROOT} (branch: ${BRANCH})"

cd "${APP_ROOT}"
git fetch origin
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

cd backend
npm ci
npm run build

if pm2 describe boss-scheduler-api >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --env production --update-env
else
  pm2 start ecosystem.config.cjs --env production
fi
pm2 save

echo "==> Health check..."
sleep 2
curl -sf "http://127.0.0.1:${PORT:-5000}/health" >/dev/null
echo "Deploy complete."
