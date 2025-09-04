#!/bin/bash

# 🚀 **QUICK TEST RUNNER**
# 
# This script allows you to run specific test suites quickly
# Usage: ./scripts/quick-test.sh [test-type]
# 
# Available test types:
# - auth: Authentication tests only
# - mobile: Mobile interaction tests only
# - inline: Inline editing tests only
# - security: Security tests only
# - performance: Performance tests only
# - all: All tests (same as run-tests.sh)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run specific test
run_test() {
    local test_type=$1
    local test_dir=$2
    local test_pattern=$3
    
    print_status "Running $test_type tests..."
    
    if [ -d "$test_dir" ]; then
        cd "$test_dir"
        
        if npm test -- --testNamePattern="$test_pattern" --verbose; then
            print_success "$test_type tests passed!"
        else
            print_error "$test_type tests failed!"
            return 1
        fi
        
        cd - > /dev/null
    else
        print_error "$test_dir not found"
        return 1
    fi
}

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [test-type]"
    echo ""
    echo "Available test types:"
    echo "  auth        - Authentication tests only"
    echo "  mobile      - Mobile interaction tests only"
    echo "  inline      - Inline editing tests only"
    echo "  security    - Security tests only"
    echo "  performance - Performance tests only"
    echo "  all         - All tests"
    echo ""
    echo "Examples:"
    echo "  $0 auth      # Run only authentication tests"
    echo "  $0 mobile    # Run only mobile tests"
    echo "  $0 all       # Run all tests"
    exit 1
fi

TEST_TYPE=$1

case $TEST_TYPE in
    "auth")
        print_status "Running Authentication Tests..."
        run_test "Backend Authentication" "backend" "PIN Authentication"
        run_test "Frontend Authentication" "frontend" "Authentication"
        ;;
    "mobile")
        print_status "Running Mobile Tests..."
        run_test "Mobile Interactions" "frontend" "Mobile"
        ;;
    "inline")
        print_status "Running Inline Editing Tests..."
        run_test "Inline Editing" "frontend" "Inline Editing"
        ;;
    "security")
        print_status "Running Security Tests..."
        run_test "Security" "backend" "Security"
        ;;
    "performance")
        print_status "Running Performance Tests..."
        run_test "Performance" "frontend" "Performance"
        ;;
    "all")
        print_status "Running All Tests..."
        ./scripts/run-tests.sh
        ;;
    *)
        print_error "Unknown test type: $TEST_TYPE"
        echo "Available types: auth, mobile, inline, security, performance, all"
        exit 1
        ;;
esac

print_success "Quick test completed!"
