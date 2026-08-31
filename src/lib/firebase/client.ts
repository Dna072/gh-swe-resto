"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";

function firebaseWebConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !authDomain || !projectId) {
    return null;
  }
  return { apiKey, authDomain, projectId };
}

function authOrNull() {
  const config = firebaseWebConfig();
  if (!config) {
    return null;
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  return getAuth(app);
}

export function staffPasswordLoginAvailable(): boolean {
  return firebaseWebConfig() !== null;
}

export function customerPasswordLoginAvailable(): boolean {
  return firebaseWebConfig() !== null;
}

export async function signInStaff(email: string, password: string): Promise<string> {
  const auth = authOrNull();
  if (!auth) {
    throw new Error("Firebase staff login is not configured in this environment.");
  }
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user.getIdToken();
}

export async function signInCustomerFirebase(email: string, password: string): Promise<string> {
  const auth = authOrNull();
  if (!auth) {
    throw new Error("Firebase customer login is not configured in this environment.");
  }
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user.getIdToken();
}

export async function registerCustomerFirebase(email: string, password: string): Promise<string> {
  const auth = authOrNull();
  if (!auth) {
    throw new Error("Firebase is not configured in this environment.");
  }
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user.getIdToken();
}
