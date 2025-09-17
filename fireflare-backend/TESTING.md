# 🧪 Fireflare Backend Testing Infrastructure

This document describes the comprehensive testing infrastructure for the Fireflare backend, including the new clustering functionality and dual storage architecture.

## 📁 Test Organization

```
fireflare-backend/
├── run_tests.py           # Comprehensive test runner
├── test.sh               # Quick bash helper script
└── tests/                # Organized test directory
    ├── tests.py          # Original backend tests (users, reports, etc.)
    ├── clustering/       # Clustering algorithm tests
    │   └── test_clustering.py
    ├── integration/      # Integration & storage tests
    │   └── test_dual_storage.py
    └── api/             # API endpoint tests
        └── test_api_endpoints.py
```

## 🚀 Quick Start

### Option 1: Use the Helper Script (Recommended)
```bash
# Run quick tests (recommended for development)
./test.sh quick

# Run all tests including manual demos
./test.sh all

# Run specific test categories
./test.sh clustering
./test.sh integration
./test.sh api
./test.sh unit
```

### Option 2: Use the Python Runner Directly
```bash
# Run all tests
python run_tests.py

# Run specific categories
python run_tests.py --clustering
python run_tests.py --integration --api
python run_tests.py --quick  # Skip manual tests
```

## 📋 Test Categories

### 1. Unit Tests (`--unit`)
Tests core backend functionality:
- User management and authentication
- Report creation and validation
- Moderator functions
- Database operations

**Files:** `tests/tests.py`

### 2. Clustering Tests (`--clustering`)
Tests the GeoJSON clustering algorithm:
- Haversine distance calculations
- Point clustering logic
- Cluster aggregation properties
- Edge cases and boundary conditions

**Files:** `tests/clustering/test_clustering.py`

### 3. Integration Tests (`--integration`)
Tests data flow and storage integration:
- Dual storage architecture validation
- Database schema compatibility
- Data consistency between original and clustered data
- Legacy data handling

**Files:** `tests/integration/test_dual_storage.py`

### 4. API Tests (`--api`)
Tests live API endpoints:
- Clustering configuration endpoints
- Data retrieval with clustering enabled/disabled
- Payload size validation
- Error handling

**Files:** `tests/api/test_api_endpoints.py`
**Note:** Requires backend server to be running (`python backend.py`)

### 5. Manual Tests (`--manual`)
Tests API endpoints in interactive mode:
- Manual API endpoint validation
- Interactive demonstration scripts
- User-friendly testing output

**Files:** `tests/api/test_api_endpoints.py` (manual mode)
**Note:** Provides user-friendly output for manual validation

## 🔧 Setup Requirements

### Dependencies
The test runner will automatically check and install:
- `pytest` - Testing framework
- `requests` - For API endpoint testing

### Manual Installation
```bash
pip install pytest requests
```

## 📊 Test Output

The test runner provides:
- ✅ **Colored output** for easy result identification
- ⏱️ **Timing information** for performance monitoring
- 📋 **Detailed summaries** with pass/fail counts
- 🎯 **Focused error reporting** for failed tests

### Example Output
```
🔥 Fireflare Backend Test Suite
═══════════════════════════════════════════════════════════

📋 Clustering Tests - Algorithm & Data Processing
──────────────────────────────────
Running: GeoJSON Clustering Algorithm
✅ PASSED (2.34s)

📋 Integration Tests - Data Flow & Storage  
──────────────────────────────────
Running: Dual Storage Architecture
✅ PASSED (1.87s)

🎉 ALL TESTS PASSED! 🎉
```

## 🎯 Development Workflow

### Daily Development
```bash
# Quick validation during development
./test.sh quick
```

### Before Commits
```bash
# Comprehensive testing
./test.sh all
```

### API Development
```bash
# Start backend server
python backend.py

# In another terminal, test API endpoints
./test.sh api
```

### Clustering Development
```bash
# Test clustering algorithms specifically
./test.sh clustering

# Run manual clustering demo
python test_clustering.py
```

## 🐛 Troubleshooting

### Common Issues

**"Backend server not running"**
- Start your backend: `python backend.py`
- Use `--force-api` to run API tests anyway

**"pytest not found"**
- The runner will auto-install pytest
- Or manually: `pip install pytest`

**Import errors**
- Ensure you're in the `fireflare-backend` directory
- Check Python path with: `python -c "import sys; print(sys.path)"`

### Debugging Failed Tests

1. **Run specific test category** to isolate issues:
   ```bash
   ./test.sh clustering  # Only clustering tests
   ```

2. **Use verbose output** for detailed information:
   ```bash
   python -m pytest tests/clustering/test_clustering.py -v -s
   ```

3. **Run individual test files** directly:
   ```bash
   python test_clustering.py  # Standalone demo mode
   ```

## 📈 Performance Metrics

### Expected Test Performance
- **Unit Tests**: ~3-5 seconds
- **Clustering Tests**: ~2-4 seconds
- **Integration Tests**: ~1-3 seconds
- **API Tests**: ~5-10 seconds (requires server)

### Clustering Performance Validation
The tests validate:
- **Payload reduction**: From 18.9MB to ~598KB (97% reduction)
- **Clustering efficiency**: ~540 clusters + 478 individual points
- **Processing time**: Sub-second clustering for typical datasets

## 🔄 Continuous Integration

For CI/CD pipelines, use:
```bash
# Non-interactive testing
python run_tests.py --quick --unit --clustering --integration

# Skip API tests if no server available
python run_tests.py --unit --clustering --integration
```

## 📚 Additional Resources

- **Backend Documentation**: See `backend.py` for API endpoint details
- **Clustering Algorithm**: See `utils/externalapi.py` for implementation
- **Database Schema**: See clustering collections in MongoDB setup
- **NASA API Integration**: See external API documentation in code comments
