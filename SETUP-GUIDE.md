# Setup Guide: AWS S3 + Telegram Bot

Follow these steps in order. Each step tells you exactly what to click and what to copy.

---

## Part 1: AWS S3 Bucket Setup

S3 is Amazon's online storage. Your app will save all appointments in a file called `appointments.json` inside an S3 bucket (think of a bucket as a folder in the cloud).

### Step 1 — Sign in to AWS

1. Go to [https://aws.amazon.com](https://aws.amazon.com)
2. Click **Sign In to the Console**
3. Sign in with your AWS account (create a free account if you don't have one)

### Step 2 — Create the S3 Bucket

1. In the AWS search bar at the top, type **S3** and click **S3**
2. Click the orange **Create bucket** button
3. Fill in:
   - **Bucket name:** `boss-scheduler-yourname` (must be globally unique — add your name or numbers, e.g. `boss-scheduler-john2026`)
   - **AWS Region:** pick one close to you (e.g. `US East (N. Virginia) us-east-1`)
4. Under **Block Public Access settings** — leave all 4 boxes **checked** (keep bucket private)
5. Scroll down and click **Create bucket**

> **Write down your bucket name** — you'll need it for the `.env` file.

### Step 3 — Upload the Empty Appointments File

1. Click your new bucket name in the list
2. Click **Upload**
3. Click **Add files**
4. Select this file from your project:
   ```
   C:\Users\Dell\boss-appointment-scheduler\backend\data\appointments.json
   ```
5. Click **Upload**

Your bucket should now contain `appointments.json`.

### Step 4 — Create an IAM User (for API access)

Your backend needs permission to read and write that file. We create a special AWS user for that.

1. In the AWS search bar, type **IAM** and open **IAM**
2. Click **Users** in the left menu → **Create user**
3. **User name:** `boss-scheduler-app`
4. Click **Next**
5. Select **Attach policies directly**
6. Click **Create policy** (opens a new tab)
   - Click **JSON** tab
   - Paste this (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME/appointments.json",
        "arn:aws:s3:::YOUR-BUCKET-NAME/meeting-minutes/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "s3:DeleteObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/meeting-minutes/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

   - Click **Next**
   - **Policy name:** `BossSchedulerS3Access`
   - Click **Create policy**
7. Go back to the **Create user** tab, click the refresh icon next to policies, search `BossSchedulerS3Access`, check it, click **Next**, then **Create user**
8. Click the new user `boss-scheduler-app`
9. Go to **Security credentials** tab → **Create access key**
10. Choose **Application running outside AWS** → **Next** → **Create access key**
11. **Copy both values now** (you won't see the secret again):
    - Access key ID
    - Secret access key

### Step 5 — Update Backend `.env`

Open `backend/.env` and set:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=paste-your-access-key-id-here
AWS_SECRET_ACCESS_KEY=paste-your-secret-access-key-here
S3_BUCKET_NAME=boss-scheduler-yourname
S3_APPOINTMENTS_KEY=appointments.json
```

---

## Part 2: Telegram Bot Setup

Telegram will send messages to the boss whenever an appointment is created, updated, or deleted.

### Step 1 — Create the Bot

1. Open Telegram on your phone or desktop
2. Search for **@BotFather** (official bot with a blue checkmark)
3. Start a chat and send: `/newbot`
4. BotFather asks for a **name** — type something like: `Boss Scheduler Bot`
5. BotFather asks for a **username** — must end in `bot`, e.g.: `my_boss_scheduler_bot`
6. BotFather replies with your **HTTP API token** — it looks like:
   ```
   7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
7. **Copy and save this token**

### Step 2 — Get Your Chat ID

The bot needs to know *who* to send messages to (the boss).

1. In Telegram, search for your new bot by its username and click **Start**
2. Send any message to the bot, e.g.: `Hello`
3. Open this URL in your browser (replace `YOUR_BOT_TOKEN` with your token):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. You'll see JSON text. Look for `"chat":{"id":` — the number after `"id":` is your **Chat ID**
   - Example: `"chat":{"id":123456789` → Chat ID is `123456789`
   - For group chats, the ID may be negative (e.g. `-1001234567890`)

### Step 3 — Update Backend `.env`

Add to `backend/.env`:

```env
TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=123456789
```

### Step 4 — Test Telegram (optional)

From the project folder, run:

```powershell
cd C:\Users\Dell\boss-appointment-scheduler\backend
npm run test:telegram
```

You should receive a test message in Telegram.

---

## Part 3: Start the App

```powershell
# Terminal 1 - Backend
cd C:\Users\Dell\boss-appointment-scheduler\backend
npm run dev

# Terminal 2 - Frontend
cd C:\Users\Dell\boss-appointment-scheduler\frontend
npm run dev
```

Open **http://localhost:5173**, log in, and create a test appointment. The boss should get a Telegram message!

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| S3 "Access Denied" | Check bucket name in `.env` matches exactly. IAM policy must allow `appointments.json` **and** `meeting-minutes/*` (see Step 4). |
| S3 "NoSuchKey" | Upload `appointments.json` to the bucket (Step 3 above). |
| Telegram not sending | Check token and chat ID. Make sure you clicked **Start** on the bot first. |
| Telegram "chat not found" | Chat ID is wrong — repeat Step 2 and copy the `id` from `getUpdates`. |
| AWS credentials error | Access key or secret has extra spaces — re-copy from IAM. |

---

## Security Reminders

- Never share your AWS secret key or Telegram bot token publicly
- Never commit `.env` to Git (it's already in `.gitignore`)
- Delete unused IAM access keys if you rotate credentials
