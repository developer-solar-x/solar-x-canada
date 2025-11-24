# Net Metering FRD - What to Remove to Reuse Estimator Workflow

## Summary

To reuse the existing estimator workflow for the net metering calculator, **remove the following sections** from the FRD as they already exist in the codebase.

---

## ❌ Remove Entire Sections

### 1. **Section 2: User Inputs** - REMOVE ENTIRELY

**Why**: All inputs are already captured in the estimator workflow:

| FRD Input | Already Exists In |
|-----------|-------------------|
| Postal Code | `StepLocation` component |
| Annual Electricity Usage | `StepEnergySimple` / `StepDetails` |
| Hourly Usage Profile (CSV) | Green Button data parser already exists |
| System Size (kW DC) | Calculated in `/api/estimate` route |
| Solar Production Model | PVWatts integration or seasonal estimates |
| Rate Plan Selection | Peak-shaving calculator step |

**Action**: Delete Section 2. Reference estimator inputs instead.

---

### 2. **Section 4.1: Hourly Solar Production Model** - REMOVE

**Why**: Solar production is already calculated via:
- PVWatts API when roof polygon exists
- Seasonal estimate when polygon doesn't exist
- Monthly derate factors already applied

**Action**: Delete Section 4.1. Reference existing `estimate.production` data.

---

### 3. **Section 4.3: TOU/ULO Classification by Hour** - REMOVE

**Why**: Hour-to-rate classification is already implemented:
- `config/rate-plans.ts` has all rate definitions
- `getRateForDateTime()` function maps hours to rates
- Winter/summer periods already handled

**Action**: Delete Section 4.3. Use existing `getRateForDateTime()` function.

---

### 4. **Section 6: UI/UX Requirements** - REMOVE ENTIRELY

**Why**: All UI components already exist:

| FRD UI Requirement | Already Exists In |
|-------------------|-------------------|
| Step-by-step input flow | `app/estimator/page.tsx` (9-step workflow) |
| Rate plan selector | Battery savings step component |
| Charts and visualizations | `components/ResultsPage.tsx` |
| Monthly production display | ResultsPage already shows monthly charts |
| Clean layouts | Shadcn UI components already styled |

**Action**: Delete Section 6 entirely. UI workflow is complete.

---

### 5. **Section 8 (Partial): Developer Notes - UI Components** - REMOVE

**Remove these lines from Section 8:**
- "Build modular components" → "Solar model" (already exists)
- "Build modular components" → "Usage model" (already exists)
- "Step-by-step input flow" references
- UI component creation notes

**Keep in Section 8:**
- Rate configuration file notes
- Calculation module structure
- API-ready outputs
- Hour-level resolution (8,760 hours)

---

## ✅ Keep These Sections (But Modify)

### Section 3: Updated Ontario Electricity Rates

**Keep**: Sections 3.1, 3.2, 3.3 (TOU, ULO, Tiered rates)

**Add**: Section 3.4 Export Credit Valuation
- Export credit = rate + 2¢/kWh
- This is the **new** calculation needed

---

### Section 4: Calculation Logic

**Remove**:
- ❌ 4.1 Hourly Solar Production Model
- ❌ 4.3 TOU/ULO Classification by Hour

**Keep**:
- ✅ 4.2 Hourly Usage Comparison (Surplus vs Grid Draw)
- ✅ 4.4 Surplus Aggregation by Period
- ✅ 4.5 Apply Export Credit Rates
- ✅ 4.6 Annual Net Metering Credit
- ✅ 4.7 Monthly Bill Impact with Rollover

---

### Section 5: Calculator Outputs

**Keep entire section** - these are net metering-specific outputs not in current ResultsPage.

---

### Section 7: Edge Cases

**Keep entire section** - net metering-specific edge cases.

---

## 🔄 Integration Changes

Instead of building new components, **integrate with existing**:

1. **Input Collection** → Use existing estimator steps
2. **Production Data** → Use existing `estimate.production`
3. **Rate Plans** → Use existing `config/rate-plans.ts`
4. **Results Display** → Add net metering section to `ResultsPage.tsx`

---

## 📋 Quick Reference: What to Delete

```
FRD Sections to DELETE:
├── Section 2 (User Inputs) - entire section
├── Section 4.1 (Solar Production Model) - entire subsection
├── Section 4.3 (TOU/ULO Classification) - entire subsection  
├── Section 6 (UI/UX Requirements) - entire section
└── Section 8 - UI-related developer notes

FRD Sections to KEEP:
├── Section 1 (Purpose) - update text
├── Section 3 (Rates) - add export credits
├── Section 4.2, 4.4-4.7 (Net Metering Calculations)
├── Section 5 (Outputs)
└── Section 7 (Edge Cases)
```

---

## 🎯 What You Actually Need to Build

After removing the above sections, you only need to implement:

1. **Net metering calculation module** (`lib/net-metering.ts`)
   - Hourly surplus/import logic
   - Export credit aggregation
   - Monthly rollover tracking

2. **Export credit rates** (add to `config/rate-plans.ts`)
   - Rate + 2¢/kWh formula

3. **Net metering results component** (new component)
   - Credits display
   - Monthly rollover visualization
   - Export vs import charts

4. **API endpoint** (`/api/net-metering`)
   - Takes existing estimate data
   - Returns net metering credits

5. **Results page integration** (modify `ResultsPage.tsx`)
   - Add net metering results section

**Total new code**: ~3-4 files + modifications to 2 existing files

