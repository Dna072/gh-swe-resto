import type { App } from "firebase-admin/app";
import { firebaseProjectId, getEnv } from "@/lib/env";
import { loadRuntimePackage } from "@/lib/node-load";
import { isCloudRun } from "@/lib/runtime";

let app: App | undefined;
let firestoreConfigured = false;

function adminApp() {
  return loadRuntimePackage<typeof import("firebase-admin/app")>("firebase-admin/app");
}

function adminFirestore() {
  return loadRuntimePackage<typeof import("firebase-admin/firestore")>("firebase-admin/firestore");
}

function adminAuth() {
  return loadRuntimePackage<typeof import("firebase-admin/auth")>("firebase-admin/auth");
}

export function getFirebaseAdminApp(): App {
  if (app) {
    return app;
  }
  const { applicationDefault, cert, getApps, initializeApp } = adminApp();
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
  try {
    app = initializeApp({
      ...(isCloudRun() ? {} : { credential: applicationDefault() }),
      projectId,
    });
    return app;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    throw new Error(`Firebase Admin failed to start for project ${projectId}: ${detail}`);
  }
}

export function getAdminFirestore() {
  const { getFirestore } = adminFirestore();
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
  return adminAuth().getAuth(getFirebaseAdminApp());
}
