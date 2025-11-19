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
      roofAzimuth = 180, // Default to south-facing if not provided
      roofAreaSqft,
      overrideSystemSizeKw
    } = body

    // Validate required fields (polygon optional for Easy mode)
    if (!coordinates) {
      return NextResponse.json(
        { error: 'Missing required field: coordinates' },
        { status: 400 }
      )
    }

    // Calculate area if polygon provided; otherwise leave 0 (easy mode may not send polygon)
    let areaSquareMeters = 0
    let areaSquareFeet = 0
    if (roofPolygon) {
      // Handle both single polygon and FeatureCollection (multiple polygons)
      if (roofPolygon.type === 'FeatureCollection' && roofPolygon.features) {
        roofPolygon.features.forEach((feature: any) => {
          if (feature.geometry.type === 'Polygon') {
            areaSquareMeters += turf.area(feature)
          }
        })
      } else {
        const polygonCoordinates = roofPolygon.geometry?.coordinates || roofPolygon.coordinates
        if (polygonCoordinates) {
          const polygon = turf.polygon(polygonCoordinates)
          areaSquareMeters = turf.area(polygon)
        }
      }
      areaSquareFeet = areaSquareMeters * 10.764
    }

    // Calculate recommended system size
    let systemSizeKw = 0
    let numPanels = 0
    let usableAreaSqFt = 0
    
    // Calculate usage-based system size recommendation
    const derivedAnnual = energyUsage?.annualKwh || annualUsageKwh || (monthlyBill ? (monthlyBill / 0.223) * 12 : 9000)
    // Target production equals ~100% of annual usage (for zero-export/self-consumption)
    // This ensures the system covers most of the usage without excessive overproduction
    const targetAnnualProduction = Math.max(0, derivedAnnual * 1.0)
    const usageBasedSystemSizeKw = Math.round((targetAnnualProduction / 1200) * 10) / 10
    
    if (areaSquareFeet > 0) {
      const systemCalc = calculateSystemSize(areaSquareFeet, shadingLevel || 'minimal')
      const roofBasedSystemSizeKw = systemCalc.systemSizeKw
      const roofBasedNumPanels = systemCalc.numPanels
      usableAreaSqFt = systemCalc.usableAreaSqFt
      
      // Use the smaller of roof-based or usage-based sizing to avoid oversizing
      // But allow up to 20% larger than usage-based to account for seasonal variations
      const maxRecommendedSize = usageBasedSystemSizeKw * 1.2
      
      if (roofBasedSystemSizeKw <= maxRecommendedSize) {
        // Roof can fit a reasonable system size
        systemSizeKw = roofBasedSystemSizeKw
        numPanels = roofBasedNumPanels
      } else {
        // Roof is too large - cap to usage-based recommendation
        systemSizeKw = Math.round(maxRecommendedSize * 10) / 10
        numPanels = Math.round((systemSizeKw * 1000) / 500)
      }
    } else {
      // Fallback sizing without polygon: size based on usage
      systemSizeKw = usageBasedSystemSizeKw
      numPanels = Math.round((systemSizeKw * 1000) / 500)
    }

    // Apply explicit override from client when provided (e.g., user adjusted panels)
    if (overrideSystemSizeKw && overrideSystemSizeKw > 0) {
      systemSizeKw = overrideSystemSizeKw
      numPanels = Math.round((systemSizeKw * 1000) / 500)
    }

    // Get solar production data. Use PVWatts only when polygon exists; otherwise use seasonal estimate.
    let productionData
    if (roofPolygon) {
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
        console.warn('PVWatts API failed, using estimation:', error)
      }
    }
    if (!productionData) {
      const seasonalDistribution = [
        0.051, 0.067, 0.087, 0.099, 0.116, 0.122,
        0.127, 0.118, 0.103, 0.084, 0.057, 0.049
      ]
      const annualProduction = systemSizeKw * 1200
      const monthlyProductionKwh = seasonalDistribution.map(pct => annualProduction * pct)
      productionData = {
        annualProductionKwh: annualProduction,
        monthlyProductionKwh,
        capacityFactor: 0.137,
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
        usableSquareFeet: Math.round(usableAreaSqFt),
      },

      // System specifications
      system: {
        sizeKw: systemSizeKw,
        numPanels: numPanels,
        panelWattage: 500, // TS-BGT54(500)-G11, N-type bifacial
        panelEfficiency: 22.5, // %
        panelType: 'N-type monocrystalline bifacial',
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

