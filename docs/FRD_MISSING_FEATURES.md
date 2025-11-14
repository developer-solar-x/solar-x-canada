# FRD Missing Features Analysis

This document identifies features from the Functional Requirements Document (FRD) Version 2.0 that are **not yet implemented** in the current codebase.

## Summary

The current implementation has a working peak-shaving calculator with many features, but several key FRD requirements are missing or implemented differently than specified.

---

## 1. AI Optimization Mode Toggle ❌ **NOT IMPLEMENTED**

### FRD Requirement (Section 4, 6.3.C2)
- **Input**: Toggle for "AI Optimization Mode"
- **Behavior**: 
  - **OFF** = Solar-only charging (current behavior)
  - **ON** = Allows grid charging at ULO rate (when Rate Plan = ULO)
- **Location**: Should be a user-facing toggle in the input section

### Current Status
- No AI Mode toggle exists in the UI
- Grid charging logic exists in `calculateSolarBatteryCombined()` but is always enabled for ULO plans
- No conditional logic based on user preference

### Implementation Needed
- Add toggle UI component in `StepBatteryPeakShavingSimple/index.tsx`
- Pass AI Mode state to calculation functions
- Modify `calculateSolarBatteryCombined()` to respect AI Mode setting
- Only allow grid charging when: `AI Mode = ON AND Rate Plan = ULO`

---

## 2. Day/Night Split (p_day, p_night) ❌ **NOT IMPLEMENTED**

### FRD Requirement (Section 5.2, 6.1)
- **Default**: `p_day = 0.5`, `p_night = 0.5` (50/50 split)
- **Purpose**: Split annual usage into daytime and nighttime loads
- **Calculation**: 
  - `dayLoad = U * p_day`
  - `nightLoad = U * p_night`
- **Note**: Should be adjustable constants for future expansion

### Current Status
- Uses fixed TOU/ULO distribution percentages (e.g., 19% on-peak, 18% mid-peak, 63% off-peak for TOU)
- No explicit day/night split calculation
- Solar allocation doesn't follow FRD Step B logic (solar to day load first)

### Implementation Needed
- Add day/night split constants (default 0.5/0.5)
- Implement Step A: Split load into day/night
- Modify solar allocation to follow Step B: `solarToDay = min(S, dayLoad)`
- Ensure solar cannot exceed dayLoad (FRD requirement)

---

## 3. Step-by-Step Calculation Logic (Step A-F) ⚠️ **PARTIALLY IMPLEMENTED**

### FRD Requirement (Section 6)
The FRD specifies a specific 6-step calculation process:

#### Step A: Split Load Into Day/Night ❌ **NOT IMPLEMENTED**
- Current: Uses period-based distribution, not day/night split

#### Step B: Solar Allocation ⚠️ **PARTIALLY IMPLEMENTED**
- FRD: `solarToDay = min(S, dayLoad)`, `solarExcess = max(S - dayLoad, 0)`
- Current: Uses weighted allocation (50% mid-peak, 22% on-peak, 28% off-peak)
- Missing: Solar cannot exceed dayLoad constraint

#### Step C: Battery Charging ⚠️ **PARTIALLY IMPLEMENTED**
- **C1 - Solar → Battery**: ✅ Implemented (`battSolarCharged = min(solarExcess, maxBattKWh, nightLoad)`)
- **C2 - Grid → Battery**: ⚠️ Always enabled for ULO, should be conditional on AI Mode
- Missing: Proper `battHeadroom` calculation when AI Mode is OFF

#### Step D: Battery Discharge Allocation ✅ **IMPLEMENTED**
- Priority order matches FRD (On-peak → Mid-peak → Off-peak → ULO)
- Proper bucket allocation logic exists

#### Step E: Edge Case Handling ❌ **NOT EXPLICITLY IMPLEMENTED**

**Case 1: Usage >> Solar + Battery Capacity**
- FRD Condition: `U > S + maxBattKWh`
- FRD Handling: Battery and solar run normally, remaining load stays proportional
- Current: Works but not explicitly checked/handled

**Case 2: Solar + Battery Capacity >> Usage**
- FRD Condition: `S + maxBattKWh > U`
- FRD Handling:
  - Cap total energy offset at U
  - Cap battery discharge: `battTotalEffective = min(battTotal, totalPeak+Mid+NightLoads)`
  - Recompute effective cycles: `effectiveCycles = battTotalEffective / B`
  - Handle excess solar (zero-export vs net-metering)
- Current: Offset cap exists (`offsetCapInfo.capFraction`) but doesn't follow exact FRD logic

#### Step F: Final Savings Calculation ✅ **IMPLEMENTED**
- Grid kWh calculation exists
- Annual cost after system exists
- Savings calculation exists

---

## 4. Output Display Requirements ⚠️ **PARTIALLY IMPLEMENTED**

### FRD Requirement (Section 7)
User-facing outputs must show:

