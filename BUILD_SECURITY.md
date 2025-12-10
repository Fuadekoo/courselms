# 🔒 Build Security & Malware Prevention Guide

## 🛑 How to Stop a Stuck Build

If your build is hanging or stuck, use these commands:

### On Ubuntu/Linux Server:
```bash
# Press Ctrl+C to stop the current build
# If that doesn't work, find and kill the process:
ps aux | grep "next build"
kill -9 <PID>

# Or kill all node processes (use with caution):
pkill -f "next build"
```

### Check Running Processes:
```bash
# See what's running
ps aux | grep node
top
htop  # if installed
```

---

## 🛡️ Malware Prevention During Builds

### 1. **Audit Dependencies Regularly**

Check for known vulnerabilities in your dependencies:

```bash
# Check for security vulnerabilities
npm audit

# Fix automatically (if safe)
npm audit fix

# Check for outdated packages
npm outdated
```

### 2. **Use Package Lock Files**

Always commit `package-lock.json` to ensure consistent, verified dependencies:

```bash
# Verify lock file exists
ls -la package-lock.json

# If missing, generate it
npm install --package-lock-only
```

### 3. **Review Package Scripts**

Check `package.json` for suspicious scripts that run automatically:

```bash
# Check for postinstall, preinstall, or other hooks
grep -E "postinstall|preinstall|install" package.json
```

**⚠️ Warning Signs:**
- Scripts that download files from external URLs
- Scripts that execute shell commands
- Scripts that modify system files
- Scripts that make network requests

### 4. **Use npm ci for Production**

Instead of `npm install`, use `npm ci` which:
- Installs from lock file only
- Fails if dependencies don't match
- Removes node_modules first (clean install)

```bash
npm ci
```

### 5. **Verify Package Integrity**

```bash
# Verify package integrity
npm verify

# Check package signatures (if using npm 8+)
npm audit signatures
```

### 6. **Monitor Build Process**

Watch for suspicious activity during builds:

```bash
# Monitor network activity
sudo netstat -tulpn | grep node

# Monitor file system changes
watch -n 1 'ls -la node_modules/.bin/'

# Check for unexpected processes
watch -n 1 'ps aux | grep node'
```

### 7. **Use Read-Only File System for Builds (Advanced)**

Run builds in a container or restricted environment:

```bash
# Use Docker for isolated builds
docker build -t course-app .
```

### 8. **Check for Suspicious Files**

After build, check for unexpected files:

```bash
# Check for suspicious executables
find . -type f -executable -name "*.sh" -o -name "*.exe" -o -name "*.bin"

# Check for hidden files
find . -name ".*" -type f

# Check node_modules for suspicious packages
ls -la node_modules | grep -E "^\." | head -20
```

---

## 🔍 Security Checklist Before Building

- [ ] Run `npm audit` and fix critical vulnerabilities
- [ ] Review `package.json` scripts for suspicious entries
- [ ] Verify `package-lock.json` is committed and up-to-date
- [ ] Check `.env` files are not committed (in `.gitignore`)
- [ ] Review all dependencies in `package.json`
- [ ] Use `npm ci` instead of `npm install` in production
- [ ] Monitor system resources during build
- [ ] Check network activity for unexpected connections

---

## 🚨 Red Flags to Watch For

### Suspicious Package Behavior:
- Packages that download files during install
- Packages with very few downloads but recent updates
- Packages with typosquatting names (similar to popular packages)
- Packages that request elevated permissions
- Packages that modify system files

### Suspicious Build Behavior:
- Build takes unusually long time
- High CPU/memory usage without progress
- Network activity during build
- Files created outside project directory
- Processes that don't terminate

---

## 🔧 Secure Build Script

Create a secure build script (`scripts/secure-build.sh`):

```bash
#!/bin/bash
set -e  # Exit on error

echo "🔒 Starting secure build process..."

# 1. Audit dependencies
echo "📋 Auditing dependencies..."
npm audit --audit-level=moderate || {
    echo "⚠️  Security vulnerabilities found! Review with: npm audit"
    exit 1
}

# 2. Clean install from lock file
echo "📦 Installing dependencies securely..."
npm ci

# 3. Verify package integrity
echo "✅ Verifying package integrity..."
npm verify || {
    echo "⚠️  Package integrity check failed!"
    exit 1
}

# 4. Build with resource limits
echo "🔨 Building application..."
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"
npm run build

echo "✅ Secure build completed!"
```

Make it executable:
```bash
chmod +x scripts/secure-build.sh
```

---

## 📊 Monitor Build Health

### Check Build Logs:
```bash
# If using PM2
pm2 logs cc --lines 100

# Check system logs
journalctl -u your-service -n 100
```

### Resource Monitoring:
```bash
# Monitor during build
watch -n 1 'free -h && df -h && ps aux | grep node | head -5'
```

---

## 🆘 If You Suspect Malware

1. **Stop the build immediately:**
   ```bash
   pkill -f "next build"
   ```

2. **Disconnect from network** (if possible)

3. **Check for suspicious processes:**
   ```bash
   ps aux | grep -E "node|npm|next"
   ```

4. **Check for modified files:**
   ```bash
   git status
   git diff
   ```

5. **Review recent changes:**
   ```bash
   git log --oneline -10
   ```

6. **Check network connections:**
   ```bash
   netstat -tulpn | grep node
   ```

7. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

8. **Run security audit:**
   ```bash
   npm audit
   ```

---

## ✅ Best Practices Summary

1. **Always use `npm ci` in production** (not `npm install`)
2. **Commit `package-lock.json`** to version control
3. **Run `npm audit` regularly** and fix vulnerabilities
4. **Review package.json scripts** before running builds
5. **Monitor system resources** during builds
6. **Use isolated environments** (Docker/containers) for builds
7. **Keep dependencies up-to-date** but test before updating
8. **Use `.npmrc`** to configure npm security settings

---

## 📝 Additional Security Settings

Create `.npmrc` file in project root:

```
audit=true
audit-level=moderate
fund=false
save-exact=true
```

This will:
- Enable automatic auditing
- Set audit level to moderate
- Disable funding messages
- Save exact versions (not ranges)

---

## 🔗 Resources

- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Snyk Vulnerability Database](https://snyk.io/vuln)

