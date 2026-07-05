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

function readZonedTimeParts(
  utcMs: number,
  timezone: string
): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utcMs));

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

  let hour = read('hour');
  if (hour === 24) {
    hour = 0;
  }

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour,
    minute: read('minute'),
  };
}

export function getMinutesSinceMidnight(timezone: string = APP_TIMEZONE): number {
  const { hour, minute } = readZonedTimeParts(Date.now(), timezone);
  return hour * 60 + minute;
}

/** UTC timestamp for a calendar date + clock time in the app timezone. */
export function getZonedDateTimeMs(
  dateStr: string,
  timeStr: string,
  timezone: string = APP_TIMEZONE
): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map((part) => parseInt(part, 10));

  let utcMs = Date.UTC(year, month - 1, day, hours, minutes || 0, 0, 0);

  for (let attempt = 0; attempt < 5; attempt++) {
    const zoned = readZonedTimeParts(utcMs, timezone);

    if (
      zoned.year === year &&
      zoned.month === month &&
      zoned.day === day &&
      zoned.hour === hours &&
      zoned.minute === (minutes || 0)
    ) {
      return utcMs;
    }

    const desired = Date.UTC(year, month - 1, day, hours, minutes || 0);
    const actual = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute);
    utcMs += desired - actual;
  }

  return utcMs;
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
  const meetingEndMs = getZonedDateTimeMs(meetingDate, endTime, timezone);
  return Date.now() >= meetingEndMs;
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
