/**
 * Utility functions for Jakarta WIB (UTC+7) Date and Time Handling
 * Slog Koopsudnas Standard
 */

const TIMEZONE_WIB = 'Asia/Jakarta';

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Jakarta (WIB) timezone
 */
export function getWIBDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_WIB,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date); // Output format: YYYY-MM-DD
}

/**
 * Returns current time formatted as HH:mm:ss in Asia/Jakarta (WIB) timezone
 */
export function getWIBTimeString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE_WIB,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return formatter.format(date).replace(/\./g, ':');
}

/**
 * Returns full ISO string with +07:00 timezone offset for WIB
 */
export function getWIBISOString(date: Date = new Date()): string {
  const dateStr = getWIBDateString(date);
  const timeStr = getWIBTimeString(date);
  return `${dateStr}T${timeStr}+07:00`;
}

/**
 * Formats a date string (YYYY-MM-DD) into Indonesian human readable date
 * e.g., "18 Oktober 2026"
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: TIMEZONE_WIB,
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Calculates milliseconds remaining until the upcoming 00:00:00 WIB (Midnight)
 */
export function getMillisecondsUntilWIBMidnight(): number {
  const now = new Date();
  
  // Get current date parts in WIB
  const dateStr = getWIBDateString(now);
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create Date object corresponding to 00:00:00 WIB of the next day
  // Midnight in Jakarta is (UTC hour - 7)
  const nextMidnightUtc = Date.UTC(year, month - 1, day + 1, -7, 0, 0, 0);
  const diff = nextMidnightUtc - now.getTime();
  
  // If somehow calculated in the past or negative, default to 1 minute
  return diff > 0 ? diff : 60000;
}
