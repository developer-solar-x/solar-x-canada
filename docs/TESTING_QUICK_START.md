# Testing Quick Start Guide

## ✅ Test Setup Complete!

Jest testing framework has been installed and configured. All 27 FRD tests are passing!

## Running Tests

### Run All Tests
```powershell
npm test
```

### Run Specific Test File
```powershell
npm test -- frd-peak-shaving.test.ts
```

### Run Tests in Watch Mode (auto-rerun on file changes)
```powershell
npm run test:watch
```

### Run Tests with Coverage Report
```powershell
npm run test:coverage
```

## Test Results

✅ **27/27 tests passing**

### Test Coverage:
- ✅ Step A: Day/Night Split (2 tests)
- ✅ Step B: Solar Allocation (3 tests)
- ✅ Step C: Battery Charging (6 tests)
- ✅ Step D: Battery Discharge (2 tests)
- ✅ Step E: Edge Cases (3 tests)
- ✅ Step F: Savings Calculation (2 tests)
- ✅ Offset Percentages (3 tests)
- ✅ Safety Checks (3 tests)
- ✅ 365 Cycles Limit (1 test)
- ✅ Integration Tests (2 tests)

## Test Files

1. **`lib/__tests__/frd-peak-shaving.test.ts`** - Automated unit tests
2. **`docs/FRD_TESTING_GUIDE.md`** - Manual testing scenarios
3. **`docs/FRD_BROWSER_CONSOLE_TESTS.js`** - Browser console test helpers

## Quick Manual Test

1. Start the dev server: `npm run dev`
2. Navigate to Peak Shaving Calculator
3. Open browser console (F12)
4. Paste contents of `docs/FRD_BROWSER_CONSOLE_TESTS.js`
5. Run: `quickValidation()`

## What's Tested

- ✅ AI Mode toggle functionality
- ✅ Day/Night split calculations
- ✅ Solar allocation (cannot exceed dayLoad)
- ✅ Battery charging (solar + grid with AI Mode)
- ✅ Battery discharge priority order
- ✅ Edge case handling (high usage, high capacity)
- ✅ Offset percentage calculations
- ✅ Safety checks (no negative values, division by zero)
- ✅ 365 cycles/year limit

All FRD requirements are now fully tested and verified! 🎉

