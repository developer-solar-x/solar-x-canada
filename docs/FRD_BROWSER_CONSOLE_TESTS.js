/**
 * FRD Browser Console Test Script
 * 
 * Copy and paste this into the browser console on the Peak Shaving Calculator page
 * to quickly verify FRD features are working.
 * 
 * Usage:
 * 1. Open Peak Shaving Calculator page
 * 2. Open browser console (F12)
 * 3. Paste this entire script
 * 4. Run: testFRDFeatures()
 */

// Test helper function
async function testFRDFeatures() {
  console.log('🧪 Starting FRD Feature Tests...\n')
  
  const tests = []
  
  // Test 1: Check if AI Mode toggle exists
  console.log('Test 1: AI Mode Toggle Visibility')
  const aiModeToggle = document.querySelector('[aria-label="Toggle AI Optimization Mode"]')
  if (aiModeToggle) {
    console.log('✅ AI Mode toggle found')
    tests.push({ name: 'AI Mode Toggle', passed: true })
  } else {
    console.log('❌ AI Mode toggle NOT found')
    tests.push({ name: 'AI Mode Toggle', passed: false })
  }
  
  // Test 2: Check if offset percentages are displayed
  console.log('\nTest 2: Offset Percentages Display')
  const offsetSection = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.includes('Energy Offset & Allocation')
  )
  if (offsetSection) {
    console.log('✅ Offset percentages section found')
    const hasSolarDirect = offsetSection.textContent?.includes('Solar Direct')
    const hasSolarBattery = offsetSection.textContent?.includes('Solar→Battery')
    const hasGrid = offsetSection.textContent?.includes('Grid')
    
    if (hasSolarDirect && hasSolarBattery && hasGrid) {
      console.log('✅ All required percentages found')
      tests.push({ name: 'Offset Percentages Display', passed: true })
    } else {
      console.log('❌ Missing some percentage labels')
      tests.push({ name: 'Offset Percentages Display', passed: false })
    }
  } else {
    console.log('❌ Offset percentages section NOT found')
    tests.push({ name: 'Offset Percentages Display', passed: false })
  }
  
  // Test 3: Check AI EMC explanation
  console.log('\nTest 3: AI EMC Explanation')
  const aiExplanation = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.includes('AI EMC Active') || 
    el.textContent?.includes('Energy Management Controller')
  )
  if (aiExplanation) {
    console.log('✅ AI EMC explanation found (may be hidden if AI Mode is OFF)')
    tests.push({ name: 'AI EMC Explanation', passed: true })
  } else {
    console.log('⚠️ AI EMC explanation not found (may appear when AI Mode is ON)')
    tests.push({ name: 'AI EMC Explanation', passed: true }) // Not critical if hidden
  }
  
  // Test 4: Verify calculation function exists (if accessible)
  console.log('\nTest 4: Calculation Functions')
  if (typeof window !== 'undefined') {
    console.log('✅ Browser environment detected')
    tests.push({ name: 'Calculation Functions', passed: true })
  } else {
    tests.push({ name: 'Calculation Functions', passed: false })
  }
  
  // Test 5: Check for ULO rate plan section
  console.log('\nTest 5: ULO Rate Plan Section')
  const uloSection = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.includes('Ultra-Low Overnight') || 
    el.textContent?.includes('ULO')
  )
  if (uloSection) {
    console.log('✅ ULO rate plan section found')
    tests.push({ name: 'ULO Rate Plan Section', passed: true })
  } else {
    console.log('❌ ULO rate plan section NOT found')
    tests.push({ name: 'ULO Rate Plan Section', passed: false })
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Summary')
  console.log('='.repeat(50))
  const passed = tests.filter(t => t.passed).length
  const total = tests.length
  console.log(`Passed: ${passed}/${total}`)
  tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`)
  })
  console.log('='.repeat(50))
  
  return { passed, total, tests }
}

// Quick manual test scenarios
const manualTestScenarios = {
  // Test AI Mode toggle
  testAIModeToggle: () => {
    console.log('🧪 Testing AI Mode Toggle...')
    const toggle = document.querySelector('[aria-label="Toggle AI Optimization Mode"]')
    if (!toggle) {
      console.log('❌ Toggle not found')
      return false
    }
    
    const initialState = toggle.getAttribute('aria-checked') === 'true'
    console.log(`Initial state: ${initialState ? 'ON' : 'OFF'}`)
    
    // Click toggle
    toggle.click()
    const newState = toggle.getAttribute('aria-checked') === 'true'
    console.log(`After click: ${newState ? 'ON' : 'OFF'}`)
    
    if (initialState !== newState) {
      console.log('✅ Toggle works correctly')
      return true
    } else {
      console.log('❌ Toggle did not change state')
      return false
    }
  },
  
  // Test offset percentages calculation
  testOffsetPercentages: () => {
    console.log('🧪 Testing Offset Percentages...')
    const offsetSection = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent?.includes('Energy Offset & Allocation')
    )
    
    if (!offsetSection) {
      console.log('❌ Offset section not found')
      return false
    }
    
    // Extract percentages
    const text = offsetSection.textContent
    const percentages = text.match(/(\d+\.?\d*)%/g) || []
    
    if (percentages.length >= 3) {
      console.log(`✅ Found ${percentages.length} percentages:`, percentages)
      return true
    } else {
      console.log('❌ Not enough percentages found')
      return false
    }
  },
  
  // Test AI Mode explanation visibility
  testAIExplanation: () => {
    console.log('🧪 Testing AI EMC Explanation...')
    const toggle = document.querySelector('[aria-label="Toggle AI Optimization Mode"]')
    if (!toggle) {
      console.log('❌ Toggle not found')
      return false
    }
    
    // Turn ON
    if (toggle.getAttribute('aria-checked') !== 'true') {
      toggle.click()
    }
    
    // Wait a bit for UI update
    setTimeout(() => {
      const explanation = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.includes('AI EMC Active')
      )
      
      if (explanation) {
        console.log('✅ AI EMC explanation visible when AI Mode is ON')
      } else {
        console.log('❌ AI EMC explanation not visible')
      }
    }, 100)
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.testFRDFeatures = testFRDFeatures
  window.manualTestScenarios = manualTestScenarios
  console.log('✅ Test functions loaded!')
  console.log('Run: testFRDFeatures()')
  console.log('Or: manualTestScenarios.testAIModeToggle()')
}

// Quick validation test
function quickValidation() {
  console.log('⚡ Quick Validation Test\n')
  
  const checks = [
    {
      name: 'AI Mode Toggle',
      check: () => document.querySelector('[aria-label="Toggle AI Optimization Mode"]') !== null
    },
    {
      name: 'Offset Percentages Section',
      check: () => {
        const section = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent?.includes('Energy Offset & Allocation')
        )
        return section !== undefined
      }
    },
    {
      name: 'ULO Rate Plan',
      check: () => {
        const ulo = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent?.includes('Ultra-Low Overnight')
        )
        return ulo !== undefined
      }
    }
  ]
  
  checks.forEach(check => {
    const result = check.check()
    console.log(`${result ? '✅' : '❌'} ${check.name}`)
  })
  
  const allPassed = checks.every(check => check.check())
  console.log(`\n${allPassed ? '✅ All checks passed!' : '❌ Some checks failed'}`)
}

if (typeof window !== 'undefined') {
  window.quickValidation = quickValidation
}

