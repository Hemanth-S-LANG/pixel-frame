/**
 * Timezone-safe date utilities.
 *
 * Problem: `new Date("2026-08-20")` creates midnight UTC, but
 * `setHours(0,0,0,0)` works in the SERVER's local timezone (e.g. IST = UTC+5:30),
 * shifting the date backward by a day. This causes off-by-one date bugs.
 *
 * Solution: Always construct date boundaries in UTC by parsing the string manually.
 */

/**
 * Given a date string "YYYY-MM-DD", returns the LOCAL-timezone start (00:00:00.000)
 * and end (23:59:59.999) of that day.
 *
 * This matches how dates are stored in the database — the seed uses
 * `date.setHours(0,0,0,0)` which creates local-midnight Date objects.
 * Using UTC boundaries instead would cause off-by-one bugs on servers
 * whose timezone is ahead of UTC (e.g. IST = UTC+5:30).
 */
export function getUTCDayRange(dateStr: string): { startOfDay: Date; endOfDay: Date } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

/**
 * Given a month string "YYYY-MM", returns LOCAL-timezone start of first day
 * and LOCAL-timezone end of last day of that month.
 */
export function getUTCMonthRange(monthStr: string): { startDate: Date; endDate: Date } {
  const [year, month] = monthStr.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = new Date(year, month - 1, lastDay, 23, 59, 59, 999);
  return { startDate, endDate };
}

/**
 * Convert a Date object to "YYYY-MM-DD" in the server's LOCAL timezone.
 *
 * The seed stores dates at local midnight (e.g. `2026-08-25T00:00:00+05:30`),
 * which MongoDB internally stores as UTC milliseconds (e.g. `2026-08-24T18:30:00Z`).
 * Using `toISOString().split("T")[0]` converts to UTC date string — off by one day
 * for any server east of UTC.  This helper avoids that by using local accessors.
 */
export function getLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
