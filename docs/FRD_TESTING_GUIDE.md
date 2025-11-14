# FRD Testing Guide

This guide provides manual testing scenarios to verify all FRD requirements are working correctly.

## Prerequisites

1. Navigate to the Peak Shaving Calculator page
2. Ensure you have valid inputs:
   - Annual Usage (kWh)
   - Solar Production (kWh)
   - Battery selection

## Test Scenarios

### Test 1: AI Mode Toggle (Basic Functionality)

**Objective**: Verify AI Mode toggle appears and works correctly

**Steps**:
1. Navigate to Peak Shaving Calculator
2. Locate the "Ultra-Low Overnight (ULO)" rate plan card
3. Verify AI Optimization Mode toggle is visible
4. Toggle AI Mode ON
5. Verify explanation text appears: "AI EMC Active: The Energy Management Controller automatically fills your battery..."
6. Toggle AI Mode OFF
7. Verify explanation text disappears

**Expected Results**:
- ✅ Toggle is visible in ULO section
- ✅ Toggle changes state when clicked
- ✅ Explanation appears when ON
- ✅ Explanation disappears when OFF

---

### Test 2: AI Mode - Grid Charging Behavior

**Objective**: Verify AI Mode controls grid charging correctly

**Test 2a: AI Mode OFF (Solar-only charging)**
- Set Annual Usage: 10,000 kWh
- Set Solar Production: 3,000 kWh
- Select Battery: Renon 16 kWh
- Set AI Mode: OFF
- Select ULO rate plan

**Expected Results**:
- ✅ Battery charges only from solar excess
- ✅ No grid charging occurs
- ✅ "ULO→Battery" percentage = 0%
- ✅ "Solar→Battery" percentage > 0% (if solar excess exists)

**Test 2b: AI Mode ON (Grid charging allowed)**
- Same inputs as Test 2a
- Set AI Mode: ON

**Expected Results**:
- ✅ Battery can charge from grid at ULO rate
- ✅ "ULO→Battery" percentage > 0%
- ✅ Total battery capacity is higher than Test 2a
- ✅ Annual savings are higher than Test 2a

**Test 2c: AI Mode on TOU Plan (Should have no effect)**
- Set Annual Usage: 10,000 kWh
- Set Solar Production: 3,000 kWh
- Select Battery: Renon 16 kWh
- Select TOU rate plan
- Toggle AI Mode ON/OFF

**Expected Results**:
- ✅ AI Mode toggle may not be visible (or visible but disabled)
- ✅ Savings remain the same regardless of AI Mode state
- ✅ No grid charging occurs (AI Mode only works for ULO)

---

### Test 3: Day/Night Split

**Objective**: Verify 50/50 day/night split is applied

**Steps**:
1. Set Annual Usage: 10,000 kWh
2. Set Solar Production: 6,000 kWh
3. Select Battery: Renon 16 kWh
4. Check results

**Expected Results**:
- ✅ Day Load = 5,000 kWh (50% of 10,000)
- ✅ Night Load = 5,000 kWh (50% of 10,000)
- ✅ Solar to Day = min(6,000, 5,000) = 5,000 kWh
- ✅ Solar Excess = 6,000 - 5,000 = 1,000 kWh
- ✅ Solar cannot exceed dayLoad (5,000 kWh max)

**Verification**:
- Check "Offset & Allocation" section
- "Solar Direct" percentage should be ~50% (5,000 / 10,000)

---

### Test 4: Solar Allocation (Step B)

**Test 4a: Solar exceeds dayLoad**
- Annual Usage: 10,000 kWh
- Solar Production: 8,000 kWh
- Battery: Renon 16 kWh

**Expected Results**:
- ✅ Solar to Day = 5,000 kWh (capped at dayLoad)
- ✅ Solar Excess = 3,000 kWh
- ✅ Day Grid After Solar = 0 kWh

**Test 4b: Solar less than dayLoad**
- Annual Usage: 10,000 kWh
- Solar Production: 3,000 kWh
- Battery: Renon 16 kWh

**Expected Results**:
- ✅ Solar to Day = 3,000 kWh (all solar used)
- ✅ Solar Excess = 0 kWh
- ✅ Day Grid After Solar = 2,000 kWh

---

### Test 5: Battery Charging (Step C)

