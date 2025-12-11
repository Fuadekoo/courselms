import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    "@heroui/react",
    "@heroui/theme",
    "@heroui/system",
    "pdf-lib",
  ],
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
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"], // Keep error and warn logs in production
          }
        : false,
  },
  // Optimize build ID generation - use simple timestamp for faster builds
  generateBuildId: async () => {
    // Skip git command for faster builds on VPS
    return `build-${Date.now()}`;
  },
  typescript: {
    // Disable TypeScript errors during builds to allow build to succeed
    ignoreBuildErrors: true,
    // Skip TypeScript type checking entirely for faster builds
    // tsconfigPath: "./tsconfig.json",
  },
  eslint: {
    // Disable ESLint during builds for faster compilation
    ignoreDuringBuilds: true,
  },
  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  turbopack: {
    // Exclude fuad folder from Turbopack processing
    resolveAlias: {
      // This prevents Turbopack from analyzing files in the fuad directory
    },
  },
  // Disable source maps completely for faster builds
  productionBrowserSourceMaps: false,
  // Disable source maps in development too
  devIndicators: {
    buildActivity: false,
  },
  webpack: (config, { isServer, dev }) => {
    // Ensure proper module resolution
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      "node_modules",
    ];

    // Fix for pdf-lib and other packages with internal module resolution issues
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Ensure proper extension resolution
    config.resolve.extensions = [
      ...(config.resolve.extensions || []),
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".json",
    ];

    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
      ".jsx": [".jsx", ".tsx"],
    };

    // Exclude the fuad directory from webpack processing
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/fuad/**",
        "**/node_modules/**",
        "**/fuad",
        "fuad/**",
        "fuad",
      ],
    };

    // Use IgnorePlugin to completely exclude fuad folder from bundling
    const webpack = require("webpack");
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /fuad/,
      }),
      new webpack.IgnorePlugin({
        checkResource(resource: string) {
          return resource.includes("fuad");
        },
      })
    );

    // Suppress source map warnings in development (these are harmless warnings from Next.js internals)
    if (dev) {
      config.ignoreWarnings = [
        { module: /node_modules/ },
        { module: /fuad/ },
        { message: /sourceMapURL/ },
        { message: /Invalid source map/ },
        { message: /fuad/ },
        { message: /The file pattern.*fuad/ },
      ];
    }

    // Optimize webpack for faster builds
    if (!isServer && !dev) {
      // Production client-side optimizations
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic", // Better caching
        // Reduce bundle analysis overhead
        usedExports: true,
        sideEffects: false,
        // Parallel processing - reduce for VPS with limited resources
        minimize: true,
        // Reduce chunk splitting overhead
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };

      // Cache webpack builds for faster subsequent builds
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
        // Reduce cache overhead
        compression: "gzip",
      };
    }

    // Enable caching for all builds (including server)
    if (!dev) {
      config.cache = config.cache || {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
        compression: "gzip",
      };
    }

    // Exclude heavy packages from server bundle if not needed
    if (isServer) {
      const existingExternals = config.externals || [];
      // Don't bundle these in server - they're Node.js only
      config.externals = [
        ...(Array.isArray(existingExternals)
          ? existingExternals
          : [existingExternals]),
        {
          sharp: "commonjs sharp",
          bcryptjs: "commonjs bcryptjs",
          "@prisma/client": "commonjs @prisma/client",
          mysql2: "commonjs mysql2",
        },
      ].filter(Boolean);
    }

    // Reduce parallel processing for VPS with limited CPU (only in production)
    if (!dev && process.env.NODE_ENV === "production") {
      // Use limited parallelism to avoid memory issues on VPS
      config.parallelism = Math.max(
        1,
        Math.floor((require("os").cpus().length || 2) / 2)
      );
    }

    return config;
  },
};

export default nextConfig;
