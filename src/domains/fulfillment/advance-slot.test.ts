import { describe, expect, it } from "vitest";
import { DEFAULT_OPENING_HOURS } from "./hours";
import {
  earliestBookableSlot,
  isExactOpenSlot,
  listBookableDays,
  resolveAdvanceDeliverySlot,
  snapToNextOpenSlot,
} from "./advance-slot";

function stockholm(isoLocal: string): Date {
  return new Date(isoLocal);
}

describe("advance delivery slots", () => {
  it("requires 24 hours lead time and snaps into opening hours", () => {
    const noonSunday = stockholm("2026-08-30T10:00:00.000Z");
    const earliest = earliestBookableSlot(noonSunday);
    expect(earliest.toISOString()).toBe("2026-08-31T10:00:00.000Z");

    const lateEvening = stockholm("2026-08-30T17:10:00.000Z");
    expect(earliestBookableSlot(lateEvening).toISOString()).toBe("2026-09-01T09:00:00.000Z");

    const beforeOpen = stockholm("2026-08-30T08:00:00.000Z");
    expect(earliestBookableSlot(beforeOpen).toISOString()).toBe("2026-08-31T09:00:00.000Z");
  });

  it("accepts 11:00 and 19:00 Stockholm slots on the 30-minute grid", () => {
    const open = stockholm("2026-08-31T09:00:00.000Z");
    const close = stockholm("2026-08-31T17:00:00.000Z");
    expect(isExactOpenSlot(open)).toBe(true);
    expect(isExactOpenSlot(close)).toBe(true);
    expect(isExactOpenSlot(stockholm("2026-08-31T08:30:00.000Z"))).toBe(false);
    expect(isExactOpenSlot(stockholm("2026-08-31T17:30:00.000Z"))).toBe(false);
    expect(isExactOpenSlot(stockholm("2026-08-31T10:15:00.000Z"))).toBe(false);
  });

  it("rejects same-day and off-grid times", () => {
    const now = stockholm("2026-08-30T10:00:00.000Z");
    expect(() => resolveAdvanceDeliverySlot("2026-08-30T14:00:00.000Z", now)).toThrow(/24 hours/i);
    expect(() => resolveAdvanceDeliverySlot("2026-08-31T10:15:00.000Z", now)).toThrow(/not available/i);
    expect(resolveAdvanceDeliverySlot("2026-08-31T10:00:00.000Z", now)).toBe("2026-08-31T10:00:00.000Z");
  });

  it("lists bookable days from the server hours, not a hardcoded UI table", () => {
    const now = stockholm("2026-08-30T10:00:00.000Z");
    const days = listBookableDays(now, DEFAULT_OPENING_HOURS, "en");
    expect(days[0]?.date).toBe("2026-08-31");
    expect(days[0]?.slots[0]?.label).toBe("12:00");
    expect(days[0]?.slots.at(-1)?.label).toBe("19:00");
    expect(days).toHaveLength(DEFAULT_OPENING_HOURS.horizonDays);
  });

  it("snaps minutes up to the next step", () => {
    const at = stockholm("2026-08-31T10:01:00.000Z");
    expect(snapToNextOpenSlot(at).toISOString()).toBe("2026-08-31T10:30:00.000Z");
  });
});
