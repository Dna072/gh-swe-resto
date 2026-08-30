import { NextResponse } from "next/server";
import { listBookableDays } from "@/domains/fulfillment/advance-slot";
import { DEFAULT_OPENING_HOURS } from "@/domains/fulfillment/hours";
import { getLocale } from "@/lib/i18n/server";
import { restaurantSettings } from "@/server/composition";
import { errorResponse } from "@/server/http";

export async function GET() {
  try {
    const locale = await getLocale();
    const hours = restaurantSettings().openingHours ?? DEFAULT_OPENING_HOURS;
    const dates = listBookableDays(new Date(), hours, locale);
    return NextResponse.json({
      timeZone: hours.timeZone,
      minLeadHours: hours.minLeadHours,
      dates,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
