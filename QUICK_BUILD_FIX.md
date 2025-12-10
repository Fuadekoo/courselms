# 🚨 Quick Fix: Stop Stuck Build & Prevent Malware

## ⚡ IMMEDIATE ACTION: Stop the Stuck Build

**On your Ubuntu server, run:**

```bash
# Press Ctrl+C first
# If that doesn't work, find and kill the process:
ps aux | grep "next build"
kill -9 <PID>

# Or kill all node build processes:
pkill -f "next build"
```

---

## 🔒 Quick Security Check (Run These Now)

### 1. Check for Vulnerabilities
```bash
npm audit
```

### 2. Check Running Processes
```bash
ps aux | grep node
```

### 3. Check Network Activity
```bash
netstat -tulpn | grep node
```

### 4. Review Package Scripts
```bash
cat package.json | grep -A 10 "scripts"
```

---

## ✅ Safe Build Process

### Option 1: Use Secure Build Script (Recommended)
```bash
chmod +x scripts/secure-build.sh
npm run build:secure
```

### Option 2: Manual Secure Build
```bash
# 1. Audit first
npm audit

# 2. Clean install
npm ci

# 3. Build with timeout (30 min max)
timeout 1800 npm run build
```

### Option 3: Regular Build (if you trust dependencies)
```bash
npm run build
```

---

## 🛡️ Why Builds Hang

Common causes:
1. **Memory issues** - Already set to 4GB, should be enough
2. **Infinite loops** - Check your code for recursive functions
3. **Network requests** - Check for API calls during build
4. **Large file processing** - Check for image/video processing
5. **TypeScript compilation** - Check for complex types
6. **Malware/compromised package** - Run `npm audit`

---

## 🔍 Debug a Hanging Build

### Check What's Happening:
```bash
# In another terminal, monitor:
watch -n 1 'ps aux | grep node | head -10'

# Check memory:
free -h

# Check disk space:
df -h

# Check CPU:
top
```

### Enable Verbose Build:
```bash
NODE_OPTIONS="--max-old-space-size=4096" DEBUG=* npm run build
```

---

## 📋 Next Steps After Stopping Build

1. **Run security audit:**
   ```bash
   npm audit
   npm audit fix  # if safe
   ```

2. **Check for suspicious packages:**
   ```bash
   npm ls --depth=0
   ```

3. **Review recent changes:**
   ```bash
   git log --oneline -10
   git diff
   ```

4. **Try building again with timeout:**
   ```bash
   timeout 1800 npm run build
   ```

---

## 🆘 If Build Keeps Hanging

1. **Check Next.js config** - Look for infinite rewrites/redirects
2. **Check API routes** - Ensure no blocking operations
3. **Check middleware** - Ensure no infinite loops
4. **Check environment variables** - Missing vars can cause hangs
5. **Try building without cache:**
   ```bash
   rm -rf .next
   npm run build
   ```

---

## 📚 Full Documentation

See `BUILD_SECURITY.md` for complete security guide.