#### 1. Offset & Allocation ❌ **NOT CLEARLY DISPLAYED**
- **% powered directly by solar** - Not shown as percentage
- **% powered by solar-charged battery** - Not shown as percentage
- **% powered by ULO-charged battery (AI Mode)** - Not shown (AI Mode doesn't exist)
- **% remaining from the grid** - Not shown as percentage

**Current Status**: 
- kWh values are shown in breakdowns
- Percentages are not prominently displayed in summary cards
- No distinction between solar-charged vs grid-charged battery energy

#### 2. TOU/ULO Breakdown ✅ **IMPLEMENTED**
- kWh by bucket before/after exists
- Cost before vs after exists
- Displayed in breakdown modals

#### 3. Financials ✅ **IMPLEMENTED**
- Annual bill before/after exists
- Annual & monthly savings exists
- Payback period exists
- 25-year net benefit exists

#### 4. AI EMC Explanation ❌ **NOT IMPLEMENTED**
- FRD: When ULO + AI Mode is enabled, explain that "AI EMC automatically fills battery at cheap rates and discharges at expensive times"
- Current: No such explanation exists

---

## 5. Edge Case Handling ❌ **NOT EXPLICITLY IMPLEMENTED**

### Case 1: Usage >> Solar + Battery Capacity
**FRD Condition**: `U > S + maxBattKWh`

**FRD Handling**:
- Battery and solar run normally
- Remaining load stays distributed proportionally across buckets
- No artificial shifting

**Current Status**: 
- Works correctly but not explicitly validated
- No specific handling or messaging for this case

### Case 2: Solar + Battery Capacity >> Usage
**FRD Condition**: `S + maxBattKWh > U`

**FRD Handling**:
1. Cap total energy offset at U
2. Cap battery discharge: `battTotalEffective = min(battTotal, totalPeak+Mid+NightLoads)`
3. Recompute effective cycles: `effectiveCycles = battTotalEffective / B`
4. Handle excess solar:
   - Zero-export mode → treat as spilled
   - Net-metering → count export separately (optional)

**Current Status**:
- Offset cap exists (`offsetCapInfo.capFraction`) but uses different logic
- Effective cycles not recalculated
- Excess solar handling not explicit

---

## 6. Battery Throughput Limit ✅ **IMPLEMENTED**

### FRD Requirement (Section 5.1)
- `Cmax = 365` cycles/year
- `maxBattKWh = B × 365` (annual maximum discharge)

### Current Status
- ✅ Implemented in `lib/simple-peak-shaving.ts` line 248-249:
  ```typescript
  const activeDaysPerYear = 365
  const batteryAnnualCycles = battery.usableKwh * activeDaysPerYear
  ```
- ✅ Used correctly in calculations

---

## 7. Editable TOU/ULO Rate Tables ✅ **IMPLEMENTED**

### FRD Requirement (Section 4)
- Modal for editing custom rates

### Current Status
- ✅ Implemented in `StepBatteryPeakShavingSimple/index.tsx`
- ✅ Custom rates state exists (lines 402-414)
- ✅ UI for editing rates exists (lines 898-1050)
- ✅ Rates are applied to calculations

---

## 8. Safety Checks ⚠️ **PARTIALLY IMPLEMENTED**

### FRD Requirement (Section 8)
- Division by zero checks
- No negative kWh allowed

### Current Status
- Some safety checks exist (e.g., `Math.max(0, ...)`)
- Not comprehensive across all calculations
- Division by zero not explicitly checked everywhere

---

## Implementation Priority

### High Priority (Core Functionality)
1. **AI Optimization Mode Toggle** - Required for ULO grid charging feature
2. **Day/Night Split** - Required for proper solar allocation (Step A-B)
3. **Edge Case Handling** - Required for accurate calculations in extreme scenarios
4. **Output Display - Offset Percentages** - Required for user understanding

### Medium Priority (User Experience)
5. **AI EMC Explanation** - Helpful for user education
6. **Explicit Edge Case Validation** - Better error handling and messaging

### Low Priority (Polish)
7. **Comprehensive Safety Checks** - Defensive programming
8. **Exact FRD Step-by-Step Refactoring** - Code organization improvement

---

## Files That Need Modification

1. **`components/estimator/StepBatteryPeakShavingSimple/index.tsx`**
   - Add AI Mode toggle UI
   - Add day/night split inputs (optional, can use defaults)
   - Update output display to show percentages
   - Add AI EMC explanation

2. **`lib/simple-peak-shaving.ts`**
   - Refactor to follow Step A-F structure
   - Add day/night split logic
   - Add AI Mode conditional logic for grid charging
   - Implement explicit edge case handling
   - Add safety checks

3. **`lib/peak-shaving.ts`** (if still used)
   - Similar updates as above

---

## Testing Scenarios Needed

Once implemented, test with:

1. **High Usage Scenario**: `U = 30,000 kWh, S = 8,000 kWh, B = 16 kWh`
   - Should trigger Case 1 edge case handling

2. **High Solar Scenario**: `U = 10,000 kWh, S = 15,000 kWh, B = 32 kWh`
   - Should trigger Case 2 edge case handling
   - Should cap offsets appropriately

3. **AI Mode OFF + ULO**: 
   - Should only charge from solar excess
   - No grid charging

4. **AI Mode ON + ULO**:
   - Should allow grid charging at ULO rate
   - Should show ULO-charged battery percentage

5. **AI Mode + TOU**:
   - AI Mode should have no effect (only applies to ULO)

---

## Notes

- The current implementation works well for most use cases
- The missing features are primarily around:
  - User control (AI Mode toggle)
  - Calculation precision (day/night split, edge cases)
  - Output clarity (percentages, explanations)
- The 365 cycles/year limit is correctly implemented
- Custom rate editing is fully functional

