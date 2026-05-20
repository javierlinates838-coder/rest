import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["yahoo-finance2"],
  // Monorepo: trace deps from repo root when Vercel builds via workspace
  outputFileTracingRoot: path.join(process.cwd(), ".."),
};

export default nextConfig;
