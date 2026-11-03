import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Card fonts are read from disk at runtime (src/cards/fonts.ts).
  outputFileTracingIncludes: {
    "/api/card/**": ["./assets/fonts/*.ttf"],
  },
  // The card renderer draws PNGs with sharp when it loads (about 3x faster than its fallback). Vercel runs
  // glibc x64, so the musl and WebAssembly builds (28 MB) only slow down cold starts.
  outputFileTracingExcludes: {
    "/api/card/**": [
      "./node_modules/@img/sharp-libvips-linuxmusl-x64/**",
      "./node_modules/@img/sharp-linuxmusl-x64/**",
      "./node_modules/@img/sharp-wasm32/**",
    ],
  },
  experimental: {
    // app/global-not-found.tsx: the root layout sits under [locale], so unmatched URLs need their own document.
    globalNotFound: true,
  },
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
