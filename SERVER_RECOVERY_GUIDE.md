# 🔄 Server Recovery Guide - Restore to Normal Status

## Complete Server Recovery Steps

Follow these steps to restore your server to normal working status.

---

## ✅ Step 1: Check Current Status

```bash
# SSH into your server
ssh ubuntu@your-server-ip

# Check current state
cd /home/ubuntu/course

# Check Node.js version
node --version

# Check PM2 status
pm2 list

# Check memory
free -h

# Check disk space
df -h
```

---

## ✅ Step 2: Fix Node.js Version (If Needed)

If you're on Node.js v24, switch to v20 LTS:

```bash
# Install nvm (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install and use Node.js v20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should be v20.x.x
```

---

## ✅ Step 3: Clean Everything

```bash
cd /home/ubuntu/course

# Stop PM2 processes
pm2 stop all
pm2 kill

# Kill any stuck processes
pkill -f npm
pkill -f node

# Clean build artifacts
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json
rm -rf .npm

# Clear npm cache
npm cache clean --force
```

---

## ✅ Step 4: Pull Latest Code

```bash
cd /home/ubuntu/course

# Pull latest code
git pull

# Verify package.json has correct versions
cat package.json | grep -E "react|next|eslint-config-next"
```

---

## ✅ Step 5: Install Dependencies

```bash
cd /home/ubuntu/course

# Configure npm for better performance
npm config set registry https://registry.npmjs.org/
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

# Install dependencies
npm install --legacy-peer-deps

# If npm install hangs, try:
# npm install --legacy-peer-deps --verbose
```

---

## ✅ Step 6: Rebuild Native Modules

```bash
cd /home/ubuntu/course

# Rebuild native modules (important!)
npm rebuild

# Verify critical packages
npm list sharp bcryptjs
```

---

## ✅ Step 7: Build Application

```bash
cd /home/ubuntu/course

# Build without memory limit first (safest)
NODE_ENV="production" npm run build

# If that works, you're good!
# If it fails, try with less memory:
NODE_ENV="production" NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

---

## ✅ Step 8: Restart PM2

```bash
cd /home/ubuntu/course

# Start PM2 with ecosystem config
pm2 start ecosystem.config.js

# Or restart if already running
pm2 restart all

# Check status
pm2 status

# Check logs
pm2 logs cc --lines 50
```

---

## ✅ Step 9: Verify Everything Works

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs cc --lines 20

# Check for errors
pm2 logs cc --err --lines 20

# Check if app is responding
curl http://localhost:3000  # or your app port
```

---

## 🚀 Complete Recovery Script

Save this as `recover-server.sh` and run it:

```bash
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
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 24 ]; then
    echo "⚠️  Node.js v24+ detected. Switching to v20 LTS..."
    if ! command -v nvm &> /dev/null; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    nvm install 20 2>/dev/null || true
    nvm use 20
    nvm alias default 20
fi

# Step 6: Pull latest code
echo "📥 Pulling latest code..."
git pull

# Step 7: Configure npm
echo "⚙️  Configuring npm..."
npm config set registry https://registry.npmjs.org/
npm config set fetch-retries 5

# Step 8: Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Step 9: Rebuild native modules
echo "🔨 Rebuilding native modules..."
npm rebuild

# Step 10: Build application
echo "🚀 Building application..."
NODE_ENV="production" npm run build || {
    echo "⚠️  Build with default settings failed, trying with less memory..."
    NODE_ENV="production" NODE_OPTIONS="--max-old-space-size=2048" npm run build
}

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
echo "📋 Check logs with: pm2 logs cc"
echo "📋 Check errors with: pm2 logs cc --err"
```

---

## 🎯 Quick Recovery (If Everything is Broken)

```bash
cd /home/ubuntu/course

# Complete reset
pm2 kill
pkill -f node
rm -rf .next node_modules package-lock.json
npm cache clean --force

# Switch to Node v20
nvm use 20 || (curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && source ~/.bashrc && nvm install 20 && nvm use 20)

# Pull and install
git pull
npm install --legacy-peer-deps
npm rebuild

# Build
NODE_ENV="production" npm run build

# Start
pm2 start ecosystem.config.js
```

---

## 🔍 Troubleshooting

### If npm install hangs:
```bash
# Use yarn instead
npm install -g yarn
yarn install
```

### If build fails:
```bash
# Try with less memory
NODE_ENV="production" NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Or without memory limit
NODE_ENV="production" npm run build
```

### If PM2 won't start:
```bash
# Kill all PM2 processes
pm2 kill

# Delete PM2 data
rm -rf ~/.pm2

# Start fresh
pm2 start ecosystem.config.js
```

---

## ✅ Verification Checklist

After recovery, verify:

- [ ] Node.js version is v20.x.x
- [ ] `npm install` completed successfully
- [ ] `npm rebuild` completed successfully
- [ ] Build completed successfully (`.next` directory exists)
- [ ] PM2 is running (`pm2 status` shows app running)
- [ ] No errors in logs (`pm2 logs cc --err`)
- [ ] Application responds (curl or browser test)

---

## 📝 Summary

**Recovery Steps:**
1. ✅ Fix Node.js version (v20 LTS)
2. ✅ Clean everything
3. ✅ Pull latest code
4. ✅ Install dependencies
5. ✅ Rebuild native modules
6. ✅ Build application
7. ✅ Start PM2
8. ✅ Verify everything works

**Expected Time:** 10-15 minutes

---

**Status:** Follow steps 1-9 to recover server to normal status

