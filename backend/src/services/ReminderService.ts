import cron from 'node-cron';
import { env } from '../config/env';
import { Appointment } from '../models/Appointment';
import {
  APP_TIMEZONE,
  formatTodayLabel,
  getAppointmentMinutesSinceMidnight,
  getMinutesSinceMidnight,
  getTodayDateString,
} from '../utils/timezone';
import { getOverlapSlotInfo } from '../utils/meetingSlots';
import { s3Service } from './S3Service';
import { telegramService } from './TelegramService';

export class ReminderService {
  private sentReminders = new Set<string>();
  private timezone: string;
  private dailySummaryHour: number;
  private minutesBeforeMeeting: number;

  constructor() {
    this.timezone = APP_TIMEZONE;
    this.dailySummaryHour = env.reminders.dailySummaryHour;
    this.minutesBeforeMeeting = env.reminders.minutesBeforeMeeting;
  }

  start(): void {
    const dailyCron = `0 ${this.dailySummaryHour} * * *`;

    cron.schedule(dailyCron, () => {
      void this.sendDailySummary();
    }, { timezone: this.timezone });

    cron.schedule('* * * * *', () => {
      void this.checkMeetingReminders();
      void this.completeExpiredMeetings();
    }, { timezone: this.timezone });

    void this.completeExpiredMeetings();

    console.log(
      `Reminder scheduler started (timezone: ${this.timezone}, daily at ${this.dailySummaryHour}:00, ${this.minutesBeforeMeeting} min before meetings, auto-complete when end time passes)`
    );
  }

  private getScheduledAppointmentsForDate(
    appointments: Appointment[],
    date: string
  ): Appointment[] {
    return appointments
      .filter((apt) => apt.meetingDate === date && apt.status === 'Scheduled')
      .sort(
        (a, b) =>
          getAppointmentMinutesSinceMidnight(a.startTime) -
          getAppointmentMinutesSinceMidnight(b.startTime)
      );
  }

  async sendDailySummary(): Promise<void> {
    try {
      const today = getTodayDateString(this.timezone);
      const appointments = await s3Service.getAppointments();
      const todaysMeetings = this.getScheduledAppointmentsForDate(appointments, today);
      const dateLabel = formatTodayLabel(this.timezone);

      await telegramService.notifyDailySummary(todaysMeetings, dateLabel);
      console.log(`Daily meeting summary sent for ${today} (${todaysMeetings.length} meetings)`);
    } catch (error) {
      console.error('Failed to send daily meeting summary:', error);
    }
  }

  async checkMeetingReminders(): Promise<void> {
    try {
      const today = getTodayDateString(this.timezone);
      const nowMinutes = getMinutesSinceMidnight(this.timezone);
      const appointments = await s3Service.getAppointments();
      const todaysMeetings = this.getScheduledAppointmentsForDate(appointments, today);
      const slotInfoMap = getOverlapSlotInfo(todaysMeetings);

      for (const appointment of todaysMeetings) {
        const meetingMinutes = getAppointmentMinutesSinceMidnight(appointment.startTime);
        const minutesUntilMeeting = meetingMinutes - nowMinutes;
        const reminderKey = `${appointment.id}-${appointment.meetingDate}-${appointment.startTime}-${this.minutesBeforeMeeting}`;

        if (
          minutesUntilMeeting >= this.minutesBeforeMeeting - 1 &&
          minutesUntilMeeting <= this.minutesBeforeMeeting + 1 &&
          !this.sentReminders.has(reminderKey)
        ) {
          await telegramService.notifyMeetingReminder(
            appointment,
            this.minutesBeforeMeeting,
            slotInfoMap.get(appointment.id),
            appointments
          );
          this.sentReminders.add(reminderKey);
          console.log(`Meeting reminder sent: ${appointment.title} at ${appointment.startTime}`);
        }
      }

      this.cleanupSentReminders(today);
    } catch (error) {
      console.error('Failed to check meeting reminders:', error);
    }
  }

  private cleanupSentReminders(today: string): void {
    for (const key of this.sentReminders) {
      if (!key.includes(today)) {
        this.sentReminders.delete(key);
      }
    }
  }

  async completeExpiredMeetings(): Promise<void> {
    try {
      const completed = await s3Service.completeExpiredAppointments(this.timezone);

      if (completed.length > 0) {
        console.log(
          `Auto-completed ${completed.length} meeting(s): ${completed.map((apt) => apt.title).join(', ')}`
        );
      }
    } catch (error) {
      console.error('Failed to auto-complete expired meetings:', error);
    }
  }
}

export const reminderService = new ReminderService();
