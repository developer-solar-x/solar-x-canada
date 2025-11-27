'use client'

// Net Metering Savings Step
// Two-column layout matching PeakShavingSalesCalculatorFRD format
// Left: Calculator inputs (usage, panels, rate plan)
// Right: Results with donut chart

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Zap, AlertTriangle, Info, Sun, Moon, BarChart3, DollarSign, TrendingUp, Clock } from 'lucide-react'
import type { NetMeteringResult } from '@/lib/net-metering'
import type { EstimatorData } from '@/app/estimator/page'
import { DEFAULT_TOU_DISTRIBUTION, DEFAULT_ULO_DISTRIBUTION, type UsageDistribution, calculateSimpleMultiYear } from '@/lib/simple-peak-shaving'
import { BLENDED_RATE } from '../StepEnergySimple/constants'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

interface StepNetMeteringProps {
  data: EstimatorData
  onComplete: (data: Partial<EstimatorData>) => void
  onBack: () => void
}

// Donut chart component
function DonutChart({ 
  touOffset = 0,
  uloOffset = 0,
  tieredOffset = 0,
  selectedPlan = 'tou'
}: {
  touOffset?: number
  uloOffset?: number
  tieredOffset?: number
  selectedPlan?: 'tou' | 'ulo' | 'tiered'
}) {
  const offset = selectedPlan === 'ulo' ? uloOffset : selectedPlan === 'tiered' ? tieredOffset : touOffset
  // Cap display at 100% for visual representation, but keep actual value for text
  const displayOffset = Math.min(100, offset)
  const remaining = 100 - displayOffset
  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference - (displayOffset / 100) * circumference
  
  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
        {/* Background circle */}
        <circle
          cx="140"
          cy="140"
          r="120"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="40"
        />
        {/* Offset circle */}
        <circle
          cx="140"
          cy="140"
          r="120"
          fill="none"
          stroke={selectedPlan === 'ulo' ? '#8b5cf6' : selectedPlan === 'tiered' ? '#f59e0b' : '#3b82f6'}
          strokeWidth="40"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800">
            {displayOffset.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {offset >= 100 ? 'Bill Fully Offset' : 'Bill Offset'}
        </div>
          {offset > 100 && (
            <div className="text-xs text-emerald-600 mt-1 font-semibold">
              +{(offset - 100).toFixed(1)}% Credit
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function StepNetMetering({ data, onComplete, onBack }: StepNetMeteringProps) {
  const [touResults, setTouResults] = useState<NetMeteringResult | null>(null)
  const [uloResults, setUloResults] = useState<NetMeteringResult | null>(null)
  const [tieredResults, setTieredResults] = useState<NetMeteringResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localEstimate, setLocalEstimate] = useState<any>(null)
  
  // Inputs
  const [annualUsageInput, setAnnualUsageInput] = useState('')
  const [solarPanels, setSolarPanels] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<'tou' | 'ulo' | 'tiered'>('tou')
  const [activeTab, setActiveTab] = useState<'basic' | 'distribution'>('basic')
  const [touDistribution, setTouDistribution] = useState<UsageDistribution>(DEFAULT_TOU_DISTRIBUTION)
  const [uloDistribution, setUloDistribution] = useState<UsageDistribution>(DEFAULT_ULO_DISTRIBUTION)
  const [overrideEstimateLoading, setOverrideEstimateLoading] = useState(false)
  const [openModal, setOpenModal] = useState<'payback' | 'profit' | 'credits' | 'coverage' | 'donut' | null>(null)
  const [showPeriodBreakdown, setShowPeriodBreakdown] = useState(false)
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false)

  // Get production and usage data - use local estimate if available
  const estimate = localEstimate || data.estimate
  const panelWattage = estimate?.system?.panelWattage || 500
  
  // Parse inputs (needed before useEffect)
  const annualUsageKwh = parseFloat(annualUsageInput) || 0
  
  // Fetch estimate if missing (when component mounts or when coordinates/roof data changes)
  useEffect(() => {
    // If we already have an estimate with production data, use it
    if (data.estimate?.production?.monthlyKwh && data.estimate.production.monthlyKwh.length === 12) {
      if (!localEstimate || localEstimate !== data.estimate) {
        setLocalEstimate(data.estimate)
      }
      return
    }

    // If we don't have an estimate but have required data, fetch it
    if (!data.coordinates || (!data.roofPolygon && !data.roofAreaSqft)) {
      return
    }

    const calculatedUsage = annualUsageKwh || data.energyUsage?.annualKwh || data.annualUsageKwh || (data.monthlyBill ? (data.monthlyBill / BLENDED_RATE) * 12 : 0)

    const fetchEstimate = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates: data.coordinates,
            roofPolygon: data.roofPolygon,
            roofAreaSqft: data.roofAreaSqft,
            roofType: data.roofType,
            roofAge: data.roofAge,
            roofPitch: data.roofPitch,
            shadingLevel: data.shadingLevel,
            monthlyBill: data.monthlyBill,
            annualUsageKwh: calculatedUsage,
            energyUsage: data.energyUsage,
            province: 'ON',
            roofAzimuth: data.roofAzimuth || 180,
            programType: data.programType || 'net_metering',
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to generate solar production estimate')
        }

        const result = await response.json()
        
        if (result.data?.production?.monthlyKwh && result.data.production.monthlyKwh.length === 12) {
          setLocalEstimate(result.data)
        } else {
          throw new Error('Invalid estimate data received - missing monthly production data')
        }
      } catch (err) {
        console.error('Error fetching estimate:', err)
        setError(err instanceof Error ? err.message : 'Failed to generate solar production estimate. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchEstimate()
  }, [data.coordinates, data.roofPolygon, data.roofAreaSqft, data.estimate, annualUsageKwh, data.energyUsage?.annualKwh, data.annualUsageKwh, data.monthlyBill])

  // Initialize solar panels from estimate when it becomes available
  useEffect(() => {
    const currentEstimate = localEstimate || data.estimate
    if (!currentEstimate) return
    
    const initialPanels = (data as any).solarOverride?.numPanels ?? currentEstimate?.system?.numPanels ?? 0
    if (initialPanels > 0 && solarPanels === 0) {
      setSolarPanels(initialPanels)
    }
  }, [localEstimate, data.estimate])

  // Initialize usage separately to avoid dependency issues
  useEffect(() => {
    const calculatedUsage = data.energyUsage?.annualKwh || data.annualUsageKwh || (data.monthlyBill ? (data.monthlyBill / BLENDED_RATE) * 12 : 0)
    if (calculatedUsage > 0 && (!annualUsageInput || parseFloat(annualUsageInput) === 0)) {
      setAnnualUsageInput(Math.round(calculatedUsage).toString())
    }
  }, [data.energyUsage?.annualKwh, data.annualUsageKwh, data.monthlyBill])

  const systemSizeKwOverride = solarPanels > 0 ? Math.round(((solarPanels * panelWattage) / 1000) * 2) / 2 : 0
  const effectiveSystemSizeKw = systemSizeKwOverride || estimate?.system?.sizeKw || 0
  const solarProductionKwh = estimate?.production?.annualKwh || 0

  // Calculate payback period and 25-year profit for net metering
  const calculatePayback = (firstYearSavings: number, netCost: number, escalationRate: number): number => {
    if (netCost <= 0 || firstYearSavings <= 0) return Infinity
    let cumulativeSavings = 0
    for (let year = 1; year <= 25; year++) {
      const yearSavings = firstYearSavings * Math.pow(1 + escalationRate, year - 1)
      cumulativeSavings += yearSavings
      if (cumulativeSavings >= netCost) {
        const prevYearSavings = year > 1 ? firstYearSavings * Math.pow(1 + escalationRate, year - 2) : 0
        const prevCumulative = cumulativeSavings - yearSavings
        const remaining = netCost - prevCumulative
        const fraction = remaining / yearSavings
        return (year - 1) + fraction
      }
    }
    return Infinity
  }

  // Get net cost and escalation rate
  const netCost = estimate?.costs?.netCost || 0
  const escalation = data.annualEscalator || 0.03

  // Calculate metrics for selected plan
  const selectedResult = selectedPlan === 'ulo' ? uloResults : selectedPlan === 'tiered' ? tieredResults : touResults
  const annualSavings = selectedResult ? selectedResult.annual.importCost - selectedResult.annual.netAnnualBill : 0
  const paybackYears = selectedResult && netCost > 0 ? calculatePayback(annualSavings, netCost, escalation) : Infinity
  const profit25 = selectedResult && netCost > 0 
    ? calculateSimpleMultiYear({ annualSavings } as any, netCost, escalation, 25).netProfit25Year
    : 0

  // Fetch/regenerate estimate when panel count changes (only if user modifies it)
  useEffect(() => {
    // Skip if no coordinates or panels haven't been initialized
    if (!data?.coordinates || solarPanels <= 0) {
      return
    }
    
    // Only fetch if we're overriding (different from original estimate)
    const originalPanels = data.estimate?.system?.numPanels ?? 0
    const isOverriding = solarPanels !== originalPanels
    
    if (!isOverriding) {
      // Use existing estimate
      return
    }
    
    const run = async () => {
      try {
        setOverrideEstimateLoading(true)
        const resp = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates: data.coordinates,
            roofPolygon: data.roofPolygon,
            roofType: data.roofType || 'asphalt_shingle',
            roofAge: data.roofAge || '0-5',
            roofPitch: data.roofPitch || 'medium',
            shadingLevel: data.shadingLevel || 'minimal',
            monthlyBill: data.monthlyBill,
            annualUsageKwh: annualUsageKwh,
            energyUsage: data.energyUsage,
            province: 'ON',
            roofAzimuth: data.roofAzimuth || 180,
            roofAreaSqft: data.roofAreaSqft,
            overrideSystemSizeKw: systemSizeKwOverride,
          }),
        })
        if (resp.ok) {
          const json = await resp.json()
          setLocalEstimate(json.data)
        }
      } catch (e) {
        console.warn('Override estimate failed', e)
      } finally {
        setOverrideEstimateLoading(false)
      }
    }
    
    const timeoutId = setTimeout(run, 500)
    return () => clearTimeout(timeoutId)
  }, [solarPanels, systemSizeKwOverride, data.coordinates, data.roofPolygon, annualUsageKwh, data.estimate?.system?.numPanels])

  // Calculate net metering for all three plans
  useEffect(() => {
    const currentEstimate = localEstimate || data.estimate
    const monthlyProduction = currentEstimate?.production?.monthlyKwh || []
    
    if (!currentEstimate?.production?.monthlyKwh || monthlyProduction.length !== 12 || annualUsageKwh <= 0) {
      return
    }

    const calculateNetMetering = async (planId: 'tou' | 'ulo' | 'tiered') => {
      try {
        setLoading(true)
        setError(null)

        const distribution = planId === 'ulo' ? uloDistribution : touDistribution
        
        const response = await fetch('/api/net-metering', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monthlySolarProduction: monthlyProduction,
            annualUsageKwh: annualUsageKwh,
            ratePlanId: planId,
            year: new Date().getFullYear(),
            usageDistribution: distribution,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate net metering')
        }

        const result = await response.json()
        
        if (planId === 'tou') {
          setTouResults(result.data)
        } else if (planId === 'ulo') {
          setUloResults(result.data)
        } else {
          setTieredResults(result.data)
        }
      } catch (err) {
        console.error('Net metering calculation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to calculate net metering')
      } finally {
          setLoading(false)
      }
    }

    // Calculate all three plans
    Promise.all([
      calculateNetMetering('tou'),
      calculateNetMetering('ulo'),
      calculateNetMetering('tiered')
    ])
  }, [localEstimate, data.estimate, annualUsageKwh, touDistribution, uloDistribution])

  const handleContinue = () => {
    if (!touResults || !uloResults || !tieredResults) {
      setError('Please wait for calculations to complete')
      return
    }

    // Determine which plan has better savings
    const bestPlan = uloResults.annual.exportCredits > touResults.annual.exportCredits 
      ? (uloResults.annual.exportCredits > tieredResults.annual.exportCredits ? 'ulo' : 'tiered')
      : (touResults.annual.exportCredits > tieredResults.annual.exportCredits ? 'tou' : 'tiered')

    // Calculate projections for all plans
    const currentEstimate = localEstimate || data.estimate
    const currentNetCost = currentEstimate?.costs?.netCost || 0
    const currentEscalation = data.annualEscalator || 0.03
    
    const touAnnualSavings = touResults.annual.importCost - touResults.annual.netAnnualBill
    const uloAnnualSavings = uloResults.annual.importCost - uloResults.annual.netAnnualBill
    const tieredAnnualSavings = tieredResults.annual.importCost - tieredResults.annual.netAnnualBill
    
    const touPaybackYears = currentNetCost > 0 ? calculatePayback(touAnnualSavings, currentNetCost, currentEscalation) : Infinity
    const uloPaybackYears = currentNetCost > 0 ? calculatePayback(uloAnnualSavings, currentNetCost, currentEscalation) : Infinity
    const tieredPaybackYears = currentNetCost > 0 ? calculatePayback(tieredAnnualSavings, currentNetCost, currentEscalation) : Infinity
    
    const touProfit25 = currentNetCost > 0 
      ? calculateSimpleMultiYear({ annualSavings: touAnnualSavings } as any, currentNetCost, currentEscalation, 25).netProfit25Year
      : 0
    const uloProfit25 = currentNetCost > 0
      ? calculateSimpleMultiYear({ annualSavings: uloAnnualSavings } as any, currentNetCost, currentEscalation, 25).netProfit25Year
      : 0
    const tieredProfit25 = currentNetCost > 0
      ? calculateSimpleMultiYear({ annualSavings: tieredAnnualSavings } as any, currentNetCost, currentEscalation, 25).netProfit25Year
      : 0

    onComplete({
      ...(localEstimate && !data.estimate ? { estimate: localEstimate } : {}),
      solarOverride: { numPanels: solarPanels, sizeKw: systemSizeKwOverride },
      netMetering: {
        tou: {
          ...touResults,
          projection: {
            paybackYears: touPaybackYears === Infinity ? null : touPaybackYears,
            netProfit25Year: touProfit25,
            annualSavings: touAnnualSavings,
          }
        },
        ulo: {
          ...uloResults,
          projection: {
            paybackYears: uloPaybackYears === Infinity ? null : uloPaybackYears,
            netProfit25Year: uloProfit25,
            annualSavings: uloAnnualSavings,
          }
        },
        tiered: {
          ...tieredResults,
          projection: {
            paybackYears: tieredPaybackYears === Infinity ? null : tieredPaybackYears,
            netProfit25Year: tieredProfit25,
            annualSavings: tieredAnnualSavings,
          }
        },
        selectedRatePlan: bestPlan,
      },
      peakShaving: {
        ratePlan: bestPlan,
        annualUsageKwh: annualUsageKwh,
        selectedBattery: 'none',
        comparisons: [],
      }
    } as any)
  }

  const hasErrors = annualUsageKwh <= 0

  return (
    <div className="w-full bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-4 md:py-6">
      <div className="w-full max-w-none">
        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 xl:gap-8 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
          
          {/* LEFT COLUMN: Calculator Inputs */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Calculator Inputs</h2>
                
            {/* Tab Navigation */}
                <div className="mt-4 flex gap-2 border-b border-gray-300">
                <button
                  onClick={() => setActiveTab('basic')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${
                    activeTab === 'basic'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                    Basic Inputs
                </button>
                <button
                  onClick={() => setActiveTab('distribution')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${
                    activeTab === 'distribution'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Usage Distribution
                </button>
              </div>
            </div>

              <div className="p-4 md:p-5 space-y-3">
            {activeTab === 'basic' && (
              <>
                    {/* Annual Usage */}
                    <div>
                      <label className="block text-base md:text-lg font-semibold text-gray-700 mb-2">
                        Annual Usage (kWh)
                      </label>
                      <input
                        type="number"
                        value={annualUsageInput}
                        onChange={(e) => setAnnualUsageInput(e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base md:text-lg ${
                          hasErrors ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                        min="0"
                        step="100"
                      />
                      {hasErrors && (
                        <div className="mt-2 flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                          <p className="text-xs text-red-700">
                            Annual energy usage must be greater than 0 kWh to calculate savings.
                          </p>
              </div>
            )}
                    </div>

                    {/* Solar System Size */}
                    <div className="pt-2 border-t border-gray-200">
                      <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Sun className="text-green-600" size={18} />
                        Solar System Size
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            System Size (kW)
                          </label>
                          <div className="px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-base md:text-lg font-bold text-green-600">
                            {effectiveSystemSizeKw?.toFixed(1) || '0.0'} kW
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Solar Panels
                          </label>
                          <input
                            type="number"
                            value={solarPanels}
                            min={0}
                            onChange={(e) => setSolarPanels(Math.max(0, Number(e.target.value)))}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base md:text-lg font-semibold text-green-700"
                            disabled={overrideEstimateLoading}
                        />
                      </div>
                        </div>
                      {overrideEstimateLoading && (
                        <div className="mt-2 text-xs text-blue-600 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          Updating production estimate...
                      </div>
                    )}
                                </div>

                    {/* Solar Production */}
                      <div>
                      <label className="block text-base md:text-lg font-semibold text-gray-700 mb-2">
                        Annual Solar Production (kWh)
                      </label>
                      <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-base md:text-lg font-semibold text-gray-700">
                        {Math.round(solarProductionKwh).toLocaleString()} kWh
                      </div>
                      <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-blue-700">
                          Adjust the number of solar panels above to change production.
                          </p>
                        </div>
                        </div>

                    {/* Rate Plan Selection */}
                    <div>
                      <label className="block text-base md:text-lg font-semibold text-gray-700 mb-2">
                        Rate Plan
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setSelectedPlan('tou')}
                          className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                            selectedPlan === 'tou'
                              ? 'bg-blue-500 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                          }`}
                        >
                          <div className="text-xs mb-1">TOU</div>
                          <div className="text-sm">Time of Use</div>
                        </button>
                        <button
                          onClick={() => setSelectedPlan('ulo')}
                          className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                            selectedPlan === 'ulo'
                              ? 'bg-purple-500 border-purple-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                          }`}
                        >
                          <div className="text-xs mb-1">ULO</div>
                          <div className="text-sm">Ultra-Low Overnight</div>
                        </button>
                        <button
                          onClick={() => setSelectedPlan('tiered')}
                          className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                            selectedPlan === 'tiered'
                              ? 'bg-amber-500 border-amber-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-amber-400'
                          }`}
                        >
                          <div className="text-xs mb-1">Tiered</div>
                          <div className="text-sm">Flat Rate</div>
                        </button>
                                </div>
                                </div>
              </>
            )}

            {activeTab === 'distribution' && (
                  <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-blue-700">
                          Customize how your annual usage is distributed across different rate periods.
                    </p>
                  </div>
                </div>

                  {/* TOU Distribution */}
                    <div className="bg-white rounded-lg border-2 border-gray-300 p-4">
                      <h3 className="font-bold text-blue-600 text-lg mb-3">Time-of-Use (TOU)</h3>
                      <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">On-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={touDistribution.onPeakPercent}
                            onChange={(e) => setTouDistribution({...touDistribution, onPeakPercent: Number(e.target.value)})}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Mid-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={touDistribution.midPeakPercent}
                            onChange={(e) => setTouDistribution({...touDistribution, midPeakPercent: Number(e.target.value)})}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Off-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={touDistribution.offPeakPercent}
                            onChange={(e) => setTouDistribution({...touDistribution, offPeakPercent: Number(e.target.value)})}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                  </div>

                  {/* ULO Distribution */}
                    <div className="bg-white rounded-lg border-2 border-gray-300 p-4">
                      <h3 className="font-bold text-purple-600 text-lg mb-3">Ultra-Low Overnight (ULO)</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-gray-700">Ultra-Low:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={uloDistribution.ultraLowPercent || 0}
                              onChange={(e) => setUloDistribution({...uloDistribution, ultraLowPercent: Number(e.target.value)})}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-sm text-gray-600">%</span>
                    </div>
                        </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">On-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={uloDistribution.onPeakPercent}
                            onChange={(e) => setUloDistribution({...uloDistribution, onPeakPercent: Number(e.target.value)})}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Mid-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={uloDistribution.midPeakPercent}
                            onChange={(e) => setUloDistribution({...uloDistribution, midPeakPercent: Number(e.target.value)})}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Off-Peak:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={uloDistribution.offPeakPercent}
                            onChange={(e) => setUloDistribution({...uloDistribution, offPeakPercent: Number(e.target.value)})}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                        </div>
                      </div>
                        </div>
                      </div>
                    </div>
                        )}
                    </div>
                  </div>

            {/* Key Financial Metrics - Under Calculator Inputs */}
            {!hasErrors && selectedResult && netCost > 0 && (
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Key Financial Metrics</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Payback Period */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-blue-600" size={20} />
                      <div className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                        Payback Period
                        <button
                          onClick={() => setOpenModal('payback')}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          aria-label="Learn more about payback period"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {paybackYears === Infinity ? 'N/A' : `${paybackYears.toFixed(1)} yrs`}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Time to recover investment</div>
                  </div>

                  {/* 25-Year Profit */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="text-green-600" size={20} />
                      <div className="text-xs text-green-700 font-semibold flex items-center gap-1">
                        25-Year Profit
                        <button
                          onClick={() => setOpenModal('profit')}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          aria-label="Learn more about 25-year profit"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${profit25 >= 0 ? 'text-green-900' : 'text-gray-700'}`}>
                      {profit25 >= 0 ? '+' : ''}{formatCurrency(Math.round(profit25))}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Total profit after payback</div>
                  </div>

                  {/* Annual Credits */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="text-emerald-600" size={20} />
                      <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        Annual Credits
                        <button
                          onClick={() => setOpenModal('credits')}
                          className="text-emerald-600 hover:text-emerald-800 transition-colors"
                          aria-label="Learn more about annual credits"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-900">
                      ${selectedResult.annual.exportCredits.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">From exported solar</div>
                  </div>

                  {/* Energy Coverage */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="text-amber-600" size={20} />
                      <div className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                        Energy Coverage
                        <button
                          onClick={() => setOpenModal('coverage')}
                          className="text-amber-600 hover:text-amber-800 transition-colors"
                          aria-label="Learn more about energy coverage"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-900">
                      {((selectedResult.annual.totalSolarProduction / selectedResult.annual.totalLoad) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Of your usage from solar</div>
                  </div>
                </div>

                {/* Electricity rate & savings disclaimer */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-gray-700">
                    Savings projections assume current publicly available electricity rates, including time-of-use
                    (TOU), ultra-low overnight (ULO), tiered, or other utility structures. Utilities may change their
                    rates, fees, or billing rules at any time, which may affect future savings.
                  </p>
                </div>
              </div>
            )}

            {/* Info Modals */}
            <Modal
              isOpen={openModal === 'payback'}
              onClose={() => setOpenModal(null)}
              title="Payback Period"
              message="The payback period is the time it takes for your solar system savings to equal the initial investment cost."
              variant="info"
              cancelText="Close"
            >
              <p className="mb-3">
                This calculation accounts for:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                <li>
                  <span className="font-semibold">Net investment</span> (system cost with no rebates for net metering):{' '}
                  {formatCurrency(netCost)}
                </li>
                {selectedResult && (
                  <>
                    <li>
                      <span className="font-semibold">Annual export credits</span> (Year 1):{' '}
                      {`$${selectedResult.annual.exportCredits.toFixed(2)}`}
                    </li>
                    <li>
                      <span className="font-semibold">Annual import cost after solar</span> (Year 1):{' '}
                      {`$${selectedResult.annual.importCost.toFixed(2)}`}
                    </li>
                    <li>
                      <span className="font-semibold">Net annual bill</span> = Import Cost − Export Credits ={' '}
                      {`$${selectedResult.annual.netAnnualBill.toFixed(2)}`}
                    </li>
                  </>
                )}
                <li>
                  We estimate your <span className="font-semibold">first‑year savings</span> from net metering and then
                  apply an annual escalation to electricity rates (typically {((data.annualEscalator || 4.5)).toFixed(1)}
                  % per year).
                </li>
                <li>
                  We add those savings year by year until the total equals your net investment. That year (including
                  fraction) is the <span className="font-semibold">payback period</span>.
                </li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                In this scenario, your payback period is approximately{' '}
                {paybackYears === Infinity ? 'N/A' : `${paybackYears.toFixed(1)} years`}. A shorter payback period means
                your investment recovers faster.
              </p>
            </Modal>

            <Modal
              isOpen={openModal === 'profit'}
              onClose={() => setOpenModal(null)}
              title="25-Year Profit"
              message="The 25-year profit represents your total financial gain over the typical lifespan of a solar panel system (25 years)."
              variant="success"
              cancelText="Close"
            >
              <p className="mb-3">
                This calculation includes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                <li>
                  <span className="font-semibold">Net investment</span>: {formatCurrency(netCost)}
                </li>
                <li>
                  <span className="font-semibold">Year‑1 savings</span> come from lower import costs plus export
                  credits under your selected plan.
                </li>
                <li>
                  We project these savings forward for 25 years using an annual escalation of{' '}
                  {((data.annualEscalator || 4.5)).toFixed(1)}% (higher rates → higher savings).
                </li>
                <li>
                  <span className="font-semibold">25‑Year Profit</span> = (Sum of 25 years of projected savings) − Net
                  Investment.
                </li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                For this scenario, your estimated 25‑year profit is{' '}
                {profit25 >= 0 ? formatCurrency(Math.round(profit25)) : 'N/A'}. This shows the long‑term value of your
                solar investment after the system has already paid for itself.
              </p>
            </Modal>

            <Modal
              isOpen={openModal === 'credits'}
              onClose={() => setOpenModal(null)}
              title="Annual Export Credits"
              message="Annual export credits represent the total dollar value of excess solar energy you send back to the grid over a full year."
              variant="info"
              cancelText="Close"
            >
              <p className="mb-3">
                How it works:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                <li>When your solar panels produce more energy than you're using, the excess is exported to the grid.</li>
                <li>
                  For each hour, we calculate{' '}
                  <span className="font-semibold">Export Credits</span> = Surplus kWh × (Consumption Rate + 2¢) ÷ 100.
                </li>
                <li>
                  We add up all hourly credits over the year to get your{' '}
                  <span className="font-semibold">Annual Export Credits</span>.
                </li>
                {selectedResult && (
                  <>
                    <li>
                      In this scenario, total exported energy is approximately{' '}
                      {Math.round(selectedResult.annual.totalExported).toLocaleString()} kWh, which generates about{' '}
                      {`$${selectedResult.annual.exportCredits.toFixed(2)}`} in credits.
                    </li>
                    <li>
                      The average export credit rate is roughly{' '}
                      {selectedResult.annual.totalExported > 0
                        ? `${((selectedResult.annual.exportCredits / selectedResult.annual.totalExported) * 100).toFixed(
                            1,
                          )}¢/kWh`
                        : 'N/A'}
                      .
                    </li>
                  </>
                )}
                <li>These credits can be used to offset future electricity bills and can roll forward for up to 12 months.</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                Higher export credits typically occur in summer months when solar production is highest. These credits help offset winter bills when production is lower.
              </p>
            </Modal>

            <Modal
              isOpen={openModal === 'coverage'}
              onClose={() => setOpenModal(null)}
              title="Energy Coverage"
              message="Energy coverage shows what percentage of your annual electricity usage is met by your solar production."
              variant="info"
              cancelText="Close"
            >
              <p className="mb-3">
                Calculation:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                <li>
                  <span className="font-semibold">Energy Coverage %</span> = Annual Solar Production ÷ Annual Usage ×
                  100%.
                </li>
                {selectedResult && (
                  <>
                    <li>
                      In this scenario:{' '}
                      {Math.round(selectedResult.annual.totalSolarProduction).toLocaleString()} kWh produced ÷{' '}
                      {Math.round(selectedResult.annual.totalLoad).toLocaleString()} kWh used ≈{' '}
                      {((selectedResult.annual.totalSolarProduction / selectedResult.annual.totalLoad) * 100).toFixed(1)}
                      %.
                    </li>
                  </>
                )}
                <li>100% means your solar system produces exactly what you use over a full year.</li>
                <li>Over 100% means you're producing more than you use (excess is exported as credits).</li>
                <li>Under 100% means you still need to purchase some electricity from the grid.</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                Note: This is an annual average. Production varies by season - higher in summer, lower in winter. Net metering allows you to use summer excess to offset winter shortfalls.
              </p>
            </Modal>

            <Modal
              isOpen={openModal === 'donut'}
              onClose={() => setOpenModal(null)}
              title="Savings Breakdown Donut"
              message="This chart shows how much of your original annual electricity bill is offset by solar and net-metering credits."
              variant="info"
              cancelText="Close"
            >
              <p className="mb-3">
                Calculation:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                <li>
                  <span className="font-semibold">Bill Offset %</span> = Annual Export Credits ÷ Annual Import Cost ×
                  100%.
                </li>
                {selectedResult && (
                  <li>
                    With your current inputs: Bill Offset ≈{' '}
                    {`${selectedResult.annual.exportCredits.toFixed(2)} ÷ ${selectedResult.annual.importCost.toFixed(
                      2,
                    )} × 100% = ${selectedResult.annual.billOffsetPercent.toFixed(1)}%`}
                    .
                  </li>
                )}
                <li>
                  If credits are equal to your annual import cost, the donut shows <span className="font-semibold">100% Bill Fully Offset</span>.
                </li>
                <li>
                  If credits are higher than your remaining bill, the offset is capped at 100% and the extra portion is shown as
                  <span className="font-semibold"> “+X% Credit”</span> under the donut.
                </li>
                <li>
                  Those extra credits can roll forward for up to 12 months and are reflected in the monthly rollover section below.
                </li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                This helps you quickly see whether solar plus net metering fully eliminates your annual bill or still leaves a portion to pay.
              </p>
            </Modal>
          </div>

          {/* RIGHT COLUMN: Results & Metrics */}
          <div className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && !selectedResult && (
              <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
                <Loader2 className="animate-spin text-emerald-500 mx-auto mb-4" size={48} />
                <p className="text-gray-600">Calculating net metering credits...</p>
              </div>
            )}

            {/* Savings Breakdown with Donut Chart */}
            {!hasErrors && selectedResult && (
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    Savings Breakdown
                    <button
                      type="button"
                      onClick={() => setOpenModal('donut')}
                      className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors w-6 h-6"
                      aria-label="How is the savings donut calculated?"
                    >
                      <Info size={14} />
                    </button>
                  </h2>
                  <InfoTooltip
                    className="hidden sm:inline-flex"
                    content={
                      'The donut shows how much of your original annual electricity bill is wiped out by solar and net-metering credits. Bill offset = Annual Export Credits ÷ Annual Import Cost × 100%. If credits are higher than your remaining bill, the offset is capped at 100% and the extra is shown as “+X% Credit” (credits that can roll forward for up to 12 months).'
                    }
                  />
                </div>
                
                <DonutChart
                  touOffset={touResults?.annual.billOffsetPercent || 0}
                  uloOffset={uloResults?.annual.billOffsetPercent || 0}
                  tieredOffset={tieredResults?.annual.billOffsetPercent || 0}
                  selectedPlan={selectedPlan}
                />

                <div className="mt-6 text-center text-sm text-gray-600">
                  {selectedResult.annual.billOffsetPercent >= 100 
                    ? `Bill Fully Offset + ${(selectedResult.annual.billOffsetPercent - 100).toFixed(1)}% Credit`
                    : `Bill Offset: ${selectedResult.annual.billOffsetPercent.toFixed(1)}%`}
                </div>

                {/* Legend */}
                <div className="mt-4 flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedPlan === 'ulo' ? 'bg-purple-500' : selectedPlan === 'tiered' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                    <span>Net Metering Credits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <span>Remaining Bill</span>
                  </div>
                </div>

                {/* Delivery fees & additional charges disclaimer */}
                <div className="mt-4 flex items-start gap-2 text-xs text-gray-700">
                  <InfoTooltip
                    content="Delivery fees, regulatory charges, and utility service fees remain the responsibility of the utility provider and are not eliminated by solar. These charges may be reduced through lower consumption but cannot be fully removed. Actual fee reductions depend on the utility's billing structure and regulations."
                  />
                  <span>Solar does not remove delivery, regulatory, or utility service fees – only reduces them.</span>
                </div>
              </div>
            )}

            {/* Detailed Breakdown - Separate Container */}
            {!hasErrors && selectedResult && (
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Breakdown</h2>
                
                {/* Warnings about credit expiration */}
                {selectedResult.warnings && selectedResult.warnings.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {selectedResult.warnings.map((warning, idx) => (
                      <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                          <p className="text-xs text-amber-800">{warning}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Credit Rollover Info */}
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <div className="text-xs text-blue-800">
                      <p className="font-semibold mb-1">12-Month Credit Rollover</p>
                      <p>Credits from excess solar production can be carried forward for up to 12 months to offset winter bills. Credits expire after 12 months if not used.</p>
                    </div>
                  </div>
                </div>
                  
                  <div className="space-y-3">
                    {/* Annual Credits */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Annual Export Credits</span>
                      <span className="text-sm font-bold text-emerald-600">${selectedResult.annual.exportCredits.toFixed(2)}</span>
                    </div>
                    
                    {/* Annual Import Cost */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Annual Import Cost</span>
                      <span className="text-sm font-bold text-gray-900">${selectedResult.annual.importCost.toFixed(2)}</span>
                    </div>
                    
                    {/* Net Annual Bill */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">Net Annual Bill</span>
                      <span className={`text-sm font-bold ${selectedResult.annual.netAnnualBill < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        ${Math.abs(selectedResult.annual.netAnnualBill).toFixed(2)}
                        {selectedResult.annual.netAnnualBill < 0 && ' (credit)'}
                      </span>
                    </div>
                    
                    {/* Energy Coverage */}
                    {selectedResult.annual.totalLoad > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Energy Coverage</span>
                          <span className="text-sm font-bold text-gray-900">
                            {((selectedResult.annual.totalSolarProduction / selectedResult.annual.totalLoad) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(selectedResult.annual.totalSolarProduction).toLocaleString()} kWh produced / {Math.round(selectedResult.annual.totalLoad).toLocaleString()} kWh used
                        </div>
                      </div>
                    )}

                    {/* Net metering rules disclaimer */}
                    <div className="mt-4 flex items-start gap-2 text-xs text-gray-700">
                      <InfoTooltip
                        content="Credit values and export calculations are based on general net metering rules. Actual crediting depends on your utility provider, metering configuration, export limits, and the most recent program rules. Utility approval is required before any system can operate under net metering."
                      />
                      <span>Net metering credits and rules are utility-specific and require formal approval.</span>
                    </div>
                    
                  {/* Detailed Distribution */}
                    {selectedResult.byPeriod && selectedResult.byPeriod.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">Detailed Distribution by Period</h4>
                        <button
                          type="button"
                          onClick={() => setShowPeriodBreakdown(!showPeriodBreakdown)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {showPeriodBreakdown ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {showPeriodBreakdown && (
                        <div className="space-y-3">
                          {selectedResult.byPeriod
                            .filter(p => p.kwhExported > 0 || p.exportCredits > 0 || p.kwhImported > 0)
                            .map((period) => (
                              <div key={period.period} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-semibold text-gray-700 capitalize">{period.period.replace('-', ' ')}</span>
                                  <span className="text-xs text-gray-500">
                                    {((period.kwhExported / (selectedResult.annual.totalSolarProduction || 1)) * 100).toFixed(1)}% of production
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-600">Exported:</span>
                                    <div className="font-semibold text-emerald-600">
                                      {period.kwhExported.toFixed(0)} kWh
                                    </div>
                                    <div className="text-emerald-600 font-bold">
                                      ${period.exportCredits.toFixed(2)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Imported:</span>
                                    <div className="font-semibold text-gray-700">
                                      {period.kwhImported.toFixed(0)} kWh
                                    </div>
                                    <div className="text-gray-700 font-bold">
                                      ${period.importCost.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-300 flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Net Credits:</span>
                                  <span className={`text-xs font-bold ${(period.exportCredits - period.importCost) >= 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                                    ${Math.abs(period.exportCredits - period.importCost).toFixed(2)}
                                    {(period.exportCredits - period.importCost) < 0 && ' (cost)'}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                      </div>
                    )}
                  
                  {/* Monthly Breakdown */}
                  {selectedResult.monthly && selectedResult.monthly.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">Monthly Breakdown</h4>
                        <button
                          type="button"
                          onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {showMonthlyBreakdown ? 'Hide' : 'Show'}
                        </button>
                  </div>
                      {showMonthlyBreakdown && (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {/* Header */}
                        <div className="grid grid-cols-5 gap-2 pb-2 border-b border-gray-200">
                          <div className="text-xs font-semibold text-gray-700">Month</div>
                          <div className="text-xs font-semibold text-gray-700 text-right">Export</div>
                          <div className="text-xs font-semibold text-gray-700 text-right">Import</div>
                          <div className="text-xs font-semibold text-gray-700 text-right">Net Bill</div>
                          <div className="text-xs font-semibold text-gray-700 text-right">Rollover</div>
                </div>
                        {/* Monthly Rows */}
                        {selectedResult.monthly.map((month, idx) => {
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                          return (
                            <div key={idx} className="grid grid-cols-5 gap-2 items-center py-2 border-b border-gray-100 hover:bg-gray-50 rounded px-2">
                              <div className="text-sm font-medium text-gray-700">{monthNames[idx]}</div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500 mb-0.5">Credits</div>
                                <div className="text-sm font-semibold text-emerald-600">${month.exportCredits.toFixed(2)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500 mb-0.5">Cost</div>
                                <div className="text-sm font-semibold text-gray-700">${month.importCost.toFixed(2)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500 mb-0.5">Net</div>
                                <div className={`text-sm font-bold ${month.netBill <= 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                                  {month.netBill <= 0 ? (
                                    <span className="text-emerald-600">-${Math.abs(month.netBill).toFixed(2)}</span>
                                  ) : (
                                    <span className="text-gray-700">${month.netBill.toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500 mb-0.5">Available</div>
                                <div className={`text-sm font-semibold ${month.creditRollover > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                  ${month.creditRollover.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={!touResults || !uloResults || !tieredResults || loading || hasErrors}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
