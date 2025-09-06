#!/bin/bash
# Quick test runner aliases for Fireflare backend

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔥 Fireflare Test Runner${NC}"
echo -e "${YELLOW}Usage: Choose an option below${NC}"
echo

# Get the directory of this script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Test Options:"
echo -e "${GREEN}1. All Tests (comprehensive)${NC} - ./test.sh all"
echo -e "${GREEN}2. Quick Tests (skip manual)${NC} - ./test.sh quick"
echo -e "${GREEN}3. Unit Tests Only${NC} - ./test.sh unit"
echo -e "${GREEN}4. Clustering Tests Only${NC} - ./test.sh clustering"
echo -e "${GREEN}5. Integration Tests Only${NC} - ./test.sh integration"
echo -e "${GREEN}6. API Tests Only${NC} - ./test.sh api"
echo -e "${GREEN}7. Manual Tests Only${NC} - ./test.sh manual"
echo

# Check if argument provided
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}No argument provided. Running quick tests...${NC}"
    python3 "$DIR/run_tests.py" --quick
elif [ "$1" = "all" ]; then
    echo -e "${GREEN}Running all tests...${NC}"
    python3 "$DIR/run_tests.py"
elif [ "$1" = "quick" ]; then
    echo -e "${GREEN}Running quick tests (skipping manual tests)...${NC}"
    python3 "$DIR/run_tests.py" --quick
elif [ "$1" = "unit" ]; then
    echo -e "${GREEN}Running unit tests...${NC}"
    python3 "$DIR/run_tests.py" --unit
elif [ "$1" = "clustering" ]; then
    echo -e "${GREEN}Running clustering tests...${NC}"
    python3 "$DIR/run_tests.py" --clustering
elif [ "$1" = "integration" ]; then
    echo -e "${GREEN}Running integration tests...${NC}"
    python3 "$DIR/run_tests.py" --integration
elif [ "$1" = "api" ]; then
    echo -e "${GREEN}Running API tests...${NC}"
    echo -e "${YELLOW}Note: Make sure your backend server is running (python backend.py)${NC}"
    python3 "$DIR/run_tests.py" --api
elif [ "$1" = "manual" ]; then
    echo -e "${GREEN}Running manual tests...${NC}"
    python3 "$DIR/run_tests.py" --manual
elif [ "$1" = "help" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo -e "${BLUE}Available commands:${NC}"
    echo "  all        - Run all tests including manual tests"
    echo "  quick      - Run all tests except manual tests (recommended)"
    echo "  unit       - Run only unit tests"
    echo "  clustering - Run only clustering algorithm tests"
    echo "  integration- Run only integration tests"
    echo "  api        - Run only API endpoint tests"
    echo "  manual     - Run only manual/standalone tests"
    echo "  help       - Show this help message"
else
    echo -e "${RED}Unknown option: $1${NC}"
    echo -e "${YELLOW}Use './test.sh help' to see available options${NC}"
    exit 1
fi
