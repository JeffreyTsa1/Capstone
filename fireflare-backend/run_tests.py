#!/usr/bin/env python3
"""
Comprehensive test runner for Fireflare backend tests.
Organizes and runs all tests with beautiful output and reporting.
"""

import os
import sys
import subprocess
import time
import argparse
from pathlib import Path

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_colored(text, color=Colors.ENDC):
    """Print colored text to terminal."""
    print(f"{color}{text}{Colors.ENDC}")

def print_header(text):
    """Print a formatted header."""
    print_colored(f"\n{'='*60}", Colors.HEADER)
    print_colored(f"🔥 {text}", Colors.HEADER + Colors.BOLD)
    print_colored(f"{'='*60}", Colors.HEADER)

def print_section(text):
    """Print a section header."""
    print_colored(f"\n📋 {text}", Colors.OKBLUE + Colors.BOLD)
    print_colored(f"{'-'*40}", Colors.OKBLUE)

def run_command(command, description, capture_output=False):
    """Run a command and return the result."""
    print_colored(f"Running: {description}", Colors.OKCYAN)
    print_colored(f"Command: {' '.join(command)}", Colors.OKCYAN)
    
    start_time = time.time()
    
    try:
        if capture_output:
            result = subprocess.run(command, capture_output=True, text=True, timeout=60)
        else:
            result = subprocess.run(command, timeout=60)
        
        end_time = time.time()
        duration = end_time - start_time
        
        if result.returncode == 0:
            print_colored(f"✅ PASSED ({duration:.2f}s)", Colors.OKGREEN)
            if capture_output and result.stdout:
                print(result.stdout)
            return True, result
        else:
            print_colored(f"❌ FAILED ({duration:.2f}s)", Colors.FAIL)
            if capture_output and result.stderr:
                print_colored(f"Error: {result.stderr}", Colors.FAIL)
            return False, result
    
    except subprocess.TimeoutExpired:
        print_colored(f"⏰ TIMEOUT (>60s)", Colors.WARNING)
        return False, None
    except Exception as e:
        print_colored(f"💥 ERROR: {e}", Colors.FAIL)
        return False, None

def check_dependencies():
    """Check if required dependencies are installed."""
    print_section("Checking Dependencies")
    
    dependencies = [
        (["python", "--version"], "Python"),
        (["pip", "--version"], "pip"),
    ]
    
    all_good = True
    for cmd, name in dependencies:
        success, result = run_command(cmd, f"Checking {name}", capture_output=True)
        if not success:
            all_good = False
    
    # Check for pytest
    try:
        import pytest
        print_colored("✅ pytest is available", Colors.OKGREEN)
    except ImportError:
        print_colored("❌ pytest not found - installing...", Colors.WARNING)
        success, _ = run_command(["pip", "install", "pytest"], "Installing pytest")
        if not success:
            all_good = False
    
    # Check for requests (for API tests)
    try:
        import requests
        print_colored("✅ requests library is available", Colors.OKGREEN)
    except ImportError:
        print_colored("❌ requests not found - installing...", Colors.WARNING)
        success, _ = run_command(["pip", "install", "requests"], "Installing requests")
        if not success:
            all_good = False
    
    return all_good

def run_unit_tests():
    """Run unit tests for core functionality."""
    print_section("Unit Tests - Core Backend Logic")
    
    test_dir = Path(__file__).parent / "tests"
    results = []
    
    # Run original backend tests
    legacy_test = test_dir / "tests.py"
    if legacy_test.exists():
        success, _ = run_command(
            ["python", "-m", "pytest", str(legacy_test), "-v"],
            "Backend Core Tests (Users, Reports, Moderators)"
        )
        results.append(("Backend Core", success))
    
    return results

def run_clustering_tests():
    """Run clustering-specific tests."""
    print_section("Clustering Tests - Algorithm & Data Processing")
    
    test_dir = Path(__file__).parent / "tests" / "clustering"
    results = []
    
    # Run clustering algorithm tests
    clustering_test = test_dir / "test_clustering.py"
    if clustering_test.exists():
        success, _ = run_command(
            ["python", "-m", "pytest", str(clustering_test), "-v"],
            "GeoJSON Clustering Algorithm"
        )
        results.append(("Clustering Algorithm", success))
    
    return results

def run_integration_tests():
    """Run integration tests."""
    print_section("Integration Tests - Data Flow & Storage")
    
    test_dir = Path(__file__).parent / "tests" / "integration"
    results = []
    
    # Run dual storage tests
    dual_storage_test = test_dir / "test_dual_storage.py"
    if dual_storage_test.exists():
        success, _ = run_command(
            ["python", "-m", "pytest", str(dual_storage_test), "-v"],
            "Dual Storage Architecture"
        )
        results.append(("Dual Storage", success))
    
    return results

