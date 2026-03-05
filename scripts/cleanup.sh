#!/bin/bash

# =============================================================================
# AI-Pandit Project Cleanup Script
# =============================================================================
# Run this script to identify and optionally clean up project bloat
# 
# Usage:
#   chmod +x scripts/cleanup.sh
#   ./scripts/cleanup.sh          # Dry run (shows what would be deleted)
#   ./scripts/cleanup.sh --execute # Actually delete files
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

EXECUTE=false
if [ "$1" == "--execute" ]; then
  EXECUTE=true
fi

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           AI-Pandit Project Cleanup Analysis                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to show stats
show_stats() {
  echo -e "${YELLOW}📊 Project Statistics:${NC}"
  echo "   Source files (TS/TSX/JS/JSX): $(find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) -not -path './node_modules/*' -not -path './.next/*' -not -path './dist/*' | wc -l)"
  echo "   Test files: $(find . -type f \( -name '*.test.ts' -o -name '*.spec.ts' -o -name '*.test.tsx' \) -not -path './node_modules/*' | wc -l)"
  echo "   TODOs/FIXMEs: $(grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" . 2>/dev/null | wc -l || echo '0')"
  echo ""
}

show_stats

# =============================================================================
# SECTION 1: Backup and Temporary Files
# =============================================================================
echo -e "${YELLOW}🗑️  Section 1: Backup & Temporary Files${NC}"
echo "   These files are typically safe to delete:"
echo ""

BACKUP_FILES=$(find . -type f \( \
  -name "*.backup" -o \
  -name "*.bak" -o \
  -name "*.old" -o \
  -name "*.original" -o \
  -name "*~" -o \
  -name "*.swp" -o \
  -name "*.swo" -o \
  -name ".DS_Store" -o \
  -name "Thumbs.db" \
\) -not -path './node_modules/*' 2>/dev/null || true)

if [ -n "$BACKUP_FILES" ]; then
  echo "$BACKUP_FILES" | while read -r file; do
    SIZE=$(du -h "$file" 2>/dev/null | cut -f1 || echo "?")
    echo -e "   ${RED}✗${NC} $file ($SIZE)"
  done
  BACKUP_COUNT=$(echo "$BACKUP_FILES" | wc -l)
  echo ""
  echo -e "   ${YELLOW}Total: $BACKUP_COUNT backup files${NC}"
else
  echo -e "   ${GREEN}✓ No backup files found${NC}"
fi
echo ""

# =============================================================================
# SECTION 2: Generated/Build Artifacts
# =============================================================================
echo -e "${YELLOW}🏗️  Section 2: Generated & Build Artifacts${NC}"
echo "   These directories can be regenerated:"
echo ""

ARTIFACTS=""
for dir in ".next" "dist" "build" "out" ".turbo" "coverage" "playwright-report"; do
  if [ -d "$dir" ]; then
    SIZE=$(du -sh "$dir" 2>/dev/null | cut -f1 || echo "?")
    ARTIFACTS="$ARTIFACTS$dir ($SIZE)\n"
    echo -e "   ${RED}✗${NC} $dir ($SIZE)"
  fi
done

if [ -z "$ARTIFACTS" ]; then
  echo -e "   ${GREEN}✓ No build artifacts found${NC}"
fi
echo ""

# =============================================================================
# SECTION 3: Log Files
# =============================================================================
echo -e "${YELLOW}📝 Section 3: Log Files${NC}"
echo ""

LOG_FILES=$(find . -type f \( -name "*.log" -o -name "*.log.*" \) -not -path './node_modules/*' 2>/dev/null || true)

if [ -n "$LOG_FILES" ]; then
  echo "$LOG_FILES" | while read -r file; do
    SIZE=$(du -h "$file" 2>/dev/null | cut -f1 || echo "?")
    echo -e "   ${RED}✗${NC} $file ($SIZE)"
  done
else
  echo -e "   ${GREEN}✓ No log files found${NC}"
fi
echo ""

# =============================================================================
# SECTION 4: Debug/Test Files in Wrong Places
# =============================================================================
echo -e "${YELLOW}🧪 Section 4: Debug/Test Files in Source${NC}"
echo ""

