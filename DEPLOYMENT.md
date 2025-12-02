# 🚀 Production Deployment Guide

## Problem
The application crashes with error:
```
Error: ENOENT: no such file or directory, open '/home/ubuntu/course/.next/prerender-manifest.json'
```

This happens because the build hasn't been run before starting the server.

## Solution

### Quick Fix (One-time)

1. **SSH into your server:**
   ```bash
   ssh ubuntu@your-server-ip
   ```

2. **Navigate to the app directory:**
   ```bash
   cd /home/ubuntu/course
   ```

3. **Run the build:**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   export NODE_ENV="production"
   npm run build
   ```

4. **Restart PM2:**
   ```bash
   pm2 restart cc
   # or if not running:
   pm2 start ecosystem.config.js
   ```

### Automated Deployment (Recommended)

Use the deployment script for future deployments:

1. **Make the script executable:**
   ```bash
   chmod +x scripts/deploy.sh
   ```

2. **Run the deployment script:**
   ```bash
   ./scripts/deploy.sh
   ```

This script will:
- ✅ Check and install dependencies
- ✅ Clean previous builds
- ✅ Build the application
- ✅ Restart PM2 automatically

### Manual Steps (Alternative)

If you prefer to do it manually:

```bash
cd /home/ubuntu/course

# Set environment
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"

# Build
npm run build

# Restart PM2
pm2 restart cc
# or
pm2 restart ecosystem.config.js
```

### Verify Deployment

1. **Check PM2 status:**
   ```bash
   pm2 status
   ```

2. **Check logs:**
   ```bash
   pm2 logs cc
   ```

3. **Check for errors:**
   ```bash
   pm2 logs cc --err
   ```

### After Code Updates

Whenever you update the code, you need to rebuild:

```bash
cd /home/ubuntu/course
./scripts/deploy.sh
```

Or manually:
```bash
cd /home/ubuntu/course
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
pm2 restart cc
```

## Important Notes

- ⚠️ **Always build before starting/restarting** in production
- ⚠️ The `.next` directory must exist with all build artifacts
- ⚠️ Never delete the `.next` directory while the app is running
- ✅ Use the deployment script for consistent deployments

## Troubleshooting

### Build fails with memory error
- Increase memory: `export NODE_OPTIONS="--max-old-space-size=8192"`

### PM2 keeps restarting
- Check logs: `pm2 logs cc --err`
- Verify build completed: `ls -la .next/prerender-manifest.json`

### Build succeeds but app still crashes
- Check file permissions: `chmod -R 755 .next`
- Verify environment variables are set correctly

