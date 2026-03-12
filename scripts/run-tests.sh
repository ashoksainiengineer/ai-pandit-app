#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# AI-Pandit Test Runner Script
# Industry-standard test execution with categorization and reporting
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test categories
UNIT_TESTS="apps/api/src/lib/**/__tests__/*.unit.test.ts"
INTEGRATION_TESTS="apps/api/src/lib/**/__tests__/*.integration.test.ts"
CONTRACT_TESTS="apps/api/src/lib/ephemeris/__tests__/contract.test.ts"
PERFORMANCE_TESTS="apps/api/src/lib/__tests__/performance.benchmark.test.ts"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AI-PANDIT TEST SUITE - Industry Standard Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Function to run tests with reporting
run_test_category() {
    local category=$1
    local pattern=$2
    local timeout=$3
    
    echo -e "${YELLOW}▶ Running $category...${NC}"
    
    if npm run test -- --testPathPattern="$pattern" --testTimeout=$timeout 2>&1; then
        echo -e "${GREEN}✓ $category passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $category failed${NC}"
        return 1
    fi
}

# Parse command line arguments
MODE=${1:-"all"}

# Set working directory to monorepo root
cd "$(dirname "$0")/.."

case "$MODE" in
    "unit")
        echo -e "${BLUE}Running Unit Tests Only${NC}"
        run_test_category "Unit Tests" "unit.test.ts" 10000
        ;;
    "integration")
        echo -e "${BLUE}Running Integration Tests Only${NC}"
        run_test_category "Integration Tests" "integration.test.ts" 120000
        ;;
    "contract")
        echo -e "${BLUE}Running Contract Tests Only${NC}"
        run_test_category "Contract Tests" "contract.test.ts" 60000
        ;;
    "performance")
        echo -e "${BLUE}Running Performance Tests Only${NC}"
        run_test_category "Performance Tests" "performance.benchmark.test.ts" 120000
        ;;
    "all"|"")
        echo -e "${BLUE}Running Full Test Suite${NC}"
        
        FAILED=0
        
        # Run unit tests first (fastest)
        run_test_category "Unit Tests" "unit.test.ts" 10000 || FAILED=1
        
        # Run contract tests
        run_test_category "Contract Tests" "contract.test.ts" 60000 || FAILED=1
        
        # Run integration tests
        run_test_category "Integration Tests" "integration.test.ts" 120000 || FAILED=1
        
        # Run performance tests (optional - can be slow)
        echo -e "${YELLOW}▶ Running Performance Tests (optional)...${NC}"
        if ! npm run test -- --testPathPattern="performance.benchmark.test.ts" --testTimeout=120000 2>&1; then
            echo -e "${YELLOW}⚠ Performance tests completed with warnings${NC}"
        fi
        
        if [ $FAILED -eq 0 ]; then
            echo ""
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${GREEN}  ALL TESTS PASSED ✓${NC}"
            echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
            exit 0
        else
            echo ""
            echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
            echo -e "${RED}  SOME TESTS FAILED ✗${NC}"
            echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
            exit 1
        fi
        ;;
    "watch")
        echo -e "${BLUE}Running Tests in Watch Mode${NC}"
        npm run test -- --watch
        ;;
    "coverage")
        echo -e "${BLUE}Running Tests with Coverage${NC}"
        npm run test:coverage
        ;;
    *)
        echo "Usage: $0 [unit|integration|contract|performance|all|watch|coverage]"
        echo ""
        echo "Categories:"
        echo "  unit         - Fast unit tests only"
        echo "  integration  - Integration tests with real dependencies"
        echo "  contract     - API contract tests"
        echo "  performance  - Performance benchmarks"
        echo "  all          - Full test suite (default)"
        echo "  watch        - Watch mode for development"
        echo "  coverage     - Generate coverage report"
        exit 1
        ;;
esac
