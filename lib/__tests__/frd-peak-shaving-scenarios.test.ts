/**
 * FRD Peak Shaving Calculator - Scenario Output Tests
 * 
 * This test file runs key scenarios and outputs detailed results
 * so you can see exactly what values are calculated.
 */

import { calculateFRDPeakShaving } from '../simple-peak-shaving'
import { BATTERY_SPECS } from '../../config/battery-specs'
import { TOU_RATE_PLAN, ULO_RATE_PLAN } from '../../config/rate-plans'
import { DEFAULT_TOU_DISTRIBUTION, DEFAULT_ULO_DISTRIBUTION } from '../simple-peak-shaving'

// Helper to create a test battery
const getTestBattery = (usableKwh: number) => {
  return {
    id: 'test-battery',
    brand: 'Test',
    model: `${usableKwh}kWh`,
    nominalKwh: usableKwh / 0.9,
    usableKwh,
    price: usableKwh * 500,
    roundTripEfficiency: 0.9,
    maxPowerKw: usableKwh * 2,
  }
}

// Helper to format and display results
function displayScenarioResults(
  scenarioName: string,
  inputs: { usage: number; solar: number; battery: number; aiMode: boolean; plan: string },
  result: ReturnType<typeof calculateFRDPeakShaving>
) {
  console.log('\n' + '='.repeat(80))
  console.log(`📊 SCENARIO: ${scenarioName}`)
  console.log('='.repeat(80))
  
  console.log('\n📥 INPUTS:')
  console.log(`   Annual Usage:        ${inputs.usage.toLocaleString()} kWh`)
  console.log(`   Solar Production:    ${inputs.solar.toLocaleString()} kWh`)
  console.log(`   Battery Size:        ${inputs.battery} kWh usable`)
  console.log(`   Rate Plan:           ${inputs.plan}`)
  console.log(`   AI Mode:             ${inputs.aiMode ? 'ON' : 'OFF'}`)
  
  console.log('\n📤 STEP A: Day/Night Split')
  console.log(`   Day Load:            ${result.dayLoad.toLocaleString()} kWh (${(result.dayLoad / inputs.usage * 100).toFixed(1)}%)`)
  console.log(`   Night Load:          ${result.nightLoad.toLocaleString()} kWh (${(result.nightLoad / inputs.usage * 100).toFixed(1)}%)`)
  
  console.log('\n📤 STEP B: Solar Allocation')
  console.log(`   Solar to Day:        ${result.solarToDay.toLocaleString()} kWh`)
  console.log(`   Solar Excess:        ${result.solarExcess.toLocaleString()} kWh`)
  console.log(`   Day Grid After Solar: ${result.dayGridAfterSolar.toLocaleString()} kWh`)
  
  console.log('\n📤 STEP C: Battery Charging')
  const maxBattKWh = inputs.battery * 365
  console.log(`   Max Battery Capacity: ${maxBattKWh.toLocaleString()} kWh/year (${inputs.battery} kWh × 365 cycles)`)
  console.log(`   Solar → Battery:     ${result.battSolarCharged.toLocaleString()} kWh`)
  console.log(`   Grid → Battery:      ${result.battGridCharged.toLocaleString()} kWh`)
  console.log(`   Total Battery:       ${result.battTotal.toLocaleString()} kWh`)
  console.log(`   Effective Cycles:    ${result.effectiveCycles.toFixed(1)} cycles/year`)
  
  console.log('\n📤 STEP D: Battery Discharge Allocation')
  console.log(`   On-Peak Discharge:   ${result.batteryDischargeByBucket.onPeak.toLocaleString()} kWh`)
  console.log(`   Mid-Peak Discharge:  ${result.batteryDischargeByBucket.midPeak.toLocaleString()} kWh`)
  console.log(`   Off-Peak Discharge:  ${result.batteryDischargeByBucket.offPeak.toLocaleString()} kWh`)
  if (result.batteryDischargeByBucket.ultraLow) {
    console.log(`   ULO Discharge:       ${result.batteryDischargeByBucket.ultraLow.toLocaleString()} kWh`)
  }
  
  console.log('\n📤 STEP E: Edge Case Handling')
  console.log(`   Edge Case:           ${result.edgeCase === 'none' ? 'None' : result.edgeCase === 'high_usage' ? 'High Usage (U >> S + Battery)' : 'High Capacity (S + Battery >> U)'}`)
  if (result.edgeCase !== 'none') {
    console.log(`   Effective Battery:   ${result.battTotalEffective.toLocaleString()} kWh`)
    console.log(`   Solar Unused:        ${result.solarUnused.toLocaleString()} kWh`)
  }
  
  console.log('\n📤 STEP F: Final Results')
  const totalGridKWh = 
    (result.gridKWhByBucket.ultraLow || 0) +
    result.gridKWhByBucket.offPeak +
    result.gridKWhByBucket.midPeak +
    result.gridKWhByBucket.onPeak
  console.log(`   Grid kWh Remaining:  ${totalGridKWh.toLocaleString()} kWh`)
  console.log(`   Annual Cost After:   $${result.annualCostAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  console.log(`   Annual Savings:      $${result.annualSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  console.log(`   Monthly Savings:     $${result.monthlySavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  
  console.log('\n📊 OFFSET & ALLOCATION PERCENTAGES:')
  console.log(`   Powered by Solar:              ${result.offsetPercentages.solarDirect.toFixed(1)}%`)
  console.log(`   Powered by Solar→Battery:      ${result.offsetPercentages.solarChargedBattery.toFixed(1)}%`)
  if (inputs.aiMode && inputs.plan === 'ULO') {
    console.log(`   Powered by ULO→Battery (AI):   ${result.offsetPercentages.uloChargedBattery.toFixed(1)}%`)
  }
  console.log(`   Remaining from Grid:           ${result.offsetPercentages.gridRemaining.toFixed(1)}%`)
  
  const totalPercent = 
    result.offsetPercentages.solarDirect +
    result.offsetPercentages.solarChargedBattery +
    result.offsetPercentages.uloChargedBattery +
    result.offsetPercentages.gridRemaining
  console.log(`   Total:                         ${totalPercent.toFixed(1)}%`)
  
  console.log('\n' + '='.repeat(80) + '\n')
}

describe('FRD Peak Shaving - Scenario Outputs', () => {
  // Suppress console.log in Jest by default, but we want to see these outputs
  const originalLog = console.log
  beforeAll(() => {
    // Keep console.log for our display functions
  })
  
  afterAll(() => {
    console.log = originalLog
  })

  test('Scenario 1: Typical Residential (AI Mode OFF)', () => {
    const usage = 14000
    const solar = 8000
    const battery = getTestBattery(16)
    
    const result = calculateFRDPeakShaving(
      usage,
      solar,
      battery,
      TOU_RATE_PLAN,
      DEFAULT_TOU_DISTRIBUTION,
      false, // AI Mode OFF
      { p_day: 0.5, p_night: 0.5 }
    )
    
    displayScenarioResults(
      'Typical Residential - TOU Plan, AI Mode OFF',
      { usage, solar, battery: battery.usableKwh, aiMode: false, plan: 'TOU' },
      result
    )
    
    // Basic assertions
    expect(result.annualSavings).toBeGreaterThan(0)
    expect(result.offsetPercentages.solarDirect).toBeGreaterThan(0)
  })

  test('Scenario 2: Typical Residential (AI Mode ON)', () => {
    const usage = 14000
    const solar = 8000
    const battery = getTestBattery(16)
    
    const result = calculateFRDPeakShaving(
      usage,
      solar,
      battery,
      ULO_RATE_PLAN,
      DEFAULT_ULO_DISTRIBUTION,
      true, // AI Mode ON
      { p_day: 0.5, p_night: 0.5 }
    )
    
    displayScenarioResults(
      'Typical Residential - ULO Plan, AI Mode ON',
      { usage, solar, battery: battery.usableKwh, aiMode: true, plan: 'ULO' },
      result
    )
    
    // Basic assertions
    expect(result.annualSavings).toBeGreaterThan(0)
    expect(result.offsetPercentages.uloChargedBattery).toBeGreaterThanOrEqual(0)
  })

  test('Scenario 3: High Usage Edge Case', () => {
    const usage = 30000
    const solar = 8000
    const battery = getTestBattery(16)
    
    const result = calculateFRDPeakShaving(
      usage,
      solar,
      battery,
      TOU_RATE_PLAN,
      DEFAULT_TOU_DISTRIBUTION,
      false,
      { p_day: 0.5, p_night: 0.5 }
    )
    
    displayScenarioResults(
      'High Usage Edge Case - U >> S + Battery',
      { usage, solar, battery: battery.usableKwh, aiMode: false, plan: 'TOU' },
      result
    )
    
    expect(result.edgeCase).toBe('high_usage')
  })

  test('Scenario 4: High Solar/Capacity Edge Case', () => {
    const usage = 10000
    const solar = 15000
    const battery = getTestBattery(32)
    
    const result = calculateFRDPeakShaving(
      usage,
      solar,
      battery,
      TOU_RATE_PLAN,
      DEFAULT_TOU_DISTRIBUTION,
      false,
      { p_day: 0.5, p_night: 0.5 }
    )
    
    displayScenarioResults(
      'High Capacity Edge Case - S + Battery >> U',
      { usage, solar, battery: battery.usableKwh, aiMode: false, plan: 'TOU' },
      result
    )
    
    expect(result.edgeCase).toBe('high_capacity')
  })

  test('Scenario 5: Low Solar with AI Mode', () => {
    const usage = 10000
    const solar = 3000
    const battery = getTestBattery(16)
    
    const resultOff = calculateFRDPeakShaving(
      usage,
      solar,
      battery,
      ULO_RATE_PLAN,
      DEFAULT_ULO_DISTRIBUTION,
      false, // AI Mode OFF
      { p_day: 0.5, p_night: 0.5 }
    )
    
    const resultOn = calculateFRDPeakShaving(
      usage,
      solar,
      battery,
      ULO_RATE_PLAN,
      DEFAULT_ULO_DISTRIBUTION,
      true, // AI Mode ON
      { p_day: 0.5, p_night: 0.5 }
    )
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 SCENARIO: Low Solar - AI Mode Comparison')
    console.log('='.repeat(80))
    console.log('\n📥 INPUTS:')
    console.log(`   Annual Usage:        ${usage.toLocaleString()} kWh`)
    console.log(`   Solar Production:    ${solar.toLocaleString()} kWh`)
    console.log(`   Battery Size:        ${battery.usableKwh} kWh usable`)
    console.log(`   Rate Plan:           ULO`)
    
    console.log('\n📊 COMPARISON:')
    console.log('\n   AI Mode OFF:')
    console.log(`     Battery Total:     ${resultOff.battTotal.toLocaleString()} kWh`)
    console.log(`     Grid Charged:      ${resultOff.battGridCharged.toLocaleString()} kWh`)
    console.log(`     Annual Savings:    $${resultOff.annualSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`     ULO→Battery %:     ${resultOff.offsetPercentages.uloChargedBattery.toFixed(1)}%`)
    
    console.log('\n   AI Mode ON:')
    console.log(`     Battery Total:     ${resultOn.battTotal.toLocaleString()} kWh`)
    console.log(`     Grid Charged:      ${resultOn.battGridCharged.toLocaleString()} kWh`)
    console.log(`     Annual Savings:    $${resultOn.annualSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`     ULO→Battery %:     ${resultOn.offsetPercentages.uloChargedBattery.toFixed(1)}%`)
    
    console.log('\n   DIFFERENCE:')
    console.log(`     Extra Battery:     ${(resultOn.battTotal - resultOff.battTotal).toLocaleString()} kWh`)
    console.log(`     Extra Savings:     $${(resultOn.annualSavings - resultOff.annualSavings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log('\n' + '='.repeat(80) + '\n')
    
    expect(resultOn.battTotal).toBeGreaterThanOrEqual(resultOff.battTotal)
    expect(resultOn.annualSavings).toBeGreaterThanOrEqual(resultOff.annualSavings)
  })

  test('Scenario 6: Real Battery Specs - Renon 16', () => {
    const renon16 = BATTERY_SPECS.find(b => b.id === 'renon-16')
    if (!renon16) {
      throw new Error('Renon 16 battery not found')
    }
    
    const usage = 14000
    const solar = 8000
    
    const result = calculateFRDPeakShaving(
      usage,
      solar,
      renon16,
      ULO_RATE_PLAN,
      DEFAULT_ULO_DISTRIBUTION,
      true, // AI Mode ON
      { p_day: 0.5, p_night: 0.5 }
    )
    
    displayScenarioResults(
      'Real Battery - Renon 16 kWh, ULO Plan, AI Mode ON',
      { usage, solar, battery: renon16.usableKwh, aiMode: true, plan: 'ULO' },
      result
    )
    
    expect(result.annualSavings).toBeGreaterThan(0)
  })

  test('Scenario 7: Large System - High Solar Production', () => {
    const usage = 20000
    const solar = 18000
    const battery = getTestBattery(32)
    
    const result = calculateFRDPeakShaving(
      usage,
      solar,
      battery,
      ULO_RATE_PLAN,
      DEFAULT_ULO_DISTRIBUTION,
      true, // AI Mode ON
      { p_day: 0.5, p_night: 0.5 }
    )
    
    displayScenarioResults(
      'Large System - High Solar Production',
      { usage, solar, battery: battery.usableKwh, aiMode: true, plan: 'ULO' },
      result
    )
    
    expect(result.solarToDay).toBeLessThanOrEqual(result.dayLoad)
  })

  test('Scenario 8: Small System - Minimal Solar', () => {
    const usage = 12000
    const solar = 2000
    const battery = getTestBattery(10)
    
    const result = calculateFRDPeakShaving(
      usage,
      solar,
      battery,
      TOU_RATE_PLAN,
      DEFAULT_TOU_DISTRIBUTION,
      false,
      { p_day: 0.5, p_night: 0.5 }
    )
    
    displayScenarioResults(
      'Small System - Minimal Solar',
      { usage, solar, battery: battery.usableKwh, aiMode: false, plan: 'TOU' },
      result
    )
    
    expect(result.solarExcess).toBe(0) // No excess with minimal solar
  })
})

