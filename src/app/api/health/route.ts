import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = {
    service: process.env.K_SERVICE ?? "local",
    revision: process.env.K_REVISION ?? "dev",
  };
  try {
    const { dataStoreInitError, dataStoreName } = await import("@/server/composition");
    const initError = dataStoreInitError();
    return NextResponse.json({
      ok: !initError,
      ...base,
      dataStore: dataStoreName(),
      ...(initError ? { initError } : {}),
    }, { status: initError ? 503 : 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        ...base,
        dataStore: "unavailable",
        initError: error instanceof Error ? error.message : "composition failed to load",
      },
      { status: 503 },
    );
  }
}
