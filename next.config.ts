import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "static",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
