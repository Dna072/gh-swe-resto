import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { allowLocalAdminBootstrap } from "@/lib/runtime";

export async function GET() {
  const env = getEnv();
  if (!allowLocalAdminBootstrap(env)) {
    return NextResponse.json({ local: false });
  }
  return NextResponse.json({ local: true, token: env.ADMIN_DEV_TOKEN });
}
