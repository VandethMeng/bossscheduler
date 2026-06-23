# Production checklist (your project)

Use this list in order. Your code is committed locally — **push to GitHub** when ready:

```bash
cd c:\Users\Dell\boss-appointment-scheduler
git push origin main
```

Repo: https://github.com/VandethMeng/bossscheduler

---

## Architecture

| Part | Service | Why |
|------|---------|-----|
| Frontend | **Vercel** (easiest) or S3 + CloudFront | Website only |
| Backend API | **EC2** + PM2 | Must run 24/7 for Telegram reminders |
| Data | S3 `boss-scheduler-ntti` (us-west-2) | Appointments + PDFs |

---

## Step 1 — Push code (starts CI)

After `git push origin main`:

1. Open https://github.com/VandethMeng/bossscheduler/actions
2. Workflow **CI** should pass (build + lint)

Deploy will **fail** until you complete steps 2–4 and add secrets.

---

## Step 2 — EC2 backend (one time)

### Launch instance

1. AWS Console → **EC2** → Launch instance
2. **Amazon Linux 2023**, type **t3.micro**
3. Create or select a key pair (`.pem` file) — save it
4. Security group:
   - SSH (22) — **your IP only**
   - HTTP (80) — anywhere
   - HTTPS (443) — anywhere
5. Launch

### IAM role (no keys on server)

1. IAM → Roles → Create role → **EC2**
2. Attach policy for bucket `boss-scheduler-ntti` (Get/Put/Delete objects, ListBucket)
3. EC2 → your instance → Actions → Security → **Modify IAM role** → attach role

### Install on server

SSH in (replace with your IP and key path):

```bash
ssh -i "your-key.pem" ec2-user@YOUR_EC2_IP
```

On the server:

```bash
git clone https://github.com/VandethMeng/bossscheduler.git ~/bossscheduler
cd ~/bossscheduler
bash deploy/ec2-setup.sh
nano ~/bossscheduler/backend/.env
```

Set these in `.env` on the server (copy from your local `backend/.env` but change):

```env
NODE_ENV=production
CORS_ORIGIN=https://YOUR-FRONTEND-URL
JWT_SECRET=use-a-long-random-string-not-the-dev-one

AWS_REGION=us-west-2
S3_BUCKET_NAME=boss-scheduler-ntti
S3_APPOINTMENTS_KEY=appointments.json
# Leave AWS keys EMPTY if using IAM role on EC2:
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_CHAT_ID=your-chat-id
```

```bash
pm2 restart boss-scheduler-api
curl http://127.0.0.1:5000/health
```

### API domain + HTTPS (recommended)

Point `api.yourdomain.com` DNS A record → EC2 IP, then:

```bash
sudo dnf install -y nginx certbot python3-certbot-nginx
sudo cp ~/bossscheduler/deploy/nginx-api.conf.example /etc/nginx/conf.d/boss-scheduler-api.conf
# Edit server_name in that file
sudo certbot --nginx -d api.yourdomain.com
```

Your API URL: `https://api.yourdomain.com/api`

---

## Step 3 — Frontend

### Option A — Vercel (recommended for beginners)

1. https://vercel.com → Import GitHub repo `bossscheduler`
2. **Root Directory:** `frontend`
3. Environment variable:
   - `VITE_API_BASE_URL` = `https://api.yourdomain.com/api`
4. Deploy

Your site: `https://bossscheduler.vercel.app` (or custom domain)

Update EC2 `CORS_ORIGIN` to match this URL exactly, then `pm2 restart boss-scheduler-api`.

### Option B — S3 + GitHub Actions

1. Create S3 bucket for website (e.g. `boss-scheduler-web-ntti`)
2. Add GitHub secrets (step 4) including `S3_FRONTEND_BUCKET`

---

## Step 4 — GitHub Actions secrets

GitHub → **bossscheduler** → Settings → Secrets and variables → Actions → **New repository secret**

| Secret | Value |
|--------|--------|
| `VITE_API_BASE_URL` | `https://api.yourdomain.com/api` |
| `EC2_HOST` | EC2 public IP or domain |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_PRIVATE_KEY` | Full contents of your `.pem` file |
| `EC2_APP_DIR` | `/home/ec2-user/bossscheduler` |

**If using S3 frontend (Option B), also add:**

| Secret | Value |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | IAM user for deploy only |
| `AWS_SECRET_ACCESS_KEY` | ... |
| `AWS_REGION` | `us-west-2` |
| `S3_FRONTEND_BUCKET` | your frontend bucket name |

**Optional variable** (Settings → Variables):

| Variable | Value |
|----------|--------|
| `CLOUDFRONT_DISTRIBUTION_ID` | if using CloudFront |

---

## Step 5 — Deploy

```bash
git push origin main
```

Or: Actions → **Deploy Production** → **Run workflow**

Watch: https://github.com/VandethMeng/bossscheduler/actions

---

## Step 6 — Verify

- [ ] `https://api.yourdomain.com/health` returns OK
- [ ] Login works on frontend
- [ ] Create a test appointment → Telegram message received
- [ ] Change default passwords (Users page or `npm run add-user` on server)

---

## Security (important)

- Never commit `.env` files (already in `.gitignore`)
- Use a **new strong** `JWT_SECRET` in production
- Change admin/assistant passwords
- Restrict SSH to your IP
- If AWS keys were ever shared or committed, **rotate them** in IAM

---

## Need help?

Full details: [DEPLOYMENT.md](./DEPLOYMENT.md)
