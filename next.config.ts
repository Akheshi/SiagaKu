import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lindungi dari "version skew": tab yang masih memegang versi lama akan
  // dimuat ulang penuh saat versi baru aktif, bukan menampilkan galat.
  // VERCEL_DEPLOYMENT_ID tersedia otomatis saat build di Vercel.
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || undefined,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
