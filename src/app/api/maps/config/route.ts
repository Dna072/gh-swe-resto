import { NextResponse } from "next/server";
import { logger } from "@/lib/logging/logger";
import { googleMapsBrowserConfig, googleMapsConfigHint, redactMapSecret } from "@/lib/maps/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = googleMapsBrowserConfig({
    NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    GOOGLE_MAPS_SERVER_KEY: process.env.GOOGLE_MAPS_SERVER_KEY,
  });
  const hint = googleMapsConfigHint(config);

  logger.info("maps_google_config", {
    provider: config.provider,
    source: config.source,
    hasKey: Boolean(config.apiKey),
    key: redactMapSecret(config.apiKey),
  });

  return NextResponse.json({
    provider: config.provider,
    apiKey: config.apiKey,
    source: config.source,
    diagnostics: {
      hasKey: Boolean(config.apiKey),
      hint,
    },
  });
}
