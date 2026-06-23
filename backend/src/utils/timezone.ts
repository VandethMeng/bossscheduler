export const APP_TIMEZONE = 'Asia/Phnom_Penh';

export function getTodayDateString(timezone: string = APP_TIMEZONE): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

export function isMeetingDateOnOrAfterToday(
  meetingDate: string,
  timezone: string = APP_TIMEZONE
): boolean {
  return meetingDate >= getTodayDateString(timezone);
}

export function getMinutesSinceMidnight(timezone: string = APP_TIMEZONE): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);

  return hour * 60 + minute;
}

export function getAppointmentMinutesSinceMidnight(startTime: string): number {
  const [hours, minutes] = startTime.split(':').map((part) => parseInt(part, 10));
  return hours * 60 + (minutes || 0);
}

export function isMeetingEnded(
  meetingDate: string,
  endTime: string,
  timezone: string = APP_TIMEZONE
): boolean {
  const today = getTodayDateString(timezone);
  const nowMinutes = getMinutesSinceMidnight(timezone);
  const endMinutes = getAppointmentMinutesSinceMidnight(endTime);

  if (meetingDate < today) {
    return true;
  }

  if (meetingDate > today) {
    return false;
  }

  return nowMinutes >= endMinutes;
}

export function formatDateLabel(date: string, timezone: string = APP_TIMEZONE): string {
  const [year, month, day] = date.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return utcDate.toLocaleDateString('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTodayLabel(timezone: string = APP_TIMEZONE): string {
  return new Date().toLocaleDateString('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