DEBUG_FILES=$(find . -type f \( \
  -name "test-*.ts" -o \
  -name "debug-*.ts" -o \
  -name "check-*.ts" -o \
  -name "requeue-*.ts" -o \
  -name "*_debug*" \
\) -not -path './node_modules/*' -not -path '*/__tests__/*' -not -path '*/tests/*' 2>/dev/null || true)

if [ -n "$DEBUG_FILES" ]; then
  echo "$DEBUG_FILES" | while read -r file; do
    echo -e "   ${YELLOW}⚠${NC} $file (consider moving to scripts/ or __tests__/)"
  done
else
  echo -e "   ${GREEN}✓ No debug files in source${NC}"
fi
echo ""

# =============================================================================
# SECTION 5: Duplicate/Redundant Files
# =============================================================================
echo -e "${YELLOW}📄 Section 5: Potential Duplicates${NC}"
echo ""

# Check for .original and .backup versions
DUPLICATES=$(find . -type f -name "*.tsx" -not -path './node_modules/*' 2>/dev/null | while read -r file; do
  for ext in ".original" ".backup" ".old"; do
    if [ -f "${file}${ext}" ]; then
      echo -e "   ${YELLOW}⚠${NC} $file has ${file}${ext}"
    fi
  done
done)

if [ -z "$DUPLICATES" ]; then
  echo -e "   ${GREEN}✓ No obvious duplicates found${NC}"
fi
echo ""

# =============================================================================
# SECTION 6: Large Files
# =============================================================================
echo -e "${YELLOW}📦 Section 6: Large Files (>100KB)${NC}"
echo ""

LARGE_FILES=$(find . -type f -size +100k -not -path './node_modules/*' -not -path './.git/*' -not -path './.next/*' -not -name "*.db" -not -name "*.sqlite" 2>/dev/null | head -20 || true)

if [ -n "$LARGE_FILES" ]; then
  echo "$LARGE_FILES" | while read -r file; do
    SIZE=$(du -h "$file" 2>/dev/null | cut -f1 || echo "?")
    echo -e "   ${YELLOW}⚠${NC} $file ($SIZE)"
  done
else
  echo -e "   ${GREEN}✓ No unusually large files${NC}"
fi
echo ""

# =============================================================================
# SECTION 7: Unused Dependencies (requires node)
# =============================================================================
echo -e "${YELLOW}📦 Section 7: Dependency Check${NC}"
echo ""

if command -v npx &> /dev/null; then
  echo "   Run 'npx knip' to find unused exports and dependencies"
else
  echo "   Install node/npm to check for unused dependencies"
fi
echo ""

# =============================================================================
# Summary and Execution
# =============================================================================
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                        Summary                               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$EXECUTE" = true ]; then
  echo -e "${RED}⚠️  EXECUTING CLEANUP...${NC}"
  echo ""
  
  # Delete backup files
  find . -type f \( -name "*.backup" -o -name "*.bak" -o -name "*.old" -o -name "*~" -o -name "*.swp" \) -not -path './node_modules/*' -delete 2>/dev/null || true
  
  # Delete build artifacts
  rm -rf .next dist build out .turbo coverage playwright-report 2>/dev/null || true
  
  # Delete log files
  find . -type f -name "*.log" -not -path './node_modules/*' -delete 2>/dev/null || true
  
  echo -e "${GREEN}✅ Cleanup complete!${NC}"
  echo ""
  show_stats
else
  echo -e "${YELLOW}This was a dry run. No files were deleted.${NC}"
  echo ""
  echo -e "To actually delete files, run:"
  echo -e "  ${GREEN}./scripts/cleanup.sh --execute${NC}"
  echo ""
  echo -e "${YELLOW}Recommended cleanup order:${NC}"
  echo "   1. Review files above manually"
  echo "   2. Commit any changes you want to keep"
  echo "   3. Run: ./scripts/cleanup.sh --execute"
  echo "   4. Run: npm run lint && npm test"
  echo "   5. Commit the cleanup"
fi
