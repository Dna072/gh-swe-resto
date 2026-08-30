import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  APP_BASE_URL: z.string().optional(),
  DEFAULT_RESTAURANT_ID: z.string().default("uppsala-main"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
  GCS_ASSETS_BUCKET: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["mock", "stripe"]).default("mock"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  DELIVERY_PROVIDER: z.enum(["mock", "wolt"]).default("mock"),
  WOLT_DRIVE_API_BASE_URL: z.string().optional(),
  WOLT_DRIVE_MERCHANT_ID: z.string().optional(),
  WOLT_DRIVE_API_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["mock", "smtp"]).default("mock"),
  ADMIN_DEV_TOKEN: z.string().optional(),
  DATA_STORE: z.enum(["memory", "firestore"]).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | undefined;

const LOCAL_ADMIN_DEV_TOKEN = "dev-admin-token";

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }
  const data = parsed.data;
  if (!data.ADMIN_DEV_TOKEN && data.APP_ENV !== "production") {
    return { ...data, ADMIN_DEV_TOKEN: LOCAL_ADMIN_DEV_TOKEN };
  }
  return data;
}

export function getEnv(): AppEnv {
  cached ??= loadEnv();
  return cached;
}

export function resetEnvCache(): void {
  cached = undefined;
}

export function firebaseProjectId(env: AppEnv = getEnv()): string {
  return (
    env.FIREBASE_PROJECT_ID ??
    env.GOOGLE_CLOUD_PROJECT ??
    env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    "ghana-restaurant-dev"
  );
}
