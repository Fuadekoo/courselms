#!/bin/bash
# Quick script to check memory usage on Ubuntu server

echo "🔍 Memory Usage Analysis"
echo "========================"
echo ""

# Total memory
echo "📊 Total Memory:"
free -h
echo ""

# Top 10 memory-consuming processes
echo "🔝 Top 10 Memory-Consuming Processes:"
ps aux --sort=-%mem | head -11
echo ""

# Node.js processes
echo "📦 Node.js Processes:"
ps aux | grep node | grep -v grep
echo ""

# PM2 processes
echo "⚙️  PM2 Processes:"
pm2 list 2>/dev/null || echo "PM2 not running or not installed"
echo ""

# System services
echo "🖥️  System Services Memory:"
systemctl list-units --type=service --state=running 2>/dev/null | head -10
echo ""

# Real available memory (what matters)
echo "✅ Real Available Memory:"
free -h | grep Mem | awk '{print "Total: " $2 " | Used: " $3 " | Free: " $4 " | Available: " $7 " | Cache: " $6}'
echo ""

echo "💡 Note: 'Cache' memory is NOT actually used - Linux uses it for disk caching"
echo "   Check 'Available' column for real free memory you can use!"

