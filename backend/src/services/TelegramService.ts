import { env } from '../config/env';
import { Appointment } from '../models/Appointment';

export class TelegramService {
  private botToken: string;
  private chatId: string;
  private baseUrl: string;

  constructor() {
    this.botToken = env.telegram.botToken;
    this.chatId = env.telegram.chatId;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  private isConfigured(): boolean {
    return Boolean(this.botToken && this.chatId);
  }

  private formatDate(date: string): string {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  }

  private formatTime(startTime: string, endTime: string): string {
    return `${startTime} - ${endTime}`;
  }

  private async sendMessage(text: string): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('Telegram not configured. Skipping notification.');
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Telegram API error:', errorData);
      }
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  }

  async notifyAppointmentCreated(appointment: Appointment): Promise<void> {
    const message = [
      '📅 <b>New Appointment</b>',
      '',
      `<b>Title:</b> ${appointment.title}`,
      `<b>Date:</b> ${this.formatDate(appointment.meetingDate)}`,
      `<b>Time:</b> ${this.formatTime(appointment.startTime, appointment.endTime)}`,
      `<b>Location:</b> ${appointment.location || 'Not specified'}`,
    ].join('\n');

    await this.sendMessage(message);
  }

  async notifyAppointmentUpdated(appointment: Appointment): Promise<void> {
    const message = [
      '✏️ <b>Appointment Updated</b>',
      '',
      `<b>Title:</b> ${appointment.title}`,
      `<b>Date:</b> ${this.formatDate(appointment.meetingDate)}`,
      `<b>Time:</b> ${this.formatTime(appointment.startTime, appointment.endTime)}`,
    ].join('\n');

    await this.sendMessage(message);
  }

  async notifyAppointmentDeleted(appointment: Appointment): Promise<void> {
    const message = [
      '❌ <b>Appointment Cancelled</b>',
      '',
      `<b>Title:</b> ${appointment.title}`,
    ].join('\n');

    await this.sendMessage(message);
  }
}

export const telegramService = new TelegramService();
