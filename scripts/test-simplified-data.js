// Test script to verify simplified data structure
// Run in browser console after going through estimator

function testSimplifiedData() {
  console.log('🧪 Testing Simplified Estimator Data Structure\n')
  
  // Check localStorage
  const saved = localStorage.getItem('solarx_estimator_draft')
  if (!saved) {
    console.error('❌ No saved data found in localStorage')
    return
  }
  
  const parsed = JSON.parse(saved)
  const data = parsed.data
  
  console.log(`✅ Data found - Step: ${parsed.currentStep}, Version: ${parsed.version || '1.0'}\n`)
  
  // Test Step 1: Location
  console.log('📍 Step 1: Location')
  const step1Fields = ['address', 'coordinates', 'email']
  step1Fields.forEach(field => {
    if (data[field]) {
      console.log(`  ✅ ${field}:`, field === 'coordinates' ? JSON.stringify(data[field]) : data[field])
    } else {
      console.log(`  ⚠️  ${field}: missing`)
    }
  })
  
  // Test Step 2: Roof
  console.log('\n🏠 Step 2: Roof')
  const step2Fields = ['roofAreaSqft', 'roofType', 'roofAge', 'roofPitch', 'shadingLevel']
  step2Fields.forEach(field => {
    if (data[field] !== undefined) {
      console.log(`  ✅ ${field}:`, data[field])
    }
  })
  
  // Test Step 3: Energy
  console.log('\n⚡ Step 3: Energy')
  const step3Fields = ['monthlyBill', 'annualUsageKwh', 'energyUsage', 'annualEscalator']
  step3Fields.forEach(field => {
    if (data[field] !== undefined) {
      console.log(`  ✅ ${field}:`, typeof data[field] === 'object' ? JSON.stringify(data[field]) : data[field])
    }
  })
  
  // Test Step 4: Battery Savings
  console.log('\n🔋 Step 4: Battery Savings')
  if (data.selectedBattery) {
    console.log(`  ✅ selectedBattery: ${data.selectedBattery}`)
  }
  if (data.systemSizeKw) {
    console.log(`  ✅ systemSizeKw: ${data.systemSizeKw}`)
  }
  if (data.numPanels) {
    console.log(`  ✅ numPanels: ${data.numPanels}`)
  }
  
  // Test TOU data
  if (data.tou) {
    console.log('  ✅ TOU data:')
    const touFields = ['solar', 'batterySolarCapture', 'totalOffset', 'buyFromGrid', 
                       'annualSavings', 'monthlySavings', 'profit25Year', 'paybackPeriod']
    touFields.forEach(field => {
      if (data.tou[field] !== undefined) {
        console.log(`    - ${field}: ${data.tou[field]}`)
      }
    })
  } else {
    console.log('  ⚠️  TOU data: missing')
  }
  
  // Test ULO data
  if (data.ulo) {
    console.log('  ✅ ULO data:')
    const uloFields = ['solar', 'batterySolarCapture', 'totalOffset', 'buyFromGrid',
                       'annualSavings', 'monthlySavings', 'profit25Year', 'paybackPeriod']
    uloFields.forEach(field => {
      if (data.ulo[field] !== undefined) {
        console.log(`    - ${field}: ${data.ulo[field]}`)
      }
    })
  } else {
    console.log('  ⚠️  ULO data: missing')
  }
  
  // Test Step 8: Review
  console.log('\n📊 Step 8: Review')
  if (data.production) {
    console.log('  ✅ production:', {
      annualKwh: data.production.annualKwh,
      monthlyKwh: data.production.monthlyKwh?.length || 0,
    })
  }
  if (data.costs) {
    console.log('  ✅ costs:', {
      totalCost: data.costs.totalCost,
      netCost: data.costs.netCost,
      totalCostWithoutTax: data.costs.totalCostWithoutTax,
      totalCostWithoutTaxAndIncentives: data.costs.totalCostWithoutTaxAndIncentives,
    })
  }
  if (data.roofArea) {
    console.log('  ✅ roofArea:', data.roofArea)
  }
  if (data.environmental) {
    console.log('  ✅ environmental:', data.environmental)
  }
  
  // Test Step 9: Contact
  console.log('\n📞 Step 9: Contact')
  const step9Fields = ['fullName', 'phone', 'preferredContactTime', 'preferredContactMethod', 'comments']
  step9Fields.forEach(field => {
    if (data[field]) {
      console.log(`  ✅ ${field}:`, data[field])
    }
  })
  
  // Check for unwanted fields
  console.log('\n🚫 Checking for unwanted fields:')
  const unwantedFields = ['photos', 'mapSnapshot', 'appliances', 'addOns']
  let hasUnwanted = false
  unwantedFields.forEach(field => {
    if (data[field] !== undefined) {
      console.log(`  ⚠️  ${field}: found (should be excluded)`)
      hasUnwanted = true
    }
  })
  if (!hasUnwanted) {
    console.log('  ✅ No unwanted fields found')
  }
  
  // Data size check
  console.log('\n📏 Data Size:')
  const dataSize = JSON.stringify(data).length
  console.log(`  Size: ${dataSize} bytes (${(dataSize / 1024).toFixed(2)} KB)`)
  
  // Check sessionStorage (final submission)
  console.log('\n💾 Final Submission (sessionStorage):')
  const results = sessionStorage.getItem('calculatorResults')
  if (results) {
    const parsedResults = JSON.parse(results)
    console.log('  ✅ Results saved to sessionStorage')
    if (parsedResults.fullName) {
      console.log(`  ✅ Contact data included: ${parsedResults.fullName}`)
    }
  } else {
    console.log('  ⚠️  No results in sessionStorage (form not submitted yet)')
  }
  
  console.log('\n✨ Test complete!')
}

// Run the test
testSimplifiedData()

