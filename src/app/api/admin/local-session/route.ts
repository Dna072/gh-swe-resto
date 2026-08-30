import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function GET() {
  const env = getEnv();
  if (env.APP_ENV === "production" || !env.ADMIN_DEV_TOKEN) {
    return NextResponse.json({ local: false });
  }
  return NextResponse.json({ local: true, token: env.ADMIN_DEV_TOKEN });
}
