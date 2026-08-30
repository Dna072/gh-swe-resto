import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@google-cloud/storage",
    "google-auth-library",
    "google-gax",
  ],
  typescript: {
    tsconfigPath: "tsconfig.build.json",
  },
  outputFileTracingIncludes: {
    "*": [
      "node_modules/firebase-admin/**",
      "node_modules/gcp-metadata/**",
      "node_modules/google-auth-library/**",
      "node_modules/google-logging-utils/**",
      "node_modules/gtoken/**",
      "node_modules/@google-cloud/firestore/**",
      "node_modules/@google-cloud/storage/**",
    ],
  },
  outputFileTracingExcludes: {
    "*": [
      "node_modules/firebase-tools/**",
      "node_modules/@firebase/rules-unit-testing/**",
      "node_modules/vitest/**",
      "node_modules/@testing-library/**",
      "node_modules/jsdom/**",
      "tests/**",
      "data/**",
      ".firebase/**",
      "coverage/**",
      "emulator-data/**",
      "scripts/**",
    ],
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/api/media/**" },
      { pathname: "/uploads/**" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
  async headers() {
    const development = process.env.NODE_ENV !== "production";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              development
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://apis.google.com"
                : "script-src 'self' 'unsafe-inline' https://js.stripe.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://storage.googleapis.com",
              development
                ? "connect-src 'self' ws: wss: http: https:"
                : "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://api.stripe.com wss://*.firebaseio.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
