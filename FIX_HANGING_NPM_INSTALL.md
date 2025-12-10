# 🔧 Fix Hanging npm install

## Problem
`npm install` hangs and doesn't complete.

---

## ✅ Quick Fixes (Try in Order)

### Fix 1: Cancel and Use Different Registry

```bash
# Press Ctrl+C to cancel current install

# Try with different registry (faster)
npm install --legacy-peer-deps --registry https://registry.npmjs.org/

# Or use npm's official registry
npm install --legacy-peer-deps --registry https://registry.npmjs.org/ --verbose
```

### Fix 2: Increase Timeout

```bash
# Cancel current (Ctrl+C)

# Install with longer timeout
npm install --legacy-peer-deps --timeout=300000

# Or set globally
npm config set timeout 300000
npm install --legacy-peer-deps
```

### Fix 3: Use npm ci (Faster, More Reliable)

```bash
# Cancel current (Ctrl+C)

# First, ensure package-lock.json exists
npm install --package-lock-only --legacy-peer-deps

# Then use npm ci (clean install)
npm ci --legacy-peer-deps
```

### Fix 4: Clear All Caches

```bash
# Cancel current (Ctrl+C)

# Clear npm cache
npm cache clean --force

# Clear all npm data
rm -rf ~/.npm
rm -rf ~/.npmrc

# Try install again
npm install --legacy-peer-deps
```

### Fix 5: Use Yarn (Alternative Package Manager)

```bash
# Cancel current (Ctrl+C)

# Install yarn
npm install -g yarn

# Use yarn instead
yarn install
```

### Fix 6: Install in Smaller Batches

```bash
# Cancel current (Ctrl+C)

# Install only production dependencies first
npm install --legacy-peer-deps --production

# Then install dev dependencies
npm install --legacy-peer-deps --include=dev
```

---

## 🔍 Diagnose Where It Hangs

### Check Verbose Output

```bash
# Cancel current (Ctrl+C)

# Install with verbose output to see where it hangs
npm install --legacy-peer-deps --verbose 2>&1 | tee install.log

# Check the log to see where it stopped
tail -50 install.log
```

### Check Network Connection

```bash
# Test npm registry connectivity
npm ping

# Test specific package
npm view react

# Check DNS
nslookup registry.npmjs.org
```

### Check for Specific Package Issues

```bash
# Try installing one package at a time to find the problematic one
npm install react --legacy-peer-deps
npm install next --legacy-peer-deps
# etc...
```

---

## 🚀 Complete Fix Script

Run this on your server:

```bash
# 1. Cancel any running install (Ctrl+C)

# 2. Kill any stuck npm processes
pkill -f npm
pkill -f node

# 3. Clean everything
cd /home/ubuntu/course
rm -rf node_modules package-lock.json .npm
npm cache clean --force
rm -rf ~/.npm

# 4. Configure npm for better performance
npm config set registry https://registry.npmjs.org/
npm config set timeout 300000
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

# 5. Try install with verbose output
npm install --legacy-peer-deps --verbose 2>&1 | tee install.log

# Monitor the log in another terminal:
# tail -f install.log
```

---

## 🎯 Alternative: Use Yarn

If npm keeps hanging, use Yarn:

```bash
# Cancel npm install (Ctrl+C)

# Install yarn globally
npm install -g yarn --force

# Or install via apt (Ubuntu)
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install yarn

# Use yarn to install
cd /home/ubuntu/course
yarn install
```

---

## 🔧 Network-Specific Fixes

### If Behind Firewall/Proxy

```bash
# Set proxy if needed
npm config set proxy http://proxy-server:port
npm config set https-proxy http://proxy-server:port

# Or use environment variables
export HTTP_PROXY=http://proxy-server:port
export HTTPS_PROXY=http://proxy-server:port
npm install --legacy-peer-deps
```

### If Slow Connection

```bash
# Use local registry mirror (if available)
npm config set registry https://registry.npmmirror.com

# Or use cnpm (Chinese mirror, often faster)
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

---

## ⚡ Quick One-Liner Fix

```bash
# Cancel current, then run:
pkill -f npm; npm cache clean --force; npm config set timeout 300000; npm install --legacy-peer-deps --registry https://registry.npmjs.org/ --verbose
```

---

## 📋 Check What's Happening

While install is running (or hanging), check:

```bash
# In another terminal, check processes
ps aux | grep npm
ps aux | grep node

# Check network activity
netstat -an | grep :443

# Check disk I/O
iostat -x 1

# Check npm cache size
du -sh ~/.npm
```

---

## ✅ Recommended Solution

**Most likely fix:**

```bash
# 1. Cancel current install (Ctrl+C)
# 2. Kill stuck processes
pkill -f npm

# 3. Clean and reconfigure
cd /home/ubuntu/course
rm -rf node_modules package-lock.json
npm cache clean --force
npm config set timeout 300000
npm config set registry https://registry.npmjs.org/

# 4. Install with verbose to see progress
npm install --legacy-peer-deps --verbose
```

---

## 🆘 Last Resort: Manual Package Installation

If nothing works, install critical packages manually:

```bash
# Install only essential packages first
npm install next@15.1.0 react@19.0.2 react-dom@19.0.2 --legacy-peer-deps

# Then install rest
npm install --legacy-peer-deps
```

---

**Status:** Try Fix 1 (different registry) or Fix 5 (use Yarn) first

