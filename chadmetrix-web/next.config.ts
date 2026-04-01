// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['chadmetrix.ru'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'chadmetrix.ru',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;