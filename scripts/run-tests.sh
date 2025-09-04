#!/bin/bash

# 🧪 **COMPREHENSIVE TEST EXECUTION SCRIPT**
# 
# This script runs all tests for the ShopStation Admin UI enhancements
# including authentication, inline editing, mobile optimization, and more.

set -e  # Exit on any error

echo "🚀 Starting Comprehensive Test Suite for ShopStation Admin UI"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Function to run tests with error handling
run_tests() {
    local test_type=$1
    local test_dir=$2
    local test_command=$3
    
    print_status "Running $test_type tests..."
    
    if [ -d "$test_dir" ]; then
        cd "$test_dir"
        
        if eval "$test_command"; then
            print_success "$test_type tests passed!"
        else
            print_error "$test_type tests failed!"
            return 1
        fi
        
        cd - > /dev/null
    else
        print_warning "$test_dir not found, skipping $test_type tests"
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Create test results directory
mkdir -p test-results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_DIR="test-results/test-run-$TIMESTAMP"
mkdir -p "$TEST_RESULTS_DIR"

print_status "Test results will be saved to: $TEST_RESULTS_DIR"

# 1. Backend Tests
echo ""
echo "🔧 BACKEND TESTING"
echo "=================="

# Authentication System Tests
run_tests "Authentication System" "backend" "npm test -- tests/auth-system.test.js --verbose" || AUTH_TESTS_FAILED=1

# Admin API Integration Tests
run_tests "Admin API Integration" "backend" "npm test -- tests/admin-api-integration.test.js --verbose" || API_TESTS_FAILED=1

# Security Tests
run_tests "Security" "backend" "npm test -- tests/security.test.js --verbose" || SECURITY_TESTS_FAILED=1

# End-to-End Workflow Tests
run_tests "End-to-End Workflows" "backend" "npm test -- tests/e2e-workflows.test.js --verbose" || E2E_TESTS_FAILED=1

# All Backend Tests
run_tests "All Backend" "backend" "npm test --verbose" || BACKEND_TESTS_FAILED=1

# Backend Coverage
print_status "Generating backend test coverage..."
cd backend
if npm run test:coverage > "../$TEST_RESULTS_DIR/backend-coverage.txt" 2>&1; then
    print_success "Backend coverage report generated"
else
    print_warning "Backend coverage generation failed"
fi
cd - > /dev/null

# 2. Frontend Tests
echo ""
echo "🎨 FRONTEND TESTING"
echo "==================="

# Authentication Component Tests
run_tests "Authentication Components" "frontend" "npm test -- --testNamePattern='Authentication' --verbose" || AUTH_COMPONENT_TESTS_FAILED=1

# Inline Editing Tests
run_tests "Inline Editing" "frontend" "npm test -- --testNamePattern='Inline Editing' --verbose" || INLINE_EDITING_TESTS_FAILED=1

# Auto-complete and Validation Tests
run_tests "Auto-complete and Validation" "frontend" "npm test -- --testNamePattern='Auto-complete' --verbose" || AUTOCOMPLETE_TESTS_FAILED=1

# Mobile Interaction Tests
run_tests "Mobile Interactions" "frontend" "npm test -- --testNamePattern='Mobile' --verbose" || MOBILE_TESTS_FAILED=1

# Performance Tests
run_tests "Performance" "frontend" "npm test -- --testNamePattern='Performance' --verbose" || PERFORMANCE_TESTS_FAILED=1

# All Frontend Tests
run_tests "All Frontend" "frontend" "npm test --verbose" || FRONTEND_TESTS_FAILED=1

# Frontend Coverage
print_status "Generating frontend test coverage..."
cd frontend
if npm test -- --coverage > "../$TEST_RESULTS_DIR/frontend-coverage.txt" 2>&1; then
    print_success "Frontend coverage report generated"
else
    print_warning "Frontend coverage generation failed"
fi
cd - > /dev/null

# 3. Integration Tests
echo ""
echo "🔄 INTEGRATION TESTING"
echo "======================"

# Run integration tests
run_tests "Integration" "backend" "npm test -- tests/integration.test.js --verbose" || INTEGRATION_TESTS_FAILED=1

# 4. Generate Test Summary
echo ""
echo "📊 TEST SUMMARY"
echo "==============="

# Create summary file
SUMMARY_FILE="$TEST_RESULTS_DIR/test-summary.txt"
cat > "$SUMMARY_FILE" << EOF
ShopStation Admin UI Test Summary
Generated: $(date)
Test Run: $TIMESTAMP

BACKEND TESTS:
- Authentication System: $([ -z "$AUTH_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")
- Admin API Integration: $([ -z "$API_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")
- Security: $([ -z "$SECURITY_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")
- End-to-End Workflows: $([ -z "$E2E_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")
- All Backend: $([ -z "$BACKEND_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")

FRONTEND TESTS:
- Authentication Components: $([ -z "$AUTH_COMPONENT_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")
- Inline Editing: $([ -z "$INLINE_EDITING_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")
- Auto-complete and Validation: $([ -z "$AUTOCOMPLETE_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")
- Mobile Interactions: $([ -z "$MOBILE_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")
- Performance: $([ -z "$PERFORMANCE_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")
- All Frontend: $([ -z "$FRONTEND_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")

INTEGRATION TESTS:
- Integration: $([ -z "$INTEGRATION_TESTS_FAILED" ] && echo "PASSED" || echo "FAILED")

OVERALL RESULT: $([ -z "$BACKEND_TESTS_FAILED$FRONTEND_TESTS_FAILED$INTEGRATION_TESTS_FAILED" ] && echo "ALL TESTS PASSED" || echo "SOME TESTS FAILED")
EOF

# Display summary
cat "$SUMMARY_FILE"

# 5. Final Status
echo ""
if [ -z "$BACKEND_TESTS_FAILED$FRONTEND_TESTS_FAILED$INTEGRATION_TESTS_FAILED" ]; then
    print_success "🎉 ALL TESTS PASSED! The ShopStation Admin UI is ready for deployment."
    echo ""
    print_status "Test results saved to: $TEST_RESULTS_DIR"
    print_status "Summary file: $SUMMARY_FILE"
    exit 0
else
    print_error "❌ SOME TESTS FAILED! Please review the test results and fix issues before deployment."
    echo ""
    print_status "Test results saved to: $TEST_RESULTS_DIR"
    print_status "Summary file: $SUMMARY_FILE"
    exit 1
fi
