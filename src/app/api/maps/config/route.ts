import { NextResponse } from "next/server";
import { logger } from "@/lib/logging/logger";
import { mapRuntimeConfig, redactMapUrl } from "@/lib/maps/style";

export const dynamic = "force-dynamic";

function hintFor(args: {
  provider: string;
  source: string;
  styleOk: boolean;
  styleStatus: number | null;
  styleError?: string;
}): string | undefined {
  if (!args.styleOk) {
    if (args.provider === "maptiler") {
      return "MapTiler rejected the style URL. Check the key, allowed origins, and referrers in the MapTiler dashboard.";
    }
    return args.styleError ?? "The vector style URL could not be fetched. The map will try OpenStreetMap raster tiles.";
  }
  if (args.provider === "openfreemap") {
    return "No MapTiler key on the server. Set MAPTILER_API_KEY or NEXT_PUBLIC_MAPTILER_KEY on Cloud Run — they are read at request time, so you do not need to rebuild.";
  }
  if (args.source === "MAPTILER_API_KEY") {
    return "Using MAPTILER_API_KEY from the server. This key appears in browser tile URLs (same as NEXT_PUBLIC_MAPTILER_KEY).";
  }
  return undefined;
}

export async function GET() {
  const config = mapRuntimeConfig({
    NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
    NEXT_PUBLIC_MAPTILER_KEY: process.env.NEXT_PUBLIC_MAPTILER_KEY,
    MAPTILER_API_KEY: process.env.MAPTILER_API_KEY,
  });

  let styleStatus: number | null = null;
  let styleOk = false;
  let styleError: string | undefined;
  try {
    const response = await fetch(config.styleUrl, { cache: "no-store" });
    styleStatus = response.status;
    styleOk = response.ok;
    if (!response.ok) {
      styleError = `style fetch HTTP ${response.status}`;
    }
  } catch (error) {
    styleError = error instanceof Error ? error.message : "style fetch failed";
  }

  const hint = hintFor({
    provider: config.provider,
    source: config.source,
    styleOk,
    styleStatus,
    styleError,
  });

  logger.info("maps_style_config", {
    provider: config.provider,
    source: config.source,
    styleUrl: redactMapUrl(config.styleUrl),
    styleOk,
    styleStatus,
    styleError,
  });

  return NextResponse.json({
    provider: config.provider,
    styleUrl: config.styleUrl,
    source: config.source,
    diagnostics: {
      styleOk,
      styleStatus,
      styleError,
      hint,
      runtimeHasPublicMaptilerKey: Boolean(process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim()),
      runtimeHasServerMaptilerKey: Boolean(process.env.MAPTILER_API_KEY?.trim()),
    },
  });
}
