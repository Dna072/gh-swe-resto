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
