import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone bundle for VPS deploy:
  //   .next/standalone/        ← self-contained Node app (run: `node server.js`)
  //   .next/static/            ← copy to .next/standalone/.next/static/
  //   public/                  ← copy to .next/standalone/public/
  output: "standalone",

  // Dev only: let a phone on the LAN load the dev server's JS/HMR assets.
  // Without this, Next blocks cross-origin dev resources, the bundle never
  // loads over the network IP, hydration fails, and no button responds.
  allowedDevOrigins: ["192.168.178.92", "192.168.178.*"],
};

export default nextConfig;