**Test 5a: Solar → Battery (C1)**
- Annual Usage: 10,000 kWh
- Solar Production: 6,000 kWh (1,000 excess after dayLoad)
- Battery: Renon 16 kWh (max capacity = 16 × 365 = 5,840 kWh/year)
- AI Mode: OFF

**Expected Results**:
- ✅ battSolarCharged = min(1,000, 5,840, 5,000) = 1,000 kWh
- ✅ battGridCharged = 0 kWh
- ✅ battTotal = 1,000 kWh

**Test 5b: Grid → Battery (C2) - AI Mode ON**
- Annual Usage: 10,000 kWh
- Solar Production: 3,000 kWh (low solar)
- Battery: Renon 16 kWh
- AI Mode: ON
- Rate Plan: ULO

**Expected Results**:
- ✅ battSolarCharged = min(0, 5,840, 5,000) = 0 kWh (no excess)
- ✅ battGridCharged > 0 kWh (grid charging enabled)
- ✅ battTotal = battSolarCharged + battGridCharged
- ✅ battTotal ≤ 5,840 kWh (365 cycles limit)

---

### Test 6: Battery Discharge Priority (Step D)

**Objective**: Verify battery discharges in correct priority order

**Steps**:
1. Set Annual Usage: 10,000 kWh
2. Set Solar Production: 5,000 kWh
3. Select Battery: Renon 32 kWh (larger battery to test all buckets)
4. Check battery discharge allocation

**Expected Results**:
- ✅ Priority order: On-peak > Mid-peak > Off-peak > ULO
- ✅ On-peak fully offset first (if battery capacity allows)
- ✅ Then mid-peak
- ✅ Then off-peak
- ✅ ULO last (only for ULO plans)

**Verification**:
- Check "Offset & Allocation" percentages
- "Solar→Battery" should show battery contribution
- Grid remaining should be lowest in on-peak period

---

### Test 7: Edge Case 1 - High Usage

**Objective**: Verify handling when Usage >> Solar + Battery

**Steps**:
1. Set Annual Usage: 30,000 kWh (high usage)
2. Set Solar Production: 8,000 kWh
3. Select Battery: Renon 16 kWh (max = 5,840 kWh/year)
4. Check results

**Expected Results**:
- ✅ Edge case detected: "high_usage"
- ✅ Battery and solar run normally
- ✅ Remaining load stays proportional across buckets
- ✅ Grid remaining > 0 (significant grid usage remains)
- ✅ Total offset < Total usage

**Verification**:
- Total offset = Solar Direct + Battery < 30,000 kWh
- Grid remaining percentage > 50%

---

### Test 8: Edge Case 2 - High Capacity

**Objective**: Verify handling when Solar + Battery >> Usage

**Steps**:
1. Set Annual Usage: 10,000 kWh
2. Set Solar Production: 15,000 kWh (high solar)
3. Select Battery: Renon 32 kWh (max = 11,680 kWh/year)
4. Check results

**Expected Results**:
- ✅ Edge case detected: "high_capacity"
- ✅ Total energy offset capped at usage (10,000 kWh)
- ✅ Battery discharge capped based on available loads
- ✅ Effective cycles recalculated (< 365)
- ✅ Excess solar tracked (solarUnused > 0)

**Verification**:
- Total offset ≤ 10,000 kWh
- "Solar Direct" + "Solar→Battery" ≤ 100%
- Effective cycles < 365 (if battery is oversized)

---

### Test 9: Offset Percentages Display

**Objective**: Verify offset percentages are displayed correctly

**Steps**:
1. Set reasonable inputs (e.g., 10,000 kWh usage, 5,000 kWh solar)
2. Select battery
3. Check "Energy Offset & Allocation" row in results table

**Expected Results**:
- ✅ "Solar Direct" percentage displayed
- ✅ "Solar→Battery" percentage displayed
- ✅ "ULO→Battery" percentage displayed (only when AI Mode ON + ULO)
- ✅ "Grid" percentage displayed
- ✅ All percentages sum to ~100%

**Test 9a: AI Mode OFF**
- AI Mode: OFF
- Expected: "ULO→Battery" = 0% or not shown

**Test 9b: AI Mode ON**
- AI Mode: ON
- Rate Plan: ULO
- Expected: "ULO→Battery" > 0%

---

### Test 10: Safety Checks

