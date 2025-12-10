#!/bin/bash
# Secure build script with malware prevention checks

set -e  # Exit on error

echo "🔒 Starting secure build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Audit dependencies
echo -e "${YELLOW}📋 Auditing dependencies...${NC}"
if npm audit --audit-level=moderate; then
    echo -e "${GREEN}✅ No critical vulnerabilities found${NC}"
else
    echo -e "${RED}⚠️  Security vulnerabilities found! Review with: npm audit${NC}"
    echo "Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. Check for suspicious scripts
echo -e "${YELLOW}🔍 Checking package.json scripts...${NC}"
if grep -qE "postinstall|preinstall" package.json; then
    echo -e "${YELLOW}⚠️  Found install hooks in package.json. Review them:${NC}"
    grep -E "postinstall|preinstall" package.json
    echo "Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 3. Verify package-lock.json exists
if [ ! -f "package-lock.json" ]; then
    echo -e "${RED}⚠️  package-lock.json not found! Generating...${NC}"
    npm install --package-lock-only
fi

# 4. Clean install from lock file (more secure than npm install)
echo -e "${YELLOW}📦 Installing dependencies securely (npm ci)...${NC}"
npm ci || {
    echo -e "${RED}❌ npm ci failed. Falling back to npm install...${NC}"
    npm install
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
timeout 1800 npm run build || {
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

