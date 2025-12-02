#!/bin/bash

# Production deployment script
# Run this script to build and deploy the application

set -e

echo "🚀 Starting production deployment..."

# Navigate to app directory
cd /home/ubuntu/course || exit 1

# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Clean and build
echo "🧹 Cleaning previous build..."
rm -rf .next

echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Exiting..."
    exit 1
fi

echo "✅ Build completed successfully!"

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

echo "🎉 Deployment completed successfully!"
echo "📊 Check status with: pm2 status"
echo "📋 Check logs with: pm2 logs cc"

