import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseProjectId, getEnv, type AppEnv } from "@/lib/env";

let app: App | undefined;
let firestoreConfigured = false;

function usingFirebaseEmulators(env: AppEnv): boolean {
  return Boolean(
    env.FIRESTORE_EMULATOR_HOST ||
      env.FIREBASE_AUTH_EMULATOR_HOST ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      process.env.FIREBASE_STORAGE_EMULATOR_HOST,
  );
}

export function getFirebaseAdminApp(): App {
  if (app) {
    return app;
  }
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return existing;
  }
  const env = getEnv();
  const projectId = firebaseProjectId(env);
  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      projectId,
    });
    return app;
  }
  // Emulators do not need ADC. Calling applicationDefault() locally hangs while
  // probing the metadata server / gcloud credentials, which freezes page loads.
  if (usingFirebaseEmulators(env)) {
    app = initializeApp({ projectId });
    return app;
  }
  app = initializeApp({
    credential: applicationDefault(),
    projectId,
  });
  return app;
}

export function getAdminFirestore() {
  const firestore = getFirestore(getFirebaseAdminApp());
  if (!firestoreConfigured) {
    try {
      firestore.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings may only be applied once per process
    }
    firestoreConfigured = true;
  }
  return firestore;
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
