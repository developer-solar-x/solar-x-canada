'use client'

// Step 4: Review estimate and results

import { useState, useEffect, useMemo } from 'react'
import { Loader2, Battery, Sun, Moon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BATTERY_SPECS } from '@/config/battery-specs'
import { ImageModal } from '@/components/ui/ImageModal'
import { PropertySummary } from './sections/PropertySummary'
import { MapSnapshot } from './sections/MapSnapshot'
import { RoofSummary } from './sections/RoofSummary'
import { PhotosSummary } from './sections/PhotosSummary'
import { EnergySummary } from './sections/EnergySummary'
import { SystemSummaryCards } from './sections/SystemSummaryCards'
import { CostBreakdown } from './sections/CostBreakdown'
import { BatteryDetails } from './sections/BatteryDetails'
import { FinancingOptions } from './sections/FinancingOptions'
import { SavingsTab } from './tabs/SavingsTab'
import { ProductionTab } from './tabs/ProductionTab'
import { EnvironmentalTab } from './tabs/EnvironmentalTab'
import { calculateCombinedMultiYear } from '@/lib/simple-peak-shaving'
import { calculateSystemCost } from '@/config/pricing'

interface StepReviewProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

// BeforeAfterBars component - copied from step 4
function BeforeAfterBars({ 
  before, 
  after, 
  savings,
  showContainer = false
}: { 
  before: number
  after: number
  savings: number
  showContainer?: boolean
}) {
  const maxValue = Math.max(before, after) * 1.1
  const beforeWidth = (before / maxValue) * 100
  const afterWidth = (after / maxValue) * 100

  const content = (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Annual Savings</h3>
        <p className="text-sm text-gray-600">See how much you'll save on electricity costs each year</p>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Your Current Electricity Bill</span>
            <span className="text-base font-bold text-gray-800">${before.toLocaleString()}/yr</span>
          </div>
          <div className="w-full h-12 bg-gray-200 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700 ease-out"
              style={{ width: `${beforeWidth}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">With Solar + Battery System</span>
            <span className="text-base font-bold text-green-600">${after.toLocaleString()}/yr</span>
          </div>
          <div className="w-full h-12 bg-gray-200 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-700 ease-out"
              style={{ width: `${afterWidth}%` }}
            ></div>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-800">You Save</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                ${savings.toLocaleString()}/yr
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">That's</span>
              <span className="text-lg font-bold text-green-600">
                ${(savings / 12).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (showContainer) {
    return (
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden p-4 md:p-5">
        {content}
      </div>
    )
  }

  return content
}

// Annual Savings Card component - displays ULO and TOU savings from step 4
// Uses pre-calculated values from step 4 instead of recalculating
function AnnualSavingsCard({ 
  touBeforeAfter,
  uloBeforeAfter,
  displayPlan 
}: { 
  touBeforeAfter: { before: number; after: number; savings: number } | null
  uloBeforeAfter: { before: number; after: number; savings: number } | null
  displayPlan: 'tou' | 'ulo' | undefined
}) {
  // Use pre-calculated values directly from step 4
  const touBefore = touBeforeAfter?.before || 0
  const touAfter = touBeforeAfter?.after || 0
  // Calculate savings as before - after (same as step 4 displays)
  const touSavings = touBefore > 0 && touAfter >= 0 ? touBefore - touAfter : 0
  
  const uloBefore = uloBeforeAfter?.before || 0
  const uloAfter = uloBeforeAfter?.after || 0
  // Calculate savings as before - after (same as step 4 displays)
  const uloSavings = uloBefore > 0 && uloAfter >= 0 ? uloBefore - uloAfter : 0

  const hasTouData = touSavings > 0 && touBefore > 0
  const hasUloData = uloSavings > 0 && uloBefore > 0
  
  if (!hasTouData && !hasUloData) {
    return null
  }

  return (
    <div className="card p-6">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Annual Savings by Rate Plan</h3>
        <p className="text-sm text-gray-600">Compare your savings on different electricity rate plans</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* TOU Plan */}
        {hasTouData && (
          <div className={`p-4 rounded-lg border-2 transition-all ${
            displayPlan === 'tou' 
              ? 'bg-blue-50 border-blue-400 shadow-md' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Sun className="text-amber-500" size={20} />
              <h4 className="font-bold text-gray-800">Time-of-Use (TOU)</h4>
              {displayPlan === 'tou' && (
                <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                  Selected
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Bill:</span>
                <span className="font-semibold text-gray-800">${Math.round(touBefore).toLocaleString()}/yr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">With System:</span>
                <span className="font-semibold text-green-600">${Math.round(touAfter).toLocaleString()}/yr</span>
              </div>
              <div className="pt-2 border-t-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Annual Savings:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${Math.round(touSavings).toLocaleString()}/yr
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600">Monthly:</span>
                  <span className="text-sm font-semibold text-green-600">
                    ${Math.round(touSavings / 12).toLocaleString()}/mo
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ULO Plan */}
        {hasUloData && (
          <div className={`p-4 rounded-lg border-2 transition-all ${
            displayPlan === 'ulo' 
              ? 'bg-purple-50 border-purple-400 shadow-md' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Moon className="text-indigo-500" size={20} />
              <h4 className="font-bold text-gray-800">Ultra-Low Overnight (ULO)</h4>
              {displayPlan === 'ulo' && (
                <span className="ml-auto text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                  Selected
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Bill:</span>
                <span className="font-semibold text-gray-800">${Math.round(uloBefore).toLocaleString()}/yr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">With System:</span>
                <span className="font-semibold text-green-600">${Math.round(uloAfter).toLocaleString()}/yr</span>
              </div>
              <div className="pt-2 border-t-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Annual Savings:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${Math.round(uloSavings).toLocaleString()}/yr
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600">Monthly:</span>
                  <span className="text-sm font-semibold text-green-600">
                    ${Math.round(uloSavings / 12).toLocaleString()}/mo
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasTouData && hasUloData && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-gray-700 text-center">
            <strong>Best Plan:</strong> {touSavings >= uloSavings ? 'TOU' : 'ULO'} saves you{' '}
            <span className="font-bold text-green-600">
              ${Math.round(Math.abs(touSavings - uloSavings)).toLocaleString()} more
            </span>{' '}
            annually
          </p>
        </div>
      )}
    </div>
  )
}

export function StepReview({ data, onComplete, onBack }: StepReviewProps) {
  const [estimate, setEstimate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'savings' | 'production' | 'environmental'>('savings')
  const [selectedFinancing, setSelectedFinancing] = useState<string>(data.financingOption || 'cash')
  // Mobile awareness state – used to make charts roomier on phones
  const [isMobile, setIsMobile] = useState(false) // track if we are on a small screen
  
  // State for image modal
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; title: string } | null>(null)

  const handleImageClick = (image: { src: string; alt: string; title: string }) => {
    setSelectedImage(image)
    setImageModalOpen(true)
  }

  // Use existing estimate from battery savings step if available, otherwise fetch from API
  useEffect(() => {
    async function fetchEstimate() {
      // If estimate already exists from battery savings step, use it instead of calling API again
      if (data.estimate) {
        setEstimate(data.estimate)
        setLoading(false)
        return
      }

      // Only fetch from API if estimate doesn't exist
      try {
        const response = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            overrideSystemSizeKw: data.solarOverride?.sizeKw,
            roofAreaSqft: data.roofAreaSqft
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate estimate')
        }

        const result = await response.json()
        setEstimate(result.data)
      } catch (error) {
        console.error('Estimate error:', error)
        setEstimate({
          system: { sizeKw: 8.5, numPanels: 28 },
          costs: { totalCost: 21250, netCost: 16250, incentives: 5000 },
          savings: { annualSavings: 2160, monthlySavings: 180, paybackYears: 7.5, roi: 265 },
          production: { annualKwh: 10200, monthlyKwh: Array(12).fill(850) },
          environmental: { co2OffsetTonsPerYear: 4.5, treesEquivalent: 108, carsOffRoadEquivalent: 0.9 }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEstimate()
  }, [data])

  useEffect(() => {
    const handleResize = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate values needed for useMemo hooks - must be before early returns
  const estimateData = estimate || {
    system: { sizeKw: 0, numPanels: 0 },
    costs: { totalCost: 0, netCost: 0, incentives: 0 },
    savings: { monthlySavings: 0 },
    production: { monthlyKwh: [] }
  }

  const hasBatteryDetails = !!(data.batteryDetails && (data.peakShaving?.tou || data.peakShaving?.ulo))
  const selectedBatteryIds: string[] = Array.isArray(data.selectedBatteryIds) && data.selectedBatteryIds.length > 0
    ? data.selectedBatteryIds
    : Array.isArray(data.selectedBatteries) && data.selectedBatteries.length > 0
    ? data.selectedBatteries
    : (data.selectedBattery ? (typeof data.selectedBattery === 'string' && data.selectedBattery.includes(',') 
        ? data.selectedBattery.split(',') 
        : [data.selectedBattery]) : [])
  const selectedBatterySpecs = selectedBatteryIds
    .map((id: string) => BATTERY_SPECS.find(b => b.id === id))
    .filter(Boolean) as any[]
  const includeBattery = selectedBatterySpecs.length > 0 || hasBatteryDetails
  const tou = (data.peakShaving as any)?.tou
  const ulo = (data.peakShaving as any)?.ulo
  const selectedPlan: 'tou' | 'ulo' | undefined = (data.peakShaving as any)?.ratePlan
  const betterPlan = (() => {
    const touAnnual = tou?.result?.annualSavings || 0
    const uloAnnual = ulo?.result?.annualSavings || 0
    return touAnnual >= uloAnnual ? 'tou' : 'ulo'
  })()
  const planData: any = (betterPlan === 'tou' ? tou : ulo) || tou || ulo
  const displayPlan = selectedPlan || betterPlan

  const aggregatedBattery = selectedBatterySpecs.length > 0
    ? selectedBatterySpecs.reduce((acc: any, cur: any) => ({
        price: (acc.price || 0) + (cur.price || 0),
        nominalKwh: (acc.nominalKwh || 0) + (cur.nominalKwh || 0),
        usableKwh: (acc.usableKwh || 0) + (cur.usableKwh || 0),
        labels: [...(acc.labels || []), `${cur.brand} ${cur.model}`]
      }), { price: 0, nominalKwh: 0, usableKwh: 0, labels: [] })
    : null

  // Calculate combinedResult and heroMetrics for useMemo
  const combinedResult = (() => {
    const planData = displayPlan === 'tou' ? tou : ulo
    return planData?.combined || 
           planData?.allResults?.combined?.combined || 
           planData?.combined?.combined ||
           null
  })()

  const heroMetrics = (() => {
    if (!combinedResult) return null
    const totalSavings = combinedResult.combinedAnnualSavings || 0
    const baseline = combinedResult.baselineAnnualBill || combinedResult.baselineAnnualBillEnergyOnly || 0
    return baseline > 0 ? {
      totalSavings: (totalSavings / baseline) * 100
    } : null
  })()

  // Calculate values needed for multiYearProjection
  const panelWattage = 500
  const numPanels = data.solarOverride?.numPanels ?? estimateData.system.numPanels
  const effectiveSystemSizeKw = numPanels && numPanels > 0
    ? (numPanels * panelWattage) / 1000
    : (data.solarOverride?.sizeKw ?? estimateData.system.sizeKw)

  const selectedBattery = aggregatedBattery || (hasBatteryDetails ? data.batteryDetails?.battery : null)
  const annualUsageKwh = data.peakShaving?.annualUsageKwh || data.energyUsage?.annualKwh || 0

  // Calculate rebates
  const solarRebateCalc = Math.min(effectiveSystemSizeKw * 1000, 5000)
  const batteryRebateCalc = selectedBattery ? Math.min((selectedBattery.nominalKwh || 0) * 300, 5000) : 0
  const totalRebates = solarRebateCalc + batteryRebateCalc

  // All hooks must be called before any early returns
  const beforeAfterCosts = useMemo(() => {
    if (!combinedResult) {
      return { before: 0, after: 0, savings: 0 }
    }

    const baselineCost = combinedResult.baselineAnnualBill || combinedResult.baselineAnnualBillEnergyOnly || 0
    const totalSavingsPercent = heroMetrics?.totalSavings ?? 0
    const savings = baselineCost * (totalSavingsPercent / 100)
    const afterCost = baselineCost - savings

    return { before: baselineCost, after: afterCost, savings }
  }, [combinedResult, heroMetrics])

  const multiYearProjection = useMemo(() => {
    if (!combinedResult || !selectedBattery || annualUsageKwh <= 0) {
      return null
    }

    const annualEscalationRate = (data.annualEscalator ?? 4.5) / 100
    const systemSize = effectiveSystemSizeKw || 0
    const solarSystemCost = systemSize > 0 ? calculateSystemCost(systemSize) : 0
    const batteryCost = selectedBattery.price || 0
    const totalSystemCost = solarSystemCost + batteryCost
    const netCost = totalSystemCost - totalRebates
    const firstYearSavings = beforeAfterCosts.savings

    const projection = calculateCombinedMultiYear(
      firstYearSavings,
      netCost,
      annualEscalationRate,
      0,
      25,
      {
        baselineAnnualBill: beforeAfterCosts.before,
        offsetCapFraction: undefined
      }
    )

    return { ...projection, totalSystemCost, solarSystemCost, batteryCost }
  }, [combinedResult, selectedBattery, annualUsageKwh, effectiveSystemSizeKw, totalRebates, data.annualEscalator, beforeAfterCosts])

  // Early return after all hooks
  if (loading || !estimate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-red-500 mb-4" size={48} />
        <p className="text-lg text-gray-600">Calculating your solar potential...</p>
        <p className="text-sm text-gray-500 mt-2">Analyzing roof dimensions, weather data, and energy usage</p>
      </div>
    )
  }

  const hasBattery = !!(data.selectedBattery && data.batteryDetails && data.batteryDetails.firstYearAnalysis)
  const productionChartData = estimate.production.monthlyKwh.map((kwh: number, i: number) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    production: kwh,
  }))

  const solarTotalCost = estimate.costs?.totalCost || 0
  const solarNetCost = estimate.costs?.netCost || 0
  const solarIncentives = estimate.costs?.incentives || 0
  const solarMonthlySavings = estimate.savings?.monthlySavings || 0

  const batteryPrice = hasBatteryDetails ? (data.batteryDetails?.battery?.price || 0) : (aggregatedBattery?.price || 0)
  const batteryNetCost = hasBatteryDetails
    ? (data.batteryDetails?.multiYearProjection?.netCost || 0)
    : Math.max(0, batteryPrice - Math.min((aggregatedBattery?.nominalKwh || 0) * 300, 5000))
  const batteryRebate = batteryPrice > 0 ? Math.max(0, batteryPrice - batteryNetCost) : 0
  const batteryAnnualSavings = planData?.result?.annualSavings || 0
  const batteryMonthlySavings = batteryAnnualSavings > 0 ? Math.round(batteryAnnualSavings / 12) : 0

  const batteryProgramRebate = aggregatedBattery ? Math.min((aggregatedBattery.nominalKwh || 0) * 300, 5000) : 0
  const batteryProgramNet = includeBattery ? Math.max(0, batteryPrice - batteryProgramRebate) : 0

  const combinedTotalCost = solarTotalCost + (includeBattery ? batteryPrice : 0)
  const combinedNetCost = solarNetCost + (includeBattery ? batteryProgramNet : 0)
  const combinedMonthlySavings = solarMonthlySavings + (includeBattery ? batteryMonthlySavings : 0)

  return (
    <div className="max-w-full overflow-x-hidden">
      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Left sidebar - Summary */}
        <div className="space-y-4 min-w-0">
          <h2 className="text-2xl font-bold text-navy-500 mb-4">Your Solar Estimate</h2>

          <PropertySummary
            address={data.address}
            onEdit={() => onBack && onBack()}
          />

          {data.mapSnapshot && (
            <MapSnapshot
              mapSnapshot={data.mapSnapshot}
              onImageClick={handleImageClick}
            />
          )}

          <RoofSummary
            roofAreaSqft={data.roofAreaSqft}
            roofType={data.roofType}
            roofPitch={data.roofPitch}
            shadingLevel={data.shadingLevel}
            roofAge={data.roofAge}
            roofPolygon={data.roofPolygon}
            roofSections={data.roofSections}
          />

          {data.photos && data.photos.length > 0 && (
            <PhotosSummary
              photos={data.photos}
              photoSummary={data.photoSummary}
              onImageClick={handleImageClick}
            />
          )}

          <EnergySummary
            energyUsage={data.energyUsage || (data.peakShaving?.annualUsageKwh ? {
              annualKwh: data.peakShaving.annualUsageKwh,
              monthlyKwh: data.peakShaving.annualUsageKwh / 12,
              dailyKwh: data.peakShaving.annualUsageKwh / 365
            } : undefined)}
            appliances={data.appliances}
            monthlyBill={data.monthlyBill}
          />

          <FinancingOptions
            selectedFinancing={selectedFinancing}
            onFinancingChange={setSelectedFinancing}
            combinedNetCost={combinedNetCost}
            hasBattery={hasBattery}
          />
        </div>

        {/* Right side - Results */}
        <div className="space-y-6 min-w-0">
          {/* Results header card */}
          <div className="card bg-gradient-to-r from-navy-500 to-blue-500 text-white p-6">
            <h2 className="text-2xl font-bold mb-1">Your Solar Estimate</h2>
            <p className="text-white/90">{data.address}</p>
          </div>


          {/* 2x2 Grid Layout for Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Left: Interested Add-ons */}
            <div className="card bg-blue-50 border border-blue-200 p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span>Interested Add-ons</span>
                {data.selectedAddOns && data.selectedAddOns.length > 0 && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                    {data.selectedAddOns.length}
                  </span>
                )}
              </h3>
              {data.selectedAddOns && data.selectedAddOns.length > 0 ? (
                <>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {data.selectedAddOns.map((addOnId: string) => (
                      <li key={addOnId} className="flex items-center gap-2">
                        <span className="text-blue-500">•</span>
                        <span className="capitalize">{addOnId.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-blue-600 mt-2">
                    We'll include pricing for these in your custom quote
                  </p>
                </>
              ) : (
                <p className="text-sm text-blue-700 italic">No add-ons selected</p>
              )}
            </div>

            {/* Top Right: Recommended System */}
            {/* Bottom Left: Total System Cost */}
            {/* Bottom Right: Your Net Investment */}
            {/* Calculate system size from panel count if available (exact calculation) */}
            {(() => {
              const panelWattage = 500 // Standard panel wattage
              const numPanels = data.solarOverride?.numPanels ?? estimate.system.numPanels
              // Always calculate from panel count if available (ensures 14 panels = 7.0 kW exactly)
              const systemSizeKw = numPanels && numPanels > 0
                ? (numPanels * panelWattage) / 1000 // Exact calculation from panel count
                : (data.solarOverride?.sizeKw ?? estimate.system.sizeKw) // Fallback to provided value
              
              return (
                <SystemSummaryCards
                  systemSizeKw={systemSizeKw}
                  numPanels={numPanels}
                  selectedBattery={data.selectedBattery}
                  batteryDetails={data.batteryDetails}
                  combinedTotalCost={combinedTotalCost}
                  solarTotalCost={solarTotalCost}
                  batteryPrice={batteryPrice}
                  includeBattery={includeBattery}
                  combinedNetCost={combinedNetCost}
                  solarIncentives={solarIncentives}
                  batteryProgramRebate={batteryProgramRebate}
                  aggregatedBattery={aggregatedBattery}
                  combinedMonthlySavings={combinedMonthlySavings}
                  tou={tou}
                  ulo={ulo}
                  peakShaving={data.peakShaving}
                  displayPlan={displayPlan}
                  solarMonthlySavings={solarMonthlySavings}
                  batteryMonthlySavings={batteryMonthlySavings}
                  batteryAnnualSavings={batteryAnnualSavings}
                />
              )
            })()}
          </div>

          <CostBreakdown
            solarTotalCost={solarTotalCost}
            solarIncentives={solarIncentives}
            solarNetCost={solarNetCost}
            includeBattery={includeBattery}
            batteryPrice={batteryPrice}
            batteryProgramRebate={batteryProgramRebate}
            batteryProgramNet={batteryProgramNet}
            aggregatedBattery={aggregatedBattery}
            hasBatteryDetails={hasBatteryDetails}
            combinedNetCost={combinedNetCost}
          />

          {/* Annual Savings Card - showing ULO and TOU results from Step 4 */}
          {includeBattery && (data.touBeforeAfter || data.uloBeforeAfter) && (
            <AnnualSavingsCard
              touBeforeAfter={data.touBeforeAfter}
              uloBeforeAfter={data.uloBeforeAfter}
              displayPlan={displayPlan}
            />
          )}

          {data.selectedBattery && data.batteryDetails && (
            <BatteryDetails
              batteryDetails={data.batteryDetails}
              peakShaving={data.peakShaving}
            />
          )}



          {/* Tabs for detailed results */}
          <div className="card p-6">
            {/* Tab buttons */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setActiveTab('savings')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'savings'
                    ? 'text-red-500 border-b-2 border-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Savings
              </button>
              <button
                onClick={() => setActiveTab('production')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'production'
                    ? 'text-red-500 border-b-2 border-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Production
              </button>
              <button
                onClick={() => setActiveTab('environmental')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'environmental'
                    ? 'text-red-500 border-b-2 border-red-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Environmental
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'savings' && (
              <SavingsTab
                estimate={estimate}
                includeBattery={includeBattery}
                tou={tou}
                ulo={ulo}
                peakShaving={data.peakShaving}
                combinedNetCost={combinedNetCost}
                isMobile={isMobile}
                annualEscalator={data.annualEscalator}
                touBeforeAfter={data.touBeforeAfter}
                uloBeforeAfter={data.uloBeforeAfter}
              />
            )}

            {activeTab === 'production' && (
              <ProductionTab
                annualKwh={estimate.production.annualKwh}
                productionChartData={productionChartData}
                isMobile={isMobile}
              />
            )}

            {activeTab === 'environmental' && (
              <EnvironmentalTab
                co2OffsetTonsPerYear={estimate.environmental.co2OffsetTonsPerYear}
                treesEquivalent={estimate.environmental.treesEquivalent}
                carsOffRoadEquivalent={estimate.environmental.carsOffRoadEquivalent}
              />
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="btn-outline border-gray-300 text-gray-700 flex-1"
              >
                Back
              </button>
            )}
            <button
              onClick={() => onComplete({
                estimate,
                financingOption: selectedFinancing
              })}
              className="btn-primary flex-1"
            >
              Continue to Contact Form
            </button>
          </div>
        </div>

        {/* Image Modal for viewing photos in full size */}
        {selectedImage && (
          <ImageModal
            isOpen={imageModalOpen}
            onClose={() => setImageModalOpen(false)}
            imageSrc={selectedImage.src}
            imageAlt={selectedImage.alt}
            title={selectedImage.title}
          />
        )}
      </div>
    </div>
  )
}

