#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# AI-Pandit Test Tools Installation Script
# ═══════════════════════════════════════════════════════════════════════════════
#
# Installs all testing tools and dependencies required for the
# comprehensive testing infrastructure.
#
# Usage: ./scripts/install-test-tools.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

check_command() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_warning "$1 is not installed"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN INSTALLATION
# ═══════════════════════════════════════════════════════════════════════════════

print_header "AI-Pandit Test Tools Installation"

echo ""
echo "This script will install:"
echo "  • Node.js testing dependencies"
echo "  • k6 (Performance testing)"
echo "  • Playwright browsers"
echo "  • Security scanning tools"
echo "  • Git hooks"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# NODE.JS DEPENDENCIES
# ═══════════════════════════════════════════════════════════════════════════════

print_header "Installing Node.js Dependencies"

npm install --save-dev \
    @stryker-mutator/core \
    @stryker-mutator/typescript-checker \
    @stryker-mutator/vitest-runner \
    @faker-js/faker \
    audit-ci \
    nyc \
    husky \
    lint-staged \
    snyk || print_warning "Some packages failed to install"

print_success "Node.js dependencies installed"

# ═══════════════════════════════════════════════════════════════════════════════
# K6 INSTALLATION
# ═══════════════════════════════════════════════════════════════════════════════

print_header "Installing k6 (Performance Testing)"

if check_command k6; then
    echo "k6 is already installed"
else
    print_warning "Installing k6..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 2>/dev/null || true
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install -y k6 || print_warning "k6 installation failed"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if check_command brew; then
            brew install k6
        else
            print_error "Homebrew is required to install k6 on macOS"
        fi
    else
        print_warning "Automatic k6 installation not supported for your OS"
        echo "Please install manually: https://k6.io/docs/getting-started/installation/"
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PLAYWRIGHT BROWSERS
# ═══════════════════════════════════════════════════════════════════════════════

print_header "Installing Playwright Browsers"

npx playwright install chromium firefox webkit || print_warning "Some browsers failed to install"
npx playwright install-deps chromium || print_warning "Browser dependencies installation failed"

print_success "Playwright browsers installed"

# ═══════════════════════════════════════════════════════════════════════════════
# SECURITY TOOLS
# ═══════════════════════════════════════════════════════════════════════════════

print_header "Installing Security Tools"

# GitLeaks
if ! check_command gitleaks; then
    print_warning "Installing GitLeaks..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -sSL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks-linux-amd64 \
            -o /tmp/gitleaks && \
            chmod +x /tmp/gitleaks && \
            sudo mv /tmp/gitleaks /usr/local/bin/ || print_warning "GitLeaks installation failed"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install gitleaks || print_warning "GitLeaks installation failed"
    fi
fi

# Semgrep
if ! check_command semgrep; then
    print_warning "Installing Semgrep..."
    pip install semgrep || print_warning "Semgrep installation failed"
fi

# Trivy
if ! check_command trivy; then
    print_warning "Installing Trivy..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sudo sh -s -- -b /usr/local/bin || print_warning "Trivy installation failed"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install trivy || print_warning "Trivy installation failed"
    fi
fi

print_success "Security tools installed"

# ═══════════════════════════════════════════════════════════════════════════════
# GIT HOOKS
# ═══════════════════════════════════════════════════════════════════════════════

print_header "Setting up Git Hooks"

npx husky install || print_warning "Husky installation failed"

# Create pre-commit hook
if [ -d ".husky" ]; then
    cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
EOF
    chmod +x .husky/pre-commit
    print_success "Git hooks configured"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

print_header "Verifying Installations"

echo ""
echo "Checking installed tools:"
echo ""

check_command k6
check_command gitleaks
check_command semgrep
check_command trivy

echo ""
echo "Node.js packages:"
npm list --depth=0 @stryker-mutator/core @faker-js/faker audit-ci nyc husky lint-staged 2>/dev/null || true

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

print_header "Installation Complete!"

echo ""
echo "You can now run the following commands:"
echo ""
echo "  npm run test              # Run all tests"
echo "  npm run test:e2e          # Run E2E tests"
echo "  npm run test:load         # Run load tests (k6)"
echo "  npm run test:security     # Run security tests"
echo "  npm run test:mutation     # Run mutation tests"
echo ""
echo "For more information, see:"
echo "  docs/TESTING_STRATEGY.md"
echo "  tests/README.md"
echo ""
