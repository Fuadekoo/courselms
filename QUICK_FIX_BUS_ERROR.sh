#!/bin/bash
# Quick fix for bus error - Switch to Node.js v20 LTS

echo "🔧 Fixing Bus Error - Node.js Version Issue"
echo "==========================================="
echo ""

# Check current Node version
echo "📋 Current Node.js version:"
node --version
echo ""

# Check if nvm is installed
if ! command -v nvm &> /dev/null; then
    echo "📦 Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    echo "✅ nvm installed"
else
    echo "✅ nvm already installed"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Install Node.js v20 if not installed
if ! nvm list | grep -q "v20"; then
    echo "📦 Installing Node.js v20 LTS..."
    nvm install 20
    echo "✅ Node.js v20 installed"
else
    echo "✅ Node.js v20 already installed"
fi

# Switch to Node.js v20
echo "🔄 Switching to Node.js v20..."
nvm use 20
nvm alias default 20

# Verify
echo ""
echo "✅ Current Node.js version:"
node --version
echo ""

# Navigate to project
cd /home/ubuntu/course || exit 1

# Clean
echo "🧹 Cleaning..."
rm -rf node_modules/.cache .next

# Rebuild native modules
echo "🔨 Rebuilding native modules..."
npm rebuild

# Try build
echo "🚀 Building..."
echo "Using: NODE_ENV=production npm run build"
NODE_ENV="production" npm run build

echo ""
echo "✅ Done! If build succeeded, restart PM2:"
echo "   pm2 restart all"

