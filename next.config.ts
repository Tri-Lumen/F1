import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  output: "standalone",
  // Expose the release version to the client so image URLs can be cache-busted
  // automatically on each release instead of relying on a hand-bumped constant.
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.formula1.com",
      },
      {
        protocol: "https",
        hostname: "**.formula1.com",
      },
    ],
  },
};

export default nextConfig;
