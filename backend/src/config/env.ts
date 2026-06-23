import dotenv from 'dotenv';

dotenv.config();

const requiredInProduction = ['JWT_SECRET', 'S3_BUCKET_NAME'];

if (process.env.NODE_ENV === 'production') {
  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.S3_BUCKET_NAME || 'boss-scheduler',
    appointmentsKey: process.env.S3_APPOINTMENTS_KEY || 'appointments.json',
    meetingMinutesPrefix: process.env.S3_MEETING_MINUTES_PREFIX || 'meeting-minutes',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
  reminders: {
    timezone: 'Asia/Phnom_Penh',
    dailySummaryHour: parseInt(process.env.DAILY_SUMMARY_HOUR || '5', 10),
    minutesBeforeMeeting: parseInt(process.env.MEETING_REMINDER_MINUTES || '30', 10),
  },
  defaultUsers: {
    admin: {
      email: process.env.ADMIN_EMAIL || 'admin@bossscheduler.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      name: process.env.ADMIN_NAME || 'System Admin',
    },
    assistant: {
      email: process.env.ASSISTANT_EMAIL || 'assistant@bossscheduler.com',
      password: process.env.ASSISTANT_PASSWORD || 'Assistant@123456',
      name: process.env.ASSISTANT_NAME || 'Office Assistant',
    },
  },
};
