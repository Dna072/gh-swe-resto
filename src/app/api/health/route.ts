import { NextResponse } from "next/server";
import { dataStoreName } from "@/server/composition";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: process.env.K_SERVICE ?? "local",
    revision: process.env.K_REVISION ?? "dev",
    dataStore: dataStoreName(),
  });
}
