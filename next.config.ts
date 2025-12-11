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
  // Optimize build ID generation
  generateBuildId: async () => {
    // Use git commit hash if available, otherwise timestamp
    try {
      const { execSync } = require('child_process');
      const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
      return `build-${gitHash}`;
    } catch {
      return `build-${Date.now()}`;
    }
  },
  typescript: {
    // Type checking can be slow - skip during build if needed (recommended to keep enabled)
    ignoreBuildErrors: false,
    // Use incremental builds for faster TypeScript compilation
    tsconfigPath: './tsconfig.json',
  },
  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  turbopack: {
    // Empty config to silence the warning - webpack config will be used when needed
  },
  webpack: (config, { isServer, dev }) => {
    // Exclude the fuad directory from webpack processing
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/fuad/**", "**/node_modules/**"],
    };
    
    // Optimize webpack for faster builds
    if (!isServer && !dev) {
      // Production client-side optimizations
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic", // Better caching
        // Reduce bundle analysis overhead
        usedExports: true,
        sideEffects: false,
        // Parallel processing
        minimize: true,
      };
      
      // Cache webpack builds for faster subsequent builds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    // Exclude heavy packages from server bundle if not needed
    if (isServer) {
      const existingExternals = config.externals || [];
      // Don't bundle these in server - they're Node.js only
      config.externals = [
        ...(Array.isArray(existingExternals) ? existingExternals : [existingExternals]),
        {
          'sharp': 'commonjs sharp',
          'bcryptjs': 'commonjs bcryptjs',
        },
      ].filter(Boolean);
    }
    
    return config;
  },
};

export default nextConfig;
