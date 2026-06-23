/**
 * Test script — sends reminder notifications to Telegram.
 * Run: npm run test:reminders
 */
import dotenv from 'dotenv';

dotenv.config();

import { env } from '../src/config/env';
import { APP_TIMEZONE } from '../src/utils/timezone';
import { reminderService } from '../src/services/ReminderService';
import { telegramService } from '../src/services/TelegramService';
import { s3Service } from '../src/services/S3Service';
import { getOverlapSlotInfo } from '../src/utils/meetingSlots';

async function testReminders(): Promise<void> {
  if (!env.telegram.botToken || !env.telegram.chatId) {
    console.error('❌ Telegram is not configured in backend/.env');
    process.exit(1);
  }

  console.log('Testing meeting reminders...\n');
  console.log(`Timezone: ${APP_TIMEZONE}`);
  console.log(`Daily summary hour: ${env.reminders.dailySummaryHour}:00`);
  console.log(`Reminder: ${env.reminders.minutesBeforeMeeting} minutes before meetings\n`);

  console.log('1. Sending daily summary (today\'s real meetings from S3)...');
  await reminderService.sendDailySummary();
  console.log('   ✅ Daily summary sent. Check Telegram.\n');

  const appointments = await s3Service.getAppointments();
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: APP_TIMEZONE,
  });
  const todayAppointments = appointments.filter(
    (apt) => apt.meetingDate === today && apt.status === 'Scheduled'
  );
  const slotInfoMap = getOverlapSlotInfo(todayAppointments);
  const sample =
    todayAppointments[0] ??
    appointments.find((apt) => apt.status === 'Scheduled');

  if (sample) {
    console.log(`2. Sending 30-minute reminder sample for: "${sample.title}"...`);
    await telegramService.notifyMeetingReminder(
      sample,
      env.reminders.minutesBeforeMeeting,
      slotInfoMap.get(sample.id)
    );
    console.log('   ✅ Meeting reminder sent. Check Telegram.\n');
  } else {
    console.log('2. No scheduled meetings found — sending sample reminder with test data...');
    await telegramService.notifyMeetingReminder(
      {
        id: 'test',
        title: 'Sample Team Meeting (test)',
        description: '',
        meetingDate: today,
        startTime: '10:00',
        endTime: '11:00',
        location: 'Conference Room',
        organizer: '',
        attendees: [],
        status: 'Scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      env.reminders.minutesBeforeMeeting
    );
    console.log('   ✅ Sample meeting reminder sent. Check Telegram.\n');
  }

  console.log('Done! You should see 2 messages in Telegram.');
}

testReminders().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
