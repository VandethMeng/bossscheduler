export const APP_TIMEZONE = 'Asia/Phnom_Penh';

export function getTodayDateString(timezone: string = APP_TIMEZONE): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}
