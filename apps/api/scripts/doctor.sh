#!/bin/bash

# 🔱 AI Pandit Engine - Local Environment Doctor
# --------------------------------------------
# This script diagnoses your local development environment to ensure
# it meets production-ready standards and has all necessary binaries.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔱 Starting AI Pandit Environment Diagnosis...${NC}\n"

# 1. Check Node.js Version
NODE_VER=$(node -v | cut -d'v' -f2)
REQUIRED_VER="20.0.0"

echo -n "Checking Node.js version... "
if [[ "$(printf '%s\n' "$REQUIRED_VER" "$NODE_VER" | sort -V | head -n1)" == "$REQUIRED_VER" ]]; then
    echo -e "${GREEN}PASS (v$NODE_VER)${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo -e "   -> Required: >= v$REQUIRED_VER, Found: v$NODE_VER"
fi

# 2. Check Global Binaries
echo -n "Checking for Turbo... "
if command -v turbo &> /dev/null; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${YELLOW}WARN${NC} (Global 'turbo' missing, using npx turbo)"
fi

echo -n "Checking for TypeScript (tsc)... "
if [ -f "./node_modules/.bin/tsc" ]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo -e "   -> Missing local tsc. Run 'npm install' or check permissions."
fi

# 3. Check Workspace Structure
echo -n "Checking workspace integrity... "
if [ -f "apps/api/src/server.ts" ] && [ -f "apps/api/src/config/index.ts" ]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC} (Project structure corrupted)"
fi

# 4. Check Ephemeris Data
echo -n "Checking Swiss Ephemeris data... "
COUNT=$(ls apps/api/ephe/*.se1 2>/dev/null | wc -l)
if [ $COUNT -gt 0 ]; then
    echo -e "${GREEN}PASS ($COUNT files found)${NC}"
else
    echo -e "${YELLOW}WARN${NC} (No .se1 files in apps/api/ephe/ - calculations may be less accurate)"
fi

# 5. Permission Check
echo -n "Checking node_modules permissions... "
if [ -w "node_modules" ]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC} (node_modules is not writable. Try 'sudo chown -R \$USER node_modules')"
fi

echo -e "\n${BLUE}Diagnosis Complete.${NC}"
echo -e "If any critical checks failed, resolve them before attempting to build for production."
