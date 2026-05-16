#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# AI-Pandit Security Testing Suite
# ═══════════════════════════════════════════════════════════════════════════════
#
# Comprehensive security scanning including:
# - Dependency vulnerability scanning
# - Static Application Security Testing (SAST)
# - Secret detection
# - Container security scanning
#
# Usage: ./tests/security/security-scan.sh [options]
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPORT_DIR="reports/security"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCAN_ALL=false
SCAN_DEPS=false
SCAN_SECRETS=false
SCAN_SAST=false
SCAN_CONTAINER=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            SCAN_ALL=true
            shift
            ;;
        --deps)
            SCAN_DEPS=true
            shift
            ;;
        --secrets)
            SCAN_SECRETS=true
            shift
            ;;
        --sast)
            SCAN_SAST=true
            shift
            ;;
        --container)
            SCAN_CONTAINER=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --all        Run all security scans"
            echo "  --deps       Scan dependencies for vulnerabilities"
            echo "  --secrets    Scan for exposed secrets"
            echo "  --sast       Run static application security testing"
            echo "  --container  Scan container images"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Default to all if no specific scan requested
if [[ "$SCAN_DEPS" == "false" && "$SCAN_SECRETS" == "false" && "$SCAN_SAST" == "false" && "$SCAN_CONTAINER" == "false" ]]; then
    SCAN_ALL=true
fi

# Create report directory
mkdir -p "$REPORT_DIR"

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# DEPENDENCY VULNERABILITY SCANNING
# ═══════════════════════════════════════════════════════════════════════════════

scan_dependencies() {
    print_header "SCANNING DEPENDENCIES FOR VULNERABILITIES"
    
    # npm audit
    echo "Running npm audit..."
    if npm audit --audit-level=moderate --json > "$REPORT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null; then
        print_success "npm audit passed"
    else
        print_warning "npm audit found vulnerabilities (see $REPORT_DIR/npm-audit-$TIMESTAMP.json)"
    fi
    
    # audit-ci for CI-friendly output
    if command -v audit-ci &> /dev/null; then
        echo "Running audit-ci..."
        if audit-ci --moderate --report-type=json > "$REPORT_DIR/audit-ci-$TIMESTAMP.json"; then
            print_success "audit-ci passed"
        else
            print_error "audit-ci found vulnerabilities"
        fi
    fi
    
    # Snyk test (if SNYK_TOKEN is available)
    if [[ -n "${SNYK_TOKEN:-}" ]] && command -v snyk &> /dev/null; then
        echo "Running Snyk test..."
        if snyk test --all-projects --json > "$REPORT_DIR/snyk-$TIMESTAMP.json"; then
            print_success "Snyk test passed"
        else
            print_warning "Snyk found issues (see $REPORT_DIR/snyk-$TIMESTAMP.json)"
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# SECRET DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

scan_secrets() {
    print_header "SCANNING FOR EXPOSED SECRETS"
    
    # GitLeaks
    if command -v gitleaks &> /dev/null; then
        echo "Running GitLeaks..."
        if gitleaks detect --source . --report-format json --report-path "$REPORT_DIR/gitleaks-$TIMESTAMP.json" --verbose; then
            print_success "GitLeaks passed - no secrets found"
        else
            print_error "GitLeaks found potential secrets!"
            cat "$REPORT_DIR/gitleaks-$TIMESTAMP.json"
        fi
    else
        print_warning "GitLeaks not installed. Install with: brew install gitleaks"
    fi
    
    # TruffleHog
    if command -v trufflehog &> /dev/null; then
        echo "Running TruffleHog..."
        if trufflehog filesystem . --json > "$REPORT_DIR/trufflehog-$TIMESTAMP.json" 2>&1; then
            print_success "TruffleHog passed"
        else
            print_warning "TruffleHog found potential issues"
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# STATIC APPLICATION SECURITY TESTING (SAST)
# ═══════════════════════════════════════════════════════════════════════════════

run_sast() {
    print_header "RUNNING STATIC APPLICATION SECURITY TESTING"
    
    # Semgrep
    if command -v semgrep &> /dev/null; then
        echo "Running Semgrep..."
        semgrep --config=auto \
                --config=p/security-audit \
                --config=p/owasp-top-ten \
                --config=p/cwe-top-25 \
                --json \
                --output="$REPORT_DIR/semgrep-$TIMESTAMP.json" \
                apps/ packages/ || true
        
        if [[ -s "$REPORT_DIR/semgrep-$TIMESTAMP.json" ]]; then
            print_warning "Semgrep findings detected - review $REPORT_DIR/semgrep-$TIMESTAMP.json"
        else
            print_success "Semgrep passed"
        fi
    else
        print_warning "Semgrep not installed. Install with: pip install semgrep"
    fi
    
    # ESLint security plugin
    echo "Running ESLint security checks..."
    if npm -w @ai-pandit/api run lint 2>&1 | tee "$REPORT_DIR/eslint-security-$TIMESTAMP.log"; then
        print_success "ESLint security checks passed"
    else
        print_warning "ESLint found issues"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# CONTAINER SECURITY SCANNING
# ═══════════════════════════════════════════════════════════════════════════════

scan_containers() {
    print_header "SCANNING CONTAINER IMAGES"
    
    # Trivy
    if command -v trivy &> /dev/null; then
        echo "Running Trivy on Docker images..."
        
        for image in ai-pandit-api ai-pandit-web; do
            if docker image inspect "$image" &> /dev/null; then
                echo "Scanning $image..."
                trivy image --format json --output "$REPORT_DIR/trivy-$image-$TIMESTAMP.json" "$image" || true
            fi
        done
        
        print_success "Container scanning completed"
    else
        print_warning "Trivy not installed. Install with: brew install trivy"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${BLUE}"
echo "    █████╗ ██╗    ██████╗  █████╗ ███╗   ██╗██████╗ ██╗████████╗"
echo "   ██╔══██╗██║    ██╔══██╗██╔══██╗████╗  ██║██╔══██╗██║╚══██╔══╝"
echo "   ███████║██║    ██████╔╝███████║██╔██╗ ██║██║  ██║██║   ██║   "
echo "   ██╔══██║██║    ██╔═══╝ ██╔══██║██║╚██╗██║██║  ██║██║   ██║   "
echo "   ██║  ██║██║    ██║     ██║  ██║██║ ╚████║██████╔╝██║   ██║   "
echo "   ╚═╝  ╚═╝╚═╝    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝   ╚═╝   "
echo -e "${NC}"
echo "   Security Scanning Suite v1.0"
echo ""

# Run requested scans
if [[ "$SCAN_ALL" == "true" || "$SCAN_DEPS" == "true" ]]; then
    scan_dependencies
fi

if [[ "$SCAN_ALL" == "true" || "$SCAN_SECRETS" == "true" ]]; then
    scan_secrets
fi

if [[ "$SCAN_ALL" == "true" || "$SCAN_SAST" == "true" ]]; then
    run_sast
fi

if [[ "$SCAN_ALL" == "true" || "$SCAN_CONTAINER" == "true" ]]; then
    scan_containers
fi

print_header "SECURITY SCAN COMPLETED"
echo "Reports saved to: $REPORT_DIR/"
echo ""
echo "Summary of scans:"
ls -la "$REPORT_DIR/"*"$TIMESTAMP"*
