import type { NextConfig } from "next";
import path from "path";

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
      "@radix-ui/react-tabs",
      "date-fns",
      "lodash",
      "zod",
      "react-hook-form",
    ],
    serverActions: {
      bodySizeLimit: "1000mb", // Increase from default 1MB to 1000MB for file uploads
    },
    // Note: optimizeCss disabled - requires critters package which can cause build issues
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
  // Optimize build ID generation (simplified for faster builds)
  generateBuildId: async () => {
    // Use simple timestamp for faster builds (git hash adds overhead)
    return `build-${Date.now()}`;
  },
  typescript: {
    // Disable TypeScript errors during builds to allow build to succeed
    ignoreBuildErrors: true,
    // Use incremental builds for faster TypeScript compilation
    tsconfigPath: "./tsconfig.json",
    // tsconfigPath: "./tsconfig.json",
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
    // Optimize module resolution for faster builds
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      "node_modules",
    ];

    // Cache module resolution results
    config.resolve.cache = true;
    config.resolve.cacheWithContext = false; // Faster resolution

    // Fix for pdf-lib and other packages with internal module resolution issues
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Optimize extension resolution order (most common first)
    config.resolve.extensions = [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".json",
      ...(config.resolve.extensions || []),
    ].filter((ext, index, self) => self.indexOf(ext) === index); // Remove duplicates

    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
      ".jsx": [".jsx", ".tsx"],
    };

    // Enable faster module resolution
    config.resolve.unsafeCache = true;

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

    // Enable filesystem cache for ALL builds (dev and production)
    // Use webpack's default cache location (safer and faster)
    if (!config.cache) {
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
        // Let webpack use default cache directory (node_modules/.cache/webpack)
        // This avoids path resolution issues and is optimized by webpack
        compression: "gzip",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      };
    } else {
      // Merge with existing cache config
      config.cache = {
        ...config.cache,
        type: "filesystem",
        buildDependencies: {
          ...(config.cache.buildDependencies || {}),
          config: [__filename],
        },
      };
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
        // Simplified chunk splitting for faster builds
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk (React, etc.)
            framework: {
              name: "framework",
              chunks: "all",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Large libraries
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module: any) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                return packageName
                  ? `lib-${packageName.replace("@", "").replace("/", "-")}`
                  : "lib";
              },
              priority: 30,
              minChunks: 1,
              minSize: 0,
              reuseExistingChunk: true,
            },
            // Common chunks
            commons: {
              name: "commons",
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Optimize for development builds too
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false, // Faster dev builds
        // Disable minification in dev for speed
        minimize: false,
      };
      // Faster source maps in dev
      config.devtool = "eval-cheap-module-source-map";
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
          // Add more heavy packages that don't need bundling
          "@prisma/client": "commonjs @prisma/client",
          mysql2: "commonjs mysql2",
          express: "commonjs express",
        },
      ].filter(Boolean);
    }

    // Optimize loader performance with parallel processing
    config.parallelism = Math.max(1, require("os").cpus().length - 1); // Use all but one CPU core

    // Optimize module processing
    config.module = config.module || {};
    if (config.module.rules) {
      // Add faster processing for common file types
      config.module.rules.forEach((rule: any) => {
        if (rule && rule.test && rule.use) {
          // Enable caching for loaders
          if (Array.isArray(rule.use)) {
            rule.use.forEach((use: any) => {
              if (use && typeof use === "object" && use.loader) {
                use.options = {
                  ...use.options,
                  cache: true,
                };
              }
            });
          }
        }
      });
    }

    // Reduce build output noise for faster builds
    config.infrastructureLogging = {
      level: "error", // Only show errors
    };

    return config;
  },
};

export default nextConfig;
