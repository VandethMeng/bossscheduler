#!/usr/bin/env bash
# One-time setup on an EC2 instance (Amazon Linux 2023 or Ubuntu).
# Run on the server after cloning the repo:
#   bash deploy/ec2-setup.sh
set -euo pipefail

APP_ROOT="${APP_ROOT:-$HOME/bossscheduler}"

echo "==> Installing Node.js 20 (if missing)..."
if ! command -v node >/dev/null 2>&1; then
  if command -v dnf >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs git
  elif command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs git
  else
    echo "Unsupported OS. Install Node.js 20 and git manually."
    exit 1
  fi
fi

echo "==> Installing PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

echo "==> Creating backend .env (edit this file with real values)..."
mkdir -p "${APP_ROOT}/backend/data"
if [ ! -f "${APP_ROOT}/backend/.env" ]; then
  cp "${APP_ROOT}/backend/.env.example" "${APP_ROOT}/backend/.env"
  echo "Created ${APP_ROOT}/backend/.env — update it before starting the API."
fi

echo "==> Building backend..."
cd "${APP_ROOT}/backend"
npm ci
npm run build

echo "==> Starting API with PM2..."
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup | tail -n 1 | bash || true

echo ""
echo "Setup complete."
echo "1. Edit ${APP_ROOT}/backend/.env (JWT_SECRET, S3, Telegram, CORS_ORIGIN)"
echo "2. pm2 restart boss-scheduler-api"
echo "3. Configure Nginx using deploy/nginx-api.conf.example"
