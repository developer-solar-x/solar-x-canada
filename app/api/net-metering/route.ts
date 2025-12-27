// Net Metering Calculation API
// Calculates net metering credits based on solar production and usage

import { NextResponse } from 'next/server'
import { calculateNetMetering, calculateNetMeteringTiered } from '@/lib/net-metering'
import { calculateAlbertaSolarClub } from '@/lib/alberta-solar-club'
import { RATE_PLANS, TOU_RATE_PLAN, ULO_RATE_PLAN } from '@/config/rate-plans'
import type { RatePlan } from '@/config/rate-plans'
import { UsageDataPoint, generateAnnualUsagePattern } from '@/lib/usage-parser'
import type { UsageDistribution } from '@/lib/simple-peak-shaving'
import type { BatterySpec } from '@/config/battery-specs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const {
      // Production data
      monthlySolarProduction, // Array of 12 monthly values (Jan-Dec) in kWh
      annualSolarProduction, // Optional: total annual production
      
      // Usage data
      annualUsageKwh,
      monthlyUsageKwh, // Optional: array of 12 monthly values
      usageData, // Optional: hourly usage data (UsageDataPoint[])
      usageDistribution, // Optional: custom usage distribution percentages
      
      // Rate plan
      ratePlanId, // 'tou', 'ulo', or 'tiered'
      ratePlan, // Optional: full RatePlan object
      
      // Battery and AI Mode
      battery, // Optional: BatterySpec object
      aiMode = false, // AI Optimization Mode (default OFF)
      
      // Province (for Alberta Solar Club)
      province, // Optional: province code (e.g., 'AB', 'ON')
      
      // Year for calculations
      year = new Date().getFullYear(),
    } = body

    // Validate required fields
    if (!monthlySolarProduction && !annualSolarProduction) {
      return NextResponse.json(
        { error: 'Missing required field: monthlySolarProduction or annualSolarProduction' },
        { status: 400 }
      )
    }

    if (!annualUsageKwh && !usageData) {
      return NextResponse.json(
        { error: 'Missing required field: annualUsageKwh or usageData' },
        { status: 400 }
      )
    }

    // Normalize monthly production data
    let monthlyProduction: number[]
    if (monthlySolarProduction && Array.isArray(monthlySolarProduction) && monthlySolarProduction.length === 12) {
      monthlyProduction = monthlySolarProduction
    } else if (annualSolarProduction) {
      // Distribute annual production evenly across months (will be adjusted by derate factors)
      // Approximate distribution for Ontario (summer heavier)
      const monthlyDistribution = [
        0.035, 0.050, 0.070, 0.100, 0.100, 0.100, // Jan-Jun
        0.100, 0.100, 0.080, 0.060, 0.045, 0.025  // Jul-Dec
      ]
      monthlyProduction = monthlyDistribution.map(percent => annualSolarProduction * percent)
    } else {
      return NextResponse.json(
        { error: 'Invalid monthlySolarProduction format. Expected array of 12 values.' },
        { status: 400 }
      )
    }

    // Normalize usage data (needed for both Alberta and regular calculations)
    let hourlyUsageData: UsageDataPoint[] | undefined
    if (usageData && Array.isArray(usageData) && usageData.length > 0) {
      hourlyUsageData = usageData as UsageDataPoint[]
    } else if (annualUsageKwh) {
      // Will be generated in calculateNetMetering or calculateAlbertaSolarClub
      hourlyUsageData = undefined
    }

    // Check if Alberta - use Solar Club calculation
    const isAlberta = province && (
      province.toUpperCase() === 'AB' || 
      province.toUpperCase() === 'ALBERTA' ||
      province.toUpperCase().includes('ALBERTA') ||
      province.toUpperCase().includes('AB')
    )
    
    if (isAlberta) {
      // Use Alberta Solar Club calculation
      const snowLossFactor = body.snowLossFactor !== undefined ? Number(body.snowLossFactor) : 0.03 // Default 3% for Alberta
      const result = calculateAlbertaSolarClub(
        monthlyProduction,
        annualUsageKwh,
        hourlyUsageData,
        year,
        usageDistribution as UsageDistribution | undefined,
        battery as BatterySpec | null | undefined,
        aiMode === true,
        snowLossFactor
      )
      
      return NextResponse.json({
        success: true,
        data: result,
        ratePlan: {
          id: 'alberta_solar_club',
          name: 'Alberta Solar Club'
        }
      })
    }

    // Determine rate plan
    let selectedRatePlan: RatePlan | null = null
    
    if (ratePlan && typeof ratePlan === 'object') {
      // Use provided rate plan object
      selectedRatePlan = ratePlan as RatePlan
    } else if (ratePlanId === 'tiered' || ratePlanId === 'tiered_rate') {
      // Tiered rate plan - handled separately using OEB residential tiered rates
      const result = calculateNetMeteringTiered(
        monthlyProduction,
        annualUsageKwh,
        10.3, // Tier 1 rate (cents/kWh)
        12.5, // Tier 2 rate (cents/kWh)
        600, // Tier 1 threshold (kWh/month)
        year
      )
      
      return NextResponse.json({
        success: true,
        data: result
      })
    } else {
      // Find rate plan by ID
      selectedRatePlan = RATE_PLANS.find(p => p.id === ratePlanId) || null
      
      // Default to TOU if not specified
      if (!selectedRatePlan) {
        selectedRatePlan = TOU_RATE_PLAN
      }
    }

    // Calculate net metering
    const result = calculateNetMetering(
      monthlyProduction,
      annualUsageKwh,
      selectedRatePlan,
      hourlyUsageData,
      year,
      usageDistribution as UsageDistribution | undefined,
      battery as BatterySpec | null | undefined,
      aiMode === true
    )

    return NextResponse.json({
      success: true,
      data: result,
      ratePlan: {
        id: selectedRatePlan.id,
        name: selectedRatePlan.name
      }
    })

  } catch (error) {
    console.error('Net metering calculation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to calculate net metering',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}



