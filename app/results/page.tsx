'use client'

// Results page route - displays calculator results after lead capture

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ResultsPage } from '@/components/ResultsPage'
import { useEffect, useState, Suspense } from 'react'

function ResultsPageContent() {
  const searchParams = useSearchParams()
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

  // Helper function to transform simplified data structure to ResultsPage format
  const transformSimplifiedData = (simplifiedData: any) => {
    // Check if this is the simplified data structure (has estimatorMode, programType, etc.)
    const isSimplifiedData = simplifiedData?.estimatorMode || simplifiedData?.programType
    
    console.log('🔄 Transforming data:', {
      isSimplifiedData,
      hasEstimatorMode: !!simplifiedData?.estimatorMode,
      hasProgramType: !!simplifiedData?.programType,
      hasSystemSizeKw: !!simplifiedData?.systemSizeKw,
      hasProduction: !!simplifiedData?.production,
      hasCosts: !!simplifiedData?.costs,
    })
    
    if (isSimplifiedData) {
      // Transform simplified data to ResultsPage format
      const transformed = {
        estimate: {
          system: {
            sizeKw: simplifiedData.systemSizeKw || 0,
            numPanels: simplifiedData.numPanels || 0,
          },
          production: simplifiedData.production || {
            annualKwh: 0,
            monthlyKwh: [],
            dailyAverageKwh: 0,
          },
          costs: {
            ...(simplifiedData.costs || {}),
            totalCost: (simplifiedData.costs?.systemCost || 0) + (simplifiedData.costs?.batteryCost || 0),
            incentives: (simplifiedData.costs?.solarRebate || 0) + (simplifiedData.costs?.batteryRebate || 0),
          },
          savings: {
            annualSavings: simplifiedData.tou?.annualSavings || simplifiedData.ulo?.annualSavings || 0,
            monthlySavings: simplifiedData.tou?.monthlySavings || simplifiedData.ulo?.monthlySavings || 0,
            paybackYears: simplifiedData.tou?.paybackPeriod || simplifiedData.ulo?.paybackPeriod || 0,
            lifetimeSavings: (simplifiedData.tou?.profit25Year || simplifiedData.ulo?.profit25Year || 0),
          },
          environmental: simplifiedData.environmental || undefined,
        },
        leadData: {
          firstName: simplifiedData.fullName?.split(' ')[0] || '',
          lastName: simplifiedData.fullName?.split(' ').slice(1).join(' ') || '',
          email: simplifiedData.email || '',
          address: simplifiedData.address || '',
          province: simplifiedData.province || 'ON',
        },
        solarOverride: {
          sizeKw: simplifiedData.systemSizeKw,
          numPanels: simplifiedData.numPanels,
        },
        solarRebate: simplifiedData.costs?.solarRebate,
        batteryRebate: simplifiedData.costs?.batteryRebate,
        combinedTotalCost: (simplifiedData.costs?.systemCost || 0) + (simplifiedData.costs?.batteryCost || 0),
        combinedNetCost: simplifiedData.costs?.netCost,
        // Set displayPlan to show which is better, but both plans will be displayed for comparison
        // Don't set displayPlan if we want to show both plans equally
        displayPlan: simplifiedData.ulo?.annualSavings && simplifiedData.tou?.annualSavings
          ? (simplifiedData.ulo.annualSavings > simplifiedData.tou.annualSavings ? 'ulo' : 'tou')
          : (simplifiedData.ulo ? 'ulo' : simplifiedData.tou ? 'tou' : undefined),
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
        // Transform tou/ulo to match ResultsPage expected structure
        tou: simplifiedData.tou ? {
          // For SavingsTab
          result: {
            annualSavings: simplifiedData.tou.annualSavings,
            monthlySavings: simplifiedData.tou.monthlySavings,
          },
          // For ResultsPage nested structure
          combined: {
            combined: {
              annual: simplifiedData.tou.annualSavings,
              monthly: simplifiedData.tou.monthlySavings,
              baselineAnnualBill: simplifiedData.tou.beforeSolar,
              postSolarBatteryAnnualBill: simplifiedData.tou.afterSolar,
            },
            combinedAnnualSavings: simplifiedData.tou.annualSavings,
            combinedMonthlySavings: simplifiedData.tou.monthlySavings,
          },
          allResults: {
            combined: {
              combined: {
                annual: simplifiedData.tou.annualSavings,
                monthly: simplifiedData.tou.monthlySavings,
                baselineAnnualBill: simplifiedData.tou.beforeSolar,
                postSolarBatteryAnnualBill: simplifiedData.tou.afterSolar,
              },
            },
          },
          // Include all original simplified data for direct access
          ...simplifiedData.tou,
        } : undefined,
        ulo: simplifiedData.ulo ? {
          // For SavingsTab
          result: {
            annualSavings: simplifiedData.ulo.annualSavings,
            monthlySavings: simplifiedData.ulo.monthlySavings,
          },
          // For ResultsPage nested structure
          combined: {
            combined: {
              annual: simplifiedData.ulo.annualSavings,
              monthly: simplifiedData.ulo.monthlySavings,
              baselineAnnualBill: simplifiedData.ulo.beforeSolar,
              postSolarBatteryAnnualBill: simplifiedData.ulo.afterSolar,
            },
            combinedAnnualSavings: simplifiedData.ulo.annualSavings,
            combinedMonthlySavings: simplifiedData.ulo.monthlySavings,
          },
          allResults: {
            combined: {
              combined: {
                annual: simplifiedData.ulo.annualSavings,
                monthly: simplifiedData.ulo.monthlySavings,
                baselineAnnualBill: simplifiedData.ulo.beforeSolar,
                postSolarBatteryAnnualBill: simplifiedData.ulo.afterSolar,
              },
            },
          },
          // Include all original simplified data for direct access
          ...simplifiedData.ulo,
        } : undefined,
        peakShaving: {
          tou: simplifiedData.tou ? {
            combined: {
              combined: {
                annual: simplifiedData.tou.annualSavings,
                monthly: simplifiedData.tou.monthlySavings,
                baselineAnnualBill: simplifiedData.tou.beforeSolar,
                postSolarBatteryAnnualBill: simplifiedData.tou.afterSolar,
              },
              combinedAnnualSavings: simplifiedData.tou.annualSavings,
              combinedMonthlySavings: simplifiedData.tou.monthlySavings,
            },
            allResults: {
              combined: {
                combined: {
                  annual: simplifiedData.tou.annualSavings,
                  monthly: simplifiedData.tou.monthlySavings,
                  baselineAnnualBill: simplifiedData.tou.beforeSolar,
                  postSolarBatteryAnnualBill: simplifiedData.tou.afterSolar,
                },
              },
            },
          } : undefined,
          ulo: simplifiedData.ulo ? {
            combined: {
              combined: {
                annual: simplifiedData.ulo.annualSavings,
                monthly: simplifiedData.ulo.monthlySavings,
                baselineAnnualBill: simplifiedData.ulo.beforeSolar,
                postSolarBatteryAnnualBill: simplifiedData.ulo.afterSolar,
              },
              combinedAnnualSavings: simplifiedData.ulo.annualSavings,
              combinedMonthlySavings: simplifiedData.ulo.monthlySavings,
            },
            allResults: {
              combined: {
                combined: {
                  annual: simplifiedData.ulo.annualSavings,
                  monthly: simplifiedData.ulo.monthlySavings,
                  baselineAnnualBill: simplifiedData.ulo.beforeSolar,
                  postSolarBatteryAnnualBill: simplifiedData.ulo.afterSolar,
                },
              },
            },
          } : undefined,
          ratePlan: simplifiedData.ulo?.annualSavings && simplifiedData.tou?.annualSavings
            ? (simplifiedData.ulo.annualSavings > simplifiedData.tou.annualSavings ? 'ulo' : 'tou')
            : 'tou',
        },
      }
      
      console.log('✅ Transformed data:', {
        hasEstimate: !!transformed.estimate,
        estimateSystem: transformed.estimate.system,
        estimateProduction: transformed.estimate.production,
        estimateCosts: transformed.estimate.costs,
      })
      
      return transformed
    }
    
    // Return original structure if not simplified data
    console.log('⚠️ Not simplified data, returning original structure')
    return simplifiedData
  }

  useEffect(() => {
    // Get lead ID from URL params
    const leadId = searchParams.get('leadId')
    
    // First, try to get data from localStorage (keyed by leadId)
    const resultsKey = leadId ? `solarx_results_${leadId}` : null
    let storedResults: string | null = null
    
    if (resultsKey) {
      storedResults = localStorage.getItem(resultsKey)
      console.log('🔍 Checking localStorage:', resultsKey, !!storedResults)
    }
    
    // Fallback to sessionStorage for immediate redirect (backward compatibility)
    if (!storedResults) {
      storedResults = sessionStorage.getItem('calculatorResults')
      console.log('🔍 Checking sessionStorage:', !!storedResults)
    }
    
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults)
        const source = resultsKey && localStorage.getItem(resultsKey) === storedResults ? 'localStorage' : 'sessionStorage'
        console.log(`📦 Loaded from ${source}:`, {
          leadId,
          resultsKey,
          hasEstimatorMode: !!results.estimatorMode,
          hasProgramType: !!results.programType,
          hasEstimate: !!results.estimate,
          keys: Object.keys(results),
        })
        
        // Check if this is simplified data structure and transform it
        const transformedData = transformSimplifiedData(results)
        
        // Always use transformed data if it has an estimate, otherwise check if original has estimate
        if (transformedData.estimate) {
          console.log('✅ Using transformed data')
          setEstimate(transformedData.estimate)
          setLeadData(transformedData.leadData)
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
        } else if (results.estimate) {
          // Use original structure
          console.log('✅ Using original structure')
          setEstimate(results.estimate)
          setLeadData(results.leadData)
          setBatteryImpact(results.batteryImpact)
          setPeakShaving(results.peakShaving)
          setSolarRebate(results.solarRebate)
          setBatteryRebate(results.batteryRebate)
          setCombinedTotalCost(results.combinedTotalCost)
          setCombinedNetCost(results.combinedNetCost)
          setDisplayPlan(results.displayPlan)
          setSolarOverride(results.solarOverride)
          setSelectedBattery(results.selectedBattery)
          setBatteryDetails(results.batteryDetails)
          setMapSnapshot(results.mapSnapshot)
          setRoofData(results.roofData)
          setPhotos(results.photos || [])
          setPhotoSummary(results.photoSummary)
          setMonthlyBill(results.monthlyBill)
          setEnergyUsage(results.energyUsage)
          setAppliances(results.appliances || [])
          setAddOns(results.addOns || [])
          setTou(results.tou)
          setUlo(results.ulo)
        } else {
          console.error('❌ No estimate found in data:', results)
        }
        
        setLoading(false)
        // Clear sessionStorage after reading (but keep localStorage for future visits)
        sessionStorage.removeItem('calculatorResults')
        console.log('✅ Results loaded successfully')
        return
      } catch (err) {
        console.error('Error parsing stored results:', err)
        setLoading(false)
      }
    }
    
    // If no sessionStorage data, try to fetch from API
    if (leadId && !leadId.startsWith('mock-')) {
      // Fetch lead data and estimate from API
      fetch(`/api/leads/${leadId}`)
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
            if (lead.hrs_residential_data || lead.full_data_json) {
              const simplifiedData = lead.full_data_json || lead.hrs_residential_data
              const transformedData = transformSimplifiedData(simplifiedData)
              
              setEstimate(transformedData.estimate)
              setLeadData(transformedData.leadData)
              setSolarRebate(transformedData.solarRebate)
              setBatteryRebate(transformedData.batteryRebate)
              setCombinedTotalCost(transformedData.combinedTotalCost)
              setCombinedNetCost(transformedData.combinedNetCost)
              setDisplayPlan(transformedData.displayPlan)
              setSolarOverride(transformedData.solarOverride)
              setMapSnapshot(transformedData.mapSnapshot)
              setRoofData(transformedData.roofData)
              setPhotos(transformedData.photos || [])
              setPhotoSummary(transformedData.photoSummary)
              setMonthlyBill(transformedData.monthlyBill)
              setEnergyUsage(transformedData.energyUsage)
              setTou(transformedData.tou)
              setUlo(transformedData.ulo)
              setPeakShaving(transformedData.peakShaving)
            } else {
              // Use original structure for old leads
              setLeadData({
                firstName: lead.full_name?.split(' ')[0],
                lastName: lead.full_name?.split(' ').slice(1).join(' '),
                email: lead.email,
                address: lead.address,
                province: lead.province,
              })
              
              // Use estimate from lead data or reconstruct from stored data
              if (lead.estimate_data) {
                setEstimate(lead.estimate_data)
              } else {
                // Fallback: reconstruct estimate from lead fields
                setEstimate({
                  system: {
                    sizeKw: lead.system_size_kw || 8.5,
                    numPanels: Math.round((lead.system_size_kw || 8.5) * 2),
                  },
                  production: {
                    annualKwh: lead.annual_production_kwh || 10200,
                    monthlyKwh: Array(12).fill((lead.annual_production_kwh || 10200) / 12),
                  },
                  costs: {
                    totalCost: lead.estimated_cost || 21250,
                    netCost: lead.net_cost_after_incentives || 16250,
                    incentives: (lead.estimated_cost || 21250) - (lead.net_cost_after_incentives || 16250),
                  },
                  savings: {
                    annualSavings: lead.annual_savings || 2160,
                    monthlySavings: (lead.annual_savings || 2160) / 12,
                    paybackYears: lead.payback_years || 7.5,
                    lifetimeSavings: (lead.annual_savings || 2160) * 25,
                  },
                  environmental: {
                    co2OffsetTonsPerYear: ((lead.annual_production_kwh || 10200) * 0.00044),
                    treesEquivalent: Math.round(((lead.annual_production_kwh || 10200) * 0.00044) * 24),
                    carsOffRoadEquivalent: ((lead.annual_production_kwh || 10200) * 0.00044) / 4.6,
                  },
                })
              }
            }
          }
        })
        .catch(err => {
          console.error('Error fetching lead:', err)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      // No lead ID or mock lead ID - show loading or error
      setLoading(false)
    }
  }, [searchParams])

  const handleMatchInstaller = async () => {
    const leadId = searchParams.get('leadId')
    if (leadId) {
      // Call API to flag lead for installer matching
      await fetch(`/api/leads/${leadId}/match-installer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const handleExportPDF = async () => {
    const leadId = searchParams.get('leadId')
    if (leadId) {
      // Open PDF export endpoint
      window.open(`/api/leads/${leadId}/export-pdf`, '_blank')
    } else {
      // Fallback: print page
      window.print()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your results. Please make sure you completed the calculator and lead form.
          </p>
          <Link href="/estimator" className="btn-primary">
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
      onMatchInstaller={handleMatchInstaller}
      onExportPDF={handleExportPDF}
    />
  )
}

export default function ResultsPageRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    }>
      <ResultsPageContent />
    </Suspense>
  )
}

