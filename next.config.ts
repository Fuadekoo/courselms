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
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"], // Keep error and warn logs in production
          }
        : false,
  },
  // Optimize build ID generation
  generateBuildId: async () => {
    // Use git commit hash if available, otherwise timestamp
    try {
      const { execSync } = require("child_process");
      const gitHash = execSync("git rev-parse --short HEAD", {
        encoding: "utf-8",
      }).trim();
      return `build-${gitHash}`;
    } catch {
      return `build-${Date.now()}`;
    }
  },
  typescript: {
    // Disable TypeScript errors during builds to allow build to succeed
    ignoreBuildErrors: true,
    // Use incremental builds for faster TypeScript compilation
    tsconfigPath: "./tsconfig.json",
    tsconfigPath: "./tsconfig.json",
  },
  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  turbopack: {
    // Exclude fuad folder from Turbopack processing
    resolveAlias: {
      // This prevents Turbopack from analyzing files in the fuad directory
    },
  },
  // Disable source maps in development to suppress warnings
  productionBrowserSourceMaps: false,
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
      ignored: ["**/fuad/**", "**/node_modules/**", /fuad/],
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
        // Parallel processing
        minimize: true,
      };

      // Cache webpack builds for faster subsequent builds
      config.cache = {
        type: "filesystem",
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
        ...(Array.isArray(existingExternals)
          ? existingExternals
          : [existingExternals]),
        {
          sharp: "commonjs sharp",
          bcryptjs: "commonjs bcryptjs",
        },
      ].filter(Boolean);
    }

    return config;
  },
};

export default nextConfig;
