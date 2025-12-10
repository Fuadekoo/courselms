# 🔧 Fix Bus Error - Node.js Version Issue

## Problem
Bus error (core dumped) when building with Node.js v24.11.1

**Root Cause:** Node.js v24 is very new and native modules (sharp, bcryptjs) may not be fully compatible yet.

---

## ✅ Solution: Use Node.js LTS Version

### Step 1: Install Node Version Manager (nvm)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Verify nvm is installed
nvm --version
```

### Step 2: Install Node.js v20 LTS (Recommended)

```bash
# Install Node.js v20 LTS
nvm install 20

# Use Node.js v20
nvm use 20

# Set as default
nvm alias default 20

# Verify version
node --version
# Should show: v20.x.x
```

### Step 3: Reinstall Dependencies

```bash
cd /home/ubuntu/course

# Clean everything
rm -rf node_modules package-lock.json .next

# Reinstall with Node v20
npm install --legacy-peer-deps

# Rebuild native modules
npm rebuild
```

### Step 4: Try Build Again

```bash
# Build without memory limit first
NODE_ENV="production" npm run build

# Or with less memory
NODE_OPTIONS="--max-old-space-size=2048" NODE_ENV="production" npm run build
```

---

## 🚀 Quick Fix (Alternative: Use Node v18)

If v20 doesn't work, try v18:

```bash
# Install Node.js v18 LTS
nvm install 18
nvm use 18
nvm alias default 18

# Reinstall dependencies
cd /home/ubuntu/course
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm rebuild

# Build
NODE_ENV="production" npm run build
```

---

## 📋 Recommended Node.js Versions

| Version | Status | Recommended For |
|---------|--------|----------------|
| Node.js v20.x | ✅ LTS (Recommended) | Production |
| Node.js v18.x | ✅ LTS (Stable) | Production |
| Node.js v24.x | ⚠️ Current (Too New) | Development Only |

---

## 🔍 Verify Current Setup

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check available Node versions
nvm list

# Switch between versions
nvm use 20
# or
nvm use 18
```

---

## ⚠️ If npm install is Hanging

If `npm install` is hanging, try:

```bash
# Cancel current install (Ctrl+C)

# Try with verbose output to see where it hangs
npm install --legacy-peer-deps --verbose

# Or try with different registry
npm install --legacy-peer-deps --registry https://registry.npmjs.org/

# Or increase timeout
npm install --legacy-peer-deps --timeout=60000
```

---

## 🎯 Complete Fix Script

Run this on your server:

```bash
# 1. Install nvm (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 2. Install and use Node.js v20
nvm install 20
nvm use 20
nvm alias default 20

# 3. Verify
node --version  # Should be v20.x.x

# 4. Clean and reinstall
cd /home/ubuntu/course
rm -rf node_modules package-lock.json .next
npm cache clean --force

# 5. Install dependencies
npm install --legacy-peer-deps

# 6. Rebuild native modules
npm rebuild

# 7. Build
NODE_ENV="production" npm run build
```

---

## 🔧 Alternative: Build Without Memory Limit

If you can't change Node.js version right now:

```bash
cd /home/ubuntu/course

# Build without memory limit (let Node.js manage it)
NODE_ENV="production" next build

# Or use the safe build command
npm run build:server:safe
```

---

## 📝 Update PM2 to Use Correct Node Version

After switching Node versions:

```bash
# Restart PM2 with new Node version
pm2 kill
pm2 start ecosystem.config.js

# Or restart existing
pm2 restart all
```

---

## ✅ Summary

**Problem:** Node.js v24.11.1 is too new, causing bus errors with native modules

**Solution:** 
1. Install nvm
2. Switch to Node.js v20 LTS
3. Reinstall dependencies
4. Rebuild native modules
5. Build again

**Expected Result:** Build completes successfully with Node.js v20

---

**Status:** Node.js v24 → v20 LTS recommended for production

