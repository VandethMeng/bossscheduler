import { env } from '../config/env';
import { Appointment } from '../models/Appointment';
import { APP_TIMEZONE, formatDateLabel } from '../utils/timezone';
import { DuplicateSlotInfo, getAppointmentConflicts, getOverlapSlotInfo, getOverlapSummaries, OverlapGroupSummary } from '../utils/meetingSlots';

interface OverlapSlotSummary extends OverlapGroupSummary {}

export class TelegramService {
  private botToken: string;
  private chatId: string;
  private baseUrl: string;
  private timezone: string;

  constructor() {
    this.botToken = env.telegram.botToken;
    this.chatId = env.telegram.chatId;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.timezone = APP_TIMEZONE;
  }

  private isConfigured(): boolean {
    return Boolean(this.botToken && this.chatId);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private formatTime(startTime: string, endTime: string): string {
    return `${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`;
  }

  private header(title: string): string {
    return `<b>${this.escapeHtml(title)}</b>`;
  }

  private footer(text: string): string {
    return `<i>${this.escapeHtml(text)}</i>`;
  }

  private metaField(label: string, value: string): string {
    return `<b>${this.escapeHtml(label)}:</b> ${this.escapeHtml(value)}`;
  }

  private field(label: string, value: string): string {
    return `<b>${this.escapeHtml(label)}:</b> ${this.escapeHtml(value)}`;
  }

  private timeField(startTime: string, endTime: string, highlight = false): string {
    const time = this.escapeHtml(this.formatTime(startTime, endTime));
    const value = highlight ? `<u><code>${time}</code></u>` : `<code>${time}</code>`;
    return `<b>Time:</b> ${value}`;
  }

  private alertBlock(title: string, detail?: string): string {
    const lines = [`<b>${this.escapeHtml(title)}</b>`];
    if (detail) {
      lines.push(this.escapeHtml(detail));
    }
    return `<blockquote>${lines.join('\n')}</blockquote>`;
  }

  private statLine(label: string, value: string | number): string {
    return `<b>${this.escapeHtml(label)}:</b> ${this.escapeHtml(String(value))}`;
  }

  private getOverlapSummaries(appointments: Appointment[]): OverlapSlotSummary[] {
    return getOverlapSummaries(appointments);
  }

  private getOverlapSlotInfo(appointments: Appointment[]): Map<string, DuplicateSlotInfo> {
    return getOverlapSlotInfo(appointments);
  }

  private overlapLabel(overlapType: 'exact' | 'partial'): string {
    return overlapType === 'exact'
      ? 'Duplicated time slot'
      : 'Overlapping time slot';
  }

  private formatAppointmentConflictSections(
    appointment: Appointment,
    allAppointments: Appointment[]
  ): string[] {
    const { timeOverlaps, locationConflicts } = getAppointmentConflicts(
      appointment,
      allAppointments
    );

    const sections: string[] = [];

    if (timeOverlaps.length > 0) {
      const lines = timeOverlaps.map((conflict) => {
        const label =
          conflict.overlapType === 'exact' ? 'Exact duplicate' : 'Partial overlap';
        return [
          `• <code>${this.escapeHtml(conflict.timeSlot)}</code> · ${this.escapeHtml(conflict.title)}`,
          `  <i>${label}</i> · ${this.escapeHtml(conflict.location)}`,
        ].join('\n');
      });

      sections.push('', this.alertBlock('Schedule conflict', 'Overlapping time slot'), '', ...lines);
    }

    if (locationConflicts.length > 0) {
      const lines = locationConflicts.map(
        (conflict) =>
          `• <b>${this.escapeHtml(conflict.location)}</b> · <code>${this.escapeHtml(conflict.timeSlot)}</code> · ${this.escapeHtml(conflict.title)}`
      );

      sections.push(
        '',
        this.alertBlock('Location conflict', 'Same location booked at overlapping times'),
        '',
        ...lines
      );
    }

    return sections;
  }

  private formatOverlapOverview(summaries: OverlapSlotSummary[]): string {
    const lines = summaries.map((group) => {
      const typeLabel =
        group.overlapType === 'exact' ? 'Exact duplicate' : 'Partial overlap';
      const meetingLines = group.meetings.map(
        (m) =>
          `  <code>${this.escapeHtml(m.timeSlot)}</code> · ${this.escapeHtml(m.title)}\n  ${this.escapeHtml(m.location)}`
      );

      return [
        `<b>Group ${group.groupIndex}</b> <i>(${typeLabel}, ${group.count} meetings)</i>`,
        ...meetingLines,
      ].join('\n');
    });

    return [
      this.alertBlock('Schedule overview', 'Overlapping or duplicated time slots detected'),
      '',
      ...lines,
    ].join('\n');
  }

  private formatMeetingBlock(
    appointment: Appointment,
    index: number,
    total: number,
    slotInfo?: DuplicateSlotInfo
  ): string {
    const hasOverlap = Boolean(slotInfo);
    const lines: string[] = [''];

    if (hasOverlap && slotInfo) {
      const label = this.overlapLabel(slotInfo.overlapType);
      const conflicts = slotInfo.conflictingTitles.join(', ');

      lines.push(
        this.alertBlock(
          label,
          `${slotInfo.timeSlot} · Meeting ${slotInfo.slotIndex} of ${slotInfo.slotTotal}`
        )
      );
      lines.push(
        `<b>${index}. ${this.escapeHtml(appointment.title)}</b> <i>(conflicts with ${this.escapeHtml(conflicts)})</i>`
      );
    } else {
      lines.push(`<b>${index}. ${this.escapeHtml(appointment.title)}</b>`);
    }

    lines.push(
      this.timeField(appointment.startTime, appointment.endTime, hasOverlap),
      this.field('Location', appointment.location || 'Not specified')
    );

    if (appointment.organizer) {
      lines.push(this.field('Organizer', appointment.organizer));
    }

    if (appointment.attendees.length > 0) {
      lines.push(this.field('Attendees', appointment.attendees.join(', ')));
    }

    if (appointment.description) {
      lines.push(`<b>Notes:</b> ${this.escapeHtml(appointment.description)}`);
    }

    return lines.join('\n');
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

  async notifyAppointmentCreated(
    appointment: Appointment,
    allAppointments: Appointment[] = []
  ): Promise<void> {
    const message = [
      this.header('New appointment'),
      '',
      this.field('Title', appointment.title),
      this.metaField('Date', formatDateLabel(appointment.meetingDate, this.timezone)),
      this.timeField(appointment.startTime, appointment.endTime),
      this.field('Location', appointment.location),
      this.metaField('Timezone', this.timezone),
      ...this.formatAppointmentConflictSections(appointment, allAppointments),
      '',
      this.footer('Boss Scheduler'),
    ].join('\n');

    await this.sendMessage(message);
  }

  async notifyAppointmentUpdated(
    appointment: Appointment,
    allAppointments: Appointment[] = []
  ): Promise<void> {
    const message = [
      this.header('Appointment updated'),
      '',
      this.field('Title', appointment.title),
      this.metaField('Date', formatDateLabel(appointment.meetingDate, this.timezone)),
      this.timeField(appointment.startTime, appointment.endTime),
      this.field('Location', appointment.location),
      this.field('Status', appointment.status),
      ...this.formatAppointmentConflictSections(appointment, allAppointments),
      '',
      this.footer('Boss Scheduler'),
    ].join('\n');

    await this.sendMessage(message);
  }

  async notifyAppointmentDeleted(appointment: Appointment): Promise<void> {
    const message = [
      this.header('Appointment cancelled'),
      '',
      this.field('Title', appointment.title),
      this.metaField('Date', formatDateLabel(appointment.meetingDate, this.timezone)),
      this.timeField(appointment.startTime, appointment.endTime),
      '',
      this.footer('Boss Scheduler'),
    ].join('\n');

    await this.sendMessage(message);
  }

  async notifyDailySummary(
    appointments: Appointment[],
    dateLabel: string
  ): Promise<void> {
    if (appointments.length === 0) {
      const message = [
        this.header('Daily meeting schedule'),
        '',
        this.metaField('Date', dateLabel),
        this.metaField('Timezone', this.timezone),
        '',
        'No meetings scheduled for today.',
        '',
        this.footer('Boss Scheduler'),
      ].join('\n');

      await this.sendMessage(message);
      return;
    }

    const overlapGroups = this.getOverlapSummaries(appointments);
    const slotInfoMap = this.getOverlapSlotInfo(appointments);
    const meetingBlocks = appointments.map((apt, i) =>
      this.formatMeetingBlock(
        apt,
        i + 1,
        appointments.length,
        slotInfoMap.get(apt.id)
      )
    );

    const sections = [
      this.header('Daily meeting schedule'),
      '',
      this.metaField('Date', dateLabel),
      this.metaField('Timezone', this.timezone),
    ];

    if (overlapGroups.length > 0) {
      sections.push('', this.formatOverlapOverview(overlapGroups));
    }

    sections.push(
      ...meetingBlocks,
      '',
      this.statLine('Total meetings', appointments.length),
      ...(overlapGroups.length > 0
        ? [this.statLine('Overlapping groups', overlapGroups.length)]
        : []),
      '',
      this.footer('Boss Scheduler'),
    );

    await this.sendMessage(sections.join('\n'));
  }

  async notifyMeetingReminder(
    appointment: Appointment,
    minutesBefore: number,
    slotInfo?: DuplicateSlotInfo,
    allAppointments: Appointment[] = []
  ): Promise<void> {
    const hasOverlap = Boolean(slotInfo);
    const { locationConflicts } = getAppointmentConflicts(appointment, allAppointments);
    const sections = [
      this.header('Meeting reminder'),
      '',
      `<b>Starts in ${minutesBefore} minutes</b>`,
    ];

    if (hasOverlap && slotInfo) {
      const label = this.overlapLabel(slotInfo.overlapType);
      const conflicts = slotInfo.conflictingTitles.join(', ');

      sections.push(
        '',
        this.alertBlock(
          label,
          `${slotInfo.timeSlot} · Meeting ${slotInfo.slotIndex} of ${slotInfo.slotTotal}`
        ),
        `<i>Conflicts with ${this.escapeHtml(conflicts)}</i>`
      );
    }

    if (locationConflicts.length > 0) {
      const lines = locationConflicts.map(
        (conflict) =>
          `• <b>${this.escapeHtml(conflict.location)}</b> · <code>${this.escapeHtml(conflict.timeSlot)}</code> · ${this.escapeHtml(conflict.title)}`
      );

      sections.push(
        '',
        this.alertBlock('Location conflict', 'Same location booked at overlapping times'),
        '',
        ...lines
      );
    }

    sections.push(
      '',
      this.field('Title', appointment.title),
      this.metaField('Date', formatDateLabel(appointment.meetingDate, this.timezone)),
      this.timeField(appointment.startTime, appointment.endTime, hasOverlap),
      this.field('Location', appointment.location),
      this.metaField('Timezone', this.timezone),
      '',
      this.footer('Boss Scheduler')
    );

    await this.sendMessage(sections.join('\n'));
  }
}

export const telegramService = new TelegramService();
