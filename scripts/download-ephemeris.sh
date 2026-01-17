#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Download Swiss Ephemeris Data Files
# Required for accurate planetary calculations
# ═══════════════════════════════════════════════════════════════════════════

set -e

EPHE_DIR="./ephe"
DOWNLOAD_URL="https://www.astro.com/ftp/swisseph/ephe"

echo "🌟 Swiss Ephemeris Data Downloader"
echo "═══════════════════════════════════════════════════════════"

# Create directory
mkdir -p "$EPHE_DIR"
cd "$EPHE_DIR"

# Essential files for 1800-2400 CE coverage
FILES=(
    "sepl_18.se1"    # Planets 1800-1900
    "seplm18.se1"    # Planets mean 1800-1900
    "sepl_24.se1"    # Planets 2000-2100
    "semo_18.se1"    # Moon 1800-1900
    "semo_24.se1"    # Moon 2000-2100
    "seas_18.se1"    # Asteroids 1800-1900  
    "fixstars.cat"   # Fixed stars catalog
)

# Additional files for full coverage
OPTIONAL_FILES=(
    "sepl_00.se1"    # 0-100 CE
    "sepl_06.se1"    # 600-700 CE
    "sepl_12.se1"    # 1200-1300 CE
    "sepl_30.se1"    # 3000-3100 CE (future)
    "semo_00.se1"    # Moon 0-100 CE
    "semo_06.se1"    # Moon 600-700 CE
    "semo_12.se1"    # Moon 1200-1300 CE
)

echo ""
echo "📥 Downloading essential ephemeris files..."

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file (already exists)"
    else
        echo "  ↓ Downloading $file..."
        curl -sO "$DOWNLOAD_URL/$file" && echo "  ✓ $file" || echo "  ✗ Failed: $file"
    fi
done

echo ""
echo "📥 Downloading optional files for extended date range..."

for file in "${OPTIONAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file (already exists)"
    else
        echo "  ↓ Downloading $file..."
        curl -sO "$DOWNLOAD_URL/$file" 2>/dev/null && echo "  ✓ $file" || echo "  ⊘ Skipped: $file"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 Downloaded files:"
ls -lh
echo ""
echo "✅ Swiss Ephemeris data ready!"
echo ""
echo "Total size: $(du -sh . | cut -f1)"
