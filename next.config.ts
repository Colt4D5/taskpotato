import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/taskpotato",
  assetPrefix: "/taskpotato/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
