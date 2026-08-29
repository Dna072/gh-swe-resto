import { NextResponse } from "next/server";
import { SCHEMA_VERSION } from "@/domains/shared/types";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ghana-restaurant",
    phase: 2,
    schemaVersion: SCHEMA_VERSION,
  });
}
