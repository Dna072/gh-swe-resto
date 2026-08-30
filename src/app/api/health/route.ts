import { NextResponse } from "next/server";
import { SCHEMA_VERSION } from "@/domains/shared/types";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ghana-restaurant",
    phase: 4,
    schemaVersion: SCHEMA_VERSION,
  });
}
