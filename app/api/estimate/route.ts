// Full solar estimate API with PVWatts integration

import { NextResponse } from 'next/server'
import { calculateSystemSize, calculateCosts, calculateSavings } from '@/config/provinces'
import { calculateSolarEstimate } from '@/lib/pvwatts'
import * as turf from '@turf/turf'

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const {
      coordinates,
      roofPolygon,
      roofType,
      roofAge,
      roofPitch,
      shadingLevel,
      monthlyBill,
      annualUsageKwh,
      appliances,
      energyUsage,
      province = 'ON',
      roofAzimuth = 180 // Default to south-facing if not provided
    } = body

    // Validate required fields
    if (!coordinates || !roofPolygon) {
      return NextResponse.json(
        { error: 'Missing required fields: coordinates and roofPolygon' },
        { status: 400 }
      )
    }

    // Calculate roof area using Turf.js
    // Mapbox Draw returns a GeoJSON Feature, we need the geometry.coordinates
    const polygonCoordinates = roofPolygon.geometry?.coordinates || roofPolygon.coordinates
    
    if (!polygonCoordinates) {
      return NextResponse.json(
        { error: 'Invalid roof polygon data' },
        { status: 400 }
      )
    }

    const polygon = turf.polygon(polygonCoordinates)
    const areaSquareMeters = turf.area(polygon)
    const areaSquareFeet = areaSquareMeters * 10.764

    // Calculate recommended system size
    const systemCalc = calculateSystemSize(areaSquareFeet, shadingLevel || 'minimal')
    const systemSizeKw = systemCalc.systemSizeKw
    const numPanels = systemCalc.numPanels

    // Get solar production data from PVWatts
    let productionData
    try {
      productionData = await calculateSolarEstimate(
        coordinates.lat,
        coordinates.lng,
        systemSizeKw,
        roofPitch || 'medium',
        province,
        roofAzimuth // Use actual roof orientation
      )
    } catch (error) {
      // Fallback to estimation if PVWatts fails
      console.warn('PVWatts API failed, using estimation:', error)
      
      // Realistic seasonal distribution for Canada (percentages of annual production)
      // Based on typical solar patterns accounting for snow, sun angle, and day length
      // Summer months (Jun-Aug) produce more, winter months (Nov-Feb) produce less
      const seasonalDistribution = [
        0.051, // Jan - 5.1% (lowest - short days, low sun angle, snow)
        0.067, // Feb - 6.7% (increasing daylight)
        0.087, // Mar - 8.7% (spring equinox, snow melting)
        0.099, // Apr - 9.9% (longer days, better sun angle)
        0.116, // May - 11.6% (near-peak conditions)
        0.122, // Jun - 12.2% (peak - summer solstice, longest days)
        0.127, // Jul - 12.7% (highest - best sun angle + long days)
        0.118, // Aug - 11.8% (still excellent)
        0.103, // Sep - 10.3% (fall equinox, declining)
        0.084, // Oct - 8.4% (shorter days)
        0.057, // Nov - 5.7% (approaching winter)
        0.049  // Dec - 4.9% (lowest - winter solstice, shortest days)
      ] // Total = 100%
      
      // Ontario average: 1,200 kWh/kW/year with modern systems
      const annualProduction = systemSizeKw * 1200
      const monthlyProductionKwh = seasonalDistribution.map(pct => annualProduction * pct)
      
      productionData = {
        annualProductionKwh: annualProduction,
        monthlyProductionKwh: monthlyProductionKwh,
        capacityFactor: 0.137, // Updated to match PVWatts typical values
        solarRadiation: 1250,
        pvWattsData: null
      }
    }

    // Calculate costs
    const costs = calculateCosts(systemSizeKw, province)

    // Calculate savings - prioritize calculated energy usage from appliances
    const actualAnnualUsageKwh = energyUsage?.annualKwh || annualUsageKwh || (monthlyBill ? (monthlyBill / 0.13) * 12 : null)
    
    const savings = calculateSavings(
      productionData.annualProductionKwh,
      monthlyBill || 150,
      province,
      actualAnnualUsageKwh
    )

    // Calculate payback period
    const paybackYears = costs.netCost / savings.annualSavings

    // Calculate environmental impact
    const co2OffsetTons = productionData.annualProductionKwh * 0.00044 // Metric tons CO2
    const treesEquivalent = Math.round(co2OffsetTons * 24) // Trees planted per ton
    const carsOffRoad = co2OffsetTons / 4.6 // Average car emissions per year

    // Build response
    const estimate = {
      // Roof details
      roofArea: {
        squareFeet: Math.round(areaSquareFeet),
        squareMeters: Math.round(areaSquareMeters),
        usableSquareFeet: systemCalc.usableAreaSqFt,
      },

      // System specifications
      system: {
        sizeKw: systemSizeKw,
        numPanels: numPanels,
        panelWattage: 300,
        roofType: roofType || 'asphalt_shingle',
        roofPitch: roofPitch || 'medium',
        shadingLevel: shadingLevel || 'minimal',
      },

      // Production estimates
      production: {
        annualKwh: Math.round(productionData.annualProductionKwh),
        monthlyKwh: productionData.monthlyProductionKwh.map(v => Math.round(v)),
        dailyAverageKwh: Math.round(productionData.annualProductionKwh / 365),
        capacityFactor: productionData.capacityFactor,
      },

      // Cost breakdown
      costs: {
        systemCost: costs.systemCost,
        installationCost: costs.installationCost,
        subtotal: costs.subtotal,
        tax: costs.hst,
        totalCost: costs.totalCost,
        incentives: costs.incentivesApplied,
        netCost: costs.netCost,
      },

      // Savings projections
      savings: {
        annualSavings: savings.annualSavings,
        monthlySavings: savings.monthlySavings,
        twentyFiveYearSavings: savings.twentyFiveYearSavings,
        paybackYears: Math.round(paybackYears * 10) / 10,
        roi: Math.round((savings.twentyFiveYearSavings / costs.netCost) * 100),
      },

      // Environmental impact
      environmental: {
        co2OffsetTonsPerYear: Math.round(co2OffsetTons * 100) / 100,
        treesEquivalent: treesEquivalent,
        carsOffRoadEquivalent: Math.round(carsOffRoad * 10) / 10,
        waterSavedLiters: Math.round(productionData.annualProductionKwh * 0.24),
      },

      // Raw data for storage
      rawData: {
        coordinates,
        roofPolygon,
        pvWattsData: productionData.pvWattsData,
      }
    }

    return NextResponse.json({
      success: true,
      data: estimate
    })

  } catch (error) {
    console.error('Estimate API error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate estimate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

