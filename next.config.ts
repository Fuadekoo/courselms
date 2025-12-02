import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@heroui/react", "@heroui/theme", "@heroui/system"],
  experimental: {
    optimizePackageImports: [
      "@heroui/react",
      "lucide-react",
      "framer-motion",
      "recharts",
    ],
    serverActions: {
      bodySizeLimit: "1000mb", // Increase from default 1MB to 1000MB for file uploads
    },
  },
  // Handle favicon and static files
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/api/favicon",
      },
    ];
  },
  // Optimize build output
  // output: "standalone",
  // Compiler optimizations (SWC is already default in Next.js 15)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"], // Keep error and warn logs in production
    } : false,
  },
  // Skip favicon generation during build
  generateBuildId: async () => {
    return "build-" + Date.now();
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking can be slow - skip during build if needed (recommended to keep enabled)
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Exclude the fuad directory from webpack processing
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/fuad/**", "**/node_modules/**"],
    };
    
    // Optimize webpack for faster builds
    if (!isServer) {
      // Client-side optimizations
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic", // Better caching
      };
    }
    
    return config;
  },
};

export default nextConfig;
