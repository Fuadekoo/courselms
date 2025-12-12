import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ignore TypeScript build errors
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      bodySizeLimit: "1000mb", // Increase from default 1MB to 1000MB for file uploads
    },
  },
  async redirects() {
    return [
      // Basic redirect
      {
        source: "/",
        destination: "/en",
        permanent: true,
      },
      // Wildcard path matching
      // {
      //   source: "/blog/:slug",
      //   destination: "/news/:slug",
      //   permanent: true,
      // },
    ];
  },
};

export default nextConfig;
