import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gp.lopesecia.com.br",
      },
      {
        protocol: "https",
        hostname: "lopesecia.com.br",
      },
      {
        protocol: "https",
        hostname: "www.catalogoambev.com.br",
      },
      {
        protocol: "https",
        hostname: "catalogoambev.com.br",
      },
    ],
  },
};

export default nextConfig;
