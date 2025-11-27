# Disclaimer Placement Guide

This document maps each FRD disclaimer requirement to specific components and locations in the codebase.

## 10.3.1 General Accuracy & Estimate Disclaimer

**Location:** Homepage / Intro Screen (before user enters calculator)  
**Component:** `components/Hero.tsx`  
**Placement:** Add below the "Check Your Solar Savings" button (around line 89)

```tsx
// After line 89 in Hero.tsx
<div className="mt-4">
  <p className="text-xs text-white/70 max-w-md">
    All calculations provided on this website are estimates only. Actual system performance, pricing, and savings may differ based on utility rates, site conditions, equipment selection, installation details, and final engineering review.
  </p>
</div>
```

**Alternative locations:**
- `components/FinalCTA.tsx` - Below the "Check Your Solar Savings" button (around line 53)
- `components/HowItWorks.tsx` - Below the "Start Your Estimate" button (around line 107)

---

## 10.3.2 User Data Accuracy Disclaimer

**Location:** Input Screen (address, usage, roof details)  
**Components:**
- `components/estimator/StepLocation/index.tsx` - Below address input
- `components/estimator/StepEnergySimple/index.tsx` - Below usage/bill inputs (around line 191)
- `components/estimator/StepRoofSimple/index.tsx` - Below roof size inputs
- `components/estimator/StepDetails/index.tsx` - Below input fields

**Example placement in StepEnergySimple:**
```tsx
// After the annual escalation input (around line 191)
<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-xs text-gray-600">
    Results rely on the information entered by the user. Incorrect or incomplete details—such as power usage, shading, roof measurements, or rate selection—will impact the accuracy of the estimates.
  </p>
</div>
```

---

## 10.3.3 Irradiance & Production Variability Disclaimer

**Location:** Mapping / Irradiance Module  
**Components:**
- `components/estimator/StepDrawRoof/index.tsx` - Below the map/roof drawing section
- `app/api/estimate/route.ts` - Display in results when production data is shown

**Placement in StepDrawRoof:**
```tsx
// Below the map component, before the roof details section
<div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
  <p className="text-xs text-gray-700">
    Production values are calculated using typical weather patterns and industry-standard modelling tools for your location. Real-world sunlight levels, seasonal variations, and shading conditions may increase or decrease actual production.
  </p>
</div>
```

---

## 10.3.4 Engineering & Final Design Disclaimer

**Location:** System Size & Panel Layout Results  
**Components:**
- `components/estimator/StepReview/sections/SystemSummaryCards.tsx` - Below system size display
- `components/ResultsPage.tsx` - In the system summary section (around line 200-300)

**Placement in SystemSummaryCards:**
```tsx
// After the system size display
<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
  <p className="text-xs text-gray-700">
    System size, layout, equipment model, and projected output shown by the calculator are preliminary estimates. Final system design can only be confirmed after a full site assessment, roof analysis, and engineering review.
  </p>
</div>
```

---

## 10.3.5 Pricing, Rebates & Incentives Disclaimer

**Location:** Estimated Cost Section  
**Components:**
- `components/estimator/StepReview/sections/CostBreakdown.tsx` - Below pricing table
- `components/ResultsPage.tsx` - In the cost breakdown section

**Placement in CostBreakdown:**
```tsx
// Below the cost table/rebate section
<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-xs text-gray-700">
    Estimated pricing, incentives, and rebates are based on current publicly available program information. Programs may change, close, or require specific eligibility criteria. Final pricing and incentives are confirmed only through a formal proposal from a qualified installer.
  </p>
</div>
```

---

## 10.3.6 Delivery Fees, Utility Fees & Additional Charges Disclaimer

**Location:** Savings and Bill Offset Section  
**Components:**
- `components/estimator/StepNetMetering/index.tsx` - Below "Savings Breakdown" section (around line 1080)
- `components/estimator/StepBatteryPeakShavingFRD/index.tsx` - Below savings calculations
- `components/ResultsPage.tsx` - In savings section

**Placement in StepNetMetering:**
```tsx
// After the donut chart and legend (around line 1079)
<div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
  <div className="flex items-start gap-2">
    <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
    <p className="text-xs text-gray-700">
      <span className="font-semibold">Delivery fees, regulatory charges, and utility service fees</span> remain the responsibility of the utility provider and are not eliminated by solar. These charges may be reduced through lower consumption but cannot be fully removed. Actual fee reductions depend on the utility's billing structure and regulations.
    </p>
  </div>
</div>
```

**Tooltip version:** Add to the "Savings Breakdown" header (line 1037) using InfoTooltip component.

---

## 10.3.7 Electricity Rate & Savings Disclaimer

