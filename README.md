# Boss Appointment Scheduler

A full-stack appointment management system where assistants can schedule, update, and manage meetings for a boss/manager. The system stores appointment data in AWS S3 and sends automatic Telegram notifications on create, update, and delete.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Material UI, React Router, Axios, FullCalendar |
| Backend | Node.js, Express, TypeScript |
| Storage | AWS S3 (`appointments.json`) |
| Notifications | Telegram Bot API |
| Auth | JWT, bcrypt password hashing |

## Features

- JWT authentication with Admin and Assistant roles
- Full CRUD for appointments
- Search and filter by date, month, and status
- Calendar views: monthly, weekly, daily
- Dashboard with appointment statistics
- Telegram notifications on appointment changes
- Responsive UI for desktop, tablet, and mobile

## Project Structure

```
boss-appointment-scheduler/
├── backend/
│   ├── src/
│   │   ├── config/         # Environment & S3 config
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # S3, Telegram, Auth services
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── models/         # TypeScript interfaces
│   │   └── utils/          # Helpers
│   └── data/               # Local user storage
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── context/        # Auth & Appointment state
│       ├── services/       # API integration
│       └── routes/         # React Router setup
└── README.md
```

## Prerequisites

- Node.js 18+
- AWS account with S3 bucket
- Telegram Bot (optional, for notifications)

## Quick Start

### 1. Clone and install

```bash
cd boss-appointment-scheduler

# Backend
cd backend
npm install
cp .env.example .env

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Configure environment

**Backend (`backend/.env`):**

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=boss-scheduler
S3_APPOINTMENTS_KEY=appointments.json
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
CORS_ORIGIN=http://localhost:5173
```

**Frontend (`frontend/.env`):**

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Set up AWS S3

1. Create an S3 bucket named `boss-scheduler` (or your chosen name)
2. Upload an empty JSON array as `appointments.json`:

```json
[]
```

3. Create an IAM user or role with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": [
        "arn:aws:s3:::boss-scheduler/appointments.json",
        "arn:aws:s3:::boss-scheduler/meeting-minutes/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "s3:DeleteObject",
      "Resource": "arn:aws:s3:::boss-scheduler/meeting-minutes/*"
    }
  ]
}
```

On EC2 or Elastic Beanstalk, attach an IAM instance role instead of using access keys.

### 4. Set up Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Copy the bot token to `TELEGRAM_BOT_TOKEN`
4. Get your chat ID by messaging the bot, then visit:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Copy the chat ID to `TELEGRAM_CHAT_ID`

### 5. Run locally

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

Default users are created on first backend startup from `ADMIN_*` and `ASSISTANT_*` values in `backend/.env`. Change those passwords before production.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/appointments` | List appointments (with filters) |
| GET | `/api/appointments/:id` | Get single appointment |
| POST | `/api/appointments` | Create appointment |
| PUT | `/api/appointments/:id` | Update appointment |
| DELETE | `/api/appointments/:id` | Delete appointment |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/health` | Health check |

### Query Parameters (GET /api/appointments)

- `search` - Search title, description, location, organizer, attendees
- `date` - Filter by date (YYYY-MM-DD)
- `month` - Filter by month (YYYY-MM)
- `status` - Filter by status (Scheduled, Completed, Cancelled, Postponed)

## Deployment

### Frontend → AWS S3 Static Website Hosting

```bash
cd frontend
npm run build

# Upload dist/ to S3 bucket
aws s3 sync dist/ s3://your-frontend-bucket --delete

# Enable static website hosting in S3 console
# Set index document: index.html
# Set error document: index.html (for SPA routing)
```

Update `VITE_API_BASE_URL` to your production API URL before building.

### Backend → AWS EC2

1. Launch an EC2 instance (Amazon Linux 2 or Ubuntu)
2. Install Node.js 18+
3. Clone the project and install dependencies
4. Attach IAM role with S3 permissions (no access keys needed)
5. Set environment variables
6. Build and run:

```bash
cd backend
npm install
npm run build
npm start
```

Use PM2 for process management:

```bash
npm install -g pm2
pm2 start dist/server.js --name boss-scheduler-api
pm2 save
pm2 startup
```

Configure Nginx as reverse proxy and enable HTTPS with Let's Encrypt.

### Backend → AWS Elastic Beanstalk

1. Install EB CLI: `pip install awsebcli`
2. Initialize in backend folder:

```bash
cd backend
eb init -p node.js boss-scheduler-api
eb create boss-scheduler-env
```

3. Set environment variables in EB console
4. Attach IAM instance profile with S3 access
5. Deploy:

```bash
eb deploy
```

## Security Notes

- Never commit `.env` files
- Use strong `JWT_SECRET` in production
- Use IAM roles on EC2/EB instead of access keys when possible
- Enable HTTPS in production
- Change default user passwords immediately

## License

MIT
