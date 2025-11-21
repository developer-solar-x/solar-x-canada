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

  useEffect(() => {
    // Get lead ID from URL params
    const leadId = searchParams.get('leadId')
    
    // First, try to get data from sessionStorage (when API is not connected)
    const storedResults = sessionStorage.getItem('calculatorResults')
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults)
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
        setLoading(false)
        // Clear sessionStorage after reading
        sessionStorage.removeItem('calculatorResults')
        return
      } catch (err) {
        console.error('Error parsing stored results:', err)
      }
    }
    
    // If no sessionStorage data, try to fetch from API
    if (leadId && !leadId.startsWith('mock-')) {
      // Fetch lead data and estimate from API
      fetch(`/api/leads/${leadId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setLeadData({
              firstName: data.lead.full_name?.split(' ')[0],
              lastName: data.lead.full_name?.split(' ').slice(1).join(' '),
              email: data.lead.email,
              address: data.lead.address,
              province: data.lead.province,
            })
            
            // Use estimate from lead data or reconstruct from stored data
            if (data.lead.estimate_data) {
              setEstimate(data.lead.estimate_data)
            } else {
              // Fallback: reconstruct estimate from lead fields
              setEstimate({
                system: {
                  sizeKw: data.lead.system_size_kw || 8.5,
                  numPanels: Math.round((data.lead.system_size_kw || 8.5) * 2),
                },
                production: {
                  annualKwh: data.lead.annual_production_kwh || 10200,
                  monthlyKwh: Array(12).fill((data.lead.annual_production_kwh || 10200) / 12),
                },
                costs: {
                  totalCost: data.lead.estimated_cost || 21250,
                  netCost: data.lead.net_cost_after_incentives || 16250,
                  incentives: (data.lead.estimated_cost || 21250) - (data.lead.net_cost_after_incentives || 16250),
                },
                savings: {
                  annualSavings: data.lead.annual_savings || 2160,
                  monthlySavings: (data.lead.annual_savings || 2160) / 12,
                  paybackYears: data.lead.payback_years || 7.5,
                  lifetimeSavings: (data.lead.annual_savings || 2160) * 25,
                },
                environmental: {
                  co2OffsetTonsPerYear: ((data.lead.annual_production_kwh || 10200) * 0.00044),
                  treesEquivalent: Math.round(((data.lead.annual_production_kwh || 10200) * 0.00044) * 24),
                  carsOffRoadEquivalent: ((data.lead.annual_production_kwh || 10200) * 0.00044) / 4.6,
                },
              })
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

