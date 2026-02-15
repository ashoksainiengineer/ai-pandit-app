#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# AI-PANDIT LOCAL DEVELOPMENT STARTER
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./start-dev.sh
# This script sets up everything automatically for local development
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo -e "${BLUE}"
    cat << "EOF"
    _    _          _____               _     _ _   
   / \  (_)_ __    |_   _| __ __ _  ___| |__ (_) |_ 
  / _ \ | | '_ \     | || '__/ _` |/ __| '_ \| | __|
 / ___ \| | |_) |    | || | | (_| | (__| | | | | |_ 
/_/   \_\_| .__/     |_||_|  \__,_|\___|_| |_|_|\__|
          |_|                                        
EOF
    echo -e "${NC}"
    echo -e "${GREEN}Birth Time Rectification Engine - Local Development${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
    echo ""
}

# Check if required commands are available
check_requirements() {
    print_info "Checking requirements..."
    
    command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed."; exit 1; }
    command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed."; exit 1; }
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) ✓"
}

# Check and setup environment variables
setup_environment() {
    print_info "Setting up environment..."
    
    if [ ! -f ".env" ]; then
        print_info "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please update .env file with your actual API keys"
    fi
    
    # Load environment variables
    set -a
    source .env
    set +a
    
    # Check critical variables
    if [ -z "$ENCRYPTION_SECRET" ]; then
        print_error "ENCRYPTION_SECRET is not set in .env file"
        exit 1
    fi
    
    if [ "$CLERK_SECRET_KEY" = "sk_test_placeholder" ]; then
        print_warning "CLERK_SECRET_KEY is set to placeholder. Authentication will not work."
        print_info "Get your keys from: https://dashboard.clerk.com"
    fi
    
    if [ "$DEEPSEEK_API_KEY" = "your_deepseek_api_key" ]; then
        print_warning "DEEPSEEK_API_KEY is set to placeholder. AI analysis will not work."
        print_info "Get your API key from: https://platform.deepseek.com"
    fi
    
    print_success "Environment configured ✓"
}

# Setup database (uses Turso for local dev as requested)
setup_database() {
    print_info "Checking database configuration..."
    
    # Check if Turso is configured
    if [ -n "$TURSO_DATABASE_URL" ] && [[ "$TURSO_DATABASE_URL" == libsql://* ]]; then
        print_success "Using Turso database: $(echo $TURSO_DATABASE_URL | cut -d'/' -f3) ✓"
    else
        print_warning "Turso database not configured, falling back to SQLite"
        if [ ! -f "dev.db" ]; then
            touch dev.db
        fi
        export DATABASE_URL="file:./dev.db"
        export TURSO_DATABASE_URL="file:./dev.db"
    fi
    
    print_success "Database ready ✓"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Frontend dependencies
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        npm install
    else
        print_info "Frontend dependencies already installed ✓"
    fi
    
    # Backend dependencies
    if [ ! -d "backend/node_modules" ]; then
        print_info "Installing backend dependencies..."
        cd backend && npm install && cd ..
    else
        print_info "Backend dependencies already installed ✓"
    fi
    
    print_success "Dependencies installed ✓"
}

# Create ephemeris directory if not exists
setup_ephemeris() {
    print_info "Setting up Swiss Ephemeris..."
    
    if [ ! -d "ephe" ]; then
        mkdir -p ephe
        print_warning "Ephemeris data directory created. You may need to add .se1 files."
    fi
    
    if [ ! -d "backend/ephe" ]; then
        ln -s ../ephe backend/ephe
    fi
    
    print_success "Ephemeris setup complete ✓"
}

# Function to cleanup processes on exit
cleanup() {
    print_info "\nShutting down services..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    print_success "Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM EXIT

# Kill any existing processes on ports 3000 and 3001
kill_existing() {
    print_info "Cleaning up existing processes..."
    fuser -k 3000/tcp 2>/dev/null || true
    fuser -k 7080/tcp 2>/dev/null || true
    sleep 2
}

# Start services
start_services() {
    print_info "Starting services..."
    print_info "════════════════════════════════════════════════════"
    
    # Export environment for subprocesses
    local SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    export ENCRYPTION_SECRET
    export DATABASE_URL="file:$SCRIPT_DIR/dev.db"
    export TURSO_DATABASE_URL="file:$SCRIPT_DIR/dev.db"
    export BACKEND_URL="http://localhost:7080"
    export NEXT_PUBLIC_BACKEND_URL="http://localhost:7080"
    
    # Start backend
    print_info "Starting backend on http://localhost:7080 ..."
    cd backend
    PORT=7080 npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to be ready
    print_info "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -sf http://localhost:7080/api/health/live > /dev/null 2>&1; then
            print_success "Backend is ready ✓"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            print_error "Backend failed to start. Check backend.log"
            exit 1
        fi
    done
    
    # Start frontend
    print_info "Starting frontend on http://localhost:3000 ..."
    unset PORT  # Unset PORT so Next.js uses default 3000
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    print_info "Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend is ready ✓"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            print_error "Frontend failed to start. Check frontend.log"
            exit 1
        fi
    done
    
    print_info "════════════════════════════════════════════════════"
    print_success "All services are running!"
    echo ""
    print_info "Frontend: http://localhost:3000"
    print_info "Backend:  http://localhost:7080"
    echo ""
    print_info "Logs:"
    print_info "  Frontend: tail -f frontend.log"
    print_info "  Backend:  tail -f backend.log"
    echo ""
    print_warning "Press Ctrl+C to stop all services"
    echo ""
    
    # Open browser (macOS/Linux)
    if command -v open >/dev/null 2>&1; then
        sleep 2 && open http://localhost:3000
    elif command -v xdg-open >/dev/null 2>&1; then
        sleep 2 && xdg-open http://localhost:3000
    fi
    
    # Wait for interrupt
    wait
}

# Main execution
main() {
    print_banner
    kill_existing
    check_requirements
    setup_environment
    setup_database
    install_dependencies
    setup_ephemeris
    start_services
}

main "$@"
