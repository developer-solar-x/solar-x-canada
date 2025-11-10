'use client'

// Step 4: Review estimate and results

import { useState, useEffect } from 'react'
import { Zap, DollarSign, TrendingUp, TrendingDown, Loader2, Leaf, CreditCard, MapPin, Home, Compass, Building, Gauge, Sun, Calendar, Droplets, Bolt, Battery, Moon } from 'lucide-react'
import { formatCurrency, formatKw, formatNumber } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { FINANCING_OPTIONS, calculateFinancing } from '@/config/provinces'
import { calculateSimpleMultiYear } from '@/lib/simple-peak-shaving'
import { BATTERY_SPECS } from '@/config/battery-specs'
import { calculateRoofAzimuth, getDirectionLabel, getOrientationEfficiency } from '@/lib/roof-calculations'
import * as turf from '@turf/turf'
import { ImageModal } from '@/components/ui/ImageModal'

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

  // Custom tooltip that flips to the left for later years to avoid clipping
  function SavingsTooltip(props: any) {
    const { active, label, payload, coordinate, viewBox } = props || {}
    if (!active || !payload || payload.length === 0 || !coordinate || !viewBox) return null

    const tooltipMaxWidth = 300 // px, keep in sync with styles below
    const horizontalGap = 16 // px gap from cursor
    const numericLabel = Number(label)
    const flipAfterYear = 20
    const shouldFlipLeft = !Number.isNaN(numericLabel) && numericLabel >= flipAfterYear

    // Compute left position with simple clamping so it never goes off-canvas
    const proposedLeft = shouldFlipLeft
      ? coordinate.x - tooltipMaxWidth - horizontalGap
      : coordinate.x + horizontalGap
    const left = Math.min(Math.max(proposedLeft, 0), Math.max(0, (viewBox.width || 0) - tooltipMaxWidth))

    // Place slightly above cursor; clamp to top
    const top = Math.max((coordinate.y || 0) - 60, 0)

    return (
      <div
        style={{ position: 'absolute', left, top, zIndex: 9999, pointerEvents: 'none', maxWidth: tooltipMaxWidth }}
        className="rounded-md border border-gray-200 bg-white text-[14px] shadow-md p-3"
      >
        <div className="text-xs font-semibold text-gray-700 mb-1">Year {label}</div>
        <div className="space-y-1">
          {payload.map((p: any, idx: number) => {
            const name = p?.name
            const val = typeof p?.value === 'number' ? formatCurrency(Math.round(p.value)) : p?.value
            return (
              <div key={idx} className="flex items-center gap-2 text-gray-700">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: p?.color || '#999' }} />
                <span className="whitespace-nowrap">{name}</span>
                <span className="ml-auto font-medium">{val}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
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
        // Use fallback estimate for demo
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

  // Detect screen size once and on resize so charts can adapt spacing for phones
  useEffect(() => {
    // helper to set the flag whenever the window size changes
    const handleResize = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640)
    handleResize() // set immediately on mount
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

  // Prepare chart data
  const hasBattery = !!(data.selectedBattery && data.batteryDetails && data.batteryDetails.firstYearAnalysis)

  const productionChartData = estimate.production.monthlyKwh.map((kwh: number, i: number) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    production: kwh,
  }))

  // Combined solar + battery figures (choose plan with best annual savings)
  const solarTotalCost = estimate.costs?.totalCost || 0
  const solarNetCost = estimate.costs?.netCost || 0
  const solarIncentives = estimate.costs?.incentives || 0
  const solarMonthlySavings = estimate.savings?.monthlySavings || 0

  const hasBatteryDetails = !!(data.batteryDetails && (data.peakShaving?.tou || data.peakShaving?.ulo))
  // Selected batteries (support multiple) – fallback to single selection
  const selectedBatteryIds: string[] = Array.isArray(data.selectedBatteries) && data.selectedBatteries.length > 0
    ? data.selectedBatteries
    : (data.selectedBattery ? [data.selectedBattery] : [])
  const selectedBatterySpecs = selectedBatteryIds
    .map((id: string) => BATTERY_SPECS.find(b => b.id === id))
    .filter(Boolean) as any[]
  // Include battery section whenever any battery is selected or details exist
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

  // Aggregate battery pricing and capacity when multiple are selected
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

  // selectedBatterySpec already defined above

  // Program battery rebate (explicit) for clear breakdown (aggregated across batteries)
  const batteryProgramRebate = aggregatedBattery ? Math.min((aggregatedBattery.nominalKwh || 0) * 300, 5000) : 0
  const batteryProgramNet = includeBattery ? Math.max(0, batteryPrice - batteryProgramRebate) : 0

  const combinedTotalCost = solarTotalCost + (includeBattery ? batteryPrice : 0)
  // Use program-based battery net for transparency in Review
  const combinedNetCost = solarNetCost + (includeBattery ? batteryProgramNet : 0)
  const combinedMonthlySavings = solarMonthlySavings + (includeBattery ? batteryMonthlySavings : 0)

  return (
    <div className="max-w-full overflow-x-hidden">
      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Left sidebar - Summary */}
        <div className="space-y-4 min-w-0">
        <h2 className="text-2xl font-bold text-navy-500 mb-4">Your Solar Estimate</h2>

        {/* Property summary card */}
        <div className="card p-5 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-navy-500 rounded-lg">
              <Home className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-navy-500 mb-1 flex items-center gap-2">
                Property Location
              </h3>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 font-medium">{data.address}</p>
              </div>
              <button
                onClick={() => onBack && onBack()}
                className="text-xs text-red-500 hover:text-red-600 font-semibold mt-2.5 flex items-center gap-1 hover:gap-1.5 transition-all"
              >
                <span>Edit Details</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Map snapshot card */}
        {data.mapSnapshot && (
          <div className="card p-4 overflow-hidden">
            <h3 className="font-semibold text-gray-700 mb-3">Your Roof</h3>
            <div 
              className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors w-full"
              onClick={() => {
                setSelectedImage({ 
                  src: data.mapSnapshot, 
                  alt: 'Roof drawing on satellite map', 
                  title: 'Your Traced Roof Outline' 
                })
                setImageModalOpen(true)
              }}
              title="Click to view full size"
            >
              <img 
                src={data.mapSnapshot} 
                alt="Roof drawing on satellite map" 
                className="w-full h-auto max-w-full object-contain"
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-navy-500">
                Satellite View
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Click to view full size
            </p>
          </div>
        )}

        {/* Roof summary card */}
        <div className="card p-5 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-red-500 rounded-lg">
              <Building className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-navy-500 mb-0.5">Roof Details</h3>
              <p className="text-xs text-gray-600">Analyzed roof specifications</p>
            </div>
          </div>

          {/* Main roof stats */}
          <div className="space-y-3 mb-4">
            {/* Total Area - Prominent */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge size={18} className="text-red-500" />
                  <span className="text-sm font-semibold text-gray-700">Total Area</span>
                </div>
                <span className="text-xl font-bold text-red-500">
                  {data.roofAreaSqft?.toLocaleString()} <span className="text-sm">sq ft</span>
                </span>
              </div>
            </div>

            {/* Roof specifications grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Droplets size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium">Type</span>
                </div>
                <p className="text-sm font-semibold text-navy-500">
                  {data.roofType || 'Asphalt Shingle'}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Compass size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium">Pitch</span>
                </div>
                <p className="text-sm font-semibold text-navy-500">
                  {data.roofPitch || 'Medium'}
                </p>
              </div>

              {data.shadingLevel && (
                <>
                  <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sun size={14} className="text-gray-500" />
                      <span className="text-xs text-gray-600 font-medium">Shading</span>
                    </div>
                    <p className="text-sm font-semibold text-navy-500 capitalize">
                      {data.shadingLevel}
                    </p>
                  </div>

                  {data.roofAge && (
                    <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar size={14} className="text-gray-500" />
                        <span className="text-xs text-gray-600 font-medium">Age</span>
                      </div>
                      <p className="text-sm font-semibold text-navy-500">
                        {data.roofAge}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Section count badge */}
          {data.roofPolygon?.features && data.roofPolygon.features.length > 1 && (
            <div className="bg-navy-500 text-white rounded-lg p-2.5 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Multiple Sections</span>
                <span className="text-lg font-bold">
                  {data.roofPolygon.features.length}
                </span>
              </div>
            </div>
          )}
          
          {/* Multi-section breakdown */}
          {data.roofPolygon?.features && data.roofPolygon.features.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Compass size={12} className="text-red-500" />
                Section Analysis
              </p>
              <div className="space-y-2">
                {data.roofPolygon.features.map((feature: any, index: number) => {
                  if (feature.geometry.type !== 'Polygon') return null
                  
                  // Use manually corrected orientation from roofSections if available
                  // Otherwise calculate from polygon geometry
                  let azimuth, direction, efficiency, areaSqFt
                  
                  if (data.roofSections && data.roofSections[index]) {
                    // Use corrected data from user edits
                    const section = data.roofSections[index]
                    azimuth = section.azimuth
                    direction = section.direction
                    efficiency = section.efficiency
                    areaSqFt = section.area
                  } else {
                    // Calculate from polygon (legacy or uncorrected)
                    const areaMeters = turf.area(feature)
                    areaSqFt = Math.round(areaMeters * 10.764)
                    azimuth = calculateRoofAzimuth(feature)
                    direction = getDirectionLabel(azimuth)
                    efficiency = getOrientationEfficiency(azimuth)
                  }
                  
                  // Color based on efficiency - using brand colors
                  const efficiencyColor = efficiency >= 90 ? 'text-navy-500' : 
                                         efficiency >= 70 ? 'text-gray-700' : 'text-red-500'
                  
                  return (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">
                          Section {index + 1}
                        </span>
                        <span className="text-xs font-bold text-navy-500">
                          {areaSqFt.toLocaleString()} sq ft
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Compass size={10} />
                          {direction}
                        </span>
                        <span className={`text-xs font-bold ${efficiencyColor}`}>
                          {efficiency}% efficiency
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Photos summary card */}
        {data.photos && data.photos.length > 0 && (
          <div className="card p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Property Photos</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Total Photos: {data.photos.length}</p>
              {data.photoSummary?.byCategory?.map((cat: any) => (
                cat.count > 0 && (
                  <p key={cat.category} className="text-xs capitalize">
                    {cat.category}: {cat.count}
                  </p>
                )
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1 mt-2">
              {data.photos.slice(0, 6).map((photo: any, idx: number) => (
                <div 
                  key={idx} 
                  className="aspect-square relative rounded overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => {
                    // Open image in modal when thumbnail is clicked
                    const categoryLabel = photo.category ? ` (${photo.category})` : ''
                    setSelectedImage({ 
                      src: photo.preview, 
                      alt: `Property photo ${idx + 1}`, 
                      title: `Property Photo ${idx + 1}${categoryLabel}` 
                    })
                    setImageModalOpen(true)
                  }}
                  title="Click to view full size"
                >
                  <img 
                    src={photo.preview} 
                    alt={`Property ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {data.photos.length > 6 && (
              <p className="text-xs text-gray-500 mt-1 text-center">
                +{data.photos.length - 6} more photos
              </p>
            )}
          </div>
        )}

        {/* Energy summary card */}
        <div className="card p-5 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-navy-500 rounded-lg">
              <Bolt className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-navy-500 mb-0.5">Energy Usage</h3>
              <p className="text-xs text-gray-600">Current consumption data</p>
            </div>
          </div>

          {/* Annual usage highlight */}
          {data.energyUsage && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4 mb-3 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-100 mb-1">Annual Electricity Use</p>
                  <p className="text-3xl font-bold">
                    {data.energyUsage.annualKwh.toLocaleString()} <span className="text-base font-semibold">kWh</span>
                  </p>
                </div>
                <div className="text-5xl opacity-20">⚡</div>
              </div>
            </div>
          )}

          {/* Consumption breakdown */}
          {data.energyUsage && (
            <div className="space-y-2 mb-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Zap size={12} className="text-red-500" />
                      <span className="text-xs text-gray-600 font-medium">Daily</span>
                    </div>
                    <p className="text-base font-bold text-navy-500">
                      {data.energyUsage.dailyKwh} <span className="text-xs font-normal">kWh</span>
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar size={12} className="text-red-500" />
                      <span className="text-xs text-gray-600 font-medium">Monthly</span>
                    </div>
                    <p className="text-base font-bold text-navy-500">
                      {data.energyUsage.monthlyKwh.toLocaleString()} <span className="text-xs font-normal">kWh</span>
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp size={12} className="text-red-500" />
                      <span className="text-xs text-gray-600 font-medium">Annual</span>
                    </div>
                    <p className="text-base font-bold text-navy-500">
                      {data.energyUsage.annualKwh.toLocaleString()} <span className="text-xs font-normal">kWh</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special appliances indicator */}
          {data.appliances && data.appliances.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-900">
                    High-Consumption Appliances
                  </p>
                  <p className="text-xs text-red-700">
                    {data.appliances.length} active {data.appliances.length === 1 ? 'appliance' : 'appliances'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Right side - Results */}
        <div className="space-y-6 min-w-0">
        {/* Results header card */}
        <div className="card bg-gradient-to-r from-navy-500 to-blue-500 text-white p-6">
          <h2 className="text-2xl font-bold mb-1">Your Solar Estimate</h2>
          <p className="text-white/90">{data.address}</p>
        </div>

        {/* Selected Battery (always show if chosen) */}
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


        {/* Add-ons summary (if any selected) */}
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

        {/* Metrics grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* System Size */}
          <div className="card p-6">
            <Zap className="text-red-500 mb-3" size={32} />
            <div className="text-3xl font-bold text-navy-500 mb-1">
              {formatKw(data.solarOverride?.sizeKw ?? estimate.system.sizeKw)}
            </div>
            <div className="text-sm text-gray-600">Recommended System</div>
            <div className="text-xs text-gray-500 mt-1">~{(data.solarOverride?.numPanels ?? estimate.system.numPanels)} solar panels</div>
            {data.selectedBattery && data.batteryDetails && (
              <div className="text-xs text-navy-500 font-semibold mt-2 flex items-center gap-1">
                <Zap size={12} />
                + {data.batteryDetails.battery.brand} {data.batteryDetails.battery.usableKwh} kWh
              </div>
            )}
          </div>

          {/* Total Cost */}
          <div className="card p-6">
            <DollarSign className="text-navy-500 mb-3" size={32} />
            <div className="text-3xl font-bold text-navy-500 mb-1">
              {formatCurrency(combinedTotalCost)}
            </div>
            <div className="text-sm text-gray-600">Total System Cost</div>
            <div className="text-xs text-gray-500 mt-1">
              {includeBattery
                ? <>Solar {formatCurrency(solarTotalCost)} + Battery {formatCurrency(batteryPrice)}</>
                : 'Before incentives'}
            </div>
          </div>

          {/* Net Cost - Emphasized */}
          <div className="p-6 rounded-xl border-2 border-green-400 bg-gradient-to-br from-green-50 to-white shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="text-green-600" size={28} />
              <div className="text-sm font-semibold text-green-800">Your Net Investment</div>
            </div>
            <div className="text-4xl font-extrabold text-green-600 leading-tight">
              {formatCurrency(combinedNetCost)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              After {formatCurrency(solarIncentives + (includeBattery ? batteryProgramRebate : 0))} in rebates
              {includeBattery && (
                <>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Solar rebate: {formatCurrency(solarIncentives)} • Battery rebate: {formatCurrency(batteryProgramRebate)}
                  </div>
                  <div className="text-[11px] text-gray-500">Battery: {data.batteryDetails?.battery?.brand ? `${data.batteryDetails?.battery?.brand} ${data.batteryDetails?.battery?.model}` : aggregatedBattery?.labels?.join(' + ')} ({data.batteryDetails?.battery?.usableKwh || aggregatedBattery?.usableKwh} kWh)</div>
                </>
              )}
            </div>
          </div>

          {/* Monthly Savings */}
          {(() => {
            // Calculate TOU and ULO monthly savings if both plans exist
            let touMonthly = combinedMonthlySavings
            let uloMonthly = combinedMonthlySavings
            if (tou && ulo && includeBattery) {
              const touAnnual = (tou?.result?.annualSavings || 0) + (estimate.savings?.annualSavings || 0)
              const uloAnnual = (ulo?.result?.annualSavings || 0) + (estimate.savings?.annualSavings || 0)
              touMonthly = Math.round(touAnnual / 12)
              uloMonthly = Math.round(uloAnnual / 12)
            }
            
            return (
              <div className="p-6 rounded-xl border-2 border-red-400 bg-gradient-to-br from-red-50 to-white shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="text-red-600" size={28} />
                  <div className="text-sm font-semibold text-red-800">Monthly Savings</div>
                </div>
                {tou && ulo && includeBattery ? (
                  <>
                    <div className="space-y-2 mb-3">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Sun size={14} className="text-navy-400" />
                          <div className="text-xs text-gray-600 font-medium">TOU Plan</div>
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(touMonthly)}
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Moon size={14} className="text-navy-400" />
                          <div className="text-xs text-gray-600 font-medium">ULO Plan</div>
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(uloMonthly)}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-extrabold text-red-600 leading-tight">
                      {formatCurrency(combinedMonthlySavings)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {displayPlan && (
                        <>
                          Based on {displayPlan.toUpperCase()} rate plan
                          {includeBattery && (
                            <div className="text-[11px] text-gray-500 mt-1">
                              Solar ${solarMonthlySavings.toLocaleString()}/mo + Battery ${batteryMonthlySavings.toLocaleString()}/mo
                            </div>
                          )}
                        </>
                      )}
                      {!displayPlan && (
                        <>
                          {includeBattery ? 'Solar + Battery savings' : 'Estimated monthly savings'}
                        </>
                      )}
                      {includeBattery && (
                        <div className="text-[11px] text-gray-500 mt-2">
                          Battery-only savings: ${batteryAnnualSavings.toLocaleString()}/yr ({Math.round(batteryAnnualSavings/12).toLocaleString()}/mo)
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })()}
        </div>

        {/* Clear Cost Breakdown (shown before totals to avoid confusion) */}
        <div className="card p-6 bg-white border border-gray-200">
          <h3 className="text-lg font-bold text-navy-600 mb-3">Cost Breakdown</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="font-semibold text-gray-700 mb-2">Solar</div>
              <div className="flex justify-between"><span>Total (before rebates)</span><span className="font-bold text-navy-600">{formatCurrency(solarTotalCost)}</span></div>
              <div className="flex justify-between"><span>Solar rebate</span><span className="font-bold text-green-600">-{formatCurrency(solarIncentives)}</span></div>
              <div className="flex justify-between border-t border-gray-200 mt-2 pt-2"><span>Solar net</span><span className="font-bold text-navy-600">{formatCurrency(solarNetCost)}</span></div>
            </div>
            {includeBattery && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="font-semibold text-gray-700 mb-2">Battery ({aggregatedBattery?.labels?.join(' + ')})</div>
                <div className="flex justify-between"><span>Battery price</span><span className="font-bold text-navy-600">{formatCurrency(batteryPrice)}</span></div>
                <div className="flex justify-between"><span>Battery rebate</span><span className="font-bold text-green-600">-{formatCurrency(batteryProgramRebate)}</span></div>
                <div className="flex justify-between border-t border-gray-200 mt-2 pt-2"><span>Battery net</span><span className="font-bold text-navy-600">{formatCurrency(batteryProgramNet)}</span></div>
              </div>
              )}
            </div>
          {hasBatteryDetails && (
            <div className="mt-3 text-xs text-gray-600">
              Combined Net = Solar net {formatCurrency(solarNetCost)} + Battery net {formatCurrency(batteryProgramNet)} = <span className="font-semibold text-navy-600">{formatCurrency(combinedNetCost)}</span>
          </div>
          )}
        </div>

        {/* Battery Scenario Comparison removed by request */}

        {/* Battery Details Card (if battery selected) */}
        {data.selectedBattery && data.batteryDetails && (
          <div className="card p-6 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-navy-500 rounded-lg">
                  <Zap className="text-white" size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-navy-500 mb-0.5 flex items-center gap-2">
                    Battery Energy Storage
                    {data.batteryDetails.firstYearAnalysis.totalSavings >= 0 ? (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">
                        ✓ Profitable
                      </span>
                    ) : (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">
                        ⚠ Review Needed
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {data.batteryDetails.battery.brand} {data.batteryDetails.battery.model} • {data.batteryDetails.battery.usableKwh} kWh usable
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">25-Year Profit</div>
                <div className={`text-2xl font-bold ${data.batteryDetails.multiYearProjection.netProfit25Year >= 0 ? 'text-navy-500' : 'text-gray-500'}`}>
                  {data.batteryDetails.multiYearProjection.netProfit25Year >= 0 ? '+' : ''}
                  {formatCurrency(data.batteryDetails.multiYearProjection.netProfit25Year)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Battery Cost */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Battery Cost</div>
                <div className="text-lg font-bold text-navy-500">
                  {formatCurrency(data.batteryDetails.battery.price)}
                </div>
              </div>

              {/* Rebate */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Rebate</div>
                <div className="text-lg font-bold text-green-600">
                  -{formatCurrency(data.batteryDetails.battery.price - data.batteryDetails.multiYearProjection.netCost)}
                </div>
              </div>

              {/* Net Cost */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Net Cost</div>
                <div className="text-lg font-bold text-navy-500">
                  {formatCurrency(data.batteryDetails.multiYearProjection.netCost)}
                </div>
              </div>

              {/* Year 1 Savings */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Year 1 Savings</div>
                <div className={`text-lg font-bold ${data.batteryDetails.firstYearAnalysis.totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.batteryDetails.firstYearAnalysis.totalSavings >= 0 ? '+' : ''}
                  {formatCurrency(Math.round(data.batteryDetails.firstYearAnalysis.totalSavings))}
                </div>
              </div>

              {/* Payback */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Payback Period</div>
                <div className="text-lg font-bold text-navy-500">
                  {data.batteryDetails.metrics.paybackYears > 0 && data.batteryDetails.metrics.paybackYears < 100 
                    ? `${data.batteryDetails.metrics.paybackYears.toFixed(1)} yrs`
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* How it works explanation */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-navy-500">Peak Shaving:</span> Battery charges during cheap hours 
                ({data.peakShaving?.ratePlan === 'ulo' ? '3.9¢/kWh overnight' : 'off-peak rates'}), 
                discharges during expensive peak hours 
                ({data.peakShaving?.ratePlan === 'ulo' ? '39.1¢/kWh evenings' : 'on-peak rates'}). 
                Shifts {Math.round(data.batteryDetails.firstYearAnalysis.totalKwhShifted).toLocaleString()} kWh annually 
                with {data.batteryDetails.firstYearAnalysis.cyclesPerYear} cycles/year.
              </p>
            </div>
          </div>
        )}

        {/* TOU vs ULO Comparison Card - Use final results from StepBatteryPeakShavingSimple */}
        {tou && ulo && (() => {
          if (!includeBattery) return null
          // Prefer the combined results computed in StepBatteryPeakShavingSimple, fallback to re-deriving
          const touCombined = (data.peakShaving as any)?.tou?.combined
          const uloCombined = (data.peakShaving as any)?.ulo?.combined
          
          let touCombinedAnnual = touCombined?.annual || 0
          let touCombinedNet = touCombined?.netCost || 0
          let touCombinedProfit = touCombined?.projection?.netProfit25Year || 0
          let uloCombinedAnnual = uloCombined?.annual || 0
          let uloCombinedNet = uloCombined?.netCost || 0
          let uloCombinedProfit = uloCombined?.projection?.netProfit25Year || 0
          
          if (!(touCombined && uloCombined)) {
            // Fallback: derive from estimate and battery savings if combined missing
            const solarAnnual = estimate.savings?.annualSavings || 0
            const solarNet = estimate.costs?.netCost || 0
            const touAnnual = (tou?.result?.annualSavings || 0) + solarAnnual
            const uloAnnual = (ulo?.result?.annualSavings || 0) + solarAnnual
            const batteryNet = Math.max(0, (batteryPrice || 0) - (batteryProgramRebate || 0))
            const touNet = Math.max(0, solarNet + batteryNet)
            const uloNet = Math.max(0, solarNet + batteryNet)
            touCombinedAnnual = touAnnual
            uloCombinedAnnual = uloAnnual
            touCombinedNet = touNet
            uloCombinedNet = uloNet
            touCombinedProfit = calculateSimpleMultiYear({ annualSavings: touAnnual } as any, touNet, 0.05, 25).netProfit25Year
            uloCombinedProfit = calculateSimpleMultiYear({ annualSavings: uloAnnual } as any, uloNet, 0.05, 25).netProfit25Year
          }
          
          const touPayback = touCombinedNet <= 0 ? 0 : (touCombinedAnnual > 0 ? touCombinedNet / touCombinedAnnual : Infinity)
          const uloPayback = uloCombinedNet <= 0 ? 0 : (uloCombinedAnnual > 0 ? uloCombinedNet / uloCombinedAnnual : Infinity)
          
          return (
            <div className="card p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-navy-300 shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="p-2 bg-gradient-to-br from-navy-500 to-navy-600 rounded-lg shadow-md">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-navy-500">
                  Rate Plan Comparison
                </h3>
              </div>
              
              {/* Compact Comparison - 3 Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Annual Savings */}
                <div className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-200 hover:border-red-300 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <DollarSign className="text-red-500" size={18} />
                    </div>
                    <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Annual Savings</div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Sun size={12} className="text-navy-400" />
                        <div className="text-xs text-gray-600 font-medium">TOU Plan</div>
                      </div>
                      <div className="text-xl font-bold text-red-600">
                        ${Math.round(touCombinedAnnual).toLocaleString()}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Moon size={12} className="text-navy-400" />
                        <div className="text-xs text-gray-600 font-medium">ULO Plan</div>
                      </div>
                      <div className="text-xl font-bold text-red-600">
                        ${Math.round(uloCombinedAnnual).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payback Period */}
                <div className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-200 hover:border-navy-300 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-navy-100 rounded-lg">
                      <Calendar className="text-navy-500" size={18} />
                    </div>
                    <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Payback Period</div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Sun size={12} className="text-navy-400" />
                        <div className="text-xs text-gray-600 font-medium">TOU Plan</div>
                      </div>
                      <div className="text-xl font-bold text-navy-600">
                        {touPayback === Infinity ? 'N/A' : `${touPayback.toFixed(1)} years`}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Moon size={12} className="text-navy-400" />
                        <div className="text-xs text-gray-600 font-medium">ULO Plan</div>
                      </div>
                      <div className="text-xl font-bold text-navy-600">
                        {uloPayback === Infinity ? 'N/A' : `${uloPayback.toFixed(1)} years`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 25-Year Profit */}
                <div className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-200 hover:border-green-300 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <TrendingUp className="text-green-600" size={18} />
                    </div>
                    <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">25-Year Profit</div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Sun size={12} className="text-navy-400" />
                        <div className="text-xs text-gray-600 font-medium">TOU Plan</div>
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        ${Math.round(touCombinedProfit).toLocaleString()}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Moon size={12} className="text-navy-400" />
                        <div className="text-xs text-gray-600 font-medium">ULO Plan</div>
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        ${Math.round(uloCombinedProfit).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Financing Options */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-navy-500 flex items-center gap-2">
                <CreditCard size={24} className="text-red-500" />
                Financing Options
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Choose how you'd like to pay for your {hasBattery ? 'solar + battery system' : 'solar system'}
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {FINANCING_OPTIONS.map((option) => {
              const totalCost = combinedNetCost
              const financing = calculateFinancing(
                totalCost,
                option.interestRate,
                option.termYears
              )
              const isSelected = selectedFinancing === option.id
              
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedFinancing(option.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-navy-500 mb-1">
                    {option.name}
                  </div>
                  {option.termYears > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-red-500 mb-1">
                        ${financing.monthlyPayment}/mo
                      </div>
                      <div className="text-xs text-gray-600">Estimated monthly payment</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        ${totalCost.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        One-time payment
                      </div>
                      <div className="text-xs text-green-600 font-semibold">
                        Best long-term value
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          </div>
          
          
          {selectedFinancing === 'cash' && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-green-800 mb-1">
                Great choice! Cash payment offers the best long-term value.
              </p>
              <p className="text-xs text-green-700">
                You'll save on interest charges and maximize your return on investment. Your total investment of {formatCurrency(combinedNetCost)} includes all rebates and incentives.
              </p>
            </div>
          )}
        </div>

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
          {activeTab === 'savings' && (() => {
            const solarAnnual = estimate.savings?.annualSavings || 0
            const escalation = 0.05
            const years = 25

            const haveTouAndUlo = Boolean(includeBattery && tou?.result?.annualSavings != null && ulo?.result?.annualSavings != null)
            const touAnnual = (tou?.result?.annualSavings || 0) + solarAnnual
            const uloAnnual = (ulo?.result?.annualSavings || 0) + solarAnnual

            if (haveTouAndUlo) {
              // Prefer combined totals from peak-shaving results if available (keeps parity with Rate Plan Comparison)
              const touCombinedAnnual = (data.peakShaving as any)?.tou?.combined?.annual ?? touAnnual
              const uloCombinedAnnual = (data.peakShaving as any)?.ulo?.combined?.annual ?? uloAnnual
              const touCombinedNet = (data.peakShaving as any)?.tou?.combined?.netCost ?? combinedNetCost
              const uloCombinedNet = (data.peakShaving as any)?.ulo?.combined?.netCost ?? combinedNetCost

              // Build TOU and ULO cumulative series
              const series = Array.from({ length: years }, (_, idx) => {
                const y = idx + 1
                const touYear = touCombinedAnnual * Math.pow(1 + escalation, idx)
                const uloYear = uloCombinedAnnual * Math.pow(1 + escalation, idx)
                return { year: y, touAnnual: touYear, uloAnnual: uloYear }
              })
              // Accumulate cumulatives and calculate profit (cumulative - net investment)
              let cumTou = 0
              let cumUlo = 0
              const savingsSeries = series.map(row => {
                cumTou += row.touAnnual
                cumUlo += row.uloAnnual
                return { 
                  year: row.year, 
                  touCumulative: cumTou, 
                  uloCumulative: cumUlo,
                  touProfit: cumTou - touCombinedNet,
                  uloProfit: cumUlo - uloCombinedNet
                }
              })

              // Payback to match Rate Plan Comparison (Net ÷ Annual)
              const paybackTouYears = touCombinedNet <= 0 ? 0 : (touCombinedAnnual > 0 ? touCombinedNet / touCombinedAnnual : Infinity)
              const paybackUloYears = uloCombinedNet <= 0 ? 0 : (uloCombinedAnnual > 0 ? uloCombinedNet / uloCombinedAnnual : Infinity)
              // 25-year profit to match Rate Plan Comparison
              const touProfit25 = (data.peakShaving as any)?.tou?.combined?.projection?.netProfit25Year ??
                calculateSimpleMultiYear({ annualSavings: touCombinedAnnual } as any, touCombinedNet, 0.05, 25).netProfit25Year
              const uloProfit25 = (data.peakShaving as any)?.ulo?.combined?.projection?.netProfit25Year ??
                calculateSimpleMultiYear({ annualSavings: uloCombinedAnnual } as any, uloCombinedNet, 0.05, 25).netProfit25Year

              return (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Annual Savings (Year 1)</div>
                      <div className="text-[13px] text-gray-600">TOU</div>
                      <div className="text-base sm:text-xl font-bold text-navy-600">{formatCurrency(Math.round(touCombinedAnnual))}</div>
                      <div className="mt-1 text-[13px] text-gray-600">ULO</div>
                      <div className="text-base sm:text-xl font-bold text-navy-600">{formatCurrency(Math.round(uloCombinedAnnual))}</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Your Net Investment</div>
                      <div className="text-xl font-bold text-navy-600">{formatCurrency(Math.max(touCombinedNet, uloCombinedNet))}</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Estimated Payback</div>
                      <div className="text-[13px] text-gray-600">TOU</div>
                      <div className="text-base sm:text-xl font-bold text-navy-600">{paybackTouYears === Infinity ? 'N/A' : `${paybackTouYears.toFixed(1)} yrs`}</div>
                      <div className="mt-1 text-[13px] text-gray-600">ULO</div>
                      <div className="text-base sm:text-xl font-bold text-navy-600">{paybackUloYears === Infinity ? 'N/A' : `${paybackUloYears.toFixed(1)} yrs`}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Chart container with responsive height and margins */}
                    <div className="chart-scroll-container h-[22rem] sm:h-80 md:h-80 w-full overflow-x-visible overflow-y-visible relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={savingsSeries} margin={isMobile ? { top: 8, right: 20, left: 36, bottom: 36 } : { top: 10, right: 160, left: 48, bottom: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="year" 
                            tick={{ fontSize: isMobile ? 10 : 11 }} 
                            label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                          />
                          <YAxis 
                            tick={{ fontSize: isMobile ? 10 : 11 }} 
                            tickFormatter={(v: number) => `$${Math.round(v/1000)}k`}
                            label={{ value: 'Amount', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                            width={isMobile ? 38 : 50}
                          />
                          <Tooltip 
                            content={<SavingsTooltip />} 
                            allowEscapeViewBox={{ x: true, y: true }} 
                            cursor={{ stroke: '#1B4E7C', strokeWidth: 2, strokeDasharray: '4 4' }} 
                            wrapperStyle={{ transform: 'none', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="touCumulative" 
                            stroke="#1B4E7C" 
                            strokeWidth={isMobile ? 2 : 2.5} 
                            strokeDasharray="5 5" 
                            dot={{ r: isMobile ? 3 : 4, fill: '#1B4E7C', strokeWidth: 2, stroke: 'white' }} 
                            activeDot={{ r: isMobile ? 6 : 7, fill: '#1B4E7C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                            name="Cumulative Savings (TOU)" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="uloCumulative" 
                            stroke="#DC143C" 
                            strokeWidth={isMobile ? 2 : 2.5} 
                            strokeDasharray="5 5" 
                            dot={{ r: isMobile ? 3 : 4, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }} 
                            activeDot={{ r: isMobile ? 6 : 7, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                            name="Cumulative Savings (ULO)" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="touProfit" 
                            stroke="#1B4E7C" 
                            strokeWidth={isMobile ? 3 : 3.5} 
                            dot={{ r: isMobile ? 4 : 5, fill: '#1B4E7C', strokeWidth: 2, stroke: 'white' }} 
                            activeDot={{ r: isMobile ? 7 : 8, fill: '#1B4E7C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                            name="25-Year Profit (TOU)" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="uloProfit" 
                            stroke="#DC143C" 
                            strokeWidth={isMobile ? 3 : 3.5} 
                            dot={{ r: isMobile ? 4 : 5, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }} 
                            activeDot={{ r: isMobile ? 7 : 8, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                            name="25-Year Profit (ULO)" 
                          />
                          <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                          <ReferenceLine y={Math.max(touCombinedNet, uloCombinedNet)} stroke="#16a34a" strokeDasharray="4 4" label={{ value: `Net Investment ${formatCurrency(Math.max(touCombinedNet, uloCombinedNet))}`, position: 'left', fill: '#166534', fontSize: 11 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Legend moved outside chart container for mobile */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-0.5 bg-[#1B4E7C] border-dashed border border-[#1B4E7C]"></div>
                          <span className="text-gray-700">Cumulative Savings (TOU)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-0.5 bg-[#DC143C] border-dashed border border-[#DC143C]"></div>
                          <span className="text-gray-700">Cumulative Savings (ULO)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 bg-[#1B4E7C]"></div>
                          <span className="text-gray-700">25-Year Profit (TOU)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 bg-[#DC143C]"></div>
                          <span className="text-gray-700">25-Year Profit (ULO)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">25-Year Profit (TOU)</div>
                      <div className="text-base sm:text-xl font-bold text-green-700">{formatCurrency(Math.round(touProfit25))}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">25-Year Profit (ULO)</div>
                      <div className="text-base sm:text-xl font-bold text-green-700">{formatCurrency(Math.round(uloProfit25))}</div>
                    </div>
                  </div>
                </div>
              )
            }

            // Fallback: single plan (selected/best)
            const planAnnual = planData?.result?.annualSavings || 0
            const combinedAnnual = solarAnnual + (includeBattery ? planAnnual : 0)
            const savingsSeries: { year: number; annual: number; cumulative: number; profit: number }[] = []
            let cumulative = 0
            for (let y = 1; y <= years; y++) {
              const annual = combinedAnnual * Math.pow(1 + escalation, y - 1)
              cumulative += annual
              savingsSeries.push({ year: y, annual, cumulative, profit: cumulative - combinedNetCost })
            }
            // Payback to match Rate Plan Comparison
            const paybackYears = combinedNetCost <= 0 ? 0 : (combinedAnnual > 0 ? combinedNetCost / combinedAnnual : Infinity)
            const profit25 = calculateSimpleMultiYear({ annualSavings: combinedAnnual } as any, combinedNetCost, 0.05, 25).netProfit25Year

            return (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Combined Annual Savings (Year 1)</div>
                    <div className="text-xl font-bold text-navy-600">{formatCurrency(Math.round(combinedAnnual))}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Your Net Investment</div>
                    <div className="text-xl font-bold text-navy-600">{formatCurrency(combinedNetCost)}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Estimated Payback</div>
                    <div className="text-xl font-bold text-navy-600">{paybackYears === Infinity ? 'N/A' : `${paybackYears.toFixed(1)} yrs`}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Chart container with responsive height and margins */}
                  <div className="chart-scroll-container h-[22rem] sm:h-96 md:h-[26rem] w-full overflow-x-visible overflow-y-visible relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={savingsSeries} margin={isMobile ? { top: 8, right: 20, left: 36, bottom: 36 } : { top: 10, right: 160, left: 48, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year" 
                          tick={{ fontSize: isMobile ? 10 : 11 }} 
                          label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                        />
                        <YAxis 
                          tick={{ fontSize: isMobile ? 10 : 11 }} 
                          tickFormatter={(v: number) => `$${Math.round(v/1000)}k`}
                          label={{ value: 'Amount', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                          width={isMobile ? 38 : 50}
                        />
                        <Tooltip 
                          content={<SavingsTooltip />} 
                          allowEscapeViewBox={{ x: true, y: true }} 
                          cursor={{ stroke: '#DC143C', strokeWidth: 2, strokeDasharray: '4 4' }} 
                          wrapperStyle={{ transform: 'none', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="cumulative" 
                          stroke="#DC143C" 
                          strokeWidth={isMobile ? 2 : 2.5} 
                          strokeDasharray="5 5" 
                          dot={{ r: isMobile ? 3 : 4, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }} 
                          activeDot={{ r: isMobile ? 6 : 7, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                          name="Cumulative Savings" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="profit" 
                          stroke="#DC143C" 
                          strokeWidth={isMobile ? 3 : 3.5} 
                          dot={{ r: isMobile ? 4 : 5, fill: '#DC143C', strokeWidth: 2, stroke: 'white' }} 
                          activeDot={{ r: isMobile ? 7 : 8, fill: '#DC143C', strokeWidth: 2, stroke: 'white', cursor: 'pointer' }}
                          name="25-Year Profit" 
                        />
                        <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                        <ReferenceLine y={combinedNetCost} stroke="#16a34a" strokeDasharray="4 4" label={{ value: `Net Investment ${formatCurrency(combinedNetCost)}`, position: 'left', fill: '#166534', fontSize: 11 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend moved outside chart container for mobile */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-[#DC143C] border-dashed border border-[#DC143C]"></div>
                        <span className="text-gray-700">Cumulative Savings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-[#DC143C]"></div>
                        <span className="text-gray-700">25-Year Profit</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">25-Year Profit</div>
                  <div className="text-base sm:text-xl font-bold text-green-700">{formatCurrency(Math.round(profit25))}</div>
                </div>
              </div>
            )
          })()}

          {activeTab === 'production' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Annual Production</div>
                  <div className="text-xl font-bold text-navy-500">
                    {formatNumber(estimate.production.annualKwh)} kWh
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Daily Average</div>
                  <div className="text-xl font-bold text-navy-500">
                    {Math.round(estimate.production.annualKwh / 365)} kWh
                  </div>
                </div>
              </div>

              {/* Production chart */}
              <div className="h-[20rem] sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="production" stroke="#1B4E7C" strokeWidth={isMobile ? 2 : 2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'environmental' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <Leaf className="text-green-600 flex-shrink-0" size={40} />
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {estimate.environmental.co2OffsetTonsPerYear} tons
                    </div>
                    <div className="text-sm text-gray-600">CO₂ offset per year</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">🌲</span>
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {estimate.environmental.treesEquivalent}
                    </div>
                    <div className="text-sm text-gray-600">Trees planted equivalent</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">🚗</span>
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {estimate.environmental.carsOffRoadEquivalent}
                    </div>
                    <div className="text-sm text-gray-600">Cars off road equivalent</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">♻️</span>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Supports renewable energy grid</div>
                    <div className="text-xs text-gray-500">Contributes to Ontario's clean energy goals</div>
                  </div>
                </div>
              </div>
            </div>
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
  )
}