**Test 10a: Zero Usage**
- Set Annual Usage: 0 kWh
- Expected: Error message or graceful handling

**Test 10b: Negative Values**
- Try negative inputs
- Expected: Values clamped to 0 or error shown

**Test 10c: No Negative kWh**
- Check all displayed values
- Expected: No negative kWh values anywhere

**Test 10d: Division by Zero**
- Test edge cases that might cause division by zero
- Expected: No crashes, graceful handling

---

### Test 11: 365 Cycles/Year Limit

**Objective**: Verify battery never exceeds 365 cycles/year

**Steps**:
1. Set Annual Usage: 10,000 kWh
2. Set Solar Production: 5,000 kWh
3. Select Battery: Renon 16 kWh
4. Calculate effective cycles

**Expected Results**:
- ✅ Max battery throughput = 16 × 365 = 5,840 kWh/year
- ✅ Effective cycles ≤ 365
- ✅ Battery discharge ≤ 5,840 kWh/year

**Verification**:
- Check that even with high solar, battery discharge is capped
- Effective cycles should never exceed 365

---

### Test 12: AI EMC Explanation

**Objective**: Verify explanation text appears correctly

**Steps**:
1. Select ULO rate plan
2. Toggle AI Mode ON
3. Check for explanation text

**Expected Results**:
- ✅ Explanation box appears below toggle
- ✅ Text explains: "AI EMC automatically fills battery at cheap ULO rates (11 PM - 7 AM) and discharges during expensive peak hours"
- ✅ Explanation disappears when AI Mode is OFF

---

### Test 13: Integration - Real-World Scenario

**Objective**: Test with realistic residential scenario

**Steps**:
1. Set Annual Usage: 14,000 kWh (typical household)
2. Set Solar Production: 8,000 kWh (typical 6kW system)
3. Select Battery: Renon 16 kWh
4. Test both TOU and ULO plans
5. Test with AI Mode OFF and ON

**Expected Results**:
- ✅ All calculations complete without errors
- ✅ Savings are realistic and positive
- ✅ Offset percentages make sense
- ✅ Payback period is reasonable
- ✅ 25-year profit is positive

---

### Test 14: Custom Rates

**Objective**: Verify custom rates work with new features

**Steps**:
1. Edit custom rates for TOU and ULO
2. Toggle AI Mode ON
3. Verify calculations use custom rates
4. Check that AI Mode still works with custom rates

**Expected Results**:
- ✅ Custom rates are applied correctly
- ✅ AI Mode works with custom ULO rates
- ✅ Grid charging uses custom ULO ultra-low rate

---

## Test Checklist

Use this checklist to verify all features:

- [ ] AI Mode toggle visible in ULO section
- [ ] AI Mode toggle works (ON/OFF)
- [ ] AI Mode explanation appears when ON
- [ ] Grid charging only when AI Mode ON + ULO
- [ ] Day/Night split 50/50 by default
- [ ] Solar allocation respects dayLoad constraint
- [ ] Battery charging from solar excess works
- [ ] Battery charging from grid works (AI Mode ON)
- [ ] Battery discharge follows priority order
- [ ] Edge case 1 (high usage) handled correctly
- [ ] Edge case 2 (high capacity) handled correctly
- [ ] Offset percentages displayed correctly
- [ ] ULO-charged battery % shown when AI Mode ON
- [ ] No negative kWh values
- [ ] 365 cycles/year limit respected
- [ ] Safety checks prevent crashes
- [ ] Custom rates work with AI Mode

---

## Common Issues to Watch For

1. **AI Mode not affecting calculations**: Check that `aiMode` is passed to calculation functions
2. **Negative percentages**: Ensure all calculations use `Math.max(0, ...)`
3. **Battery exceeding 365 cycles**: Verify `battTotal ≤ B × 365`
4. **Solar exceeding dayLoad**: Verify `solarToDay ≤ dayLoad`
5. **Grid charging on TOU**: Should never happen, even with AI Mode ON

---

## Performance Testing

- Test with very large numbers (100,000+ kWh usage)
- Test with very small numbers (100 kWh usage)
- Test rapid toggling of AI Mode
- Test changing multiple inputs quickly
- Verify calculations complete instantly (< 100ms)

---

## Browser Compatibility

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Accessibility Testing

- [ ] AI Mode toggle is keyboard accessible
- [ ] Screen reader announces toggle state
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA standards

