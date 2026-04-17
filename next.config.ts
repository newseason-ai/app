import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin workspace root to this package so Turbopack does not pick a parent lockfile.
    root: path.join(__dirname),
  },
};

export default nextConfig;
