# 🔧 Server Build Fix - cross-env Not Found

## Problem
On Ubuntu server, `npm run build` fails with:
```
sh: 1: cross-env: not found
```

This happens because `cross-env` binary is not found in the PATH, even though the package is installed.

---

## ✅ Solutions

### Solution 1: Use Linux-Compatible Build Command (Recommended)

**On your Ubuntu server, use:**

```bash
cd /home/ubuntu/course

# Option 1: Use the new build:linux command
npm run build:linux

# Option 2: Set NODE_OPTIONS directly (works on Linux)
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Option 3: Export and run
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"
npm run build
```

### Solution 2: Install Dependencies Properly

If `cross-env` is missing, reinstall dependencies:

```bash
cd /home/ubuntu/course

# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Verify cross-env is installed
npm list cross-env

# Try build again
npm run build
```

### Solution 3: Use Updated Build Scripts

The build scripts have been updated to use Linux-compatible commands:

```bash
# Use the production build script
./scripts/build-production.sh

# Or use the secure build script
npm run build:secure

# Or use the deploy script
./scripts/deploy.sh
```

---

## 🚀 Quick Fix for Server

**Run these commands on your Ubuntu server:**

```bash
cd /home/ubuntu/course

# Install/update dependencies
npm install --legacy-peer-deps

# Build using Linux-compatible method
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"
npm run build
```

---

## 📝 Updated Build Commands

### For Windows (Local Development):
```bash
npm run build  # Uses cross-env
```

### For Linux (Server):
```bash
npm run build:linux  # Sets NODE_OPTIONS directly
# OR
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## 🔍 Why This Happens

1. **cross-env** is a cross-platform tool for setting environment variables
2. On Linux, you can set environment variables directly in the shell
3. The `cross-env` binary might not be in PATH if dependencies weren't installed properly
4. Using direct environment variables works better on Linux servers

---

## ✅ Updated Scripts

All build scripts now have fallbacks:
- `scripts/build-production.sh` - Uses `build:linux` with fallback
- `scripts/deploy.sh` - Sets NODE_OPTIONS directly
- `scripts/secure-build.sh` - Uses `build:linux` with fallback

---

## 🎯 Recommended Server Build Process

```bash
cd /home/ubuntu/course

# 1. Ensure dependencies are installed
npm install --legacy-peer-deps

# 2. Build with environment variables
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"
npm run build

# OR use the updated scripts
./scripts/build-production.sh
```

---

**Status:** ✅ Fixed - Use `npm run build:linux` or set NODE_OPTIONS directly on server

