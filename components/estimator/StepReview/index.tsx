'use client'

// Step 4: Review estimate and results

import { useState, useEffect } from 'react'
import { Loader2, Battery } from 'lucide-react'
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
import { PlanComparison } from './sections/PlanComparison'
import { FinancingOptions } from './sections/FinancingOptions'
import { SavingsTab } from './tabs/SavingsTab'
import { ProductionTab } from './tabs/ProductionTab'
import { EnvironmentalTab } from './tabs/EnvironmentalTab'

interface StepReviewProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
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

  // Fetch estimate from API
  useEffect(() => {
    async function fetchEstimate() {
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

  const hasBatteryDetails = !!(data.batteryDetails && (data.peakShaving?.tou || data.peakShaving?.ulo))
  const selectedBatteryIds: string[] = Array.isArray(data.selectedBatteries) && data.selectedBatteries.length > 0
    ? data.selectedBatteries
    : (data.selectedBattery ? [data.selectedBattery] : [])
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
            energyUsage={data.energyUsage}
            appliances={data.appliances}
          />
        </div>

        {/* Right side - Results */}
        <div className="space-y-6 min-w-0">
          {/* Results header card */}
          <div className="card bg-gradient-to-r from-navy-500 to-blue-500 text-white p-6">
            <h2 className="text-2xl font-bold mb-1">Your Solar Estimate</h2>
            <p className="text-white/90">{data.address}</p>
          </div>

          {selectedBatterySpecs.length > 0 && (
            <div className="card p-4 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-navy-500 rounded-lg">
                    <Battery className="text-white" size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-navy-600">Selected Battery</div>
                    <div className="text-sm text-gray-700 font-semibold">{aggregatedBattery?.labels?.join(' + ')} • {aggregatedBattery?.usableKwh} kWh usable</div>
                  </div>
                </div>
                {selectedPlan && (
                  <div className="text-xs text-gray-600">Plan: {selectedPlan.toUpperCase()}</div>
                )}
              </div>
            </div>
          )}

          {data.selectedAddOns && data.selectedAddOns.length > 0 && (
            <div className="card bg-blue-50 border border-blue-200 p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span>Interested Add-ons</span>
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  {data.selectedAddOns.length}
                </span>
              </h3>
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
            </div>
          )}

          <SystemSummaryCards
            systemSizeKw={data.solarOverride?.sizeKw ?? estimate.system.sizeKw}
            numPanels={data.solarOverride?.numPanels ?? estimate.system.numPanels}
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

          {data.selectedBattery && data.batteryDetails && (
            <BatteryDetails
              batteryDetails={data.batteryDetails}
              peakShaving={data.peakShaving}
            />
          )}

          {tou && ulo && includeBattery && (() => {
            const touCombined = (data.peakShaving as any)?.tou?.allResults?.combined?.combined ||
                               (data.peakShaving as any)?.tou?.combined?.combined ||
                               (data.peakShaving as any)?.tou?.combined
            const uloCombined = (data.peakShaving as any)?.ulo?.allResults?.combined?.combined ||
                               (data.peakShaving as any)?.ulo?.combined?.combined ||
                               (data.peakShaving as any)?.ulo?.combined

            if (!touCombined || !uloCombined) {
              console.warn('Plan Comparison: Missing combined data', {
                tou: !!touCombined,
                ulo: !!uloCombined,
                touPath: (data.peakShaving as any)?.tou?.allResults,
                uloPath: (data.peakShaving as any)?.ulo?.allResults,
              })
              return null
            }

            return <PlanComparison touCombined={touCombined} uloCombined={uloCombined} />
          })()}

          <FinancingOptions
            combinedNetCost={combinedNetCost}
            selectedFinancing={selectedFinancing}
            onFinancingChange={setSelectedFinancing}
            hasBattery={hasBattery}
          />

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

