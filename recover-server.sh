#!/bin/bash
# Complete server recovery script

set -e

echo "🔄 Starting Server Recovery..."
echo "=============================="
echo ""

# Step 1: Navigate to project
cd /home/ubuntu/course || exit 1

# Step 2: Stop PM2
echo "🛑 Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Step 3: Kill stuck processes
echo "🧹 Cleaning stuck processes..."
pkill -f npm 2>/dev/null || true
pkill -f node 2>/dev/null || true
sleep 2

# Step 4: Clean everything
echo "🧹 Cleaning build artifacts..."
rm -rf .next node_modules package-lock.json .npm
npm cache clean --force 2>/dev/null || true

# Step 5: Check Node.js version
echo "📋 Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 24 ]; then
        echo "⚠️  Node.js v24+ detected. Switching to v20 LTS..."
        if ! command -v nvm &> /dev/null; then
            echo "📦 Installing nvm..."
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        fi
        nvm install 20 2>/dev/null || true
        nvm use 20
        nvm alias default 20
        echo "✅ Switched to Node.js v20"
    else
        echo "✅ Node.js version OK: $(node --version)"
    fi
fi

# Step 6: Pull latest code
echo "📥 Pulling latest code..."
git pull

# Step 7: Configure npm
echo "⚙️  Configuring npm..."
npm config set registry https://registry.npmjs.org/ 2>/dev/null || true
npm config set fetch-retries 5 2>/dev/null || true

# Step 8: Install dependencies
echo "📦 Installing dependencies..."
echo "This may take 5-10 minutes..."
npm install --legacy-peer-deps

# Step 9: Rebuild native modules
echo "🔨 Rebuilding native modules..."
npm rebuild

# Step 10: Build application
echo "🚀 Building application..."
if NODE_ENV="production" npm run build 2>&1 | tee build.log; then
    echo "✅ Build completed successfully!"
else
    echo "⚠️  Build with default settings failed, trying with less memory..."
    if NODE_ENV="production" NODE_OPTIONS="--max-old-space-size=2048" npm run build 2>&1 | tee build.log; then
        echo "✅ Build completed with reduced memory!"
    else
        echo "❌ Build failed. Check build.log for details."
        exit 1
    fi
fi

# Step 11: Start PM2
echo "🔄 Starting PM2..."
pm2 start ecosystem.config.js || pm2 restart all

# Step 12: Verify
echo ""
echo "✅ Recovery Complete!"
echo ""
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "📋 Next steps:"
echo "   - Check logs: pm2 logs cc"
echo "   - Check errors: pm2 logs cc --err"
echo "   - Monitor: pm2 monit"
echo ""

