# Net Metering FRD - Modifications to Reuse Estimator Workflow

## Overview
This document identifies what should be **removed** or **modified** from the Net Metering FRD to integrate with the existing estimator workflow, rather than building a separate calculator.

## ✅ Already Implemented in Estimator Workflow

The following sections from the FRD are **already handled** by the existing estimator and should be **removed**:

### 1. User Inputs (Section 2) - **REMOVE ENTIRE SECTION**

All user inputs are already captured in the estimator:

- ✅ **Postal Code/Address** - Already captured in `StepLocation`
- ✅ **Annual Electricity Usage** - Already captured in `StepEnergySimple` / `StepDetails`
- ✅ **System Size (kW DC)** - Already calculated in `/api/estimate` based on roof size and usage
- ✅ **Solar Production Model** - Already implemented via PVWatts API or seasonal estimates
- ✅ **Rate Plan Selection (TOU/ULO/Tiered)** - Already available in peak-shaving calculator
- ✅ **Hourly Usage Profile** - Already supported (CSV upload exists for Green Button data)

**Action**: Remove Section 2 entirely. The estimator workflow already handles all inputs.

### 2. Updated Ontario Electricity Rates (Section 3) - **KEEP BUT MODIFY**

- ✅ **TOU/ULO Rates** - Already defined in `config/rate-plans.ts`
- ✅ **Rate classification by hour** - Already implemented in `getRateForDateTime()`

**Action**: 
- Keep Section 3.1-3.3 for reference (verify rates match)
- **Add** Section 3.4 Export Credit Valuation (+2¢/kWh) - this is NEW

### 3. Solar Production Model (Section 4.1) - **REMOVE**

- ✅ **8,760-hour baseline** - Already generated via PVWatts or seasonal estimates
- ✅ **Monthly derate factors** - Already handled in production calculations
- ✅ **System size calculation** - Already implemented

**Action**: Remove Section 4.1. Reference existing production data instead.

### 4. Rate Plan Classification (Section 4.3) - **REMOVE**

- ✅ **TOU/ULO hour mapping** - Already implemented in `config/rate-plans.ts`

**Action**: Remove Section 4.3. Use existing `getRateForDateTime()` function.

### 5. UI/UX Requirements (Section 6) - **REMOVE ENTIRE SECTION**

- ✅ **Step-by-step input flow** - Already exists in estimator
- ✅ **Rate plan selector** - Already in battery savings step
- ✅ **Layout and visualizations** - Already in ResultsPage

**Action**: Remove Section 6 entirely. Focus FRD only on net metering-specific calculations and outputs.

### 6. Developer Notes - UI/UX (Section 8) - **MODIFY**

Remove references to:
- Building input components
- Creating new UI flows
- Step-by-step input collection

Keep only:
- Calculation logic modularity
- API-ready outputs
- Rate configuration file updates

## 🆕 New Requirements to Add

These are the **only new features** needed for net metering:

### 1. Net Metering Credit Calculations (Section 4)

**Keep and Implement:**
- Section 4.2: Hourly Usage Comparison (Surplus vs Grid Draw)
- Section 4.4: Surplus Aggregation by TOU/ULO period
- Section 4.5: Apply Export Credit Rates (+2¢/kWh to each rate)
- Section 4.6: Annual Net Metering Credit calculation
- Section 4.7: Monthly Bill Impact with 12-month rollover

### 2. Export Credit Valuation (Add to Section 3.4)

**New requirement:**
- Export credits = rate + 2¢/kWh for all TOU/ULO periods
- This is the key difference from peak-shaving (which only saves on avoided consumption)

### 3. Monthly Rollover Logic (Add to Section 4.7)

**New requirement:**
- Track monthly export credits
- Apply credits to next month's bill
- Cap rollover at 12 months
- Handle oversized systems (cannot cash out excess)

### 4. Net Metering-Specific Outputs (Section 5)

**Keep and Implement:**
- Annual Net Metering Credits ($)
- % of Annual Bill Offset
- Monthly Bill After Solar
- Credits earned per TOU/ULO period
- kWh exported per period
- Monthly breakdown with rollover visualization

## 📝 Modified FRD Structure

### Recommended FRD Sections (Simplified)

1. **Purpose** - Keep as-is (update to reference estimator workflow)
2. **User Inputs** - **REMOVE** (reference estimator inputs instead)
3. **Updated Ontario Electricity Rates** - Keep Sections 3.1-3.3, **Add** 3.4 Export Credits
4. **Calculation Logic** - **Remove** 4.1, 4.3; **Keep** 4.2, 4.4-4.7; **Add** export credit logic
5. **Calculator Outputs** - Keep as-is (net metering specific results)
6. **UI/UX Requirements** - **REMOVE** (use existing ResultsPage)
7. **Edge Cases** - Keep as-is
8. **Developer Notes** - **Simplify** to focus on calculation modules only

## 🔄 Integration Points

### Where Net Metering Logic Should Live

1. **New Calculation Module**: `lib/net-metering.ts`
   - Hourly surplus/import calculations
   - Export credit aggregation by period
   - Monthly rollover logic

2. **Update Rate Plans**: `config/rate-plans.ts`
   - Add export credit rates (rate + 2¢)

3. **New Results Component**: `components/estimator/StepReview/sections/NetMeteringSummary.tsx`
   - Display net metering credits
   - Monthly rollover visualization
   - Export vs import charts

4. **Update ResultsPage**: `components/ResultsPage.tsx`
   - Add net metering results tab/section
   - Show credits alongside savings

### API Integration

- Create `/api/net-metering` endpoint that:
  - Takes production data (from existing estimate)
  - Takes usage data (from existing estimate)
  - Takes rate plan selection
  - Returns net metering credits and monthly impacts

## ✅ Summary of Changes

**Remove from FRD:**
- ❌ Section 2 (User Inputs) - already in estimator
- ❌ Section 4.1 (Solar Production Model) - already implemented
- ❌ Section 4.3 (TOU/ULO Classification) - already implemented
- ❌ Section 6 (UI/UX Requirements) - already in ResultsPage
- ❌ UI-related developer notes

**Keep in FRD:**
- ✅ Section 1 (Purpose) - update to reference estimator
- ✅ Section 3 (Rates) - add export credit rates
- ✅ Section 4.2, 4.4-4.7 (Net Metering Calculations)
- ✅ Section 5 (Net Metering Outputs)
- ✅ Section 7 (Edge Cases)
- ✅ Calculation-focused developer notes

**Add to FRD:**
- ➕ Export credit rate formula (+2¢/kWh)
- ➕ Monthly rollover rules and limits
- ➕ Integration with existing estimator workflow

