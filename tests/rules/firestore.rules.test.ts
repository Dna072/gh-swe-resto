import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let testEnv: RulesTestEnvironment;

const restaurantId = "uppsala-main";

async function seed() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "restaurants", restaurantId), { name: "Meridian Fusion Cuisine", city: "Uppsala" });
    await setDoc(doc(db, "restaurants", restaurantId, "menuItems", "jollof"), {
      name: "Jollof Rice",
      archivedAt: null,
      isAvailable: true,
      basePriceOre: 12900,
    });
    await setDoc(doc(db, "restaurants", restaurantId, "inventory", "tilapia"), {
      sku: "tilapia",
      availableQuantity: 1,
    });
    await setDoc(doc(db, "restaurants", restaurantId, "promotions", "welcome"), {
      code: "WELCOME10",
      percentOff: 10,
    });
    await setDoc(doc(db, "orders", "order-guest"), {
      publicOrderNumber: "GH1048",
      customerId: null,
      totalOre: 17800,
      paymentStatus: "PAID",
    });
    await setDoc(doc(db, "orders", "order-customer"), {
      publicOrderNumber: "GH1049",
      customerId: "customer-1",
      totalOre: 17800,
      paymentStatus: "PAID",
    });
    await setDoc(doc(db, "payments", "pay-1"), {
      orderId: "order-customer",
      status: "succeeded",
      amountOre: 17800,
    });
    await setDoc(doc(db, "customers", "customer-1"), {
      email: "ama@example.com",
      name: "Ama",
    });
    await setDoc(doc(db, "customers", "customer-2"), {
      email: "kofi@example.com",
      name: "Kofi",
    });
    await setDoc(doc(db, "reviews", "rev-approved"), {
      orderId: "order-customer",
      customerId: "customer-1",
      rating: 5,
      status: "APPROVED",
    });
    await setDoc(doc(db, "reviews", "rev-pending"), {
      orderId: "order-guest",
      customerId: "customer-2",
      rating: 4,
      status: "PENDING",
    });
  });
}

function guest() {
  return testEnv.unauthenticatedContext().firestore();
}

function customer(uid: string) {
  return testEnv.authenticatedContext(uid, { role: "CUSTOMER" }).firestore();
}

function staff(uid: string, role: string) {
  return testEnv.authenticatedContext(uid, { role, restaurantId }).firestore();
}

describe("Firestore security rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "ghana-restaurant-test",
      firestore: {
        rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
        host: process.env.FIRESTORE_EMULATOR_HOST?.split(":")[0] ?? "127.0.0.1",
        port: Number(process.env.FIRESTORE_EMULATOR_HOST?.split(":")[1] ?? 8080),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await seed();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("allows guests to read the published menu", async () => {
    await assertSucceeds(getDoc(doc(guest(), "restaurants", restaurantId, "menuItems", "jollof")));
  });

  it("denies guest access to other customers and guest orders", async () => {
    await assertFails(getDoc(doc(guest(), "orders", "order-guest")));
    await assertFails(getDoc(doc(guest(), "customers", "customer-1")));
  });

  it("allows a customer to read only their own order and profile", async () => {
    const ama = customer("customer-1");
    await assertSucceeds(getDoc(doc(ama, "orders", "order-customer")));
    await assertSucceeds(getDoc(doc(ama, "customers", "customer-1")));
    await assertFails(getDoc(doc(ama, "customers", "customer-2")));
    await assertFails(getDoc(doc(ama, "orders", "order-guest")));
  });

  it("denies customer writes to orders, prices, payments and inventory", async () => {
    const ama = customer("customer-1");
    await assertFails(
      updateDoc(doc(ama, "orders", "order-customer"), { totalOre: 1, paymentStatus: "PAID" }),
    );
    await assertFails(
      updateDoc(doc(ama, "restaurants", restaurantId, "menuItems", "jollof"), { basePriceOre: 1 }),
    );
    await assertFails(updateDoc(doc(ama, "payments", "pay-1"), { status: "refunded" }));
    await assertFails(
      updateDoc(doc(ama, "restaurants", restaurantId, "inventory", "tilapia"), { availableQuantity: 99 }),
    );
  });

  it("denies guests from creating or modifying orders", async () => {
    await assertFails(
      setDoc(doc(guest(), "orders", "forged"), {
        totalOre: 1,
        paymentStatus: "PAID",
      }),
    );
  });

  it("allows kitchen staff to read orders but not payments or promotions", async () => {
    const kitchen = staff("kitchen-1", "KITCHEN");
    await assertSucceeds(getDoc(doc(kitchen, "orders", "order-customer")));
    await assertSucceeds(getDoc(doc(kitchen, "restaurants", restaurantId, "inventory", "tilapia")));
    await assertFails(getDoc(doc(kitchen, "payments", "pay-1")));
    await assertFails(getDoc(doc(kitchen, "restaurants", restaurantId, "promotions", "welcome")));
    await assertFails(updateDoc(doc(kitchen, "orders", "order-customer"), { orderStatus: "PREPARING" }));
  });

  it("allows finance to read payments but not inventory writes", async () => {
    const finance = staff("finance-1", "FINANCE");
    await assertSucceeds(getDoc(doc(finance, "payments", "pay-1")));
    await assertFails(
      updateDoc(doc(finance, "payments", "pay-1"), { amountOre: 1 }),
    );
    await assertFails(
      updateDoc(doc(finance, "restaurants", restaurantId, "inventory", "tilapia"), {
        availableQuantity: 0,
      }),
    );
  });

  it("denies unauthorized admin data and audit log access", async () => {
    await assertFails(getDoc(doc(customer("customer-1"), "auditLogs", "log-1")));
    await assertSucceeds(getDoc(doc(staff("owner-1", "OWNER"), "auditLogs", "log-1")));
  });

  it("blocks marketing from reading payments", async () => {
    await assertFails(getDoc(doc(staff("mkt-1", "MARKETING"), "payments", "pay-1")));
  });

  it("lets a customer create a pending review and read their own reviews", async () => {
    const ama = customer("customer-1");
    await assertSucceeds(getDoc(doc(ama, "reviews", "rev-approved")));
    await assertFails(getDoc(doc(ama, "reviews", "rev-pending")));
    await assertSucceeds(
      setDoc(doc(ama, "reviews", "rev-new"), {
        orderId: "order-customer",
        customerId: "customer-1",
        rating: 5,
        status: "PENDING",
      }),
    );
    await assertFails(
      setDoc(doc(ama, "reviews", "rev-forged"), {
        orderId: "order-customer",
        customerId: "customer-2",
        rating: 5,
        status: "PENDING",
      }),
    );
  });

  it("hides pending reviews from guests", async () => {
    await assertSucceeds(getDoc(doc(guest(), "reviews", "rev-approved")));
    await assertFails(getDoc(doc(guest(), "reviews", "rev-pending")));
  });
});
