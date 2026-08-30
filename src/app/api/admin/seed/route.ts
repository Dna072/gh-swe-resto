import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/infrastructure/firebase/admin";
import { restaurantHasMenu, seedFirestoreCatalog } from "@/infrastructure/firestore/seed";
import { firestoreDataStoreEnabled } from "@/lib/data-store";
import { requireAdmin } from "@/server/admin-auth";
import { restaurantIdFromEnv } from "@/server/composition";
import { errorResponse } from "@/server/http";

export async function POST(request: Request) {
  try {
    await requireAdmin(request, "menu:write");
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
    return errorResponse(error);
  }
}
