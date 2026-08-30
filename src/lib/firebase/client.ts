"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

function firebaseWebConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !authDomain || !projectId) {
    return null;
  }
  return { apiKey, authDomain, projectId };
}

export function staffPasswordLoginAvailable(): boolean {
  return firebaseWebConfig() !== null;
}

export async function signInStaff(email: string, password: string): Promise<string> {
  const config = firebaseWebConfig();
  if (!config) {
    throw new Error("Firebase staff login is not configured in this environment.");
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const credential = await signInWithEmailAndPassword(getAuth(app), email, password);
  return credential.user.getIdToken();
}
