# 🚀 Server Build Instructions

## Problem
On Ubuntu server, `npm run build` runs but doesn't produce output or complete because `cross-env` is not found.

## ✅ Solution: Use Linux-Compatible Build Command

### On Your Ubuntu Server, Run:

```bash
cd /home/ubuntu/course

# Option 1: Use the new build:server command (Recommended)
npm run build:server

# Option 2: Set environment variables directly
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"
npm run build

# Option 3: One-line command
NODE_OPTIONS="--max-old-space-size=4096" NODE_ENV="production" npm run build
```

---

## 🔧 Why This Happens

- `cross-env` package exists but the binary isn't in PATH on the server
- On Linux, you can set environment variables directly in the shell
- The build command runs but fails silently when `cross-env` can't execute

---

## 📝 Quick Fix Commands

### Immediate Fix:
```bash
cd /home/ubuntu/course

# Install dependencies first (if needed)
npm install --legacy-peer-deps

# Build using Linux method
NODE_OPTIONS="--max-old-space-size=4096" NODE_ENV="production" next build
```

### Or Use Updated Script:
```bash
./scripts/build-production.sh
```

---

## ✅ Verification

After build, check:
```bash
# Check if .next directory was created
ls -la .next

# Check build output
ls -la .next/static

# Check for build manifest
ls -la .next/prerender-manifest.json
```

---

## 🎯 Recommended Server Build Process

```bash
cd /home/ubuntu/course

# 1. Pull latest code
git pull

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Clean previous build
rm -rf .next

# 4. Build with Linux-compatible command
NODE_OPTIONS="--max-old-space-size=4096" NODE_ENV="production" npm run build

# OR use the script
./scripts/build-production.sh
```

---

**Status:** Use `npm run build:server` or set NODE_OPTIONS directly on Ubuntu server

