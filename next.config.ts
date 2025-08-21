import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { 
            key: "Access-Control-Allow-Origin", 
            value: process.env.NODE_ENV === 'production' 
              ? process.env.NEXTAUTH_URL || "https://yourdomain.com"
              : "*" 
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
          // Security headers
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options", 
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin"
          }
        ],
      },
    ];
  },
};

export default nextConfig;
