'use client'

// Tracking page - allows users to view their estimate results using a tracking ID
// This uses the same structure as the results page but with the tracking ID from the URL

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ResultsPage } from '@/components/ResultsPage'
import { useEffect, useState, Suspense } from 'react'

function TrackPageContent() {
  const params = useParams()
  const trackingId = params?.id as string
  const [estimate, setEstimate] = useState<any>(null)
  const [leadData, setLeadData] = useState<any>(null)
  const [batteryImpact, setBatteryImpact] = useState<any>(undefined)
  const [peakShaving, setPeakShaving] = useState<any>(undefined)
  const [solarRebate, setSolarRebate] = useState<number | undefined>(undefined)
  const [batteryRebate, setBatteryRebate] = useState<number | undefined>(undefined)
  const [combinedTotalCost, setCombinedTotalCost] = useState<number | undefined>(undefined)
  const [combinedNetCost, setCombinedNetCost] = useState<number | undefined>(undefined)
  const [displayPlan, setDisplayPlan] = useState<'tou' | 'ulo' | undefined>(undefined)
  const [solarOverride, setSolarOverride] = useState<any>(undefined)
  const [selectedBattery, setSelectedBattery] = useState<any>(undefined)
  const [batteryDetails, setBatteryDetails] = useState<any>(undefined)
  const [mapSnapshot, setMapSnapshot] = useState<string | undefined>(undefined)
  const [roofData, setRoofData] = useState<any>(undefined)
  const [photos, setPhotos] = useState<any[]>([])
  const [photoSummary, setPhotoSummary] = useState<any>(undefined)
  const [monthlyBill, setMonthlyBill] = useState<number | undefined>(undefined)
  const [energyUsage, setEnergyUsage] = useState<any>(undefined)
  const [appliances, setAppliances] = useState<any[]>([])
  const [addOns, setAddOns] = useState<any[]>([])
  const [tou, setTou] = useState<any>(undefined)
  const [ulo, setUlo] = useState<any>(undefined)
  const [loading, setLoading] = useState(true)

  // Use the same transform function as results page
  const transformSimplifiedData = (simplifiedData: any, leadFields?: any) => {
    const isSimplifiedData = simplifiedData?.estimatorMode || simplifiedData?.programType
    
    // For easy mode, check if peakShaving is nested in full_data_json
    const peakShaving = simplifiedData?.peakShaving || simplifiedData?.estimate?.peakShaving
    
    // Extract TOU/ULO data - prioritize leadFields (database) for beforeSolar/afterSolar
    // since those are the correct values saved from calculations
    let touData = simplifiedData.tou
    let uloData = simplifiedData.ulo
    
    // For easy mode (quick estimate), prioritize leadFields values for beforeSolar/afterSolar
    // These are the correct values calculated and saved to the database
    if (leadFields) {
      const touBefore = parseFloat(leadFields.tou_before_solar) || 0
      const touAfter = parseFloat(leadFields.tou_after_solar) || 0
      const uloBefore = parseFloat(leadFields.ulo_before_solar) || 0
      const uloAfter = parseFloat(leadFields.ulo_after_solar) || 0
      
      // If we have database values, use them (they're the source of truth)
      if (touBefore > 0 || touAfter >= 0) {
        touData = {
          ...touData,
          beforeSolar: touBefore,
          afterSolar: touAfter,
          // Calculate annual savings from before/after (same as step 4)
          annualSavings: touBefore > 0 && touAfter >= 0 ? touBefore - touAfter : (touData?.annualSavings || parseFloat(leadFields.tou_annual_savings) || 0),
          monthlySavings: touData?.monthlySavings || parseFloat(leadFields.tou_monthly_savings) || 0,
          paybackPeriod: touData?.paybackPeriod || parseFloat(leadFields.tou_payback_period) || 0,
          profit25Year: touData?.profit25Year || parseFloat(leadFields.tou_profit_25_year) || 0,
          totalBillSavingsPercent: touData?.totalBillSavingsPercent || parseFloat(leadFields.tou_total_bill_savings_percent) || 0,
          totalOffset: touData?.totalOffset || parseFloat(leadFields.tou_total_offset) || 0, // Add totalOffset for energy offset display
        }
      }
      
      if (uloBefore > 0 || uloAfter >= 0) {
        uloData = {
          ...uloData,
          beforeSolar: uloBefore,
          afterSolar: uloAfter,
          // Calculate annual savings from before/after (same as step 4)
          annualSavings: uloBefore > 0 && uloAfter >= 0 ? uloBefore - uloAfter : (uloData?.annualSavings || parseFloat(leadFields.ulo_annual_savings) || 0),
          monthlySavings: uloData?.monthlySavings || parseFloat(leadFields.ulo_monthly_savings) || 0,
          paybackPeriod: uloData?.paybackPeriod || parseFloat(leadFields.ulo_payback_period) || 0,
          profit25Year: uloData?.profit25Year || parseFloat(leadFields.ulo_profit_25_year) || 0,
          totalBillSavingsPercent: uloData?.totalBillSavingsPercent || parseFloat(leadFields.ulo_total_bill_savings_percent) || 0,
          totalOffset: uloData?.totalOffset || parseFloat(leadFields.ulo_total_offset) || 0, // Add totalOffset for energy offset display
        }
      }
    }
    
    // If still no data, try to extract from peakShaving nested structure
    if (!touData && peakShaving?.tou) {
      const touCombined = peakShaving.tou?.allResults?.combined?.combined || 
                         peakShaving.tou?.combined?.combined ||
                         peakShaving.tou?.combined
      touData = {
        beforeSolar: touCombined?.baselineAnnualBill || leadFields?.tou_before_solar || 0,
        afterSolar: touCombined?.postSolarBatteryAnnualBill || leadFields?.tou_after_solar || 0,
        annualSavings: touCombined?.annual || peakShaving.tou?.result?.annualSavings || leadFields?.tou_annual_savings || 0,
        monthlySavings: touCombined?.monthly || peakShaving.tou?.result?.monthlySavings || leadFields?.tou_monthly_savings || 0,
        paybackPeriod: touCombined?.projection?.paybackYears || leadFields?.tou_payback_period || 0,
        profit25Year: touCombined?.projection?.netProfit25Year || leadFields?.tou_profit_25_year || 0,
        totalBillSavingsPercent: leadFields?.tou_total_bill_savings_percent || 0,
      }
    }
    
    if (!uloData && peakShaving?.ulo) {
      const uloCombined = peakShaving.ulo?.allResults?.combined?.combined || 
                         peakShaving.ulo?.combined?.combined ||
                         peakShaving.ulo?.combined
      uloData = {
        beforeSolar: uloCombined?.baselineAnnualBill || leadFields?.ulo_before_solar || 0,
        afterSolar: uloCombined?.postSolarBatteryAnnualBill || leadFields?.ulo_after_solar || 0,
        annualSavings: uloCombined?.annual || peakShaving.ulo?.result?.annualSavings || leadFields?.ulo_annual_savings || 0,
        monthlySavings: uloCombined?.monthly || peakShaving.ulo?.result?.monthlySavings || leadFields?.ulo_monthly_savings || 0,
        paybackPeriod: uloCombined?.projection?.paybackYears || leadFields?.ulo_payback_period || 0,
        profit25Year: uloCombined?.projection?.netProfit25Year || leadFields?.ulo_profit_25_year || 0,
        totalBillSavingsPercent: leadFields?.ulo_total_bill_savings_percent || 0,
      }
    }
    
    // Calculate annual savings from before/after (same as step 4)
    const touAnnualSavings = touData?.beforeSolar && touData?.afterSolar !== undefined
      ? touData.beforeSolar - touData.afterSolar
      : touData?.annualSavings || 0
    const uloAnnualSavings = uloData?.beforeSolar && uloData?.afterSolar !== undefined
      ? uloData.beforeSolar - uloData.afterSolar
      : uloData?.annualSavings || 0
    
    if (isSimplifiedData) {
      // For quick estimates, prioritize calculated value from full_data_json over database value
      // The calculated value (6.5 kW from 13 panels) is more accurate than stored database value (6.7 kW)
      // Calculate from numPanels first: 13 panels * 500W = 6.5 kW
      const systemSizeKw = simplifiedData.estimate?.system?.sizeKw ||  // Calculated value from step review (6.5 kW)
                           (simplifiedData.numPanels ? (simplifiedData.numPanels * 500) / 1000 : 0) ||  // Calculate from numPanels in simplifiedData (13 * 500 / 1000 = 6.5)
                           (simplifiedData.estimate?.system?.numPanels ? (simplifiedData.estimate.system.numPanels * 500) / 1000 : 0) ||  // Calculate from estimate.numPanels
                           simplifiedData.systemSizeKw ||              // Direct value in simplifiedData
                           (leadFields?.num_panels ? (parseFloat(String(leadFields.num_panels)) * 500) / 1000 : 0) ||  // Calculate from database num_panels (13 * 500 / 1000 = 6.5)
                           (leadFields?.system_size_kw ? parseFloat(String(leadFields.system_size_kw)) : 0) || 0  // Fallback to database value (6.7)
      
      const numPanels = simplifiedData.numPanels ||                    // From simplifiedData (13)
                       simplifiedData.estimate?.system?.numPanels ||   // From estimate (13)
                       (leadFields?.num_panels ? parseFloat(String(leadFields.num_panels)) : 0) || 0  // From database (13)
      
      return {
        estimate: {
          system: {
            sizeKw: systemSizeKw,
            numPanels: numPanels,
          },
          production: simplifiedData.production || (leadFields ? {
            annualKwh: parseFloat(leadFields.production_annual_kwh) || 0,
            monthlyKwh: Array.isArray(leadFields.production_monthly_kwh) 
              ? leadFields.production_monthly_kwh.map((v: any) => parseFloat(v) || 0)
              : typeof leadFields.production_monthly_kwh === 'string'
                ? JSON.parse(leadFields.production_monthly_kwh).map((v: any) => parseFloat(v) || 0)
                : [],
            dailyAverageKwh: parseFloat(leadFields.production_daily_average_kwh) || 0,
          } : {
            annualKwh: 0,
            monthlyKwh: [],
            dailyAverageKwh: 0,
          }),
          costs: {
            ...(simplifiedData.costs || simplifiedData.estimate?.costs || {}),
            systemCost: simplifiedData.costs?.systemCost || 
                       simplifiedData.estimate?.costs?.systemCost || 
                       parseFloat(leadFields?.system_cost) || 0,
            batteryCost: simplifiedData.costs?.batteryCost || 
                        simplifiedData.estimate?.costs?.batteryCost || 
                        parseFloat(leadFields?.battery_cost) || 0,
            solarRebate: simplifiedData.costs?.solarRebate || 
                        simplifiedData.estimate?.costs?.solarRebate || 
                        simplifiedData.estimate?.costs?.incentives || 
                        parseFloat(leadFields?.solar_rebate) || 0,
            batteryRebate: simplifiedData.costs?.batteryRebate || 
                          simplifiedData.estimate?.costs?.batteryRebate || 
                          parseFloat(leadFields?.battery_rebate) || 0,
            netCost: simplifiedData.costs?.netCost || 
                    simplifiedData.estimate?.costs?.netCost || 
                    parseFloat(leadFields?.net_cost) || 0,
            totalCost: simplifiedData.costs?.totalCost || 
                      simplifiedData.estimate?.costs?.totalCost ||
                      (simplifiedData.costs?.systemCost || 
                       simplifiedData.estimate?.costs?.systemCost || 
                       parseFloat(leadFields?.system_cost) || 0) + 
                      (simplifiedData.costs?.batteryCost || 
                       simplifiedData.estimate?.costs?.batteryCost || 
                       parseFloat(leadFields?.battery_cost) || 0),
            incentives: simplifiedData.costs?.incentives ||
                       simplifiedData.estimate?.costs?.incentives ||
                       (simplifiedData.costs?.solarRebate || 
                        simplifiedData.estimate?.costs?.solarRebate || 
                        parseFloat(leadFields?.solar_rebate) || 0) + 
                       (simplifiedData.costs?.batteryRebate || 
                        simplifiedData.estimate?.costs?.batteryRebate || 
                        parseFloat(leadFields?.battery_rebate) || 0),
          },
          savings: {
            annualSavings: Math.max(touAnnualSavings, uloAnnualSavings) || 0,
            monthlySavings: Math.max(touAnnualSavings, uloAnnualSavings) / 12 || 0,
            paybackYears: touData?.paybackPeriod || uloData?.paybackPeriod || 0,
            lifetimeSavings: (touData?.profit25Year || uloData?.profit25Year || 0),
          },
          environmental: simplifiedData.environmental || (leadFields ? {
            co2OffsetTonsPerYear: parseFloat(leadFields.co2_offset_tons_per_year) || 0,
            treesEquivalent: parseFloat(leadFields.trees_equivalent) || 0,
            carsOffRoadEquivalent: parseFloat(leadFields.cars_off_road_equivalent) || 0,
          } : undefined),
        },
        leadData: {
          firstName: simplifiedData.fullName?.split(' ')[0] || '',
          lastName: simplifiedData.fullName?.split(' ').slice(1).join(' ') || '',
          email: simplifiedData.email || '',
          address: simplifiedData.address || '',
          province: simplifiedData.province || 'ON',
        },
        solarOverride: {
          sizeKw: systemSizeKw, // Use the same extracted systemSizeKw
          numPanels: numPanels,  // Use the same extracted numPanels
        },
        solarRebate: simplifiedData.costs?.solarRebate || 
                    simplifiedData.estimate?.costs?.solarRebate || 
                    simplifiedData.estimate?.costs?.incentives || 
                    parseFloat(leadFields?.solar_rebate) || 0,
        batteryRebate: simplifiedData.costs?.batteryRebate || 
                      simplifiedData.estimate?.costs?.batteryRebate || 
                      parseFloat(leadFields?.battery_rebate) || 0,
        combinedTotalCost: simplifiedData.costs?.totalCost || 
                          simplifiedData.estimate?.costs?.totalCost ||
                          (simplifiedData.costs?.systemCost || 
                           simplifiedData.estimate?.costs?.systemCost || 
                           parseFloat(leadFields?.system_cost) || 0) + 
                          (simplifiedData.costs?.batteryCost || 
                           simplifiedData.estimate?.costs?.batteryCost || 
                           parseFloat(leadFields?.battery_cost) || 0),
        combinedNetCost: simplifiedData.costs?.netCost || 
                        simplifiedData.estimate?.costs?.netCost || 
                        parseFloat(leadFields?.net_cost) || 0,
        displayPlan: uloAnnualSavings > 0 && touAnnualSavings > 0
          ? (uloAnnualSavings > touAnnualSavings ? 'ulo' : 'tou')
          : (uloAnnualSavings > 0 ? 'ulo' : touAnnualSavings > 0 ? 'tou' : undefined),
        mapSnapshot: simplifiedData.mapSnapshot,
        roofData: {
          roofAreaSqft: simplifiedData.roofAreaSqft,
          roofType: simplifiedData.roofType,
          roofPitch: simplifiedData.roofPitch,
          shadingLevel: simplifiedData.shadingLevel,
          roofAge: simplifiedData.roofAge,
          roofPolygon: simplifiedData.roofPolygon,
        },
        photos: simplifiedData.photos || [],
        photoSummary: simplifiedData.photoSummary,
        monthlyBill: typeof simplifiedData.monthlyBill === 'string' 
          ? parseFloat(simplifiedData.monthlyBill) 
          : simplifiedData.monthlyBill,
        energyUsage: simplifiedData.energyUsage || (simplifiedData.annualUsageKwh ? {
          annualKwh: simplifiedData.annualUsageKwh,
          monthlyKwh: simplifiedData.annualUsageKwh / 12,
          dailyKwh: simplifiedData.annualUsageKwh / 365,
        } : undefined),
        tou: touData ? (() => {
          const before = touData.beforeSolar || 0
          const after = touData.afterSolar || 0
          const annualSavings = touAnnualSavings
          const monthlySavings = touData.monthlySavings || annualSavings / 12
          const paybackPeriod = touData.paybackPeriod || 0
          const profit25Year = touData.profit25Year || 0
          
          return {
            result: {
              annualSavings,
              monthlySavings,
            },
            combined: {
              combined: {
                annual: annualSavings,
                monthly: monthlySavings,
                baselineAnnualBill: before,
                postSolarBatteryAnnualBill: after,
              },
              combinedAnnualSavings: annualSavings,
              combinedMonthlySavings: monthlySavings,
              projection: {
                paybackYears: paybackPeriod,
                netProfit25Year: profit25Year,
              },
            },
            allResults: {
              combined: {
                combined: {
                  annual: annualSavings,
                  monthly: monthlySavings,
                  baselineAnnualBill: before,
                  postSolarBatteryAnnualBill: after,
                  projection: {
                    paybackYears: paybackPeriod,
                    netProfit25Year: profit25Year,
                  },
                },
              },
            },
            // Include all original simplified data for direct access
            beforeSolar: before,
            afterSolar: after,
            paybackPeriod: paybackPeriod,
            profit25Year: profit25Year,
            totalOffset: touData.totalOffset || 0,
            totalBillSavingsPercent: touData.totalBillSavingsPercent || 0,
            ...touData,
          }
        })() : undefined,
        ulo: uloData ? (() => {
          const before = uloData.beforeSolar || 0
          const after = uloData.afterSolar || 0
          const annualSavings = uloAnnualSavings
          const monthlySavings = uloData.monthlySavings || annualSavings / 12
          const paybackPeriod = uloData.paybackPeriod || 0
          const profit25Year = uloData.profit25Year || 0
          
          return {
            result: {
              annualSavings,
              monthlySavings,
            },
            combined: {
              combined: {
                annual: annualSavings,
                monthly: monthlySavings,
                baselineAnnualBill: before,
                postSolarBatteryAnnualBill: after,
              },
              combinedAnnualSavings: annualSavings,
              combinedMonthlySavings: monthlySavings,
              projection: {
                paybackYears: paybackPeriod,
                netProfit25Year: profit25Year,
              },
            },
            allResults: {
              combined: {
                combined: {
                  annual: annualSavings,
                  monthly: monthlySavings,
                  baselineAnnualBill: before,
                  postSolarBatteryAnnualBill: after,
                  projection: {
                    paybackYears: paybackPeriod,
                    netProfit25Year: profit25Year,
                  },
                },
              },
            },
            // Include all original simplified data for direct access
            beforeSolar: before,
            afterSolar: after,
            paybackPeriod: paybackPeriod,
            profit25Year: profit25Year,
            totalOffset: uloData.totalOffset || 0,
            totalBillSavingsPercent: uloData.totalBillSavingsPercent || 0,
            ...uloData,
          }
        })() : undefined,
        peakShaving: {
          tou: simplifiedData.tou ? (() => {
            const before = simplifiedData.tou.beforeSolar || 0
            const after = simplifiedData.tou.afterSolar || 0
            const annualSavings = before > 0 && after >= 0 ? before - after : simplifiedData.tou.annualSavings || 0
            const monthlySavings = annualSavings / 12
            
            return {
              combined: {
                combined: {
                  annual: annualSavings,
                  monthly: monthlySavings,
                  baselineAnnualBill: before,
                  postSolarBatteryAnnualBill: after,
                },
                combinedAnnualSavings: annualSavings,
                combinedMonthlySavings: monthlySavings,
              },
              allResults: {
                combined: {
                  combined: {
                    annual: annualSavings,
                    monthly: monthlySavings,
                    baselineAnnualBill: before,
                    postSolarBatteryAnnualBill: after,
                  },
                },
              },
            }
          })() : undefined,
          ulo: simplifiedData.ulo ? (() => {
            const before = simplifiedData.ulo.beforeSolar || 0
            const after = simplifiedData.ulo.afterSolar || 0
            const annualSavings = before > 0 && after >= 0 ? before - after : simplifiedData.ulo.annualSavings || 0
            const monthlySavings = annualSavings / 12
            
            return {
              combined: {
                combined: {
                  annual: annualSavings,
                  monthly: monthlySavings,
                  baselineAnnualBill: before,
                  postSolarBatteryAnnualBill: after,
                },
                combinedAnnualSavings: annualSavings,
                combinedMonthlySavings: monthlySavings,
              },
              allResults: {
                combined: {
                  combined: {
                    annual: annualSavings,
                    monthly: monthlySavings,
                    baselineAnnualBill: before,
                    postSolarBatteryAnnualBill: after,
                  },
                },
              },
            }
          })() : undefined,
          ratePlan: simplifiedData.ulo?.annualSavings && simplifiedData.tou?.annualSavings
            ? (simplifiedData.ulo.annualSavings > simplifiedData.tou.annualSavings ? 'ulo' : 'tou')
            : 'tou',
          touBeforeAfter: simplifiedData.tou && simplifiedData.tou.beforeSolar && simplifiedData.tou.afterSolar !== undefined
            ? {
                before: simplifiedData.tou.beforeSolar,
                after: simplifiedData.tou.afterSolar,
                savings: simplifiedData.tou.beforeSolar - simplifiedData.tou.afterSolar
              }
            : undefined,
          uloBeforeAfter: simplifiedData.ulo && simplifiedData.ulo.beforeSolar && simplifiedData.ulo.afterSolar !== undefined
            ? {
                before: simplifiedData.ulo.beforeSolar,
                after: simplifiedData.ulo.afterSolar,
                savings: simplifiedData.ulo.beforeSolar - simplifiedData.ulo.afterSolar
              }
            : undefined,
        },
      }
    }
    
    return {
      estimate: simplifiedData?.estimate || {
        system: { sizeKw: 0, numPanels: 0 },
        production: { annualKwh: 0, monthlyKwh: [] },
        costs: { totalCost: 0, netCost: 0, incentives: 0 },
        savings: { annualSavings: 0, monthlySavings: 0, paybackYears: 0 },
      },
      leadData: simplifiedData?.leadData || {},
      ...simplifiedData,
    }
  }

  useEffect(() => {
    if (!trackingId) {
      setLoading(false)
      return
    }

    // Fetch lead data from API using tracking ID (which is the leadId)
    fetch(`/api/leads/${trackingId}`)
      .then(async res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch lead: ${res.status} ${res.statusText}`)
        }
        const text = await res.text()
        if (!text) {
          throw new Error('Empty response from server')
        }
        try {
          return JSON.parse(text)
        } catch (e) {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
        }
      })
      .then(data => {
        if (data.success) {
          const lead = data.lead
          
          // Check if this is HRS residential lead with simplified data structure
          if (lead.full_data_json) {
            const simplifiedData = lead.full_data_json
            // Pass lead.hrs_residential_data as leadFields for easy mode fallback
            const transformedData = transformSimplifiedData(simplifiedData, lead.hrs_residential_data)
            
            setEstimate(transformedData.estimate)
            setLeadData(transformedData.leadData || {})
            setBatteryImpact(transformedData.batteryImpact)
            setPeakShaving(transformedData.peakShaving)
            setSolarRebate(transformedData.solarRebate)
            setBatteryRebate(transformedData.batteryRebate)
            setCombinedTotalCost(transformedData.combinedTotalCost)
            setCombinedNetCost(transformedData.combinedNetCost)
            setDisplayPlan(transformedData.displayPlan)
            setSolarOverride(transformedData.solarOverride)
            setSelectedBattery(transformedData.selectedBattery)
            setBatteryDetails(transformedData.batteryDetails)
            setMapSnapshot(transformedData.mapSnapshot)
            setRoofData(transformedData.roofData)
            setPhotos(transformedData.photos || [])
            setPhotoSummary(transformedData.photoSummary)
            setMonthlyBill(transformedData.monthlyBill)
            setEnergyUsage(transformedData.energyUsage)
            setAppliances(transformedData.appliances || [])
            setAddOns(transformedData.addOns || [])
            setTou(transformedData.tou)
            setUlo(transformedData.ulo)
            setLoading(false)
            return
          }
        }
        
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching lead from database:', err)
        setLoading(false)
      })
  }, [trackingId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your estimate...</p>
        </div>
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Estimate Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find an estimate with that tracking ID. Please check the ID and try again.
          </p>
          <Link
            href="/estimator"
            className="inline-block btn-primary"
          >
            Start New Estimate
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ResultsPage
      estimate={estimate}
      leadData={leadData}
      batteryImpact={batteryImpact}
      peakShaving={peakShaving}
      solarRebate={solarRebate}
      batteryRebate={batteryRebate}
      combinedTotalCost={combinedTotalCost}
      combinedNetCost={combinedNetCost}
      displayPlan={displayPlan}
      solarOverride={solarOverride}
      selectedBattery={selectedBattery}
      batteryDetails={batteryDetails}
      mapSnapshot={mapSnapshot}
      roofData={roofData}
      photos={photos}
      photoSummary={photoSummary}
      monthlyBill={monthlyBill}
      energyUsage={energyUsage}
      appliances={appliances}
      addOns={addOns}
      tou={tou}
      ulo={ulo}
    />
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackPageContent />
    </Suspense>
  )
}

