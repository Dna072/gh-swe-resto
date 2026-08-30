import type { AppEnv } from "./env";

export function isCloudRun(source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): boolean {
  return Boolean(source.K_SERVICE);
}

/** Auto-issue ADMIN_DEV_TOKEN only on a local machine — never on Cloud Run. */
export function allowLocalAdminBootstrap(
  env: Pick<AppEnv, "APP_ENV" | "ADMIN_DEV_TOKEN">,
  source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return env.APP_ENV !== "production" && Boolean(env.ADMIN_DEV_TOKEN) && !isCloudRun(source);
}
