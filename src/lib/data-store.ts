import { getEnv, type AppEnv } from "./env";
import { isCloudRun } from "./runtime";

export function firestoreDataStoreEnabled(
  env: AppEnv = getEnv(),
  source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  if (env.DATA_STORE === "memory") {
    return false;
  }
  if (env.DATA_STORE === "firestore") {
    return true;
  }
  if (source.FIRESTORE_EMULATOR_HOST) {
    return true;
  }
  const project = env.FIREBASE_PROJECT_ID ?? env.GOOGLE_CLOUD_PROJECT ?? source.GOOGLE_CLOUD_PROJECT;
  return isCloudRun(source) && Boolean(project);
}
