import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path+/",
        destination: `${backendUrl}/api/:path+/`,
      },
      {
        source: "/api/:path+",
        destination: `${backendUrl}/api/:path+/`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
