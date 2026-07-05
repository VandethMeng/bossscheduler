import {
  APP_TIMEZONE,
  getTodayDateString,
  getZonedDateTimeMs,
  isMeetingEnded,
} from '../src/utils/timezone';

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`PASS: ${label}`);
}

const today = getTodayDateString(APP_TIMEZONE);
const now = Date.now();

const futureEndTime = new Date(now + 2 * 60 * 60 * 1000);
const futureEndParts = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).formatToParts(futureEndTime);
const futureEndHour = futureEndParts.find((p) => p.type === 'hour')?.value ?? '23';
const futureEndMinute = futureEndParts.find((p) => p.type === 'minute')?.value ?? '59';
const futureEndTimeStr = `${futureEndHour.padStart(2, '0')}:${futureEndMinute.padStart(2, '0')}`;

assert(
  'today meeting with future end time is not completed',
  !isMeetingEnded(today, futureEndTimeStr, APP_TIMEZONE)
);

const pastEndTime = new Date(now - 60 * 60 * 1000);
const pastEndParts = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).formatToParts(pastEndTime);
const pastEndHour = pastEndParts.find((p) => p.type === 'hour')?.value ?? '00';
const pastEndMinute = pastEndParts.find((p) => p.type === 'minute')?.value ?? '00';
const pastEndTimeStr = `${pastEndHour.padStart(2, '0')}:${pastEndMinute.padStart(2, '0')}`;

assert(
  'today meeting with past end time is completed',
  isMeetingEnded(today, pastEndTimeStr, APP_TIMEZONE)
);

const tomorrowDate = new Date(getZonedDateTimeMs(today, '12:00', APP_TIMEZONE) + 24 * 60 * 60 * 1000);
const tomorrow = tomorrowDate.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });

assert(
  'tomorrow meeting is not completed yet',
  !isMeetingEnded(tomorrow, '09:00', APP_TIMEZONE)
);

console.log('\nAll meeting end-time checks passed.');
