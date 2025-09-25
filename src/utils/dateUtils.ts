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