#!/bin/bash

# Production startup script
# This ensures the build exists before starting the server

set -e

echo "🚀 Starting production server..."

# Navigate to app directory
cd /home/ubuntu/course || exit 1

# Check if .next directory exists and has required files
if [ ! -f ".next/prerender-manifest.json" ]; then
    echo "📦 Build not found. Building application..."
    
    # Set Node.js memory limit
    export NODE_OPTIONS="--max-old-space-size=4096"
    export NODE_ENV="production"
    
    # Run build
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ Build failed! Exiting..."
        exit 1
    fi
    
    echo "✅ Build completed successfully!"
else
    echo "✅ Build already exists, skipping build step..."
fi

# Start the server
echo "🎯 Starting server..."
exec node --loader ts-node/esm server.ts

