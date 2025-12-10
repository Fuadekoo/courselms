# 🔧 Fix Bus Error (Core Dumped) - Ubuntu Server

## Problem
```
Bus error (core dumped)
```

This indicates a memory corruption or native module issue.

---

## ✅ Solution Steps

### Step 1: Clean Everything and Reinstall

```bash
cd /home/ubuntu/course

# Clean all caches and builds
rm -rf .next
rm -rf node_modules
rm -rf .npm
rm -rf package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install --legacy-peer-deps
```

### Step 2: Check Native Dependencies

```bash
# Rebuild native modules
npm rebuild

# Or rebuild specific problematic packages
npm rebuild sharp
npm rebuild bcryptjs
```

### Step 3: Try Building with Less Memory

```bash
# Try with less memory first
NODE_OPTIONS="--max-old-space-size=2048" NODE_ENV="production" npm run build

# If that works, gradually increase
NODE_OPTIONS="--max-old-space-size=3072" NODE_ENV="production" npm run build
```

### Step 4: Check System Resources

```bash
# Check available memory
free -h

# Check disk space
df -h

# Check for system errors
dmesg | tail -20
```

### Step 5: Alternative Build Method

```bash
# Build without memory limit (let Node.js manage it)
NODE_ENV="production" npm run build

# Or use the build:linux command
npm run build:linux
```

---

## 🔍 Common Causes

1. **Corrupted node_modules** - Native modules not compiled correctly
2. **Memory issues** - Server doesn't have enough RAM
3. **Native module conflicts** - sharp, bcryptjs, etc. need rebuilding
4. **Disk space** - Not enough space for build
5. **Node.js version** - Incompatible Node.js version

---

## 🚀 Complete Fix Script

Run this on your server:

```bash
cd /home/ubuntu/course

# 1. Clean everything
echo "🧹 Cleaning..."
rm -rf .next node_modules .npm package-lock.json

# 2. Clear cache
echo "🗑️  Clearing cache..."
npm cache clean --force

# 3. Check Node.js version
echo "📋 Node.js version:"
node --version
# Should be v18.x or v20.x

# 4. Reinstall
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# 5. Rebuild native modules
echo "🔨 Rebuilding native modules..."
npm rebuild

# 6. Try build with standard memory
echo "🚀 Building..."
NODE_ENV="production" npm run build
```

---

## 🎯 Quick Fix (Try This First)

```bash
cd /home/ubuntu/course

# Quick clean and rebuild
rm -rf .next node_modules/.cache
npm rebuild
NODE_ENV="production" npm run build
```

---

## ⚠️ If Still Failing

### Check Node.js Version:
```bash
node --version
# Should be v18.17.0+ or v20.x.x
```

### Check System Memory:
```bash
free -h
# Need at least 2GB free RAM
```

### Try Building Without Memory Limit:
```bash
# Remove memory limit entirely
NODE_ENV="production" next build
```

---

## 📝 Alternative: Use Docker or Different Build Method

If bus error persists, it might be a system-level issue. Consider:
- Using Docker for builds
- Building on a different server
- Checking hardware (RAM, disk)

---

**Status:** Bus error usually fixed by cleaning and rebuilding native modules

