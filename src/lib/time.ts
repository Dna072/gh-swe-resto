export type IsoDateTime = string;

export function nowIso(date = new Date()): IsoDateTime {
  return date.toISOString();
}

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const WEEKDAYS: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function weekdayInTimeZone(at: Date, timeZone: string): Weekday {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  });
  const name = formatter.format(at).toLowerCase();
  const match = WEEKDAYS.find((day) => day === name);
  if (!match) {
    throw new Error(`Unable to resolve weekday for ${timeZone}`);
  }
  return match;
}

export function isWeekendDay(day: Weekday, weekendDays: readonly Weekday[]): boolean {
  return weekendDays.includes(day);
}

export type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: Weekday;
};

export function zonedDateTimeParts(at: Date, timeZone: string): ZonedDateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const values = Object.fromEntries(formatter.formatToParts(at).map((part) => [part.type, part.value]));
  const weekdayName = (values.weekday ?? "").toLowerCase();
  const weekday = WEEKDAYS.find((day) => day === weekdayName);
  if (!weekday) {
    throw new Error(`Unable to resolve weekday for ${timeZone}`);
  }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    weekday,
  };
}

export function timeZoneOffsetMs(at: Date, timeZone: string): number {
  const parts = zonedDateTimeParts(at, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  return asUtc - at.getTime();
}

/** Interpret a civil date/time in `timeZone` as a UTC instant. */
export function fromZonedTime(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const first = new Date(utcGuess - timeZoneOffsetMs(new Date(utcGuess), timeZone));
  const adjusted = new Date(utcGuess - timeZoneOffsetMs(first, timeZone));
  return adjusted;
}

export function addCalendarDays(
  parts: { year: number; month: number; day: number },
  days: number,
): { year: number; month: number; day: number } {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

export function ymd(parts: { year: number; month: number; day: number }): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}
