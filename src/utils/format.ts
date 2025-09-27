export function formatDate(value?: string | Date | null): string {
  if (!value) return "-";
  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, day] = value.split("-").map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(value);
  }
  if (isNaN(d.getTime())) return String(value);
  const locale = typeof navigator !== "undefined" ? navigator.language : "es-EC";
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

export function formatDateOnly(value?: string | Date | null): string {
  if (!value) return "-";
  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, day] = value.split("-").map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(value);
  }
  if (isNaN(d.getTime())) return String(value);
  const locale = typeof navigator !== "undefined" ? navigator.language : "es-EC";
  return d.toLocaleDateString(locale);
}

