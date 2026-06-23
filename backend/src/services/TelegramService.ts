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

  /** Header — bold, primary emphasis */
  private header(title: string): string {
    return [
      '━━━━━━━━━━━━━━━━━━━━',
      `<b>${this.escapeHtml(title)}</b>`,
      '━━━━━━━━━━━━━━━━━━━━',
    ].join('\n');
  }

  /** Footer — italic, muted tone */
  private footer(text: string): string {
    return [
      '━━━━━━━━━━━━━━━━━━━━',
      `<i>${this.escapeHtml(text)}</i>`,
    ].join('\n');
  }

  /** Meta line — italic labels (date, timezone) */
  private metaField(label: string, value: string): string {
    return `<i>${this.escapeHtml(label)}:</i> <b>${this.escapeHtml(value)}</b>`;
  }

  /** Standard field — bold label, normal value */
  private field(label: string, value: string): string {
    return `<b>${this.escapeHtml(label)}</b>  ${this.escapeHtml(value)}`;
  }

  /** Time value — monospace (appears in a distinct grey tone in Telegram) */
  private timeValue(startTime: string, endTime: string, highlight = false): string {
    const time = this.escapeHtml(this.formatTime(startTime, endTime));
    if (highlight) {
      return `<u><code>${time}</code></u>`;
    }
    return `<code>${time}</code>`;
  }

  /** Warning block — blockquote with underline (stands out as an alert) */
  private alertBlock(text: string): string {
    return `<blockquote><b><u>${this.escapeHtml(text)}</u></b></blockquote>`;
  }

  /** Summary stat — code style for numbers */
  private statLine(label: string, value: string | number): string {
    return `<b>${this.escapeHtml(label)}</b>  <code>${this.escapeHtml(String(value))}</code>`;
  }

  private getOverlapSummaries(appointments: Appointment[]): OverlapSlotSummary[] {
    return getOverlapSummaries(appointments);
  }

  private getOverlapSlotInfo(appointments: Appointment[]): Map<string, DuplicateSlotInfo> {
    return getOverlapSlotInfo(appointments);
  }

  private overlapLabel(overlapType: 'exact' | 'partial'): string {
    return overlapType === 'exact'
      ? 'DUPLICATED TIME SLOT'
      : 'OVERLAPPING TIME SLOT';
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
          `  •  <code>${this.escapeHtml(conflict.timeSlot)}</code>  ${this.escapeHtml(conflict.title)}`,
          `     <i>${label}</i>  ·  ${this.escapeHtml(conflict.location)}`,
        ].join('\n');
      });

      sections.push('', this.alertBlock('⚠ OVERLAPPING TIME SLOT'), '', ...lines);
    }

    if (locationConflicts.length > 0) {
      const lines = locationConflicts.map(
        (conflict) =>
          `  •  <b>${this.escapeHtml(conflict.location)}</b>  <code>${this.escapeHtml(conflict.timeSlot)}</code>  ${this.escapeHtml(conflict.title)}`
      );

      sections.push(
        '',
        this.alertBlock('⚠ SAME LOCATION BOOKED AT OVERLAPPING TIME'),
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
          `     <code>${this.escapeHtml(m.timeSlot)}</code>  ${this.escapeHtml(m.title)}\n     📍 ${this.escapeHtml(m.location)}`
      );

      return [
        `  <b>Group ${group.groupIndex}</b>  <i>(${typeLabel} · ${group.count} meetings)</i>`,
        ...meetingLines,
      ].join('\n');
    });

    return [
      this.alertBlock('⚠ OVERLAPPING / DUPLICATED TIME SLOTS DETECTED'),
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
          `${label} · ${slotInfo.timeSlot} · Meeting ${slotInfo.slotIndex} of ${slotInfo.slotTotal}`
        )
      );
      lines.push(
        `<b>Meeting ${index} of ${total}</b>  <i>(conflicts with: ${this.escapeHtml(conflicts)})</i>`
      );
    } else {
      lines.push(`<b>Meeting ${index} of ${total}</b>`);
    }

    lines.push(
      this.field('Title', appointment.title),
      `<b>Time</b>  ${this.timeValue(appointment.startTime, appointment.endTime, hasOverlap)}`,
      this.field('Location', appointment.location || 'Not specified')
    );

    if (appointment.organizer) {
      lines.push(this.field('Organizer', appointment.organizer));
    }

    if (appointment.attendees.length > 0) {
      lines.push(this.field('Attendees', appointment.attendees.join(', ')));
    }

    if (appointment.description) {
      lines.push(`<i>Notes</i>  ${this.escapeHtml(appointment.description)}`);
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
      this.header('NEW APPOINTMENT'),
      '',
      this.field('Title', appointment.title),
      this.metaField('Date', formatDateLabel(appointment.meetingDate, this.timezone)),
      `<b>Time</b>  ${this.timeValue(appointment.startTime, appointment.endTime)}`,
      this.field('Location', appointment.location),
      this.metaField('Timezone', this.timezone),
      ...this.formatAppointmentConflictSections(appointment, allAppointments),
      '',
      this.footer('Appointment Scheduler'),
    ].join('\n');

    await this.sendMessage(message);
  }

  async notifyAppointmentUpdated(
    appointment: Appointment,
    allAppointments: Appointment[] = []
  ): Promise<void> {
    const message = [
      this.header('APPOINTMENT UPDATED'),
      '',
      this.field('Title', appointment.title),
      this.metaField('Date', formatDateLabel(appointment.meetingDate, this.timezone)),
      `<b>Time</b>  ${this.timeValue(appointment.startTime, appointment.endTime)}`,
      this.field('Location', appointment.location),
      this.field('Status', appointment.status),
      ...this.formatAppointmentConflictSections(appointment, allAppointments),
      '',
      this.footer('Appointment Scheduler'),
    ].join('\n');

    await this.sendMessage(message);
  }

  async notifyAppointmentDeleted(appointment: Appointment): Promise<void> {
    const message = [
      this.header('APPOINTMENT CANCELLED'),
      '',
      this.field('Title', appointment.title),
      this.metaField('Date', formatDateLabel(appointment.meetingDate, this.timezone)),
      `<b>Time</b>  ${this.timeValue(appointment.startTime, appointment.endTime)}`,
      '',
      this.footer('Appointment Scheduler'),
    ].join('\n');

    await this.sendMessage(message);
  }

  async notifyDailySummary(
    appointments: Appointment[],
    dateLabel: string
  ): Promise<void> {
    if (appointments.length === 0) {
      const message = [
        this.header('DAILY MEETING SCHEDULE'),
        '',
        this.metaField('Date', dateLabel),
        this.metaField('Timezone', this.timezone),
        '',
        '<i>No scheduled meetings for today.</i>',
        '',
        this.footer('Have a productive day.'),
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
      this.header('DAILY MEETING SCHEDULE'),
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
      this.statLine('Overlapping groups', overlapGroups.length),
      '',
      this.footer('Please review your schedule for the day.')
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
      this.header('MEETING REMINDER'),
      '',
      `<b>Starts in <code>${minutesBefore}</code> minutes</b>`,
    ];

    if (hasOverlap && slotInfo) {
      const label = this.overlapLabel(slotInfo.overlapType);
      const conflicts = slotInfo.conflictingTitles.join(', ');

      sections.push(
        '',
        this.alertBlock(
          `${label} · ${slotInfo.timeSlot} · Meeting ${slotInfo.slotIndex} of ${slotInfo.slotTotal}`
        ),
        `<i>Conflicts with: ${this.escapeHtml(conflicts)}</i>`
      );
    }

    if (locationConflicts.length > 0) {
      const lines = locationConflicts.map(
        (conflict) =>
          `  •  <b>${this.escapeHtml(conflict.location)}</b>  <code>${this.escapeHtml(conflict.timeSlot)}</code>  ${this.escapeHtml(conflict.title)}`
      );

      sections.push(
        '',
        this.alertBlock('⚠ SAME LOCATION BOOKED AT OVERLAPPING TIME'),
        '',
        ...lines
      );
    }

    sections.push(
      '',
      this.field('Title', appointment.title),
      this.metaField('Date', formatDateLabel(appointment.meetingDate, this.timezone)),
      `<b>Time</b>  ${this.timeValue(appointment.startTime, appointment.endTime, hasOverlap)}`,
      this.field('Location', appointment.location),
      this.metaField('Timezone', this.timezone),
      '',
      this.footer('Appointment Scheduler')
    );

    await this.sendMessage(sections.join('\n'));
  }
}

export const telegramService = new TelegramService();
