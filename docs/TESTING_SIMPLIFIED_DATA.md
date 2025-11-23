# Testing Simplified Estimator Data

This guide explains how to test that the simplified data structure is being saved correctly throughout the estimator flow.

## Quick Test Steps

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Navigate to Estimator

Go to `http://localhost:3000/estimator` in your browser.

### 3. Open Browser DevTools

Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac) to open Developer Tools.

### 4. Check localStorage After Each Step

Open the **Console** tab and run these commands to inspect saved data:

```javascript
// Check if data is saved
const saved = localStorage.getItem('solarx_estimator_draft')
if (saved) {
  const parsed = JSON.parse(saved)
  console.log('Current Step:', parsed.currentStep)
  console.log('Saved Data:', JSON.stringify(parsed.data, null, 2))
} else {
  console.log('No saved data found')
}
```

### 5. Test Each Step

#### Step 1: Location
- Enter an address and email
- Check localStorage - should have: `address`, `coordinates`, `email`

#### Step 2: Roof
- Enter roof size or draw roof
- Check localStorage - should have: `roofAreaSqft`, `roofPolygon`, `roofType`, etc.

#### Step 3: Energy
- Enter monthly bill or annual usage
- Check localStorage - should have: `monthlyBill`, `annualUsageKwh`, `energyUsage`, etc.

#### Step 4: Battery Savings (HRS Program)
- Select a battery
- Check localStorage - should have: `selectedBattery`, `systemSizeKw`, `numPanels`, `tou`, `ulo`

#### Step 8: Review
- Review the estimate
- Check localStorage - should have: `production`, `costs`, `roofArea`, `environmental`

#### Step 9: Contact
- Fill out contact form
- Check localStorage - should have: `fullName`, `phone`, `preferredContactTime`, etc.

### 6. Verify Simplified Structure

Run this in the console to see only the simplified fields:

```javascript
const saved = localStorage.getItem('solarx_estimator_draft')
if (saved) {
  const parsed = JSON.parse(saved)
  const data = parsed.data
  
  // Check for required fields only
  const requiredFields = {
    // Step 1
    address: data.address,
    coordinates: data.coordinates,
    email: data.email,
    
    // Step 2
    roofAreaSqft: data.roofAreaSqft,
    roofType: data.roofType,
    
    // Step 3
    annualUsageKwh: data.annualUsageKwh,
    monthlyBill: data.monthlyBill,
    
    // Step 4
    selectedBattery: data.selectedBattery,
    systemSizeKw: data.systemSizeKw,
    numPanels: data.numPanels,
    tou: data.tou,
    ulo: data.ulo,
    
    // Step 8
    production: data.production,
    costs: data.costs,
    roofArea: data.roofArea,
    environmental: data.environmental,
    
    // Step 9
    fullName: data.fullName,
    phone: data.phone,
  }
  
  console.log('Simplified Data Structure:', JSON.stringify(requiredFields, null, 2))
  
  // Check for unwanted fields (should not exist)
  const unwantedFields = ['photos', 'mapSnapshot', 'appliances', 'addOns']
  unwantedFields.forEach(field => {
    if (data[field]) {
      console.warn(`⚠️ Unwanted field found: ${field}`, data[field])
    }
  })
}
```

### 7. Check sessionStorage (Final Submission)

After completing Step 9, check sessionStorage:

```javascript
const results = sessionStorage.getItem('calculatorResults')
if (results) {
  const parsed = JSON.parse(results)
  console.log('Final Submission Data:', JSON.stringify(parsed, null, 2))
  
  // Verify contact data is included
  console.log('Contact Data:', {
    fullName: parsed.fullName,
    phone: parsed.phone,
    email: parsed.email,
  })
}
```

## Automated Test Script

You can also create a test file to verify the data structure programmatically.

### Test Checklist

- [ ] Step 1 data saved: address, coordinates, email
- [ ] Step 2 data saved: roof fields
- [ ] Step 3 data saved: energy fields
- [ ] Step 4 data saved: battery, TOU, ULO with projections
- [ ] Step 8 data saved: production, costs, roofArea, environmental
- [ ] Step 9 data saved: contact fields
- [ ] No unwanted fields (photos File objects, mapSnapshot, etc.)
- [ ] TOU data includes: solar, batterySolarCapture, totalOffset, buyFromGrid, etc.
- [ ] ULO data includes: solar, batterySolarCapture, totalOffset, buyFromGrid, etc.
- [ ] 25-year projections included: profit25Year, paybackPeriod

## Common Issues

### Issue: Contact data not saved
**Solution**: Make sure `onComplete` is called with formData in StepContact component.

### Issue: TOU/ULO projections missing
**Solution**: Verify PeakShavingSalesCalculatorFRD calculates and includes projections in onComplete.

### Issue: Too many fields saved
**Solution**: Check that `extractSimplifiedData` is being used in `saveEstimatorProgress`.

## Debugging Commands

```javascript
// Clear all saved data
localStorage.removeItem('solarx_estimator_draft')
localStorage.removeItem('solarx_estimator_timestamp')
sessionStorage.removeItem('calculatorResults')

// View all localStorage keys
Object.keys(localStorage).filter(k => k.startsWith('solarx'))

// View data size (to check if simplified)
const saved = localStorage.getItem('solarx_estimator_draft')
console.log('Data size:', saved ? saved.length : 0, 'bytes')
```

