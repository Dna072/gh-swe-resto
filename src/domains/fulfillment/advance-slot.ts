import { AppError } from "@/lib/errors";
import {
  addCalendarDays,
  fromZonedTime,
  ymd,
  zonedDateTimeParts,
} from "@/lib/time";
import { DEFAULT_OPENING_HOURS, type OpeningHours } from "./hours";

export type BookableSlot = {
  value: string;
  date: string;
  label: string;
};

export type BookableDay = {
  date: string;
  label: string;
  slots: BookableSlot[];
};

function minutesOfDay(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function wallTime(hours: OpeningHours, year: number, month: number, day: number, minuteOfDay: number): Date {
  return fromZonedTime(
    {
      year,
      month,
      day,
      hour: Math.floor(minuteOfDay / 60),
      minute: minuteOfDay % 60,
    },
    hours.timeZone,
  );
}

function ceilToStep(minuteOfDay: number, step: number): number {
  return Math.ceil(minuteOfDay / step) * step;
}

export function earliestBookableSlot(now = new Date(), hours: OpeningHours = DEFAULT_OPENING_HOURS): Date {
  const leadMs = hours.minLeadHours * 60 * 60 * 1000;
  const earliest = new Date(now.getTime() + leadMs);
  return snapToNextOpenSlot(earliest, hours);
}

export function snapToNextOpenSlot(at: Date, hours: OpeningHours = DEFAULT_OPENING_HOURS): Date {
  const parts = zonedDateTimeParts(at, hours.timeZone);
  let minute = ceilToStep(minutesOfDay(parts.hour, parts.minute), hours.stepMinutes);
  let year = parts.year;
  let month = parts.month;
  let day = parts.day;

  if (minute < hours.openMinute) {
    minute = hours.openMinute;
  }
  if (minute > hours.closeMinute) {
    const next = addCalendarDays({ year, month, day }, 1);
    year = next.year;
    month = next.month;
    day = next.day;
    minute = hours.openMinute;
  }

  return wallTime(hours, year, month, day, minute);
}

export function isExactOpenSlot(at: Date, hours: OpeningHours = DEFAULT_OPENING_HOURS): boolean {
  const parts = zonedDateTimeParts(at, hours.timeZone);
  const minute = minutesOfDay(parts.hour, parts.minute);
  if (minute < hours.openMinute || minute > hours.closeMinute) {
    return false;
  }
  if (minute % hours.stepMinutes !== 0) {
    return false;
  }
  const reconstructed = wallTime(hours, parts.year, parts.month, parts.day, minute);
  return Math.abs(reconstructed.getTime() - at.getTime()) < 1000;
}

export function resolveAdvanceDeliverySlot(
  scheduledFor: string,
  now = new Date(),
  hours: OpeningHours = DEFAULT_OPENING_HOURS,
): string {
  const parsed = new Date(scheduledFor);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("SLOT_UNAVAILABLE", "Choose a delivery date and time.");
  }
  if (!isExactOpenSlot(parsed, hours)) {
    throw new AppError("SLOT_UNAVAILABLE", "That delivery time is not available.");
  }
  const earliest = earliestBookableSlot(now, hours);
  if (parsed.getTime() + 1000 < earliest.getTime()) {
    throw new AppError("SLOT_UNAVAILABLE", "Choose a delivery time at least 24 hours from now.");
  }
  return parsed.toISOString();
}

function formatDayLabel(date: Date, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "sv-SE", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTimeLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function listBookableDays(
  now = new Date(),
  hours: OpeningHours = DEFAULT_OPENING_HOURS,
  locale = "sv",
): BookableDay[] {
  const earliest = earliestBookableSlot(now, hours);
  const start = zonedDateTimeParts(earliest, hours.timeZone);
  const days: BookableDay[] = [];

  for (let offset = 0; offset < hours.horizonDays; offset += 1) {
    const civil = addCalendarDays({ year: start.year, month: start.month, day: start.day }, offset);
    const slots: BookableSlot[] = [];
    for (let minute = hours.openMinute; minute <= hours.closeMinute; minute += hours.stepMinutes) {
      const at = wallTime(hours, civil.year, civil.month, civil.day, minute);
      if (at.getTime() + 1000 < earliest.getTime()) {
        continue;
      }
      slots.push({
        value: at.toISOString(),
        date: ymd(civil),
        label: formatTimeLabel(at, hours.timeZone),
      });
    }
    if (slots.length === 0) {
      continue;
    }
    const noon = wallTime(hours, civil.year, civil.month, civil.day, 12 * 60);
    days.push({
      date: ymd(civil),
      label: formatDayLabel(noon, hours.timeZone, locale),
      slots,
    });
  }

  return days;
}