**Location:** Payback / ROI Section  
**Components:**
- `components/estimator/StepNetMetering/index.tsx` - Below "Key Financial Metrics" (around line 805)
- `components/estimator/StepReview/tabs/SavingsTab.tsx` - Below payback/ROI metrics
- `components/ResultsPage.tsx` - In financial metrics section

**Placement in StepNetMetering:**
```tsx
// After the Key Financial Metrics grid (around line 805)
<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-xs text-gray-700">
    Savings projections assume current publicly available electricity rates, including time-of-use (TOU), ultra-low overnight (ULO), tiered, or other utility structures. Utilities may change their rates, fees, or billing rules at any time, which may affect future savings.
  </p>
</div>
```

---

## 10.3.8 Net Metering Rules Disclaimer

**Location:** Net Metering Credit Section  
**Component:** `components/estimator/StepNetMetering/index.tsx`  
**Placement:** Below "Detailed Breakdown" section, after "Annual Export Credits" (around line 1118)

```tsx
// After Annual Export Credits display (around line 1118)
<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex items-start gap-2">
    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
    <p className="text-xs text-gray-700">
      Credit values and export calculations are based on general net metering rules. Actual crediting depends on your utility provider, metering configuration, export limits, and the most recent program rules. Approval is required from the utility before any system can operate under net metering.
    </p>
  </div>
</div>
```

**Also add to:** `components/ResultsPage/sections/NetMeteringResults.tsx` - Below net metering results display

---

## 10.3.9 Battery Performance & Optimization Disclaimer

**Location:** Battery Savings or Backup Module  
**Components:**
- `components/estimator/StepBatteryPeakShavingFRD/index.tsx` - Below battery savings calculations
- `components/estimator/StepReview/sections/BatteryDetails.tsx` - Below battery details

**Placement in StepBatteryPeakShavingFRD:**
```tsx
// Below the battery savings results section
<div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
  <p className="text-xs text-gray-700">
    Battery performance, backup duration, and savings vary based on selected loads, weather conditions, solar production, consumption patterns, and equipment model. Optimization algorithms or AI-based controls may improve performance but cannot be guaranteed.
  </p>
</div>
```

---

## 10.3.10 Not a Contract or Quote Disclaimer

**Location:** Final Results Page  
**Components:**
- `components/estimator/StepContact/index.tsx` - Above "Submit" or "Connect with Installer" button
- `components/ResultsPage.tsx` - Above the CTA section (around line 1500+)

**Placement in StepContact:**
```tsx
// Before the submit/contact form (around the top of the component)
<div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
  <p className="text-sm text-gray-800 font-medium">
    This calculator is for educational and informational purposes only. It does not constitute a quote, contract, guarantee of performance, or confirmation of eligibility for any program or incentive. A qualified installer must provide a formal proposal and conduct a site assessment before any system is approved or installed.
  </p>
</div>
```

---

## 10.3.11 Global Footer Disclaimer

**Location:** Footer (every page)  
**Component:** `components/Footer.tsx`  
**Placement:** Add before the bottom bar (around line 123)

```tsx
// Before line 123 in Footer.tsx, add a new section:
<div className="pt-8 border-t border-white/10 mb-8">
  <p className="text-xs text-gray-300 leading-relaxed max-w-4xl">
    All calculations provided on this website are estimates. Actual pricing, production, incentives, fees, and savings may vary. This tool does not guarantee approval for any utility program or government incentive, nor does it eliminate delivery charges or utility service fees. Users should verify all details with a licensed solar professional and their local utility provider.
  </p>
</div>
```

---

## Implementation Notes

### Styling Guidelines
- Use consistent styling: `p-3 bg-[color]-50 border border-[color]-200 rounded-lg`
- Text size: `text-xs` for most disclaimers, `text-sm` for important ones
- Colors: Blue for informational, Amber/Yellow for warnings, Gray for neutral
- Icons: Use `Info` icon from lucide-react for tooltips and important notices

### Responsive Considerations
- All disclaimers should be readable on mobile (minimum 12px font)
- Use responsive padding: `p-3 sm:p-4`
- Ensure disclaimers don't block core UI elements

### Accessibility
- Maintain proper contrast ratios (WCAG AA minimum)
- Use semantic HTML (`<p>`, `<div>` with proper roles)
- Include `aria-label` for icon-only tooltips

### Testing Checklist
- [ ] All disclaimers visible on desktop
- [ ] All disclaimers visible on mobile
- [ ] Disclaimers don't interfere with core functionality
- [ ] Text is readable (contrast ratio check)
- [ ] Footer disclaimer appears on all pages
- [ ] Tooltips work correctly
- [ ] Disclaimers appear in correct order in user flow



