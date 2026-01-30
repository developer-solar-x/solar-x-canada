'use client'

// Net Metering Savings Step
// Two-column layout matching PeakShavingSalesCalculatorFRD format
// Left: Calculator inputs (usage, panels, rate plan)
// Right: Results with donut chart

import { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { ArrowLeft, ArrowRight, Loader2, Zap, AlertTriangle, Info, Sun, Moon, BarChart3, DollarSign, TrendingUp, TrendingDown, Clock, Battery, Plus, X, ChevronDown, Sparkles, Leaf } from 'lucide-react'
import type { NetMeteringResult } from '@/lib/net-metering'
import type { EstimatorData } from '@/app/estimator/page'
import { DEFAULT_TOU_DISTRIBUTION, DEFAULT_ULO_DISTRIBUTION, type UsageDistribution, calculateSimpleMultiYear } from '@/lib/simple-peak-shaving'
import { BLENDED_RATE } from '../StepEnergySimple/constants'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, isValidEmail } from '@/lib/utils'
import { formatProductionRange } from '@/lib/production-range'
import { AlbertaSavingsBreakdown } from './AlbertaSavingsBreakdown'
import { BATTERY_SPECS, type BatterySpec } from '@/config/battery-specs'
import { ONTARIO_RESIDENTIAL_MAX_PANELS_500W } from '@/config/provinces'
import { useBatteries } from '@/hooks/useBatteries'

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
  selectedPlan = 'tou',
  batterySavingsPercent = 0
}: {
  touOffset?: number
  uloOffset?: number
  tieredOffset?: number
  selectedPlan?: 'tou' | 'ulo' | 'tiered'
  batterySavingsPercent?: number
}) {
  // Base solar offset from the selected rate plan
  const rawSolarOffset =
    selectedPlan === 'ulo'
      ? uloOffset
      : selectedPlan === 'tiered'
      ? tieredOffset
      : touOffset

  // Clamp solar offset to 0–100 for rendering
  const solarOffset = Math.max(0, Math.min(100, rawSolarOffset))

  // Battery can only eat into the remaining headroom after solar.
  const rawBatteryPortion = Math.max(0, batterySavingsPercent)
  const maxBatteryHeadroom = Math.max(0, 100 - solarOffset)
  const batteryPortion = Math.min(rawBatteryPortion, maxBatteryHeadroom)

  const totalOffset = solarOffset + batteryPortion
  // Cap display at 100% for visual representation, but keep actual value for text
  const displayTotalOffset = Math.min(100, totalOffset)
  const remaining = 100 - displayTotalOffset
  const circumference = 2 * Math.PI * 120
  const batteryArcLength = (batteryPortion / 100) * circumference
  
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
        {/* Solar offset circle */}
        {solarOffset > 0 && (
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke={
              selectedPlan === 'ulo'
                ? '#8b5cf6'
                : selectedPlan === 'tiered'
                ? '#f59e0b'
                : '#3b82f6'
            }
            strokeWidth="40"
            strokeDasharray={circumference}
            strokeDashoffset={
              circumference - (solarOffset / 100) * circumference
            }
            // Use a flat line cap so adjoining segments meet cleanly with no visual gap.
            strokeLinecap="butt"
            className="transition-all duration-700"
          />
        )}
        {/* Battery savings circle – drawn on top of solar so it appears as a second segment */}
        {batteryPortion > 0 && (
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="#10b981" // emerald-500 to match the legend
            strokeWidth="40"
            // Draw only the incremental battery slice as a separate dash segment.
            // The dash starts where the solar segment ends and covers only the
            // additional percentage contributed by the battery.
            strokeDasharray={`${batteryArcLength} ${circumference - batteryArcLength}`}
            strokeDashoffset={
              circumference - (solarOffset / 100) * circumference
            }
            strokeLinecap="butt"
            className="transition-all duration-700"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800">
            {displayTotalOffset.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {totalOffset >= 100 ? 'Bill Fully Offset' : 'Bill Offset'}
        </div>
          {totalOffset > 100 && (
            <div className="text-xs text-emerald-600 mt-1 font-semibold">
              +{(totalOffset - 100).toFixed(1)}% Credit
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
  
  // Check if province is Alberta - check multiple possible locations and make it reactive
  const isAlberta = useMemo(() => {
    // Check multiple possible locations for province
    const province = data.province || 
                     data.estimate?.province || 
                     (data as any).location?.province || 
                     (data as any).address?.province ||
                     (data.address && extractProvinceFromAddress(data.address))
    
    if (!province) {
      // Debug: log when province is not found
      if (process.env.NODE_ENV === 'development') {
        console.log('StepNetMetering: Province not found in data:', {
          'data.province': data.province,
          'data.estimate?.province': data.estimate?.province,
          'data.address': data.address
        })
      }
      return false
    }
    
    const provinceUpper = String(province).toUpperCase().trim()
    const isAlbertaResult = (
      provinceUpper === 'AB' || 
      provinceUpper === 'ALBERTA' ||
      provinceUpper.includes('ALBERTA') ||
      provinceUpper.includes('AB')
    )
    
    // Debug: log province detection
    if (process.env.NODE_ENV === 'development') {
      console.log('StepNetMetering: Province detection:', { province, provinceUpper, isAlbertaResult })
    }
    
    return isAlbertaResult
  }, [data.province, data.estimate?.province, data.address])

  const isOntario = useMemo(() => {
    const province = data.province || data.estimate?.province || (data as any).location?.province || (data as any).address?.province || (data.address && extractProvinceFromAddress(data.address))
    if (!province) return false
    const provinceUpper = String(province).toUpperCase().trim()
    return provinceUpper === 'ON' || provinceUpper === 'ONTARIO'
  }, [data.province, data.estimate?.province, data.address])
  
  // Helper function to extract province from address string
  function extractProvinceFromAddress(address: string): string | null {
    if (!address) return null
    const addressUpper = address.toUpperCase()
    // Check for common province patterns in address
    const provinceMatch = addressUpper.match(/\b(AB|ALBERTA|ON|ONTARIO|BC|BRITISH COLUMBIA|MB|MANITOBA|SK|SASKATCHEWAN|QC|QUEBEC|NS|NOVA SCOTIA|NB|NEW BRUNSWICK|NL|NEWFOUNDLAND|PE|PRINCE EDWARD ISLAND|YT|YUKON|NT|NORTHWEST TERRITORIES|NU|NUNAVUT)\b/)
    return provinceMatch ? provinceMatch[1] : null
  }
  
  // Inputs
  const [annualUsageInput, setAnnualUsageInput] = useState('')
  const [solarPanels, setSolarPanels] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<'tou' | 'ulo' | 'tiered'>('tou')
  const [activeTab, setActiveTab] = useState<'basic' | 'distribution'>('basic')
  const [touDistribution, setTouDistribution] = useState<UsageDistribution>(DEFAULT_TOU_DISTRIBUTION)
  const [uloDistribution, setUloDistribution] = useState<UsageDistribution>(DEFAULT_ULO_DISTRIBUTION)
  // Tiered is a flat rate, but we still collect a notional distribution so
  // users can describe their usage pattern for narrative / battery modelling.
  const [tieredDistribution, setTieredDistribution] = useState<UsageDistribution>({
    onPeakPercent: 35,
    midPeakPercent: 30,
    offPeakPercent: 35,
  })
  const [overrideEstimateLoading, setOverrideEstimateLoading] = useState(false)
  const [openModal, setOpenModal] = useState<'payback' | 'profit' | 'credits' | 'coverage' | 'donut' | null>(null)
  const [showPeriodBreakdown, setShowPeriodBreakdown] = useState(false)
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false)
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([])
  // AI Optimization Mode - allows grid charging at cheap rates for both TOU and ULO
  const [aiMode, setAiMode] = useState(true)
  
  // Fetch batteries from API (with fallback to static)
  const { batteries: availableBatteries, refetch: refetchBatteries } = useBatteries(false)

  // Get production and usage data - use local estimate if available
  const estimate = localEstimate || data.estimate
  const panelWattage = estimate?.system?.panelWattage || 500
  
  // Parse inputs (needed before useEffect)
  const annualUsageKwh = parseFloat(annualUsageInput) || 0
  
  // Fetch estimate if missing (when component mounts or when coordinates/roof data changes)
  useEffect(() => {
    // Check if we have saved production from persisted data
    const savedProduction = (data as any)?.production
    const hasSavedProduction = savedProduction?.monthlyKwh && savedProduction.monthlyKwh.length === 12
    
    // If we already have an estimate with production data, use it
    if (data.estimate?.production?.monthlyKwh && data.estimate.production.monthlyKwh.length === 12) {
      if (!localEstimate || localEstimate !== data.estimate) {
        setLocalEstimate(data.estimate)
      }
      return
    }
    
    // If we have saved production data, skip fetching
    if (hasSavedProduction) {
      // For Alberta, create a minimal estimate object so the calculation can proceed
      if (isAlberta && !localEstimate) {
        const syntheticEstimate = {
          production: savedProduction,
          system: {
            sizeKw: (data as any)?.systemSizeKw || ((data as any)?.numPanels * 0.5) || 10,
            numPanels: (data as any)?.numPanels || 20
          }
        }
        setLocalEstimate(syntheticEstimate as any)
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
            province: data.province || 'ON',
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

  // Initialize solar panels from estimate when it becomes available (Ontario: cap at 24)
  useEffect(() => {
    const currentEstimate = localEstimate || data.estimate
    
    let initialPanels =
      (data as any).solarOverride?.numPanels ??
      (data as any)?.numPanels ??
      currentEstimate?.system?.numPanels ?? 0
    
    if (isOntario && initialPanels > ONTARIO_RESIDENTIAL_MAX_PANELS_500W) {
      initialPanels = ONTARIO_RESIDENTIAL_MAX_PANELS_500W
    }
    
    if (initialPanels > 0 && solarPanels === 0) {
      setSolarPanels(initialPanels)
    }
  }, [localEstimate, data.estimate, (data as any)?.numPanels, isOntario])

  // Clamp solar panels to Ontario max when province is Ontario (e.g. after province switch or legacy data)
  useEffect(() => {
    if (isOntario && solarPanels > ONTARIO_RESIDENTIAL_MAX_PANELS_500W) {
      setSolarPanels(ONTARIO_RESIDENTIAL_MAX_PANELS_500W)
    }
  }, [isOntario, solarPanels])

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
  // For net metering, include battery cost but NO rebates (net metering doesn't qualify for rebates)
  const solarSystemCost = estimate?.costs?.systemCost || estimate?.costs?.totalCost || 0
  const solarRebate = 0 // Net metering doesn't qualify for rebates
      const batteryCost = selectedBatteries.length > 0
        ? selectedBatteries
            .map(id => availableBatteries.find(b => b.id === id))
            .filter(Boolean)
            .reduce((sum, battery) => sum + (battery?.price || 0), 0)
        : 0
  const batteryRebate = 0 // No rebates for net metering
  const netCost = solarSystemCost + batteryCost - solarRebate - batteryRebate // Total system cost (solar + battery, no rebates)
  // annualEscalator is stored as a percentage (e.g. 4.5 for 4.5%), but the payback
  // + multi‑year projection functions expect a decimal (0.045). Normalise here.
  const escalatorPercent = typeof data.annualEscalator === 'number' ? data.annualEscalator : 4.5
  const escalation = escalatorPercent > 1 ? escalatorPercent / 100 : escalatorPercent

  // Calculate metrics for selected plan
  // For Alberta, always use touResults (which contains Alberta data)
  const selectedResult = isAlberta ? touResults : (selectedPlan === 'ulo' ? uloResults : selectedPlan === 'tiered' ? tieredResults : touResults)
  const annualSavings = selectedResult ? selectedResult.annual.importCost - selectedResult.annual.netAnnualBill : 0
  const paybackYears = selectedResult && netCost > 0 ? calculatePayback(annualSavings, netCost, escalation) : Infinity
  const profit25 = selectedResult && netCost > 0 
    ? calculateSimpleMultiYear({ annualSavings } as any, netCost, escalation, 25).netProfit25Year
    : 0

  // Build monthly production vs usage chart data
  const productionUsageChartData = useMemo(() => {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    if (selectedResult?.monthly && selectedResult.monthly.length === 12) {
      return selectedResult.monthly.map((m, idx) => ({
        month: names[idx],
        production: Math.round(m.totalSolarProduction || 0),
        usage: Math.round(m.totalLoad || 0),
      }))
    }
    // Fallback to estimate production and evenly distributed usage if monthly not present
    const prod = (estimate?.production?.monthlyKwh || []) as number[]
    const annualUse = annualUsageKwh || data.energyUsage?.annualKwh || data.annualUsageKwh || 0
    const avgUse = annualUse > 0 ? Math.round(annualUse / 12) : 0
    return prod.map((kwh: number, idx: number) => ({
      month: names[idx],
      production: Math.round(kwh || 0),
      usage: avgUse,
    }))
  }, [selectedResult?.monthly, estimate?.production?.monthlyKwh, annualUsageKwh, data.energyUsage?.annualKwh, data.annualUsageKwh])

  // Calculate battery savings percentage for net metering
  // Battery stores excess solar and uses it during higher‑cost hours, reducing imports.
  // This is a simplified model, but it now responds to the customer's usage
  // distribution so that shifting more usage into peak periods increases the
  // relative value of battery storage.
  // NOTE: In Alberta, batteries are storage-only (no grid arbitrage), so battery savings are 0
  const calculateBatterySavingsPercent = (): number => {
    if (isAlberta || selectedBatteries.length === 0 || !selectedResult) return 0
    
    // Get total battery capacity
    const totalBatteryKwh = selectedBatteries
      .map(id => availableBatteries.find(b => b.id === id))
      .filter(Boolean)
      .reduce((sum, battery) => sum + (battery?.usableKwh || battery?.nominalKwh || 0), 0)
    
    if (totalBatteryKwh === 0 || selectedResult.annual.importCost === 0) return 0
    
    // Estimate annual battery throughput
    // Battery can charge/discharge daily, storing excess solar and using during peak
    // With AI Mode ON, battery can also charge from grid, increasing utilization
    const dailyCycles = 1 // One full charge/discharge cycle per day
    const batteryEfficiency = 0.85 // 85% round-trip efficiency
    let annualBatteryKwhUsed = totalBatteryKwh * dailyCycles * 365 * batteryEfficiency
    
    // AI Mode increases battery utilization by allowing grid charging
    // When AI Mode is ON, battery can use full capacity (not limited to solar excess)
    if (aiMode) {
      // Full capacity utilization with grid charging
      annualBatteryKwhUsed = totalBatteryKwh * 365 // Full annual capacity
    }

    // --- Usage‑distribution‑aware adjustment -----------------------------------
    // For TOU / ULO plans, adjust the effective impact of the battery based on
    // how much of the customer's usage happens in higher‑cost periods.
    //
    // We compute an "effective peak share" between 0–1 and use it to scale the
    // shifted energy. This makes the battery more valuable for customers with
    // heavier on‑peak usage, and less valuable when most usage is already
    // off‑peak or ultra‑low.

    const getEffectivePeakShare = (): number => {
      const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value))

      if (selectedPlan === 'ulo') {
        const ultra = uloDistribution.ultraLowPercent || 0
        const on = uloDistribution.onPeakPercent || 0
        const mid = uloDistribution.midPeakPercent || 0
        const off = uloDistribution.offPeakPercent || 0
        const total = ultra + on + mid + off
        if (total <= 0) return 0.35 // baseline

        // Weight on‑peak highest, mid‑peak medium, off/ultra lowest.
        const effective =
          (on * 1.0 + mid * 0.6 + off * 0.3 + ultra * 0.1) / total
        return clamp(effective, 0.1, 0.9)
      }

      // TOU or Tiered – use the matching distribution
      const source =
        selectedPlan === 'tiered' ? tieredDistribution : touDistribution

      const on = source.onPeakPercent || 0
      const mid = source.midPeakPercent || 0
      const off = source.offPeakPercent || 0
      const total = on + mid + off
      if (total <= 0) return 0.35

      const effective = (on * 1.0 + mid * 0.6 + off * 0.3) / total
      return clamp(effective, 0.1, 0.9)
    }

    const effectivePeakShare = getEffectivePeakShare()

    // Calibrate relative to a baseline "typical" peak share of ~35%.
    const baselinePeakShare = 0.35
    const peakShareFactor = Math.min(
      1.5, // cap upside so the model stays conservative
      Math.max(0.5, effectivePeakShare / baselinePeakShare)
    )

    // Battery reduces imports during higher‑cost hours when rates are highest.
    // Estimate: battery stores excess solar (that would have been exported at
    // lower rates) and uses it during peak periods (avoiding imports at higher
    // rates). Savings = energy shifted * (peak_rate - export_rate) / import_cost.
    
    // Simplified estimate: assume battery shifts 60% of its capacity from
    // exports to peak avoidance, scaled by how "peaky" the load is.
    const baseShiftFraction = 0.6
    const energyShifted = annualBatteryKwhUsed * baseShiftFraction * peakShareFactor
    const avgRatePremium = 0.06 // 6 cents/kWh average premium (peak rate - export rate)
    const estimatedBatterySavings = energyShifted * avgRatePremium // In dollars
    
    // Calculate as percentage of import cost
    const batterySavingsPercent = (estimatedBatterySavings / selectedResult.annual.importCost) * 100
    
    // Cap at reasonable maximum (battery can't offset more than remaining imports)
    const maxBatterySavings = Math.min(
      batterySavingsPercent,
      (100 - selectedResult.annual.billOffsetPercent) * 0.5, // Max 50% of remaining bill
      15 // Absolute cap of 15%
    )
    
    return Math.max(0, maxBatterySavings)
  }
  
  const batterySavingsPercent = calculateBatterySavingsPercent()

  // Distribution validation – require each plan's usage to sum to ~100%.
  const touTotalPercent =
    touDistribution.offPeakPercent +
    touDistribution.midPeakPercent +
    touDistribution.onPeakPercent
  const uloTotalPercent =
    (uloDistribution.ultraLowPercent || 0) +
    uloDistribution.offPeakPercent +
    uloDistribution.midPeakPercent +
    uloDistribution.onPeakPercent
  const tieredTotalPercent =
    tieredDistribution.offPeakPercent +
    tieredDistribution.midPeakPercent +
    tieredDistribution.onPeakPercent

  const isTouDistributionValid = Math.abs(touTotalPercent - 100) <= 0.1
  const isUloDistributionValid = Math.abs(uloTotalPercent - 100) <= 0.1
  const isTieredDistributionValid = Math.abs(tieredTotalPercent - 100) <= 0.1

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
            province: data.province || 'ON',
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

  // For Alberta, run a single calculation instead of multiple plans
  useEffect(() => {
    if (!isAlberta) return
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Alberta effect triggered:', {
        isAlberta,
        hasLocalEstimate: !!localEstimate,
        hasDataEstimate: !!data.estimate,
        solarPanels,
        annualUsageInput,
        'data.annualUsageKwh': data.annualUsageKwh,
        'data.monthlyBill': data.monthlyBill
      })
    }
    
    const currentEstimate = localEstimate || data.estimate
    // Fallback to persisted production (from review) or evenly distribute annual production
    const persistedProduction = (data as any)?.production
    
    // Try multiple sources for monthly production
    let monthlyProduction: number[] = []
    if (currentEstimate?.production?.monthlyKwh?.length === 12) {
      monthlyProduction = currentEstimate.production.monthlyKwh
    } else if (persistedProduction?.monthlyKwh?.length === 12) {
      monthlyProduction = persistedProduction.monthlyKwh
    } else if (persistedProduction?.annualKwh && persistedProduction.annualKwh > 0) {
      // Evenly distribute annual production
      monthlyProduction = Array(12).fill(persistedProduction.annualKwh / 12)
    } else if (currentEstimate?.system?.sizeKw || solarPanels > 0) {
      // Fallback: estimate production from system size (1200 kWh/kW/year for Alberta)
      const systemKw = currentEstimate?.system?.sizeKw || (solarPanels * panelWattage / 1000)
      const estimatedAnnual = systemKw * 1200
      // Alberta seasonal distribution (more production in summer)
      const seasonalDistribution = [0.051, 0.067, 0.087, 0.099, 0.116, 0.122, 0.127, 0.118, 0.103, 0.084, 0.057, 0.049]
      monthlyProduction = seasonalDistribution.map(pct => estimatedAnnual * pct)
    }
    
    // Use annualUsageInput if available, otherwise fall back to data properties
    const inputUsage = parseFloat(annualUsageInput) || 0
    const calculatedUsage = inputUsage > 0 
      ? inputUsage 
      : (data.energyUsage?.annualKwh || data.annualUsageKwh || (data.monthlyBill ? (data.monthlyBill / BLENDED_RATE) * 12 : 0))

    if (monthlyProduction.length !== 12 || calculatedUsage <= 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Alberta calculation skipped:', { 
          monthlyProductionLength: monthlyProduction.length, 
          calculatedUsage,
          hasProduction: monthlyProduction.length === 12,
          hasUsage: calculatedUsage > 0
        })
      }
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Running Alberta calculation with:', { 
        monthlyProduction: monthlyProduction.slice(0, 3), 
        calculatedUsage,
        selectedBatteries: selectedBatteries.length
      })
    }

    const runAlbertaCalculation = async () => {
      try {
        setLoading(true)
        setError(null)

        const combinedBattery = selectedBatteries.length > 0
          ? selectedBatteries
              .map(id => availableBatteries.find(b => b.id === id))
              .filter((b): b is BatterySpec => b !== undefined)
              .reduce<BatterySpec | null>((combined, battery, idx) => {
                if (idx === 0) return battery
                if (!combined) return battery
                return {
                  ...combined,
                  id: `${combined.id}+${battery.id}`,
                  brand: `${combined.brand}+${battery.brand}`,
                  model: `${combined.model}+${battery.model}`,
                  nominalKwh: combined.nominalKwh + battery.nominalKwh,
                  usableKwh: combined.usableKwh + battery.usableKwh,
                  usablePercent: (combined.usablePercent + battery.usablePercent) / 2,
                  roundTripEfficiency: (combined.roundTripEfficiency + battery.roundTripEfficiency) / 2,
                  inverterKw: Math.max(combined.inverterKw, battery.inverterKw),
                  price: combined.price + battery.price,
                  warranty: {
                    years: Math.min(combined.warranty.years, battery.warranty.years),
                    cycles: Math.min(combined.warranty.cycles, battery.warranty.cycles)
                  }
                }
              }, null)
          : null

        const response = await fetch('/api/net-metering', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monthlySolarProduction: monthlyProduction,
            annualUsageKwh: calculatedUsage,
            ratePlanId: 'tou', // Use TOU as placeholder, API will detect Alberta
            province: data.province,
            year: new Date().getFullYear(),
            ...(combinedBattery ? { battery: combinedBattery } : {}),
            aiMode: false, // AI Mode not available for Alberta Solar Club
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to calculate Alberta Solar Club net metering')
        }

        const result = await response.json()
        if (result.success && result.data) {
          // Store as touResults for compatibility
          setTouResults(result.data)
          setUloResults(result.data) // Same for both
          setTieredResults(result.data) // Same for all
        }
      } catch (err) {
        console.error('Alberta Solar Club calculation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to calculate Alberta Solar Club savings')
      } finally {
        setLoading(false)
      }
    }

    runAlbertaCalculation()
  }, [isAlberta, localEstimate, data.estimate, annualUsageInput, data.energyUsage?.annualKwh, data.annualUsageKwh, data.monthlyBill, solarPanels, panelWattage, selectedBatteries, availableBatteries, aiMode, data.province])

  // Shared helper to calculate net metering for a single plan.
  const runNetMeteringForPlan = async (planId: 'tou' | 'ulo' | 'tiered') => {
    // Skip if Alberta (handled separately above)
    if (isAlberta) return
    const currentEstimate = localEstimate || data.estimate
    const monthlyProduction = currentEstimate?.production?.monthlyKwh || []

    if (
      !currentEstimate?.production?.monthlyKwh ||
      monthlyProduction.length !== 12 ||
      annualUsageKwh <= 0
    ) {
      return
    }

    // Per‑plan validation: only skip the specific plan whose inputs are invalid.
    if (planId === 'tou' && !isTouDistributionValid) return
    if (planId === 'ulo' && !isUloDistributionValid) return

    try {
      setLoading(true)
      setError(null)

      const distribution =
        planId === 'ulo'
          ? uloDistribution
          : planId === 'tou'
          ? touDistribution
          : undefined
      
      // Get combined battery if batteries are selected
      const combinedBattery = selectedBatteries.length > 0
        ? selectedBatteries
            .map(id => availableBatteries.find(b => b.id === id))
            .filter((b): b is BatterySpec => b !== undefined)
            .reduce<BatterySpec | null>((combined, battery, idx) => {
              if (idx === 0) return battery
              if (!combined) return battery
              return {
                ...combined,
                id: `${combined.id}+${battery.id}`,
                brand: `${combined.brand}+${battery.brand}`,
                model: `${combined.model}+${battery.model}`,
                nominalKwh: combined.nominalKwh + battery.nominalKwh,
                usableKwh: combined.usableKwh + battery.usableKwh,
                usablePercent: (combined.usablePercent + battery.usablePercent) / 2,
                roundTripEfficiency: (combined.roundTripEfficiency + battery.roundTripEfficiency) / 2,
                inverterKw: Math.max(combined.inverterKw, battery.inverterKw),
                price: combined.price + battery.price,
                warranty: {
                  years: Math.min(combined.warranty.years, battery.warranty.years),
                  cycles: Math.min(combined.warranty.cycles, battery.warranty.cycles)
                }
              }
            }, null)
        : null

      const response = await fetch('/api/net-metering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlySolarProduction: monthlyProduction,
          annualUsageKwh: annualUsageKwh,
          ratePlanId: planId,
          province: data.province, // Pass province for Alberta detection
          year: new Date().getFullYear(),
          // Tiered ignores usageDistribution; we only send it for plans that
          // actually have a configurable distribution.
          ...(distribution ? { usageDistribution: distribution } : {}),
          ...(combinedBattery ? { battery: combinedBattery } : {}),
          aiMode: aiMode && selectedBatteries.length > 0, // Only enable if battery is selected
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

  // TOU net metering – only depends on TOU inputs.
  useEffect(() => {
    void runNetMeteringForPlan('tou')
  }, [localEstimate, data.estimate, annualUsageKwh, touDistribution, isTouDistributionValid, selectedBatteries, aiMode])

  // ULO net metering – only depends on ULO inputs.
  useEffect(() => {
    void runNetMeteringForPlan('ulo')
  }, [localEstimate, data.estimate, annualUsageKwh, uloDistribution, isUloDistributionValid, selectedBatteries, aiMode])

  // Tiered net metering – independent of TOU/ULO distributions.
  useEffect(() => {
    void runNetMeteringForPlan('tiered')
  }, [localEstimate, data.estimate, annualUsageKwh])

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
    // For net metering, include battery cost but NO rebates
    const currentEstimate = localEstimate || data.estimate
    const currentSolarSystemCost = currentEstimate?.costs?.systemCost || currentEstimate?.costs?.totalCost || 0
    const currentSolarRebate = 0 // Net metering doesn't qualify for rebates
    const currentBatteryCost = selectedBatteries.length > 0
      ? selectedBatteries
          .map(id => availableBatteries.find(b => b.id === id))
          .filter(Boolean)
          .reduce((sum, battery) => sum + (battery?.price || 0), 0)
      : 0
    const currentBatteryRebate = 0 // No rebates for net metering
    const currentNetCost = currentSolarSystemCost + currentBatteryCost - currentSolarRebate - currentBatteryRebate
    const currentEscalation = escalatorPercent > 1 ? escalatorPercent / 100 : (escalation || 0.03)
    
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

    const email = data.email

    const stepData = {
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
        selectedBattery: selectedBatteries.length > 0 ? selectedBatteries[0] : 'none',
        selectedBatteries: selectedBatteries,
        comparisons: [],
      },
      selectedBatteries: selectedBatteries
    } as any

    // Save partial lead for both detailed and quick/easy net metering residential flows
    if (
      email &&
      isValidEmail(email) &&
      (data.estimatorMode === 'detailed' || data.estimatorMode === 'easy') &&
      data.programType === 'net_metering' &&
      data.leadType === 'residential'
    ) {
      void fetch('/api/partial-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          estimatorData: {
            ...data,
            ...stepData,
            email,
            selectedBatteries, // Include battery selection
          },
          currentStep: 4, // Net Metering Savings step (mirrors Battery step index)
        }),
      }).catch((error) => {
        console.error('Failed to save Net Metering progress (partial lead):', error)
      })
    }

    onComplete(stepData)
  }

  // Check for errors - use actual data sources, not just parsed input
  const actualUsage = annualUsageKwh || data.energyUsage?.annualKwh || data.annualUsageKwh || (data.monthlyBill ? (data.monthlyBill / BLENDED_RATE) * 12 : 0)
  const hasErrors = actualUsage <= 0

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
                
            {/* Tab Navigation - Hide for Alberta */}
                {!isAlberta && (
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
                )}
            </div>

              <div className="p-4 md:p-5 space-y-3">
            {(activeTab === 'basic' || isAlberta) && (
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
                            max={isOntario ? ONTARIO_RESIDENTIAL_MAX_PANELS_500W : undefined}
                            onChange={(e) => {
                              const raw = Math.max(0, Number(e.target.value))
                              const capped = isOntario ? Math.min(raw, ONTARIO_RESIDENTIAL_MAX_PANELS_500W) : raw
                              setSolarPanels(capped)
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base md:text-lg font-semibold text-green-700"
                            disabled={overrideEstimateLoading}
                          />
                          {isOntario && (
                            <p className="mt-1 text-xs text-gray-600">Ontario residential: max 10 kW AC ({ONTARIO_RESIDENTIAL_MAX_PANELS_500W} panels).</p>
                          )}
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
                        {formatProductionRange(solarProductionKwh)}
                      </div>
                      <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-blue-700">
                          Adjust the number of solar panels above to change production. The range accounts for weather variability and system performance. Disclaimer: This range is an estimate only; actual production may vary due to weather, shading, and system conditions and is not a guarantee.
                          </p>
                        </div>
                        </div>

                    {/* Rate Plan Selection - Show Solar Club rates for Alberta, otherwise show TOU/ULO/Tiered */}
                    {isAlberta ? (
                      <div>
                        <label className="block text-base md:text-lg font-semibold text-gray-700 mb-2">
                          Solar Club Alberta Rates
                        </label>
                        <div className="space-y-3">
                          {/* Low Production Solar Rate */}
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-bold text-blue-900 text-lg">LOW PRODUCTION SOLAR RATE</div>
                                <div className="text-2xl font-bold text-blue-600 mt-1">6.89¢/kWh</div>
                              </div>
                              <TrendingDown className="text-blue-600" size={32} />
                            </div>
                            <p className="text-sm text-blue-800 mb-3">
                              Designed for low production seasons when you consume more electricity than your array produces.
                            </p>
                            <p className="text-xs text-blue-700">
                              Pay a lower rate for the electricity you consume or use your banked credits to offset your bill.
                            </p>
                            <div className="mt-3 pt-3 border-t border-blue-300 flex items-center gap-4 text-xs text-blue-700">
                              <div className="flex items-center gap-1">
                                <DollarSign size={14} />
                                <span>3% Cash Back</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Leaf size={14} />
                                <span>Carbon Offset Credit Platform</span>
                              </div>
                            </div>
                          </div>

                          {/* High Production Solar Rate */}
                          <div className="bg-gradient-to-r from-amber-50 to-orange-100 border-2 border-amber-300 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-bold text-amber-900 text-lg">HIGH PRODUCTION SOLAR RATE</div>
                                <div className="text-2xl font-bold text-amber-600 mt-1">33.00¢/kWh</div>
                              </div>
                              <TrendingUp className="text-amber-600" size={32} />
                            </div>
                            <p className="text-sm text-amber-800 mb-3">
                              Designed for high production seasons when your array produces more electricity than you consume.
                            </p>
                            <p className="text-xs text-amber-700">
                              Allows you to earn and bank credits on the electricity you export to use against future bills.
                            </p>
                            <div className="mt-3 pt-3 border-t border-amber-300 flex items-center gap-4 text-xs text-amber-700">
                              <div className="flex items-center gap-1">
                                <DollarSign size={14} />
                                <span>3% Cash Back</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Leaf size={14} />
                                <span>Carbon Offset Credit Platform</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                            <div className="flex items-start gap-2">
                              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                              <p className="text-xs text-blue-800">
                                <strong>How it works:</strong> You can switch between these rates with 10 days notice. 
                                Use the high rate (33¢/kWh) during spring/summer when production is high, and switch to 
                                the low rate (6.89¢/kWh) during fall/winter when you consume more than you produce.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
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
                    )}

                    {/* Battery Selection (Optional - No Rebates) */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Battery className="text-emerald-600" size={18} />
                        Battery Storage (Optional)
                      </h3>
                      <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={14} />
                          <p className="text-xs text-amber-700">
                            <strong>Note:</strong> Net metering systems do not qualify for rebates. Battery cost will be included in your total investment but will not receive any rebates.
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {selectedBatteries.map((batteryId, index) => {
                          const battery = availableBatteries.find(b => b.id === batteryId)
                          if (!battery) return null
                          
                          return (
                            <div key={`${batteryId}-${index}`} className="p-3 bg-gray-50 border-2 border-gray-300 rounded-lg">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1">
                                  <Battery className="text-emerald-600" size={20} />
                                  <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-1">Battery {index + 1}</div>
                                    <select
                                      value={batteryId}
                                      onChange={(e) => {
                                        const newBatteries = [...selectedBatteries]
                                        newBatteries[index] = e.target.value
                                        setSelectedBatteries(newBatteries)
                                      }}
                                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-gray-700 bg-white"
                                    >
                                      {availableBatteries.map(b => (
                                        <option key={b.id} value={b.id}>
                                          {b.brand} {b.model} - ${b.price.toLocaleString()}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setSelectedBatteries(selectedBatteries.filter((_, i) => i !== index))}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                                  title="Remove battery"
                                >
                                  <X className="text-red-500" size={18} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                        
                        {selectedBatteries.length < 3 && (
                          <button
                            onClick={() => setSelectedBatteries([...selectedBatteries, availableBatteries[0]?.id || ''])}
                            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                          >
                            <Plus className="text-emerald-500" size={18} />
                            Add Battery
                          </button>
                        )}
                        
                        {selectedBatteries.length > 0 && (
                          <>
                            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">Total Battery Cost:</span>
                                <span className="text-lg font-bold text-emerald-700">
                                  ${selectedBatteries
                                    .map(id => availableBatteries.find(b => b.id === id))
                                    .filter(Boolean)
                                    .reduce((sum, battery) => sum + (battery?.price || 0), 0)
                                    .toLocaleString()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                No rebates apply to net metering systems
                              </div>
                            </div>

                            {/* AI Optimization Mode Toggle - Not available for Alberta Solar Club */}
                            {!isAlberta && (
                            <div className="mt-4 pt-4 border-t-2 border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <label className="block text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                                  <Sparkles className="text-purple-600" size={20} />
                                  AI Optimization Mode
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setAiMode(!aiMode)}
                                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                    aiMode ? 'bg-purple-600' : 'bg-gray-300'
                                  }`}
                                  role="switch"
                                  aria-checked={aiMode}
                                  aria-label="Toggle AI Optimization Mode"
                                >
                                  <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                      aiMode ? 'translate-x-8' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                              <div className={`p-4 rounded-lg border-2 ${
                                aiMode 
                                  ? 'bg-purple-50 border-purple-200' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 mt-0.5 ${
                                    aiMode ? 'text-purple-600' : 'text-gray-500'
                                  }`}>
                                    {aiMode ? <Zap size={18} /> : <Battery size={18} />}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`font-semibold mb-1 ${
                                      aiMode ? 'text-purple-800' : 'text-gray-700'
                                    }`}>
                                      {aiMode ? 'AI Mode: ON' : 'AI Mode: OFF'}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      {aiMode ? (
                                        <>
                                          <p>• Maximize Solar Capture</p>
                                          <p>• 100% Efficient Grid Arbitrage</p>
                                          <p>• Ensures a full cycle daily for Maximum ROI</p>
                                        </>
                                      ) : (
                                        <>
                                          <p>• Battery only charges from solar excess (free)</p>
                                          <p>• No grid charging - battery capacity limited to available solar excess</p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {aiMode && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs text-blue-700">
                                      <strong>How it works:</strong> When AI Mode is ON, your battery charges from the grid during cheap rate periods ({selectedPlan === 'ulo' ? 'ultra-low' : 'off-peak'}) and discharges during expensive periods (on-peak/mid-peak). This creates energy arbitrage - buying low and using it to avoid buying high, maximizing your savings.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            )}
                          </>
                        )}
                                </div>
                                </div>
              </>
            )}

            {activeTab === 'distribution' && !isAlberta && (
                  <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-blue-700">
                          Customize how your annual usage is distributed across different rate periods.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
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
                    <div className="pt-3 border-t border-gray-300 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700">
                          Total: {touTotalPercent.toFixed(1)}%
                        </span>
                        {!isTouDistributionValid ? (
                          <span className="text-red-600 text-xs font-semibold">(must = 100%)</span>
                        ) : (
                          <span className="text-green-600 text-xs font-semibold">✓ Valid</span>
                        )}
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
                            onChange={(e) =>
                              setUloDistribution({
                                ...uloDistribution,
                                offPeakPercent: Number(e.target.value),
                              })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-300 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700">
                          Total: {uloTotalPercent.toFixed(1)}%
                        </span>
                        {!isUloDistributionValid ? (
                          <span className="text-red-600 text-xs font-semibold">(must = 100%)</span>
                        ) : (
                          <span className="text-green-600 text-xs font-semibold">✓ Valid</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tiered Distribution */}
                  <div className="bg-white rounded-lg border-2 border-gray-300 p-4">
                    <h3 className="font-bold text-amber-600 text-lg mb-3">Tiered (Flat Rate)</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">High-Usage Hours:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={tieredDistribution.onPeakPercent}
                            onChange={(e) =>
                              setTieredDistribution({
                                ...tieredDistribution,
                                onPeakPercent: Number(e.target.value),
                              })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Typical Usage:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={tieredDistribution.midPeakPercent}
                            onChange={(e) =>
                              setTieredDistribution({
                                ...tieredDistribution,
                                midPeakPercent: Number(e.target.value),
                              })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Low-Usage Hours:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={tieredDistribution.offPeakPercent}
                            onChange={(e) =>
                              setTieredDistribution({
                                ...tieredDistribution,
                                offPeakPercent: Number(e.target.value),
                              })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-300 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700">
                          Total: {tieredTotalPercent.toFixed(1)}%
                        </span>
                        {!isTieredDistributionValid ? (
                          <span className="text-red-600 text-xs font-semibold">(must = 100%)</span>
                        ) : (
                          <span className="text-green-600 text-xs font-semibold">✓ Valid</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Close inputs card body and container */}
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
                  apply an annual escalation to electricity rates (typically {escalatorPercent.toFixed(1)}% per year).
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
                  {escalatorPercent.toFixed(1)}% (higher rates → higher savings).
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
              message="This chart shows how much of your original annual electricity bill is offset by solar credits and battery savings."
              variant="info"
              cancelText="Close"
            >
              <p className="mb-3">
                Calculation:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                {selectedResult && (
                  <>
                    <li>
                      <span className="font-semibold">Original annual bill</span> is your{' '}
                      <span className="font-semibold">import cost before solar</span>:
                      {' '}${selectedResult.annual.importCost.toFixed(2)}.
                    </li>
                    <li>
                      After solar (and any battery savings we model here), your{' '}
                      <span className="font-semibold">net annual bill</span> is:
                      {' '}${selectedResult.annual.netAnnualBill.toFixed(2)}.
                    </li>
                    <li>
                      <span className="font-semibold">Bill Offset %</span> shown in the donut is:
                      {' '}({selectedResult.annual.importCost.toFixed(2)} − {Math.max(0, selectedResult.annual.netAnnualBill).toFixed(2)})
                      ÷ {selectedResult.annual.importCost.toFixed(2)} × 100% ≈{' '}
                      {selectedResult.annual.billOffsetPercent.toFixed(1)}%.
                    </li>
                  </>
                )}
                {batterySavingsPercent > 0 && (
                  <li>
                    <span className="font-semibold">Battery Savings</span> represents additional savings from storing excess solar during the day and using it during peak hours, reducing expensive imports.
                  </li>
                )}
                <li>
                  If the total offset is equal to your annual import cost, the donut shows <span className="font-semibold">100% Bill Fully Offset</span>.
                </li>
                <li>
                  If the total offset is higher than your bill, it's capped at 100% and the extra portion is shown as
                  <span className="font-semibold"> “+X% Credit”</span> under the donut.
                </li>
                <li>
                  Those extra credits can roll forward for up to 12 months and are reflected in the monthly rollover section below.
                </li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                This helps you quickly see whether solar plus battery storage fully eliminates your annual bill or still leaves a portion to pay.
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

            {/* Alberta Solar Club Savings Breakdown */}
            {!hasErrors && selectedResult && isAlberta && (
              <AlbertaSavingsBreakdown
                result={selectedResult}
                systemSizeKw={systemSizeKwOverride || estimate?.system?.sizeKw || 0}
                annualUsageKwh={annualUsageKwh}
                annualEscalator={typeof data.annualEscalator === 'number' ? data.annualEscalator : undefined}
                monthlyBill={data.monthlyBill}
                currentPanels={solarPanels}
                systemCost={netCost}
              />
            )}

            {/* Savings Breakdown with Donut Chart (for non-Alberta) */}
            {!hasErrors && selectedResult && !isAlberta && (
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
                </div>
                
                <DonutChart
                  touOffset={touResults?.annual.billOffsetPercent || 0}
                  uloOffset={uloResults?.annual.billOffsetPercent || 0}
                  tieredOffset={tieredResults?.annual.billOffsetPercent || 0}
                  selectedPlan={selectedPlan}
                  batterySavingsPercent={batterySavingsPercent}
                />

                <div className="mt-6 text-center text-sm text-gray-600">
                  {(() => {
                    const totalOffset = selectedResult.annual.billOffsetPercent + batterySavingsPercent
                    return totalOffset >= 100 
                      ? `Bill Fully Offset + ${(totalOffset - 100).toFixed(1)}% Credit`
                      : `Bill Offset: ${totalOffset.toFixed(1)}%`
                  })()}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedPlan === 'ulo' ? 'bg-purple-500' : selectedPlan === 'tiered' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                    <span>Solar Credits</span>
                  </div>
                  {batterySavingsPercent > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span>Battery Savings</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <span>Remaining Bill</span>
                  </div>
                </div>

                {/* Delivery fees & additional charges disclaimer */}
                <div className="mt-4 space-y-2 text-xs text-gray-700">
                  <p className="flex items-start gap-2">
                    <InfoTooltip
                      content="The savings percentage shown (e.g. Bill Offset) is based on electricity usage (energy charges), not your entire power bill. Delivery fees, regulatory charges, and utility service fees remain the responsibility of the utility and are not eliminated by solar; they are typically reduced when your consumption drops. Actual fee reductions depend on your utility's billing structure and regulations."
                    />
                    <span>Savings are based on electricity usage; delivery and regulatory charges are also reduced when consumption drops.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Detailed Breakdown - Separate Container (for non-Alberta only) */}
            {!hasErrors && selectedResult && !isAlberta && (
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
                {/* Production vs Usage (Monthly) */}
                {productionUsageChartData && productionUsageChartData.length === 12 && (
                  <div className="mb-4 bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700">Production vs Usage (Monthly)</h4>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productionUsageChartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="production" name="Production (kWh)" fill="#10b981" radius={[4,4,0,0]} />
                          <Bar dataKey="usage" name="Usage (kWh)" fill="#f59e0b" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                  
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
