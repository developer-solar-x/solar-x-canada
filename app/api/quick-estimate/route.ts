// Quick Estimate API - Simplified solar estimate calculation
// Returns system size, production, cost, and savings estimates

import { NextResponse } from 'next/server'
import { calculateSolarEstimate } from '@/lib/pvwatts'
import { calculateSystemSize, calculateCosts, calculateSavings } from '@/config/provinces'

// Shading factors
const SHADING_FACTORS: Record<string, number> = {
  none: 1.0,
  light: 0.9,
  moderate: 0.75,
  heavy: 0.5,
}

// Blended electricity rate (22.3 cents/kWh)
const BLENDED_RATE = 0.223

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      coordinates,
      roofAreaSqft,
      shadingLevel = 'none',
      roofAzimuth = 180,
      annualUsageKwh,
      monthlyBill,
      province = 'ON',
      programType = 'quick', // Default to 'quick' if not provided
      hasBattery = false,
    } = body

    // Validate required fields
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return NextResponse.json(
        { error: 'Valid coordinates are required' },
        { status: 400 }
      )
    }

    if (!roofAreaSqft || roofAreaSqft <= 0) {
      return NextResponse.json(
        { error: 'Valid roof area is required' },
        { status: 400 }
      )
    }

    // Calculate annual usage if only monthly bill provided
    const derivedAnnualUsageKwh = annualUsageKwh || (monthlyBill ? (monthlyBill / BLENDED_RATE) * 12 : 9000)

    // Calculate system size based on roof area and usage
    const systemCalc = calculateSystemSize(roofAreaSqft, shadingLevel)

    // Target ~80% offset for battery, 100% for simple grid-tied
    const targetAnnualProduction = derivedAnnualUsageKwh * 0.9 // Target 90% offset for quick estimate
    const usageBasedSystemSizeKw = Math.round((targetAnnualProduction / 1200) * 10) / 10

    // Use smaller of roof-based or usage-based system size
    let systemSizeKw = Math.min(systemCalc.systemSizeKw, usageBasedSystemSizeKw)

    // Minimum 3 kW system
    systemSizeKw = Math.max(3, systemSizeKw)

    // Round to nearest 0.5 kW
    systemSizeKw = Math.round(systemSizeKw * 2) / 2

    // Calculate number of panels (assuming 500W panels)
    const numPanels = Math.ceil((systemSizeKw * 1000) / 500)

    // Get solar production estimate from PVWatts or fallback
    let productionData
    try {
      productionData = await calculateSolarEstimate(
        coordinates.lat,
        coordinates.lng,
        systemSizeKw,
        'medium', // Default pitch
        province,
        roofAzimuth
      )
    } catch (error) {
      console.warn('PVWatts API failed, using fallback:', error)

      // Fallback production estimate
      const shadingFactor = SHADING_FACTORS[shadingLevel] || 1.0
      const baseProduction = systemSizeKw * 1200 // ~1200 kWh/kW in Canada
      const annualProductionKwh = Math.round(baseProduction * shadingFactor)

      const seasonalDistribution = [
        0.051, 0.067, 0.087, 0.099, 0.116, 0.122,
        0.127, 0.118, 0.103, 0.084, 0.057, 0.049
      ]

      productionData = {
        annualProductionKwh,
        monthlyProductionKwh: seasonalDistribution.map(pct => Math.round(annualProductionKwh * pct)),
        capacityFactor: 0.137,
      }
    }

    // Apply shading factor to production
    const shadingFactor = SHADING_FACTORS[shadingLevel] || 1.0
    const adjustedAnnualProduction = Math.round(productionData.annualProductionKwh * shadingFactor)
    const adjustedMonthlyProduction = productionData.monthlyProductionKwh.map(
      (kwh: number) => Math.round(kwh * shadingFactor)
    )

    // Calculate costs - use programType to determine if rebates apply
    // Net metering doesn't get rebates, HRS and quick estimates do
    const costs = calculateCosts(
      systemSizeKw, 
      province, 
      hasBattery ? 10 : 0, // Default battery size if hasBattery is true (will be refined later)
      programType as 'hrs_residential' | 'net_metering' | 'quick'
    )

    // Calculate savings
    const savings = calculateSavings(
      adjustedAnnualProduction,
      monthlyBill || (derivedAnnualUsageKwh / 12) * BLENDED_RATE,
      province,
      derivedAnnualUsageKwh
    )

    // Calculate payback period
    const paybackYears = Math.round((costs.netCost / savings.annualSavings) * 10) / 10

    // Calculate environmental impact
    const co2OffsetTons = Math.round(adjustedAnnualProduction * 0.00044 * 100) / 100

    // Build response
    const estimate = {
      systemSizeKw,
      numPanels,
      annualProductionKwh: adjustedAnnualProduction,
      monthlyProductionKwh: adjustedMonthlyProduction,
      estimatedCost: costs.totalCost,
      netCost: costs.netCost,
      annualSavings: savings.annualSavings,
      monthlySavings: savings.monthlySavings,
      paybackYears: Math.min(paybackYears, 25), // Cap at 25 years
      co2OffsetTons,
    }

    return NextResponse.json({
      success: true,
      data: estimate,
    })
  } catch (error) {
    console.error('Quick estimate API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to calculate estimate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
