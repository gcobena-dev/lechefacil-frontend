/**
 * Convert a Date object to local date string in YYYY-MM-DD format
 * This avoids timezone issues that occur with toISOString()
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in local timezone as YYYY-MM-DD string
 */
export function getTodayLocalDateString(): string {
  return getLocalDateString(new Date());
}

/**
 * Build a local datetime string suitable for <input type="datetime-local">
 * Format: YYYY-MM-DDTHH:mm in the user's local timezone
 */
export function getLocalDateTimeInputValue(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

// Default locale/timezone for display
export const DEFAULT_LOCALE = 'es-EC';
export const DEFAULT_TIMEZONE = 'America/Guayaquil';

/** Coerce string | Date to Date */
export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Format time as HH:mm in local timezone */
export function formatLocalTime(value: string | Date, locale: string = DEFAULT_LOCALE, timeZone: string = DEFAULT_TIMEZONE): string {
  const dt = toDate(value);
  return new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' }).format(dt);
}

/** Format date as short month + day (e.g., "27 sept") */
export function formatLocalDateShort(value: string | Date, locale: string = DEFAULT_LOCALE, timeZone: string = DEFAULT_TIMEZONE): string {
  const dt = toDate(value);
  return new Intl.DateTimeFormat(locale, { timeZone, month: 'short', day: 'numeric' }).format(dt);
}

/**
 * Get date range for common periods in local timezone
 */
export function getLocalDateRange(period: 'lastWeek' | 'lastMonth' | 'last3Months' | 'thisYear'): {
  dateFrom: string;
  dateTo: string;
} {
  const today = new Date();
  const startDate = new Date();

  switch (period) {
    case 'lastWeek':
      startDate.setDate(today.getDate() - 7);
      break;
    case 'lastMonth':
      startDate.setMonth(today.getMonth() - 1);
      break;
    case 'last3Months':
      startDate.setMonth(today.getMonth() - 3);
      break;
    case 'thisYear':
      startDate.setMonth(0);
      startDate.setDate(1);
      break;
  }

  return {
    dateFrom: getLocalDateString(startDate),
    dateTo: getLocalDateString(today)
  };
}

/** Add days to a Date and return a new Date */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Get local date string for today plus N days */
export function getTodayPlusDaysLocalDateString(days: number): string {
  return getLocalDateString(addDays(new Date(), days));
}
