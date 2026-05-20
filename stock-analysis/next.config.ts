import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

const parentDir = path.join(process.cwd(), "..");
const isMonorepoRoot =
  fs.existsSync(path.join(parentDir, "package.json")) &&
  fs.existsSync(path.join(process.cwd(), "package.json"));

const nextConfig: NextConfig = {
  serverExternalPackages: ["yahoo-finance2"],
  ...(isMonorepoRoot
    ? { outputFileTracingRoot: parentDir }
    : {}),
};

export default nextConfig;
