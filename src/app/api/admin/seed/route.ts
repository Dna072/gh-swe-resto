import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/infrastructure/firebase/admin";
import { restaurantHasMenu, seedFirestoreCatalog } from "@/infrastructure/firestore/seed";
import { firestoreDataStoreEnabled } from "@/lib/data-store";
import { AppError } from "@/lib/errors";
import { requireAdmin } from "@/server/admin-auth";
import { dataStoreInitError, restaurantIdFromEnv } from "@/server/composition";
import { errorResponse } from "@/server/http";

export async function POST(request: Request) {
  try {
    await requireAdmin(request, "menu:write");
    const initError = dataStoreInitError();
    if (initError) {
      return NextResponse.json(
        { code: "INTERNAL", seeded: false, message: initError },
        { status: 500 },
      );
    }
    if (!firestoreDataStoreEnabled()) {
      return NextResponse.json({
        seeded: false,
        dataStore: "memory",
        message: "This instance is using the in-memory catalog. Set DATA_STORE=firestore to seed Firebase.",
      });
    }
    const force = new URL(request.url).searchParams.get("force") === "true";
    const restaurantId = restaurantIdFromEnv();
    const db = getAdminFirestore();
    if (!force && (await restaurantHasMenu(db, restaurantId))) {
      return NextResponse.json({
        seeded: false,
        alreadyPresent: true,
        restaurantId,
        message: "Menu already exists in Firestore. Pass ?force=true to rewrite the demo catalog.",
      });
    }
    const result = await seedFirestoreCatalog(db, restaurantId);
    return NextResponse.json({ seeded: true, ...result });
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error);
    }
    const message = error instanceof Error ? error.message : "Seed failed.";
    return NextResponse.json({ code: "INTERNAL", seeded: false, message }, { status: 500 });
  }
}
