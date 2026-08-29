import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    formats: ["image/avif", "image/webp"],
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
