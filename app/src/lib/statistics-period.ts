export interface StatisticsPeriod {
  // Inclusive, local midnight
  from: Date;
  // Exclusive
  to: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const monthFormat = new Intl.DateTimeFormat("sv-SE", { month: "short" });

// Monday 00:00 to next Monday 00:00 in local time
export function currentWeek(now = new Date()): StatisticsPeriod {
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const from = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysSinceMonday,
  );
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
  return { from, to };
}

// Monday 00:00 to Monday 00:00 the week before the current one
export function lastWeek(now = new Date()): StatisticsPeriod {
  const { from: to } = currentWeek(now);
  const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 7);
  return { from, to };
}

// 1st of last month 00:00 to 1st of this month 00:00 in local time
export function lastMonth(now = new Date()): StatisticsPeriod {
  const to = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = new Date(to.getFullYear(), to.getMonth() - 1, 1);
  return { from, to };
}

// ISO 8601 week number (weeks start on Monday)
export function isoWeekNumber(date: Date): number {
  const day = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  // The Thursday of the same week decides which year the week belongs to
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  return Math.ceil(((day.getTime() - yearStart) / DAY_MS + 1) / 7);
}

// Some engines format short months with a trailing dot ("okt.")
function shortMonth(date: Date) {
  return monthFormat.format(date).replace(/\.$/, "");
}

// "14 – 20 okt", or "28 sep – 4 okt" across months
export function formatPeriodRange({ from, to }: StatisticsPeriod): string {
  const last = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 1);
  if (from.getMonth() === last.getMonth()) {
    return `${from.getDate()} – ${last.getDate()} ${shortMonth(last)}`;
  }
  return `${from.getDate()} ${shortMonth(from)} – ${last.getDate()} ${shortMonth(last)}`;
}
