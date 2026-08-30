export const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";

export type OpeningHours = {
  timeZone: string;
  /** Minutes from midnight, inclusive. */
  openMinute: number;
  /** Minutes from midnight, inclusive last bookable slot. */
  closeMinute: number;
  stepMinutes: number;
  minLeadHours: number;
  horizonDays: number;
};

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  timeZone: STOCKHOLM_TIME_ZONE,
  openMinute: 11 * 60,
  closeMinute: 19 * 60,
  stepMinutes: 30,
  minLeadHours: 24,
  horizonDays: 14,
};
