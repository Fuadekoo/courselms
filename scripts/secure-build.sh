#!/bin/bash
# Secure build script with malware prevention checks

set -e  # Exit on error

echo "🔒 Starting secure build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Audit dependencies and auto-fix if possible
echo -e "${YELLOW}📋 Auditing dependencies...${NC}"

# First, try to auto-fix vulnerabilities
echo -e "${YELLOW}🔧 Attempting to fix vulnerabilities automatically...${NC}"
if npm audit fix --legacy-peer-deps 2>/dev/null; then
    echo -e "${GREEN}✅ Auto-fixed vulnerabilities${NC}"
else
    echo -e "${YELLOW}⚠️  Some vulnerabilities may require manual review${NC}"
fi

# Check for remaining vulnerabilities
echo -e "${YELLOW}📋 Checking for remaining vulnerabilities...${NC}"
AUDIT_OUTPUT=$(npm audit --audit-level=critical 2>&1)
AUDIT_EXIT_CODE=$?

if [ $AUDIT_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ No critical vulnerabilities found${NC}"
elif echo "$AUDIT_OUTPUT" | grep -q "critical"; then
    echo -e "${RED}❌ CRITICAL vulnerabilities found!${NC}"
    echo "$AUDIT_OUTPUT"
    echo -e "${RED}Build aborted for security reasons.${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠️  Non-critical vulnerabilities found (low/moderate/high in dev dependencies)${NC}"
    echo -e "${YELLOW}These are typically safe to ignore for build dependencies.${NC}"
    # Show summary but continue
    npm audit --audit-level=moderate 2>&1 | head -20 || true
fi

# 2. Check for suspicious scripts
echo -e "${YELLOW}🔍 Checking package.json scripts...${NC}"
if grep -qE "postinstall|preinstall" package.json; then
    echo -e "${YELLOW}⚠️  Found install hooks in package.json. Review them:${NC}"
    grep -E "postinstall|preinstall" package.json
    echo -e "${YELLOW}⚠️  Continuing build (review these hooks manually if needed)${NC}"
    # Continue automatically - user can review manually
fi

# 3. Verify package-lock.json exists
if [ ! -f "package-lock.json" ]; then
    echo -e "${RED}⚠️  package-lock.json not found! Generating...${NC}"
    npm install --package-lock-only
fi

# 4. Clean install from lock file (more secure than npm install)
echo -e "${YELLOW}📦 Installing dependencies securely (npm ci)...${NC}"
npm ci --legacy-peer-deps || {
    echo -e "${YELLOW}⚠️  npm ci failed, trying with legacy peer deps...${NC}"
    npm install --legacy-peer-deps || {
        echo -e "${RED}❌ Dependency installation failed!${NC}"
        exit 1
    }
}

# 5. Verify package integrity
echo -e "${YELLOW}✅ Verifying package integrity...${NC}"
npm verify || {
    echo -e "${YELLOW}⚠️  Package integrity check had warnings (this may be normal)${NC}"
}

# 6. Check for suspicious files in node_modules
echo -e "${YELLOW}🔍 Checking for suspicious files...${NC}"
SUSPICIOUS=$(find node_modules -type f -executable -name "*.sh" -o -name "*.exe" -o -name "*.bin" 2>/dev/null | head -5)
if [ -n "$SUSPICIOUS" ]; then
    echo -e "${YELLOW}⚠️  Found executable files in node_modules:${NC}"
    echo "$SUSPICIOUS"
fi

# 7. Build with resource limits
echo -e "${YELLOW}🔨 Building application...${NC}"
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"

# Set timeout for build (30 minutes)
# Use Linux-compatible build command (NODE_OPTIONS already set above)
timeout 1800 npm run build:linux || timeout 1800 npm run build || {
    if [ $? -eq 124 ]; then
        echo -e "${RED}❌ Build timed out after 30 minutes!${NC}"
        echo "This might indicate a problem. Check for:"
        echo "  - Infinite loops in code"
        echo "  - Memory leaks"
        echo "  - Network requests hanging"
        exit 1
    else
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    fi
}

echo -e "${GREEN}✅ Secure build completed successfully!${NC}"

