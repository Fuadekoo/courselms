#!/bin/bash
# Quick fix for hanging npm install

echo "🔧 Fixing Hanging npm install"
echo "============================="
echo ""

# Kill any stuck npm processes
echo "🛑 Killing stuck npm processes..."
pkill -f npm 2>/dev/null || true
pkill -f node 2>/dev/null || true
sleep 2

# Navigate to project
cd /home/ubuntu/course || exit 1

# Clean everything
echo "🧹 Cleaning..."
rm -rf node_modules package-lock.json .npm
npm cache clean --force 2>/dev/null || true

# Configure npm for better performance
echo "⚙️  Configuring npm..."
npm config set registry https://registry.npmjs.org/
npm config set timeout 300000
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

# Show configuration
echo ""
echo "📋 npm Configuration:"
npm config list | grep -E "registry|timeout|fetch"
echo ""

# Try install
echo "📦 Installing dependencies..."
echo "This may take a while. Watch for progress..."
echo ""

# Install with verbose output
npm install --legacy-peer-deps --verbose 2>&1 | tee install.log

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation completed successfully!"
    echo ""
    echo "🔨 Rebuilding native modules..."
    npm rebuild
    echo ""
    echo "✅ Done! You can now try building:"
    echo "   NODE_ENV=production npm run build"
else
    echo ""
    echo "❌ Installation failed or hung"
    echo "📋 Check install.log for details"
    echo ""
    echo "💡 Try alternative:"
    echo "   1. Install yarn: npm install -g yarn"
    echo "   2. Use yarn: yarn install"
fi

