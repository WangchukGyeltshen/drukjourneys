// Date helpers that work on plain "YYYY-MM-DD" strings in UTC, so the
// server and the browser always agree whatever time zone they are in.
const DAY_MS = 24 * 60 * 60 * 1000

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function addDaysIso(isoDate: string, days: number): string {
  const start = new Date(`${isoDate}T00:00:00Z`)
  return new Date(start.getTime() + days * DAY_MS).toISOString().slice(0, 10)
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// "3 November 2026". Accepts a date or a full ISO timestamp.
export function formatDay(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