def run_api_tests(skip_if_no_server=True):
    """Run API endpoint tests."""
    print_section("API Tests - Live Endpoint Testing")
    
    # Check if server is running
    if skip_if_no_server:
        try:
            import requests
            response = requests.get("http://localhost:8080/health", timeout=5)
            if response.status_code != 200:
                print_colored("⚠️ Backend server not running - skipping API tests", Colors.WARNING)
                print_colored("   Start your backend with: python backend.py", Colors.WARNING)
                return [("API Tests", "SKIPPED")]
        except Exception:
            print_colored("⚠️ Backend server not accessible - skipping API tests", Colors.WARNING)
            print_colored("   Start your backend with: python backend.py", Colors.WARNING)
            return [("API Tests", "SKIPPED")]
    
    test_dir = Path(__file__).parent / "tests" / "api"
    results = []
    
    # Run API endpoint tests
    api_test = test_dir / "test_api_endpoints.py"
    if api_test.exists():
        success, _ = run_command(
            ["python", "-m", "pytest", str(api_test), "-v"],
            "Clustering API Endpoints"
        )
        results.append(("API Endpoints", success))
    
    return results

def run_manual_tests():
    """Run manual/standalone tests."""
    print_section("Manual Tests - API Test Manual Mode")
    
    test_dir = Path(__file__).parent / "tests" / "api"
    results = []
    
    # Run API endpoint test in manual mode
    api_test = test_dir / "test_api_endpoints.py"
    if api_test.exists():
        success, _ = run_command(
            ["python", str(api_test), "manual"],
            "Manual API Endpoint Test"
        )
        results.append(("API Manual Test", success))
    else:
        print_colored("⚠️ No manual tests available", Colors.WARNING)
        results.append(("Manual Tests", "SKIPPED"))
    
    return results

def print_summary(all_results):
    """Print a summary of all test results."""
    print_header("Test Results Summary")
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    skipped_tests = 0
    
    for category, results in all_results.items():
        print_section(f"{category} Results")
        
        for test_name, result in results:
            total_tests += 1
            
            if result is True:
                print_colored(f"  ✅ {test_name}", Colors.OKGREEN)
                passed_tests += 1
            elif result is False:
                print_colored(f"  ❌ {test_name}", Colors.FAIL)
                failed_tests += 1
            else:
                print_colored(f"  ⚠️ {test_name} - {result}", Colors.WARNING)
                skipped_tests += 1
    
    print_header("Final Summary")
    print_colored(f"Total Tests: {total_tests}", Colors.BOLD)
    print_colored(f"✅ Passed: {passed_tests}", Colors.OKGREEN)
    print_colored(f"❌ Failed: {failed_tests}", Colors.FAIL)
    print_colored(f"⚠️ Skipped: {skipped_tests}", Colors.WARNING)
    
    if failed_tests == 0:
        print_colored(f"\n🎉 ALL TESTS PASSED! 🎉", Colors.OKGREEN + Colors.BOLD)
    else:
        print_colored(f"\n⚠️ {failed_tests} test(s) failed", Colors.FAIL + Colors.BOLD)
    
    return failed_tests == 0

def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description="Fireflare Backend Test Runner")
    parser.add_argument("--unit", action="store_true", help="Run only unit tests")
    parser.add_argument("--clustering", action="store_true", help="Run only clustering tests")
    parser.add_argument("--integration", action="store_true", help="Run only integration tests")
    parser.add_argument("--api", action="store_true", help="Run only API tests")
    parser.add_argument("--manual", action="store_true", help="Run only manual tests")
    parser.add_argument("--force-api", action="store_true", help="Force API tests even if server not detected")
    parser.add_argument("--quick", action="store_true", help="Skip manual tests for faster execution")
    
    args = parser.parse_args()
    
    print_header("Fireflare Backend Test Suite")
    print_colored("🧪 Comprehensive testing for clustering and dual storage", Colors.OKCYAN)
    
    # Check dependencies
    if not check_dependencies():
        print_colored("❌ Dependency check failed", Colors.FAIL)
        return 1
    
    # Determine which tests to run
    run_all = not (args.unit or args.clustering or args.integration or args.api or args.manual)
    
    all_results = {}
    
    if run_all or args.unit:
        all_results["Unit Tests"] = run_unit_tests()
    
    if run_all or args.clustering:
        all_results["Clustering Tests"] = run_clustering_tests()
    
    if run_all or args.integration:
        all_results["Integration Tests"] = run_integration_tests()
    
    if run_all or args.api:
        all_results["API Tests"] = run_api_tests(skip_if_no_server=not args.force_api)
    
    if (run_all and not args.quick) or args.manual:
        all_results["Manual Tests"] = run_manual_tests()
    
    # Print summary
    success = print_summary(all_results)
    
    if success:
        print_colored(f"\n🚀 Ready for production! All systems are working correctly.", Colors.OKGREEN + Colors.BOLD)
    else:
        print_colored(f"\n🔧 Some tests failed - check the output above for details.", Colors.FAIL + Colors.BOLD)
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
