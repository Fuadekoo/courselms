# 🔍 Fix High Memory Usage (10GB/16GB)

## Problem
Server shows 10GB RAM used but you didn't use it all.

---

## ✅ Quick Diagnosis

### Step 1: Check What's Using Memory

```bash
# Check total memory usage
free -h

# Check top memory-consuming processes
ps aux --sort=-%mem | head -20

# Check Node.js processes
ps aux | grep node

# Check PM2 processes (if using PM2)
pm2 list
pm2 monit
```

### Step 2: Check Linux Cache

Linux uses free RAM for disk caching (this is normal and good!):

```bash
free -h
# Look at the "buff/cache" line
# This is NOT actually "used" - it's available for use
```

**Important:** Linux shows cached memory as "used" but it's actually available. The real "used" memory is what matters.

---

## 🔧 Solutions

### Solution 1: Clear Linux Cache (If Needed)

```bash
# Check current memory
free -h

# Clear page cache (safe, won't affect running apps)
sudo sync
sudo sysctl vm.drop_caches=1

# Or clear all caches (more aggressive)
sudo sync
sudo sysctl vm.drop_caches=3

# Check memory again
free -h
```

**Note:** This is usually NOT needed - Linux cache is good for performance!

### Solution 2: Check and Kill Unnecessary Node Processes

```bash
# Find all Node.js processes
ps aux | grep node

# Check PM2 processes
pm2 list

# If you see multiple Node processes, check which ones are needed
# Kill unnecessary ones:
pm2 stop <app-name>
# or
kill <PID>
```

### Solution 3: Restart PM2 Processes

```bash
# Restart all PM2 processes (clears memory leaks)
pm2 restart all

# Or restart specific app
pm2 restart cc
```

### Solution 4: Check for Memory Leaks

```bash
# Monitor memory usage over time
watch -n 1 free -h

# Check if memory keeps growing (indicates leak)
# If it does, restart the application
```

---

## 📊 Understanding Linux Memory

### Memory Breakdown:

```
Total: 16GB
Used: 10GB (includes cache)
Free: 2GB
Available: 6GB (this is what you can actually use!)
Buff/Cache: 4GB (this is "used" but available)
```

**Key Point:** "Buff/Cache" memory is NOT actually used - Linux uses it for disk caching but will free it when needed.

### Real Available Memory:

```bash
# Check "available" memory (this is what matters)
free -h | grep Mem | awk '{print $7}'
```

---

## 🚀 Quick Fix Commands

### Check Current Status:
```bash
# See what's using memory
ps aux --sort=-%mem | head -10

# Check PM2
pm2 list
pm2 monit

# Check real available memory
free -h
```

### If PM2 is Using Too Much:
```bash
# Restart PM2 processes
pm2 restart all

# Or restart specific app
pm2 restart cc

# Check memory after restart
free -h
```

### If Cache is High (Usually OK):
```bash
# Check if cache is the issue
free -h

# If "available" memory is good, you're fine!
# Cache is good for performance - don't clear unless necessary
```

---

## 🔍 Detailed Memory Analysis

### Check Each Process:
```bash
# Top 10 memory users
ps aux --sort=-%mem | head -11

# Check Node.js processes specifically
ps aux | grep node | awk '{print $2, $4, $11}' | sort -k2 -rn

# Check PM2 memory usage
pm2 list
pm2 describe <app-name>
```

### Check System Services:
```bash
# Check all services
systemctl list-units --type=service --state=running

# Check specific services
systemctl status apache2
systemctl status nginx
systemctl status mysql
```

---

## ⚠️ Common Causes

1. **PM2 Processes** - Multiple Node.js apps running
2. **Linux Cache** - Normal, not actually "used"
3. **Memory Leaks** - App consuming more over time
4. **Multiple Builds** - Old build processes still running
5. **Database** - MySQL/PostgreSQL using memory
6. **Web Server** - Apache/Nginx using memory

---

## ✅ Recommended Actions

### 1. Check PM2 First:
```bash
pm2 list
pm2 monit  # Watch memory in real-time
```

### 2. Restart if Needed:
```bash
pm2 restart all
```

### 3. Check Real Available Memory:
```bash
free -h
# Look at "available" column, not "used"
```

### 4. If Still High, Check Processes:
```bash
ps aux --sort=-%mem | head -20
```

---

## 🎯 Memory Optimization

### For Node.js Apps:
```bash
# Set memory limits in PM2 ecosystem.config.js
# max_memory_restart: '1G'  # Restart if exceeds 1GB
```

### For Build Process:
```bash
# Use less memory for builds
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

---

## 📝 Summary

**Most Likely Causes:**
1. ✅ Linux cache (normal, not actually "used")
2. ✅ PM2 processes using memory
3. ✅ Multiple Node.js processes

**Quick Fix:**
```bash
# Check what's using memory
ps aux --sort=-%mem | head -10
pm2 list

# Restart if needed
pm2 restart all

# Check real available memory
free -h
```

**Remember:** Linux "used" memory includes cache, which is actually available. Check the "available" column for real free memory!

