import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone bundle for VPS deploy:
  //   .next/standalone/        ← self-contained Node app (run: `node server.js`)
  //   .next/static/            ← copy to .next/standalone/.next/static/
  //   public/                  ← copy to .next/standalone/public/
  output: "standalone",
};

export default nextConfig;
