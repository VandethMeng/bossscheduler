# Production Deployment & CI/CD

This guide sets up **automatic deployment** when you push to the `main` branch on GitHub.

| Part | Where it runs | Why |
|------|----------------|-----|
| **Frontend** | AWS S3 (+ optional CloudFront) | Static website, low cost |
| **Backend** | AWS EC2 + PM2 | Must run 24/7 for Telegram reminders |
| **Data** | S3 `boss-scheduler-ntti` | Appointments & meeting minutes |

Repo: [github.com/VandethMeng/bossscheduler](https://github.com/VandethMeng/bossscheduler)

---

## How CI/CD works

```
Push to main
    │
    ├─► CI workflow — lint & build backend + frontend (every push/PR)
    │
    └─► Deploy workflow
            ├─► Build frontend with production API URL → upload to S3
            └─► SSH to EC2 → git pull → npm build → PM2 restart
```

You can also run deploy manually: **GitHub → Actions → Deploy Production → Run workflow**.

---

## Step 1 — One-time AWS setup

### S3 buckets

You already have **`boss-scheduler-ntti`** for appointment data. Create a **second bucket** for the website (or use the same bucket with a `web/` prefix — separate bucket is simpler).

Example frontend bucket name: `boss-scheduler-web-ntti`

1. Create bucket in **us-west-2** (same region as your data bucket).
2. **Block all public access** (recommended).
3. Enable **Static website hosting** only if you are **not** using CloudFront. With CloudFront, keep the bucket private.

### CloudFront (recommended for HTTPS)

1. Create a CloudFront distribution with origin = your frontend S3 bucket.
2. Default root object: `index.html`
3. Custom error response: HTTP 403 → `/index.html` (for React Router)
4. Note the **Distribution ID** for cache invalidation.

### EC2 for backend

1. Launch **t3.micro** (free tier eligible) — Amazon Linux 2023 or Ubuntu.
2. Security group: allow **22** (SSH, your IP only), **80/443** (HTTP/HTTPS from anywhere).
3. Attach an **IAM role** with S3 access to `boss-scheduler-ntti` (no access keys on the server).
4. Allocate an **Elastic IP** (optional but recommended).

### IAM user for GitHub Actions (frontend deploy)

Create IAM user `github-actions-deploy` with policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::YOUR-FRONTEND-BUCKET",
        "arn:aws:s3:::YOUR-FRONTEND-BUCKET/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "*"
    }
  ]
}
```

---

## Step 2 — Prepare the EC2 server (one time)

SSH into the server:

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

Clone the repo and run setup:

```bash
git clone https://github.com/VandethMeng/bossscheduler.git ~/bossscheduler
cd ~/bossscheduler
bash deploy/ec2-setup.sh
```

Edit production environment:

```bash
nano ~/bossscheduler/backend/.env
```

Important values:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=use-a-long-random-string-here
CORS_ORIGIN=https://your-frontend-domain.com

AWS_REGION=us-west-2
S3_BUCKET_NAME=boss-scheduler-ntti
S3_APPOINTMENTS_KEY=appointments.json

# On EC2 with IAM role — leave access keys empty:
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_CHAT_ID=your-chat-id
```

Restart the API:

```bash
pm2 restart boss-scheduler-api
curl http://127.0.0.1:5000/health
```

### Nginx + HTTPS

```bash
sudo dnf install -y nginx   # Amazon Linux
# or: sudo apt install -y nginx   # Ubuntu

sudo cp ~/bossscheduler/deploy/nginx-api.conf.example /etc/nginx/conf.d/boss-scheduler-api.conf
# Edit server_name to your API domain
sudo nginx -t && sudo systemctl enable nginx && sudo systemctl start nginx

sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Step 3 — GitHub Secrets

Open your repo → **Settings → Secrets and variables → Actions**.

### Secrets (required)

| Name | Example | Used for |
|------|---------|----------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | Upload frontend to S3 |
| `AWS_SECRET_ACCESS_KEY` | `...` | Upload frontend to S3 |
| `AWS_REGION` | `us-west-2` | AWS region |
| `S3_FRONTEND_BUCKET` | `boss-scheduler-web-ntti` | Frontend hosting bucket |
| `VITE_API_BASE_URL` | `https://api.yourdomain.com/api` | Baked into frontend build |
| `EC2_HOST` | `1.2.3.4` or domain | SSH deploy target |
| `EC2_USER` | `ec2-user` or `ubuntu` | SSH username |
| `EC2_SSH_PRIVATE_KEY` | Full `.pem` file contents | SSH key |
| `EC2_APP_DIR` | `/home/ec2-user/bossscheduler` | Optional; defaults to `~/bossscheduler` |

### Variables (optional)

**Settings → Secrets and variables → Actions → Variables**

| Name | Example |
|------|---------|
| `CLOUDFRONT_DISTRIBUTION_ID` | `E1234567890ABC` |

### Production environment (optional)

**Settings → Environments → New environment → `production`**

You can require manual approval before deploy runs (good for teams).

---

## Step 4 — First deploy

1. Commit and push to `main`:

   ```bash
   git add .
   git commit -m "Add CI/CD pipelines"
   git push origin main
   ```

2. Open **GitHub → Actions** and watch:
   - **CI** — should pass
   - **Deploy Production** — should deploy frontend + backend

3. Test:
   - Frontend URL (CloudFront or S3 website URL)
   - API: `https://api.yourdomain.com/health`

---

## Alternative: Frontend on Vercel

If you prefer [Vercel](https://vercel.com) instead of S3:

1. Import `VandethMeng/bossscheduler` in Vercel.
2. Set **Root Directory** = `frontend`
3. Add environment variable: `VITE_API_BASE_URL` = `https://api.yourdomain.com/api`
4. Vercel auto-deploys on push to `main`.

In this case, disable the **deploy-frontend** job in `.github/workflows/deploy-production.yml` or remove S3 secrets — backend EC2 deploy still runs from GitHub Actions.

`frontend/vercel.json` is included for SPA routing.

---

## Manual deploy (without GitHub)

**Backend on EC2:**

```bash
cd ~/bossscheduler
bash deploy/ec2-deploy.sh
```

**Frontend from your PC:**

```bash
cd frontend
# Set VITE_API_BASE_URL in .env.production or export it
npm run build
aws s3 sync dist/ s3://YOUR-FRONTEND-BUCKET --delete
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Frontend loads but API fails | Check `VITE_API_BASE_URL` secret; rebuild & redeploy |
| CORS error in browser | Set `CORS_ORIGIN` in backend `.env` to your frontend URL exactly |
| Telegram reminders stopped | Backend must run 24/7 on EC2; check `pm2 status` |
| SSH deploy fails | Verify `EC2_HOST`, `EC2_USER`, key, and security group port 22 |
| S3 deploy fails | Check IAM policy and bucket name secret |
| `users.json` missing | Run `npm run add-user` on the server inside `backend/` |

---

## Security checklist

- [ ] Change default admin/assistant passwords
- [ ] Strong `JWT_SECRET` on EC2
- [ ] HTTPS on API (Nginx + Let's Encrypt)
- [ ] HTTPS on frontend (CloudFront or Vercel)
- [ ] EC2 IAM role for S3 (no keys on server)
- [ ] Restrict SSH to your IP in security group
- [ ] Never commit `.env` files
