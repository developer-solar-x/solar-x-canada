'use client'

// FRD-Compliant Peak Shaving Sales Calculator
// Version 2.0 - "Simple, User-Friendly & Offset-Focused UI"
// Implements all 6 required sections from the FRD

import { useState, useEffect, useMemo } from 'react'
import { 
  Sun, Battery, TrendingUp, ChevronDown, ChevronUp, 
  Zap, Info, AlertTriangle, BarChart3, DollarSign, Calendar, Award, Clock
} from 'lucide-react'
import { BATTERY_SPECS, BatterySpec, calculateBatteryRebate, BATTERY_REBATE_PER_KWH, BATTERY_REBATE_MAX } from '@/config/battery-specs'
import { RATE_PLANS, RatePlan, ULO_RATE_PLAN, TOU_RATE_PLAN } from '@/config/rate-plans'
import {
  calculateFRDPeakShaving,
  calculateSolarBatteryCombined,
  calculateSimpleMultiYear,
  calculateCombinedMultiYear,
  DEFAULT_TOU_DISTRIBUTION,
  DEFAULT_ULO_DISTRIBUTION,
  UsageDistribution,
  FRDPeakShavingResult,
  computeSolarBatteryOffsetCap,
} from '@/lib/simple-peak-shaving'
import { calculateSystemCost } from '@/config/pricing'
import type { StepBatteryPeakShavingSimpleProps } from '../StepBatteryPeakShavingSimple/types'
import { clampBreakdown, type LeftoverBreakdown } from '../StepBatteryPeakShavingSimple/utils'

// Animated number component for smooth transitions
function AnimatedNumber({ value, decimals = 0, suffix = '%', prefix = '', className = '' }: { 
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
}) {
  const [isMounted, setIsMounted] = useState(false)
  // Don't initialize displayValue from value to avoid hydration mismatch
  // We'll set it after mount
  const [displayValue, setDisplayValue] = useState<number | null>(null)

  // Set mounted flag on client side only to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    // Initialize displayValue with current value after mount
    setDisplayValue(value)
  }, [value])
  
  // Update displayValue when value changes, but only after mount
  useEffect(() => {
    if (isMounted && displayValue !== null) {
      // Only animate if value actually changed
      if (Math.abs(displayValue - value) > 0.01) {
        // Animate the transition
    const duration = 700 // Animation duration in ms
    const startValue = displayValue
    const endValue = value
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (endValue - startValue) * easeOutCubic
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    requestAnimationFrame(animate)
      } else {
        // Values are the same, just update directly
        setDisplayValue(value)
      }
    }
  }, [value, isMounted, displayValue])

  // Always render the value prop on both server and client for initial render
  // Only use displayValue after mount and animation has started
  // This ensures server and client render the same initial value
  // Use suppressHydrationWarning since values may differ initially but will sync after mount
  const valueToDisplay = (isMounted && displayValue !== null && Math.abs(displayValue - value) > 0.01) ? displayValue : value
  const formattedValue = valueToDisplay >= 1000 && suffix === 'k' 
    ? (valueToDisplay / 1000).toFixed(decimals)
    : valueToDisplay.toFixed(decimals)
  
  // Suppress hydration warning - values may differ between server/client initially
  // but will sync after mount when localStorage values are loaded
  return (
    <span className={className} suppressHydrationWarning>
      {prefix}{formattedValue}{suffix}
    </span>
  )
}

// Hero Metric Card Component
function HeroMetricCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix = '%',
  caption, 
  tooltip,
  color 
}: { 
  icon: any
  label: string
  value: number
  suffix?: string
  caption: string
  tooltip?: string
  color: 'blue' | 'green' | 'gold'
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    gold: 'from-amber-500 to-amber-600', // Icon background - keeping gradient for visual appeal
  }
  
  // FRD requirement: Exact gold color #F9A825 for text/numbers
  const goldGradientStyle = color === 'gold' ? { background: 'linear-gradient(to bottom right, #F9A825, #F57C00)' } : {}

  const bgColorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    gold: 'bg-amber-50 border-amber-200',
  }

  // FRD requirement: Exact gold color #F9A825
  const goldColorStyle = color === 'gold' ? { color: '#F9A825' } : {}

  return (
    <div className={`p-3 md:p-4 rounded-xl border-2 ${bgColorClasses[color]} shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div 
          className={`p-3 rounded-lg shadow-md ${color !== 'gold' ? `bg-gradient-to-br ${colorClasses[color]}` : ''}`}
          style={color === 'gold' ? goldGradientStyle : {}}
        >
          <Icon className="text-white" size={24} />
        </div>
      </div>
      <div className="text-center">
        <div 
          className={`text-3xl md:text-4xl font-bold mb-2 ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : ''}`}
          style={goldColorStyle}
        >
          {suffix === '$' ? (
            <AnimatedNumber 
              value={value} 
              decimals={value >= 1000 ? 1 : 0} 
              suffix={value >= 1000 ? 'k' : ''} 
              prefix="$"
            />
          ) : (
            <AnimatedNumber value={value} decimals={2} suffix={suffix} />
          )}
        </div>
        <div className="text-sm font-semibold text-gray-700 mb-1">{label}</div>
        <div className="text-xs text-gray-500">
          {caption}
          {tooltip && (
            <span className="block mt-1 text-[11px] text-amber-600">{tooltip}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Energy Flow Diagram Component (Circular/Sankey style)
function EnergyFlowDiagram({ 
  result, 
  combinedResult, 
  annualUsageKwh,
  solarProductionKwh,
  offsetCapInfo,
  data
}: { 
  result: FRDPeakShavingResult | null
  combinedResult: any
  annualUsageKwh: number
  solarProductionKwh: number
  offsetCapInfo: ReturnType<typeof computeSolarBatteryOffsetCap>
  data: StepBatteryPeakShavingSimpleProps['data']
}) {
  // Calculate percentages from combined result if available, otherwise use FRD result
  let solarDirectPercent = 0
  let solarChargedBatteryPercent = 0
  let gridChargedBatteryPercent = 0
  let gridRemainingPercent = 0
  let totalOffset = 0
  let uncappedTotalOffset = 0 // Store for cap note display

  if (combinedResult?.breakdown && annualUsageKwh > 0) {
    const breakdown = combinedResult.breakdown
    // Calculate solar direct
    const solarAllocated: number = breakdown.solarAllocation 
      ? (Object.values(breakdown.solarAllocation).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) as number)
      : 0
    const uncappedSolarDirectPercent = (solarAllocated / annualUsageKwh) * 100

    // Calculate battery offsets - separate solar-charged and grid-charged (ULO/off-peak)
    let uncappedSolarChargedBatteryPercent = 0
    if (result?.offsetPercentages) {
      // Get separate percentages for solar-charged and grid-charged battery
      uncappedSolarChargedBatteryPercent = result.offsetPercentages.solarChargedBattery || 0
      gridChargedBatteryPercent = result.offsetPercentages.uloChargedBattery || 0
    } else {
      // Fallback: estimate from breakdown (less accurate)
    const batteryOffsets: any = breakdown.batteryOffsets || {}
    const batteryOffsetKwh = (batteryOffsets.onPeak || 0) + 
                             (batteryOffsets.midPeak || 0) + 
                             (batteryOffsets.offPeak || 0) +
                             (batteryOffsets.ultraLow || 0)
      // Rough estimate: assume most is solar-charged, some is grid-charged
      const totalBatteryPercent = (batteryOffsetKwh / annualUsageKwh) * 100
      uncappedSolarChargedBatteryPercent = totalBatteryPercent * 0.7 // Estimate 70% solar-charged
      gridChargedBatteryPercent = totalBatteryPercent * 0.3 // Estimate 30% grid-charged
    }

    // Apply offset cap to keep expectations realistic (winter limits)
    uncappedTotalOffset = uncappedSolarDirectPercent + uncappedSolarChargedBatteryPercent
    const offsetCapPercent = offsetCapInfo.capFraction * 100
    const cappedTotalOffset = Math.min(uncappedTotalOffset, offsetCapPercent)
    
    // Scale solar and battery offsets proportionally to maintain their ratio
    if (uncappedTotalOffset > 0 && cappedTotalOffset < uncappedTotalOffset) {
      const scale = cappedTotalOffset / uncappedTotalOffset
      solarDirectPercent = uncappedSolarDirectPercent * scale
      solarChargedBatteryPercent = uncappedSolarChargedBatteryPercent * scale
    } else {
      solarDirectPercent = uncappedSolarDirectPercent
      solarChargedBatteryPercent = uncappedSolarChargedBatteryPercent
    }

    // Grid remaining = only actual remaining grid usage (not including grid-charged battery)
    // After capping, grid remaining increases to account for the capped offset
    const uncappedGridRemaining = 100 - uncappedSolarDirectPercent - uncappedSolarChargedBatteryPercent - gridChargedBatteryPercent
    const offsetReduction = uncappedTotalOffset - (solarDirectPercent + solarChargedBatteryPercent)
    gridRemainingPercent = uncappedGridRemaining + offsetReduction
    // Total Energy Offset = only FREE energy (solar direct + solar-charged battery) - CAPPED
    // Grid-charged battery is NOT free - it's purchased from the grid
    totalOffset = solarDirectPercent + solarChargedBatteryPercent
  } else if (result) {
    const { offsetPercentages } = result
    const uncappedSolarDirectPercent = offsetPercentages.solarDirect
    const uncappedSolarChargedBatteryPercent = offsetPercentages.solarChargedBattery || 0
    gridChargedBatteryPercent = offsetPercentages.uloChargedBattery || 0
    
    // Apply offset cap to keep expectations realistic (winter limits)
    uncappedTotalOffset = uncappedSolarDirectPercent + uncappedSolarChargedBatteryPercent
    const offsetCapPercent = offsetCapInfo.capFraction * 100
    const cappedTotalOffset = Math.min(uncappedTotalOffset, offsetCapPercent)
    
    // Scale solar and battery offsets proportionally to maintain their ratio
    if (uncappedTotalOffset > 0 && cappedTotalOffset < uncappedTotalOffset) {
      const scale = cappedTotalOffset / uncappedTotalOffset
      solarDirectPercent = uncappedSolarDirectPercent * scale
      solarChargedBatteryPercent = uncappedSolarChargedBatteryPercent * scale
    } else {
      solarDirectPercent = uncappedSolarDirectPercent
      solarChargedBatteryPercent = uncappedSolarChargedBatteryPercent
    }
    
    // Grid remaining = only actual remaining grid usage
    // After capping, grid remaining increases to account for the capped offset
    const uncappedGridRemaining = offsetPercentages.gridRemaining || 0
    const offsetReduction = uncappedTotalOffset - (solarDirectPercent + solarChargedBatteryPercent)
    gridRemainingPercent = uncappedGridRemaining + offsetReduction
    // Total Energy Offset = only FREE energy (solar direct + solar-charged battery) - CAPPED
    // Grid-charged battery is NOT free - it's purchased from the grid
    totalOffset = solarDirectPercent + solarChargedBatteryPercent
  } else {
    return (
      <div className="p-12 bg-gray-50 rounded-xl border-2 border-gray-200 text-center">
        <p className="text-gray-500">Enter values above to see energy flow</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
      {/* FRD Section 9: Headline 32-40px */}
      <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 text-center">How Your Home is Powered</h3>
      
      {/* Circular flow visualization */}
      <div className="relative w-full max-w-xs mx-auto aspect-square">
        {/* Outer circle (grid remaining) */}
        <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
          {/* Grid remaining (grey) */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#E0E0E0"
            strokeWidth="20"
            strokeDasharray={`${(gridRemainingPercent / 100) * 565} 565`}
          />
          {/* Solar direct (blue) */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#1A73E8"
            strokeWidth="20"
            strokeDasharray={`${(solarDirectPercent / 100) * 565} 565`}
            strokeDashoffset={-(gridRemainingPercent / 100) * 565}
          />
          {/* Solar-charged battery (green) */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#34A853"
            strokeWidth="20"
            strokeDasharray={`${(solarChargedBatteryPercent / 100) * 565} 565`}
            strokeDashoffset={-((gridRemainingPercent + solarDirectPercent) / 100) * 565}
          />
          {/* Grid-charged battery (ULO/off-peak) - orange/amber */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#F9A825"
            strokeWidth="20"
            strokeDasharray={`${(gridChargedBatteryPercent / 100) * 565} 565`}
            strokeDashoffset={-((gridRemainingPercent + solarDirectPercent + solarChargedBatteryPercent) / 100) * 565}
          />
        </svg>
        
        {/* Center text - FRD requirement: "Net Grid Usage: X%" */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-base font-bold text-gray-800">Net Grid Usage:</div>
            <div className="text-xl font-bold text-gray-600">
              <AnimatedNumber value={gridRemainingPercent} decimals={1} suffix="%" />
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <div className="text-sm">
            <div className="font-semibold text-gray-700">From Solar Panels</div>
            <div className="text-xs text-gray-500">{solarDirectPercent.toFixed(1)}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <div className="text-sm">
            <div className="font-semibold text-gray-700">From Stored Solar</div>
            <div className="text-xs text-gray-500">{solarChargedBatteryPercent.toFixed(1)}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F9A825' }}></div>
          <div className="text-sm">
            <div className="font-semibold text-gray-700">From Battery (AI Charged)</div>
            <div className="text-xs text-gray-500">{gridChargedBatteryPercent.toFixed(1)}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-400"></div>
          <div className="text-sm">
            <div className="font-semibold text-gray-700">From Grid</div>
            <div className="text-xs text-gray-500">{gridRemainingPercent.toFixed(1)}%</div>
          </div>
        </div>
      </div>
      
      {/* Total Offset Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-700">Total Solar & Battery Offset: </span>
          <span className="text-base font-bold text-gray-800">{totalOffset.toFixed(1)}%</span>
          <span className="text-xs text-gray-500 ml-1">(Free energy from solar and battery)</span>
        </div>
        {(() => {
          const offsetCapPercent = offsetCapInfo.capFraction * 100
          const isCapped = uncappedTotalOffset > offsetCapPercent + 0.1
          return isCapped ? (
            <div className="text-[11px] text-amber-600 mt-2">
              Capped at {offsetCapPercent.toFixed(0)}% to reflect winter limits (solar production closely matches annual usage).
            </div>
          ) : null
        })()}
      </div>
    </div>
  )
}

// Before/After Savings Bars Component
function BeforeAfterBars({ 
  before, 
  after, 
  savings 
}: { 
  before: number
  after: number
  savings: number
}) {
  const maxValue = Math.max(before, after) * 1.1
  const beforeWidth = (before / maxValue) * 100
  const afterWidth = (after / maxValue) * 100
  const savingsPercent = before > 0 ? (savings / before) * 100 : 0

  return (
    <div className="space-y-4">
      {/* FRD Section 9: Headline 32-40px */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Before & After Comparison</h3>
        <p className="text-sm text-gray-600">Annual cost comparison with your solar + battery system</p>
      </div>
      
      <div className="space-y-3">
        {/* Before bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Before System</span>
            <span className="text-base font-bold text-gray-800">${before.toLocaleString()}/yr</span>
          </div>
          <div className="w-full h-12 bg-gray-200 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700 ease-out"
              style={{ width: `${beforeWidth}%` }}
            ></div>
          </div>
        </div>

        {/* After bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">After Solar + Battery + AI EMC</span>
            <span className="text-base font-bold text-green-600">${after.toLocaleString()}/yr</span>
          </div>
          <div className="w-full h-12 bg-gray-200 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-700 ease-out"
              style={{ width: `${afterWidth}%` }}
            ></div>
          </div>
        </div>

        {/* Savings summary */}
        <div className="pt-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-800">Total Savings</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                ${savings.toLocaleString()}
              </div>
            </div>
          </div>
          {/* Monthly savings display - FRD requirement */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Monthly Savings</span>
              <span className="text-lg font-bold text-green-600">
                ${(savings / 12).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PeakShavingSalesCalculatorFRDProps extends StepBatteryPeakShavingSimpleProps {
  solarPanels?: number
  onSolarPanelsChange?: (panels: number) => void
  overrideEstimateLoading?: boolean
  effectiveSystemSizeKw?: number
  panelWattage?: number
}

export function PeakShavingSalesCalculatorFRD({ 
  data, 
  onComplete, 
  onBack, 
  manualMode = false,
  solarPanels,
  onSolarPanelsChange,
  overrideEstimateLoading = false,
  effectiveSystemSizeKw,
  panelWattage = 500
}: PeakShavingSalesCalculatorFRDProps) {
  // Detailed breakdown state (expanded by default)
  const [detailedBreakdownExpanded, setDetailedBreakdownExpanded] = useState(true)
  // Client-side mounted state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false)
  // Check if estimate is being loaded (solar system size needed for calculations)
  // In manual mode, don't wait for estimate - allow manual input immediately
  const [estimateLoading, setEstimateLoading] = useState(!manualMode && !data.estimate?.system?.sizeKw)
  const [estimateError, setEstimateError] = useState<string | null>(null)
  
  // Initialize input values with safe defaults (no localStorage access during SSR)
  // We'll load from localStorage after mount to prevent hydration mismatches
  // Use BLENDED_RATE (0.223) to match StepEnergySimple calculation
  const BLENDED_RATE = 0.223 // 22.3¢/kWh blended rate (energy + delivery + HST)
  const getDefaultUsage = () => {
    return data.peakShaving?.annualUsageKwh || 
           data.energyUsage?.annualKwh || 
           (data.monthlyBill ? Math.round((data.monthlyBill / BLENDED_RATE) * 12) : null) ||
           14000
  }
  
  const getDefaultProduction = () => {
    // Use override estimate production if available (from panel customization)
    if (data.estimate?.production?.annualKwh) {
      return data.estimate.production.annualKwh
    }
    // Fallback: estimate from system size (if available)
    const systemSizeKw = data.solarOverride?.sizeKw || data.estimate?.system?.sizeKw
    if (systemSizeKw) {
      return systemSizeKw * 1200 // Conservative 1200 kWh/kW/year
    }
    return 8000
  }
  
  const getDefaultBattery = () => {
    // Support both old single battery format and new array format
    if (data.selectedBattery) {
      if (Array.isArray(data.selectedBattery)) {
        return data.selectedBattery
      }
      return [data.selectedBattery]
    }
    return ['renon-16']
  }
  
  // Helper function to combine multiple batteries into a single virtual battery
  // Handles duplicate battery IDs (same battery selected multiple times)
  const combineBatteries = (batteryIds: string[]): BatterySpec | null => {
    if (batteryIds.length === 0) return null
    
    const batteries = batteryIds
      .map(id => BATTERY_SPECS.find(b => b.id === id))
      .filter((b): b is BatterySpec => b !== undefined)
    
    if (batteries.length === 0) return null
    
    // If only one battery, return it directly
    if (batteries.length === 1) return batteries[0]
    
    // Combine multiple batteries (including duplicates)
    const totalNominalKwh = batteries.reduce((sum, b) => sum + b.nominalKwh, 0)
    const totalUsableKwh = batteries.reduce((sum, b) => sum + b.usableKwh, 0)
    const totalInverterKw = batteries.reduce((sum, b) => sum + b.inverterKw, 0)
    const totalPrice = batteries.reduce((sum, b) => sum + b.price, 0)
    
    // Weighted average efficiency (by usable capacity)
    const weightedEfficiency = batteries.reduce((sum, b) => {
      return sum + (b.roundTripEfficiency * b.usableKwh)
    }, 0) / totalUsableKwh
    
    // Minimum warranty (most restrictive)
    const minWarrantyYears = Math.min(...batteries.map(b => b.warranty.years))
    const minWarrantyCycles = Math.min(...batteries.map(b => b.warranty.cycles))
    
    // Average usable percent
    const avgUsablePercent = (totalUsableKwh / totalNominalKwh) * 100
    
    // Count unique battery types for display
    const uniqueBatteries = Array.from(new Set(batteries.map(b => `${b.brand} ${b.model}`)))
    
    return {
      id: `combined-${batteryIds.join('-')}`,
      brand: 'Multiple',
      model: `${batteries.length} Battery${batteries.length > 1 ? 's' : ''}`,
      nominalKwh: totalNominalKwh,
      usableKwh: totalUsableKwh,
      usablePercent: avgUsablePercent,
      roundTripEfficiency: weightedEfficiency,
      inverterKw: totalInverterKw,
      price: totalPrice,
      warranty: {
        years: minWarrantyYears,
        cycles: minWarrantyCycles
      },
      description: `Combined: ${uniqueBatteries.join(', ')}`
    }
  }
  
  // Input values - initialize with safe defaults (no localStorage during SSR)
  const [annualUsageInput, setAnnualUsageInput] = useState<string>(String(getDefaultUsage()))
  const [solarProductionInput, setSolarProductionInput] = useState<string>(String(getDefaultProduction()))
  const [selectedBatteryIds, setSelectedBatteryIds] = useState<string[]>(getDefaultBattery())
  const [ratePlan, setRatePlan] = useState<'TOU' | 'ULO'>('ULO')
  // AI Optimization Mode is always ON (hidden from user) - allows grid charging at cheap rates for both TOU and ULO
  const aiMode = true
  
  // Tab state for metrics section
  const [metricsTab, setMetricsTab] = useState<'current' | 'payback' | 'profit'>('current')
  
  // Wait for estimate to be available and auto-populate solar production
  // Skip in manual mode to allow free manual input
  useEffect(() => {
    if (manualMode) return // Don't auto-populate in manual mode
    
    if (data.estimate?.system?.sizeKw) {
      setEstimateLoading(false)
      // Auto-populate solar production from estimate if available and not manually set
      if (data.estimate?.production?.annualKwh) {
        const estimateProduction = Math.round(data.estimate.production.annualKwh)
        const currentProduction = Number(solarProductionInput) || 0
        // Update if significantly different (more than 100 kWh) or if it's a new override estimate
        // This handles both initial load and panel customization updates
        if (Math.abs(currentProduction - estimateProduction) > 100 || 
            currentProduction === 8000 || 
            currentProduction === 0) {
          setSolarProductionInput(String(estimateProduction))
        }
      }
    }
  }, [data.estimate, solarProductionInput, manualMode])
  
  // Generate estimate if missing or when monthlyBill/usage changes (when in estimator flow, not manual mode)
  useEffect(() => {
    if (manualMode) return
    
    // Only generate if we have required data
    if (!data.coordinates) {
      return
    }
    
    // Don't generate if we're missing critical data
    if (!data.roofAreaSqft && !data.monthlyBill && !data.energyUsage?.annualKwh) {
      return
    }
    
    const generateEstimate = async () => {
      try {
        setEstimateLoading(true)
        setEstimateError(null)
        
        const response = await fetch('/api/estimate', {
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
            annualUsageKwh: data.energyUsage?.annualKwh || data.annualUsageKwh,
            energyUsage: data.energyUsage,
            province: 'ON',
            roofAzimuth: data.roofAzimuth || 180,
            roofAreaSqft: data.roofAreaSqft,
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate estimate')
        }
        
        const result = await response.json()
        if (result.data) {
          // Auto-populate solar production from estimate
          if (result.data.production?.annualKwh) {
            const estimateProduction = Math.round(result.data.production.annualKwh)
            setSolarProductionInput(String(estimateProduction))
          }
          setEstimateLoading(false)
        }
      } catch (error) {
        console.error('Error generating estimate:', error)
        setEstimateError('Failed to generate solar estimate. Using default values.')
        setEstimateLoading(false)
      }
    }
    
    // Debounce to avoid too many API calls
    const timeoutId = setTimeout(() => {
      generateEstimate()
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [
    manualMode, 
    data.coordinates, 
    data.roofAreaSqft, 
    data.roofPolygon, 
    data.monthlyBill, 
    data.energyUsage?.annualKwh, 
    data.annualUsageKwh,
    data.roofType,
    data.roofAge,
    data.roofPitch,
    data.shadingLevel,
    data.roofAzimuth
  ])

  // Track if we've initialized from Step 3 data to avoid overriding user edits
  const [initializedFromStep3, setInitializedFromStep3] = useState(false)
  
  // Update annual usage when monthlyBill or energyUsage changes from Step 3
  // Only update once on initial load, then allow manual editing
  useEffect(() => {
    if (manualMode) return // Don't auto-update in manual mode
    if (!isMounted) return
    if (initializedFromStep3) return // Don't override after user has edited
    
    // Priority: Use energyUsage if available (most accurate)
    if (data.energyUsage?.annualKwh && data.energyUsage.annualKwh > 0) {
      const calculatedUsage = Math.round(data.energyUsage.annualKwh)
      const currentUsage = Number(annualUsageInput) || 0
      // Only update if field is empty or default value
      if (currentUsage === 0 || currentUsage === 8000 || Math.abs(currentUsage - calculatedUsage) > 100) {
        setAnnualUsageInput(String(calculatedUsage))
        setInitializedFromStep3(true)
      }
      return
    }
    
    // Fallback: Calculate from monthly bill if available
    if (data.monthlyBill && data.monthlyBill > 0) {
      const calculatedUsage = Math.round((data.monthlyBill / BLENDED_RATE) * 12)
      const currentUsage = Number(annualUsageInput) || 0
      // Only update if field is empty or default value
      if (currentUsage === 0 || currentUsage === 8000 || Math.abs(currentUsage - calculatedUsage) > 100) {
        setAnnualUsageInput(String(calculatedUsage))
        setInitializedFromStep3(true)
      }
    }
  }, [data.monthlyBill, data.energyUsage?.annualKwh, isMounted, annualUsageInput, initializedFromStep3, manualMode])
  
  // Set mounted flag on client side only to prevent hydration mismatch
  // Also load values from localStorage after mount
  useEffect(() => {
    setIsMounted(true)
    
    // Load from localStorage after mount to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      if (manualMode) {
        // In manual mode, only load from localStorage, don't override with prop data
        const savedUsage = window.localStorage.getItem('peak_shaving_annual_usage_kwh') || 
                          window.localStorage.getItem('manual_estimator_annual_kwh')
        if (savedUsage) {
          const numValue = Number(savedUsage)
          if (!isNaN(numValue) && numValue > 0) {
            setAnnualUsageInput(savedUsage)
          }
        }
        
        const savedProduction = window.localStorage.getItem('peak_shaving_solar_production_kwh') ||
                               window.localStorage.getItem('manual_estimator_production_kwh')
        if (savedProduction) {
          const numValue = Number(savedProduction)
          if (!isNaN(numValue) && numValue > 0) {
            setSolarProductionInput(savedProduction)
          }
        }
      } else {
        // In step mode, prioritize fresh data from props, then localStorage
        const hasFreshData = data.energyUsage?.annualKwh || (data.monthlyBill && data.monthlyBill > 0)
        
        if (hasFreshData) {
          // Calculate from fresh data immediately
          if (data.energyUsage?.annualKwh && data.energyUsage.annualKwh > 0) {
            setAnnualUsageInput(String(Math.round(data.energyUsage.annualKwh)))
            setInitializedFromStep3(true)
          } else if (data.monthlyBill && data.monthlyBill > 0) {
            const calculatedUsage = Math.round((data.monthlyBill / BLENDED_RATE) * 12)
            setAnnualUsageInput(String(calculatedUsage))
            setInitializedFromStep3(true)
          }
        } else {
          // Only load from localStorage if we don't have fresh data from Step 3
          const savedUsage = window.localStorage.getItem('peak_shaving_annual_usage_kwh')
          if (savedUsage) {
            const numValue = Number(savedUsage)
            if (!isNaN(numValue) && numValue > 0) {
              setAnnualUsageInput(savedUsage)
            }
          }
        }
        
        const savedProduction = window.localStorage.getItem('peak_shaving_solar_production_kwh')
        if (savedProduction) {
          const numValue = Number(savedProduction)
          if (!isNaN(numValue) && numValue > 0) {
            setSolarProductionInput(savedProduction)
          }
        }
      }
      
      // Load battery selection from localStorage
      const savedBattery = window.localStorage.getItem('peak_shaving_battery_ids')
      if (savedBattery) {
        try {
          const parsed = JSON.parse(savedBattery)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedBatteryIds(parsed)
          }
        } catch (e) {
          // Fallback to old format
          const oldBattery = window.localStorage.getItem('peak_shaving_battery_id')
          if (oldBattery) {
            setSelectedBatteryIds([oldBattery])
          }
        }
      } else {
        // Try old format for backward compatibility
        const oldBattery = window.localStorage.getItem('peak_shaving_battery_id')
        if (oldBattery) {
          setSelectedBatteryIds([oldBattery])
        }
      }
      
      const savedRatePlan = window.localStorage.getItem('peak_shaving_rate_plan')
      if (savedRatePlan === 'TOU' || savedRatePlan === 'ULO') {
        setRatePlan(savedRatePlan)
      }
    }
    // Only run once on mount - don't re-run when manualMode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Persist annual usage to localStorage
  useEffect(() => {
    if (isMounted && annualUsageInput) {
      const numValue = Number(annualUsageInput)
      if (!isNaN(numValue) && numValue > 0) {
        window.localStorage.setItem('peak_shaving_annual_usage_kwh', String(numValue))
      }
    }
  }, [annualUsageInput, isMounted])
  
  // Persist solar production to localStorage
  useEffect(() => {
    if (isMounted && solarProductionInput) {
      const numValue = Number(solarProductionInput)
      if (!isNaN(numValue) && numValue > 0) {
        window.localStorage.setItem('peak_shaving_solar_production_kwh', String(numValue))
      }
    }
  }, [solarProductionInput, isMounted])
  
  // Persist battery selection to localStorage
  useEffect(() => {
    if (isMounted && selectedBatteryIds.length > 0) {
      window.localStorage.setItem('peak_shaving_battery_ids', JSON.stringify(selectedBatteryIds))
      // Also save first battery for backward compatibility
      if (selectedBatteryIds.length > 0) {
        window.localStorage.setItem('peak_shaving_battery_id', selectedBatteryIds[0])
      }
    }
  }, [selectedBatteryIds, isMounted])
  
  // Persist rate plan to localStorage
  useEffect(() => {
    if (isMounted && ratePlan) {
      window.localStorage.setItem('peak_shaving_rate_plan', ratePlan)
    }
  }, [ratePlan, isMounted])

  // Parse numeric values
  const annualUsageKwh = Math.max(0, Number(annualUsageInput) || 0)
  const solarProductionKwh = Math.max(0, Number(solarProductionInput) || 0)
  const selectedBattery = combineBatteries(selectedBatteryIds) || BATTERY_SPECS[0]

  // Calculate rebates
  const rebates = useMemo(() => {
    // Solar rebate: $1,000 per kW, max $5,000
    const solarRebatePerKw = 1000
    const solarRebateMax = 5000
    const systemSize = effectiveSystemSizeKw || 0
    const solarRebateCalculated = systemSize * solarRebatePerKw
    const solarRebate = Math.min(solarRebateCalculated, solarRebateMax)

    // Battery rebate: $300 per kWh, max $5,000 (per battery, but we combine them)
    const batteryRebate = selectedBattery ? calculateBatteryRebate(selectedBattery.nominalKwh) : 0

    // Total rebates
    const totalRebates = solarRebate + batteryRebate

    return {
      solarRebate,
      batteryRebate,
      totalRebates,
      solarRebatePerKw,
      solarRebateMax,
      batteryRebatePerKwh: BATTERY_REBATE_PER_KWH,
      batteryRebateMax: BATTERY_REBATE_MAX
    }
  }, [effectiveSystemSizeKw, selectedBattery])

  // Calculate offset cap to account for winter limits (EXACT same as manual calculator)
  const offsetCapInfo = useMemo(() => {
    // Use roof data from props if available, otherwise use defaults
    const roofPitch = data.estimate?.roof?.pitch ?? data.roofPitch ?? 'medium'
    const roofAzimuth = data.estimate?.roof?.azimuth ?? data.roofAzimuth ?? 180
    
    return computeSolarBatteryOffsetCap({
      usageKwh: Math.max(0, annualUsageKwh || 0),
      productionKwh: Math.max(0, solarProductionKwh || 0),
      roofPitch: roofPitch,
      roofAzimuth: roofAzimuth,
      roofSections: data.roofSections,
    })
  }, [
    annualUsageKwh,
    solarProductionKwh,
    data.estimate?.roof?.pitch,
    data.roofPitch,
    data.estimate?.roof?.azimuth,
    data.roofAzimuth,
    data.roofSections,
  ])

  // Calculate results using the same method as the old calculator for consistency
  const combinedResult = useMemo(() => {
    if (!annualUsageKwh || annualUsageKwh <= 0) return null
    if (!selectedBattery) return null

    try {
      const ratePlanObj: RatePlan = ratePlan === 'ULO' ? ULO_RATE_PLAN : TOU_RATE_PLAN
      const distribution: UsageDistribution = ratePlan === 'ULO' ? DEFAULT_ULO_DISTRIBUTION : DEFAULT_TOU_DISTRIBUTION

      // Use calculateSolarBatteryCombined with offset cap (EXACT same as manual calculator)
      return calculateSolarBatteryCombined(
        annualUsageKwh,
        solarProductionKwh,
        selectedBattery,
        ratePlanObj,
        distribution,
        offsetCapInfo.capFraction, // Apply winter cap to keep expectations realistic
        aiMode  // AI Mode enables battery grid charging for arbitrage (both TOU and ULO)
      )
    } catch (e) {
      console.error('Calculation error:', e)
      return null
    }
  }, [annualUsageKwh, solarProductionKwh, selectedBattery, ratePlan, aiMode, offsetCapInfo.capFraction])

  // Also calculate FRD result for offset percentages display
  const frdResult = useMemo<FRDPeakShavingResult | null>(() => {
    if (!annualUsageKwh || annualUsageKwh <= 0) return null
    if (!selectedBattery || selectedBatteryIds.length === 0) return null

    try {
      const ratePlanObj: RatePlan = ratePlan === 'ULO' ? ULO_RATE_PLAN : TOU_RATE_PLAN
      const distribution: UsageDistribution = ratePlan === 'ULO' ? DEFAULT_ULO_DISTRIBUTION : DEFAULT_TOU_DISTRIBUTION

      return calculateFRDPeakShaving(
        annualUsageKwh,
        solarProductionKwh,
        selectedBattery,
        ratePlanObj,
        distribution,
        aiMode, // AI Mode now works for both TOU and ULO plans
        { p_day: 0.5, p_night: 0.5 }
      )
    } catch (e) {
      console.error('FRD Calculation error:', e)
      return null
    }
  }, [annualUsageKwh, solarProductionKwh, selectedBattery, ratePlan, aiMode])

  // Use FRD result for offset percentages, combined result for costs
  const result = frdResult

  // Validation state - FRD Section 10 requirements
  const hasErrors = annualUsageInput !== '' && annualUsageKwh <= 0
  const hasBatteryError = selectedBatteryIds.length === 0
  
  // Check if solar + battery capacity exceeds usage (non-blocking warning)
  const batteryCapacityKwh = selectedBattery?.nominalKwh || 0
  const totalCapacityKwh = solarProductionKwh + batteryCapacityKwh
  
  // Check for extremely low or high usage (info tooltip)
  const usageExtremelyLow = annualUsageKwh > 0 && annualUsageKwh < 3000
  const usageExtremelyHigh = annualUsageKwh > 50000

  // Calculate hero metrics from combined result for consistency
  const heroMetrics = useMemo(() => {
    // Return zeros until mounted to ensure consistent server/client render
    // This prevents hydration mismatches when values differ between server and client
    if (!isMounted) {
      return {
        solarOffset: 0,
        batteryOffset: 0,
        totalSavings: 0,
        totalEnergyOffset: 0,
        gridChargedBatteryPercent: 0,
        boughtFromGridPercent: 0,
        costOfEnergyBoughtFromGrid: 0,
        remainingGridCostTooltip: undefined,
      }
    }
    
    if (!combinedResult || !annualUsageKwh || annualUsageKwh <= 0) {
      return {
        solarOffset: 0,
        batteryOffset: 0,
        totalSavings: 0,
        totalEnergyOffset: 0,
        gridChargedBatteryPercent: 0,
        boughtFromGridPercent: 0,
        costOfEnergyBoughtFromGrid: 0,
        remainingGridCostTooltip: undefined,
      }
    }

    // Calculate percentages from combined result breakdown
    const breakdown = combinedResult.breakdown
    if (!breakdown) {
      // Fallback to FRD result if breakdown not available
      if (result) {
        // Get uncapped offsets from FRD result
        const uncappedSolarOffset = result.offsetPercentages.solarDirect
        const uncappedBatteryOffset = result.offsetPercentages.solarChargedBattery
        const uncappedTotalOffset = uncappedSolarOffset + uncappedBatteryOffset
        
        // Apply offset cap to keep expectations realistic (winter limits)
        // Cap only affects offset display, not savings calculation
        // Solar offset should remain at its calculated value (typically 50% for daytime usage)
        // Only battery offset should be adjusted if cap is exceeded
        const offsetCapPercent = offsetCapInfo.capFraction * 100
        const cappedTotalOffset = Math.min(uncappedTotalOffset, offsetCapPercent)
        
        // Keep solar offset at its calculated value (not scaled)
        let solarOffset = uncappedSolarOffset
        // Only scale battery offset if total exceeds cap
        let batteryOffset = uncappedBatteryOffset
        if (uncappedTotalOffset > 0 && cappedTotalOffset < uncappedTotalOffset) {
          // Calculate how much room is left for battery after solar
          const remainingCap = Math.max(0, offsetCapPercent - solarOffset)
          batteryOffset = Math.min(uncappedBatteryOffset, remainingCap)
        }
        
        const totalSavings = solarOffset + batteryOffset
        
        // Check if offset is capped and calculate adjusted grid remaining
        const offsetCapped = uncappedTotalOffset > offsetCapPercent + 0.1
        const offsetReduction = uncappedTotalOffset - (solarOffset + batteryOffset)
        const additionalGridKwh = (offsetReduction / 100) * annualUsageKwh
        
        // Calculate bought from grid and cost percentage
        const gridChargedBatteryPercent = result.offsetPercentages.uloChargedBattery || 0
        const gridRemainingPercent = result.offsetPercentages.gridRemaining || 0
        // When offset is capped, add the offset reduction to grid remaining
        // This ensures that when production equals/exceeds usage, we show the additional grid energy needed
        const adjustedGridRemainingPercent = gridRemainingPercent + (offsetCapped ? offsetReduction : 0)
        let boughtFromGridPercent = gridChargedBatteryPercent + adjustedGridRemainingPercent
        
        // Ensure the math adds up: totalEnergyOffset + boughtFromGridPercent should = 100%
        const calculatedTotal = (solarOffset + batteryOffset) + boughtFromGridPercent
        if (Math.abs(calculatedTotal - 100) > 0.1) {
          // If they don't add up, recalculate to ensure correctness
          boughtFromGridPercent = 100 - (solarOffset + batteryOffset)
        }
        
        // Store offsets for TOU off-peak cap calculation
        const totalOffsetPercent = solarOffset + batteryOffset
        
        // Get cost percentage from combined result if available
        // Calculate from actual grid energy breakdown to match StepBatteryPeakShavingSimple exactly
        let costOfEnergyBoughtFromGrid = 0
        let totalSavingsPercent = 0
        
        // Use combined result baseline bill (EXACT same as manual calculator)
        // Manual calculator uses touData.combined?.baselineAnnualBill which comes from displayedMonthlyBill * 12
        const baselineBill = combinedResult?.baselineAnnualBill || 0
        
        if (baselineBill > 0 && result) {
          // Get rate plan to calculate costs
          const ratePlanObj: RatePlan = ratePlan === 'ULO' ? ULO_RATE_PLAN : TOU_RATE_PLAN
          const ultraLowRate = ratePlanObj.periods.find(p => p.period === 'ultra-low')?.rate ?? 3.9
          const offPeakRate = ratePlanObj.periods.find(p => p.period === 'off-peak')?.rate ?? 9.8
          const midPeakRate = ratePlanObj.periods.find(p => p.period === 'mid-peak')?.rate ?? 15.7
          const onPeakRate = ratePlanObj.periods.find(p => p.period === 'on-peak')?.rate ?? (ratePlan === 'ULO' ? 39.1 : 20.3)
          
          // Get battery grid-charged kWh (EXACT same as manual calculator)
          const batteryGridChargedKwh = result.battGridCharged || 0
          
          // Calculate battery charging cost separately (EXACT same as manual calculator)
          const chargingRate = ratePlan === 'ULO' ? ultraLowRate : offPeakRate
          const batteryChargingCost = batteryGridChargedKwh * (chargingRate / 100)
          
          // Calculate leftover grid energy (remaining grid usage EXCLUDING battery charging)
          // Manual calculator uses gridRemainingPercent for leftover, not boughtFromGridPercent
          const gridRemainingPercent = result.offsetPercentages.gridRemaining || 0
          const originalLeftoverKwh = gridRemainingPercent * annualUsageKwh / 100
          // When offset is capped, use adjusted grid remaining to include additional grid energy
          const adjustedLeftoverKwh = originalLeftoverKwh + (offsetCapped ? additionalGridKwh : 0)
          // Use adjusted leftoverKwh for cost calculation
          const leftoverKwh = adjustedLeftoverKwh
          
          // Get gridKWhByBucket - use it directly and scale to leftoverKwh (EXACT same as manual calculator)
          // For TOU: manual uses touFrd.gridKWhByBucket directly and scales it
          // For ULO: manual uses uloData.result.leftoverEnergy.breakdown (which doesn't include battery charging)
          const gridKwhByBucket = result.gridKWhByBucket || {}
          
          // For TOU: use gridKWhByBucket directly and scale (manual calculator approach)
          // For ULO: use clampBreakdown on leftoverEnergy.breakdown (EXACT same as manual calculator)
          let clampedBreakdown: LeftoverBreakdown
          
          if (ratePlan === 'TOU') {
            // TOU: use gridKWhByBucket directly and scale (EXACT same as manual calculator)
            const rawBreakdown = {
              ultraLow: 0,
              offPeak: gridKwhByBucket.offPeak || 0,
              midPeak: gridKwhByBucket.midPeak || 0,
              onPeak: gridKwhByBucket.onPeak || 0
            }
            const rawTotal = rawBreakdown.offPeak + rawBreakdown.midPeak + rawBreakdown.onPeak
            
            // Scale breakdown to match leftoverKwh (EXACT same as manual calculator)
            let scaledBreakdown: LeftoverBreakdown
            if (rawTotal > 0 && Math.abs(rawTotal - leftoverKwh) > 0.01) {
              const scale = leftoverKwh / rawTotal
              scaledBreakdown = {
                ultraLow: 0,
                offPeak: rawBreakdown.offPeak * scale,
                midPeak: rawBreakdown.midPeak * scale,
                onPeak: rawBreakdown.onPeak * scale
              }
            } else {
              scaledBreakdown = rawBreakdown
            }
            
            // Calculate off-peak cap for TOU (EXACT same as manual calculator)
            const distribution = DEFAULT_TOU_DISTRIBUTION
            const originalOffPeakUsage = annualUsageKwh * distribution.offPeakPercent / 100
            const postOffPeakUsage = (scaledBreakdown.offPeak || 0) + batteryGridChargedKwh
            const offPeakRoomForRemainder = Math.max(0, originalOffPeakUsage - postOffPeakUsage)
            const offPeakCap = Math.min(leftoverKwh, offPeakRoomForRemainder + (annualUsageKwh * 0.05))
            
            // Apply clampBreakdown with off-peak cap (EXACT same as manual calculator)
            clampedBreakdown = clampBreakdown(
              scaledBreakdown,
              leftoverKwh,
              ['offPeak', 'midPeak', 'onPeak'],
              { offPeak: offPeakCap }
            )
          } else {
            // ULO: derive leftoverEnergy.breakdown from gridKWhByBucket (subtract battery charging)
            // Then apply clampBreakdown with ultra-low cap (EXACT same as manual calculator)
            const leftoverBreakdown = {
              ultraLow: Math.max(0, (gridKwhByBucket.ultraLow || 0) - batteryGridChargedKwh),
              offPeak: gridKwhByBucket.offPeak || 0,
              midPeak: gridKwhByBucket.midPeak || 0,
              onPeak: gridKwhByBucket.onPeak || 0
            }
            
            // Calculate ultra-low cap for ULO (EXACT same as manual calculator - similar to TOU off-peak cap)
            const distribution = DEFAULT_ULO_DISTRIBUTION
            const originalUltraLowUsage = annualUsageKwh * (distribution.ultraLowPercent || 0) / 100
            const postUltraLowUsage = (leftoverBreakdown.ultraLow || 0) + batteryGridChargedKwh
            const ultraLowRoomForRemainder = Math.max(0, originalUltraLowUsage - postUltraLowUsage)
            const ultraLowCap = Math.min(leftoverKwh, ultraLowRoomForRemainder + (annualUsageKwh * 0.05))
            
            // Apply clampBreakdown with ultra-low cap (EXACT same as manual calculator)
            clampedBreakdown = clampBreakdown(
              leftoverBreakdown,
              leftoverKwh,
              ['ultraLow', 'offPeak', 'midPeak', 'onPeak'],
              { ultraLow: ultraLowCap }
            )
          }
          
          // Calculate leftover cost from clamped breakdown
          const leftoverCost = 
            (clampedBreakdown.ultraLow || 0) * (ultraLowRate / 100) +
            (clampedBreakdown.offPeak || 0) * (offPeakRate / 100) +
            (clampedBreakdown.midPeak || 0) * (midPeakRate / 100) +
            (clampedBreakdown.onPeak || 0) * (onPeakRate / 100)
          
          // If offset is capped, add cost of additional grid energy (at cheapest rate)
          // IMPORTANT: Match manual calculator - always add this cost when capped
          const additionalGridCost = offsetCapped ? additionalGridKwh * (chargingRate / 100) : 0
          
          // Total grid cost = battery charging + leftover + additional grid cost (if capped)
          const totalGridCost = batteryChargingCost + leftoverCost + additionalGridCost
          
          // Cost percentage = actual grid cost / original bill * 100
          // Use same calculation as StepBatteryPeakShavingSimple
          costOfEnergyBoughtFromGrid = (totalGridCost / baselineBill) * 100
          // Calculate Total Savings as complement to ensure they add up to 100%
          totalSavingsPercent = Math.max(0, 100 - costOfEnergyBoughtFromGrid)
        } else if (baselineBill > 0) {
          // Fallback: use bill ratio if breakdown not available
          const postSolarBatteryBill = combinedResult?.postSolarBatteryAnnualBill || result?.annualCostAfter || 0
          costOfEnergyBoughtFromGrid = (postSolarBatteryBill / baselineBill) * 100
          totalSavingsPercent = Math.max(0, 100 - costOfEnergyBoughtFromGrid)
        }

        // Final safety check: ensure boughtFromGridPercent accounts for cap
        const totalEnergyOffset = solarOffset + batteryOffset
        const finalTotal = totalEnergyOffset + boughtFromGridPercent
        if (Math.abs(finalTotal - 100) > 0.1) {
          // Recalculate boughtFromGridPercent to ensure it's correct
          boughtFromGridPercent = Math.max(0, 100 - totalEnergyOffset)
        }

        // Calculate tooltip text for "Remaining Grid Cost" when offset is capped
        // Show tooltip for both TOU and ULO modes when offset is capped
        let remainingGridCostTooltip: string | undefined
        if (offsetCapped && additionalGridKwh > 0.1 && baselineBill > 0 && result) {
          const ratePlanObj: RatePlan = ratePlan === 'ULO' ? ULO_RATE_PLAN : TOU_RATE_PLAN
          const ultraLowRate = ratePlanObj.periods.find(p => p.period === 'ultra-low')?.rate ?? 3.9
          const offPeakRate = ratePlanObj.periods.find(p => p.period === 'off-peak')?.rate ?? 9.8
          // For TOU, use off-peak rate; for ULO, use ultra-low rate
          const tooltipRate = ratePlan === 'ULO' ? ultraLowRate : offPeakRate
          remainingGridCostTooltip = `Cost includes additional grid energy (${additionalGridKwh.toFixed(0)} kWh @ ${tooltipRate.toFixed(1)}¢/kWh) due to winter cap.`
        }

        return { 
          solarOffset, 
          batteryOffset, 
          totalSavings: totalSavingsPercent,
          totalEnergyOffset,
          gridChargedBatteryPercent,
          boughtFromGridPercent,
          costOfEnergyBoughtFromGrid,
          uncappedTotalOffset, // Include for cap note display
          remainingGridCostTooltip,
        }
      }
      return { 
        solarOffset: 0, 
        batteryOffset: 0, 
        totalSavings: 0,
        totalEnergyOffset: 0,
        gridChargedBatteryPercent: 0,
        boughtFromGridPercent: 0,
        costOfEnergyBoughtFromGrid: 0,
        remainingGridCostTooltip: undefined,
      }
    }

    // Calculate solar direct offset
    const solarAllocated: number = breakdown.solarAllocation 
      ? (Object.values(breakdown.solarAllocation).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) as number)
      : 0
    const uncappedSolarOffset = (solarAllocated / annualUsageKwh) * 100

    // Calculate battery offset - only solar-charged battery (not grid-charged)
    // Try to get from FRD result if available for accurate separation
    let uncappedBatteryOffset = 0
    if (result?.offsetPercentages) {
      // Use FRD result to get accurate solar-charged battery percentage
      uncappedBatteryOffset = result.offsetPercentages.solarChargedBattery
    } else {
      // Fallback: estimate from breakdown (less accurate)
    const batteryOffsets: any = breakdown.batteryOffsets || {}
    const batteryOffsetKwh = (batteryOffsets.onPeak || 0) + 
                             (batteryOffsets.midPeak || 0) + 
                             (batteryOffsets.offPeak || 0) +
                             (batteryOffsets.ultraLow || 0)
      // Conservative estimate: assume most battery is solar-charged
      uncappedBatteryOffset = (batteryOffsetKwh / annualUsageKwh) * 100
    }

    // Apply offset cap to keep expectations realistic (winter limits)
    // Cap only affects offset display, not savings calculation
    const uncappedTotalOffsetForCap = uncappedSolarOffset + uncappedBatteryOffset
    const offsetCapPercent = offsetCapInfo.capFraction * 100
    const cappedTotalOffset = Math.min(uncappedTotalOffsetForCap, offsetCapPercent)
    
    // Scale solar and battery offsets proportionally to maintain their ratio
    let solarOffset = uncappedSolarOffset
    let batteryOffset = uncappedBatteryOffset
    if (uncappedTotalOffsetForCap > 0 && cappedTotalOffset < uncappedTotalOffsetForCap) {
      const scale = cappedTotalOffset / uncappedTotalOffsetForCap
      solarOffset = uncappedSolarOffset * scale
      batteryOffset = uncappedBatteryOffset * scale
    }

    // Total Energy Offset = solar + battery (free energy only) - CAPPED
    const totalEnergyOffset = solarOffset + batteryOffset
    const uncappedTotalOffset = uncappedTotalOffsetForCap // Store for cap note display

    // Calculate grid-charged battery percentage (ULO/off-peak charged)
    let gridChargedBatteryPercent = 0
    if (result?.offsetPercentages) {
      // For ULO: uloChargedBattery, for TOU: also uses uloChargedBattery field (off-peak charged)
      gridChargedBatteryPercent = result.offsetPercentages.uloChargedBattery || 0
    }

    // Check if offset is capped and calculate adjusted grid remaining
    const offsetCapped = uncappedTotalOffset > offsetCapPercent + 0.1
    const offsetReduction = uncappedTotalOffset - totalEnergyOffset
    const additionalGridKwh = (offsetReduction / 100) * annualUsageKwh

    // Calculate "Bought from cheap hours" = grid-charged battery + adjusted grid remaining
    // When offset is capped, we must account for the additional grid energy needed
    let boughtFromGridPercent = 0
    if (result?.offsetPercentages) {
      // Grid-charged battery + remaining grid usage (adjusted for cap if needed)
      const gridRemainingPercent = result.offsetPercentages.gridRemaining || 0
      
      // When offset is capped, add the offset reduction to grid remaining
      // This ensures that when production equals/exceeds usage, we show the additional grid energy needed
      // Example: 100% uncapped offset capped to 90% means 10% must be bought from grid
      const adjustedGridRemainingPercent = offsetCapped 
        ? (gridRemainingPercent + offsetReduction)
        : gridRemainingPercent
      
      boughtFromGridPercent = gridChargedBatteryPercent + adjustedGridRemainingPercent
    } else {
      // Fallback: calculate from total (this already accounts for cap since totalEnergyOffset is capped)
      boughtFromGridPercent = 100 - totalEnergyOffset
    }
    
    // CRITICAL: Always ensure boughtFromGridPercent + totalEnergyOffset = 100%
    // This is the most important check - it ensures the math is always correct
    // When offset is capped at 90%, boughtFromGridPercent must be 10%
    const calculatedTotal = totalEnergyOffset + boughtFromGridPercent
    if (Math.abs(calculatedTotal - 100) > 0.1) {
      // Recalculate to ensure correctness - this handles all edge cases
      boughtFromGridPercent = Math.max(0, 100 - totalEnergyOffset)
    }
    
    // Additional explicit check: if offset is capped, ensure boughtFromGridPercent reflects the cap
    // This is a double-check to ensure we're always showing the correct value
    if (offsetCapped && offsetReduction > 0.1) {
      // When capped, the remainder must equal the offset reduction
      // Example: 100% uncapped -> 90% capped = 10% reduction = 10% bought from grid
      const expectedRemainder = 100 - totalEnergyOffset
      if (Math.abs(boughtFromGridPercent - expectedRemainder) > 0.1) {
        boughtFromGridPercent = expectedRemainder
      }
    }

    // Calculate "Remaining Grid Cost (Discounted)" as percentage of original bill
    // This represents the discounted cost of remaining grid energy (including grid-charged battery)
    // Discounted because remaining energy is allocated to cheapest rate periods
    // Calculate from actual grid energy breakdown to match StepBatteryPeakShavingSimple exactly
    let costOfEnergyBoughtFromGrid = 0
    
    // Use combined result baseline bill (EXACT same as manual calculator)
    // Manual calculator uses touData.combined?.baselineAnnualBill which comes from displayedMonthlyBill * 12
    const baselineBill = combinedResult?.baselineAnnualBill || 0
    
    if (baselineBill > 0 && result) {
      // Get rate plan to calculate costs
      const ratePlanObj: RatePlan = ratePlan === 'ULO' ? ULO_RATE_PLAN : TOU_RATE_PLAN
      const ultraLowRate = ratePlanObj.periods.find(p => p.period === 'ultra-low')?.rate ?? 3.9
      const offPeakRate = ratePlanObj.periods.find(p => p.period === 'off-peak')?.rate ?? 9.8
      const midPeakRate = ratePlanObj.periods.find(p => p.period === 'mid-peak')?.rate ?? 15.7
      const onPeakRate = ratePlanObj.periods.find(p => p.period === 'on-peak')?.rate ?? (ratePlan === 'ULO' ? 39.1 : 20.3)
      
      // Get battery grid-charged kWh (EXACT same as manual calculator)
      const batteryGridChargedKwh = result.battGridCharged || 0
      
      // Calculate battery charging cost separately (EXACT same as manual calculator)
      const chargingRate = ratePlan === 'ULO' ? ultraLowRate : offPeakRate
      const batteryChargingCost = batteryGridChargedKwh * (chargingRate / 100)
      
      // Calculate leftover grid energy (remaining grid usage EXCLUDING battery charging)
      // Manual calculator uses gridRemainingPercent for leftover, not boughtFromGridPercent
      const gridRemainingPercent = result.offsetPercentages.gridRemaining || 0
      const originalLeftoverKwh = gridRemainingPercent * annualUsageKwh / 100
      // When offset is capped, use adjusted grid remaining to include additional grid energy
      const adjustedLeftoverKwh = originalLeftoverKwh + (offsetCapped ? additionalGridKwh : 0)
      // Use adjusted leftoverKwh for cost calculation, but scale breakdown to original first
      const leftoverKwh = adjustedLeftoverKwh
      
      // Get gridKWhByBucket - use it directly and scale to leftoverKwh (EXACT same as manual calculator)
      // For TOU: manual uses touFrd.gridKWhByBucket directly and scales it
      // For ULO: manual uses uloData.result.leftoverEnergy.breakdown (which doesn't include battery charging)
      const gridKwhByBucket = result.gridKWhByBucket || {}
      
      // For TOU: use gridKWhByBucket directly and scale (manual calculator approach)
      // For ULO: use clampBreakdown on leftoverEnergy.breakdown (EXACT same as manual calculator)
      let clampedBreakdown: LeftoverBreakdown
      
      if (ratePlan === 'TOU') {
        // TOU: use gridKWhByBucket directly and scale (EXACT same as manual calculator)
        const rawBreakdown = {
          ultraLow: 0,
          offPeak: gridKwhByBucket.offPeak || 0,
          midPeak: gridKwhByBucket.midPeak || 0,
          onPeak: gridKwhByBucket.onPeak || 0
        }
        const rawTotal = rawBreakdown.offPeak + rawBreakdown.midPeak + rawBreakdown.onPeak
        
        // IMPORTANT: Scale breakdown to match adjustedLeftoverKwh (not originalLeftoverKwh)
        // This matches the manual calculator which uses touLeftoverKwh (which is already adjusted)
        let scaledBreakdown: LeftoverBreakdown
        if (rawTotal > 0 && Math.abs(rawTotal - adjustedLeftoverKwh) > 0.01) {
          const scale = adjustedLeftoverKwh / rawTotal
          scaledBreakdown = {
            ultraLow: 0,
            offPeak: rawBreakdown.offPeak * scale,
            midPeak: rawBreakdown.midPeak * scale,
            onPeak: rawBreakdown.onPeak * scale
          }
        } else {
          scaledBreakdown = rawBreakdown
        }
        
        // Calculate off-peak cap for TOU (EXACT same as manual calculator)
        const distribution = DEFAULT_TOU_DISTRIBUTION
        const originalOffPeakUsage = annualUsageKwh * distribution.offPeakPercent / 100
        const postOffPeakUsage = (scaledBreakdown.offPeak || 0) + batteryGridChargedKwh
        const offPeakRoomForRemainder = Math.max(0, originalOffPeakUsage - postOffPeakUsage)
        const offPeakCap = Math.min(adjustedLeftoverKwh, offPeakRoomForRemainder + (annualUsageKwh * 0.05))
        
        // Apply clampBreakdown with off-peak cap to adjusted leftoverKwh (includes additional energy if capped)
        clampedBreakdown = clampBreakdown(
          scaledBreakdown,
          adjustedLeftoverKwh,
          ['offPeak', 'midPeak', 'onPeak'],
          { offPeak: offPeakCap }
        )
      } else {
        // ULO: derive leftoverEnergy.breakdown from gridKWhByBucket (subtract battery charging)
        // Then apply clampBreakdown with ultra-low cap (EXACT same as manual calculator)
        const leftoverBreakdown = {
          ultraLow: Math.max(0, (gridKwhByBucket.ultraLow || 0) - batteryGridChargedKwh),
          offPeak: gridKwhByBucket.offPeak || 0,
          midPeak: gridKwhByBucket.midPeak || 0,
          onPeak: gridKwhByBucket.onPeak || 0
        }
        
        // Calculate ultra-low cap for ULO (EXACT same as manual calculator - similar to TOU off-peak cap)
        const distribution = DEFAULT_ULO_DISTRIBUTION
        const originalUltraLowUsage = annualUsageKwh * (distribution.ultraLowPercent || 0) / 100
        const postUltraLowUsage = (leftoverBreakdown.ultraLow || 0) + batteryGridChargedKwh
        const ultraLowRoomForRemainder = Math.max(0, originalUltraLowUsage - postUltraLowUsage)
        const ultraLowCap = Math.min(adjustedLeftoverKwh, ultraLowRoomForRemainder + (annualUsageKwh * 0.05))
        
        // Apply clampBreakdown with ultra-low cap to adjusted leftoverKwh (includes additional energy if capped)
        clampedBreakdown = clampBreakdown(
          leftoverBreakdown,
          adjustedLeftoverKwh,
          ['ultraLow', 'offPeak', 'midPeak', 'onPeak'],
          { ultraLow: ultraLowCap }
        )
      }
      
      // Calculate leftover cost from clamped breakdown
      const leftoverCost = 
        (clampedBreakdown.ultraLow || 0) * (ultraLowRate / 100) +
        (clampedBreakdown.offPeak || 0) * (offPeakRate / 100) +
        (clampedBreakdown.midPeak || 0) * (midPeakRate / 100) +
        (clampedBreakdown.onPeak || 0) * (onPeakRate / 100)
      
      // Verify breakdown accounts for all energy including additional (if capped)
      // clampBreakdown should allocate all energy to match adjustedLeftoverKwh
      const breakdownTotal = (clampedBreakdown.ultraLow || 0) + (clampedBreakdown.offPeak || 0) + 
                            (clampedBreakdown.midPeak || 0) + (clampedBreakdown.onPeak || 0)
      
      // IMPORTANT: The manual calculator adds additionalGridCost separately even though clampBreakdown
      // already allocated the additional energy. This appears to be intentional - the breakdown
      // allocates energy respecting caps (which may put some in higher rate periods), but the cost
      // calculation adds the additional energy cost at the cheapest rate separately.
      // This matches the manual calculator behavior exactly.
      const additionalGridCost = offsetCapped ? additionalGridKwh * (chargingRate / 100) : 0
      
      // Total grid cost = battery charging + leftover + additional grid cost (if capped)
      // Note: This may appear to double-count, but it matches the manual calculator exactly
      const totalGridCost = batteryChargingCost + leftoverCost + additionalGridCost
      
      // Cost percentage = actual grid cost / original bill * 100
      // This should be LESS than the energy percentage because energy is bought at cheaper rates
      // Use same calculation as StepBatteryPeakShavingSimple
      costOfEnergyBoughtFromGrid = (totalGridCost / baselineBill) * 100
    } else if (baselineBill > 0) {
      // Fallback: use bill ratio if breakdown not available
      const postSolarBatteryBill = combinedResult?.postSolarBatteryAnnualBill || result?.annualCostAfter || 0
      costOfEnergyBoughtFromGrid = (postSolarBatteryBill / baselineBill) * 100
    }

    // Calculate Total Savings as complement to ensure they add up to 100%
    // This ensures "Remaining Grid Cost (Discounted)" + "Total Bill Savings" = 100%
    const totalSavingsPercent = Math.max(0, 100 - costOfEnergyBoughtFromGrid)

    // Calculate uncapped total offset for cap note display (already calculated above)
    // Use the value from the calculation above

    // Final safety check: ensure boughtFromGridPercent accounts for cap
    // CRITICAL: When offset is capped (e.g., 90%), boughtFromGridPercent must be the remainder (10%)
    // This ensures: totalEnergyOffset (90%) + boughtFromGridPercent (10%) = 100%
    const finalTotal = totalEnergyOffset + boughtFromGridPercent
    if (Math.abs(finalTotal - 100) > 0.1) {
      // Recalculate boughtFromGridPercent to ensure it's correct
      // This is the most important check - it ensures the math always adds up correctly
      boughtFromGridPercent = Math.max(0, 100 - totalEnergyOffset)
    }
    
    // Additional check: if offset is capped, ensure we're showing the correct boughtFromGridPercent
    // This handles edge cases where the calculation might have missed the cap adjustment
    if (offsetCapped && boughtFromGridPercent < offsetReduction - 0.1) {
      // If offset is capped but boughtFromGridPercent is less than the offset reduction,
      // it means we're not accounting for the cap correctly
      boughtFromGridPercent = Math.max(boughtFromGridPercent, 100 - totalEnergyOffset)
    }

    // Calculate tooltip text for "Remaining Grid Cost" when offset is capped
    // Show tooltip for both TOU and ULO modes when offset is capped
    let remainingGridCostTooltip: string | undefined
    // Re-get baselineBill to ensure it's in scope
    const baselineBillForTooltip = combinedResult?.baselineAnnualBill || 0
    if (offsetCapped && additionalGridKwh > 0.1 && baselineBillForTooltip > 0 && result) {
      // Get rate plan - we need to get it here since it might not be in scope from earlier
      const ratePlanObj: RatePlan = ratePlan === 'ULO' ? ULO_RATE_PLAN : TOU_RATE_PLAN
      const ultraLowRate = ratePlanObj.periods.find(p => p.period === 'ultra-low')?.rate ?? 3.9
      const offPeakRate = ratePlanObj.periods.find(p => p.period === 'off-peak')?.rate ?? 9.8
      // For TOU, use off-peak rate; for ULO, use ultra-low rate
      const tooltipRate = ratePlan === 'ULO' ? ultraLowRate : offPeakRate
      remainingGridCostTooltip = `Cost includes additional grid energy (${additionalGridKwh.toFixed(0)} kWh @ ${tooltipRate.toFixed(1)}¢/kWh) due to winter cap.`
    }

    return { 
      solarOffset, 
      batteryOffset, 
      totalSavings: totalSavingsPercent,
      totalEnergyOffset,
      gridChargedBatteryPercent,
      boughtFromGridPercent,
      costOfEnergyBoughtFromGrid,
      uncappedTotalOffset, // Include for cap note display
      remainingGridCostTooltip,
    }
  }, [combinedResult, result, annualUsageKwh, solarProductionKwh, selectedBattery, ratePlan, data?.estimate, offsetCapInfo, isMounted])

  // Calculate before/after costs using combined result for accurate savings
  const beforeAfterCosts = useMemo(() => {
    if (!combinedResult) {
      return { before: 0, after: 0, savings: 0 }
    }

    // Use combined result which matches the old calculator
    const baselineCost = combinedResult.baselineAnnualBill
    const afterCost = combinedResult.postSolarBatteryAnnualBill
    const savings = combinedResult.combinedAnnualSavings

    return { before: baselineCost, after: afterCost, savings }
  }, [combinedResult])

  // Calculate 25-year projection (payback period and profit)
  const multiYearProjection = useMemo(() => {
    if (!combinedResult || !selectedBattery || annualUsageKwh <= 0) {
      return null
    }

    // Get annual escalation rate from Step 3 (default to 4.5% = 0.045)
    const annualEscalationRate = (data.annualEscalator || 4.5) / 100

    // Calculate system costs
    const systemSize = effectiveSystemSizeKw || 0
    const solarSystemCost = systemSize > 0 ? calculateSystemCost(systemSize) : 0
    const batteryCost = selectedBattery.price
    const totalSystemCost = solarSystemCost + batteryCost

    // Calculate net cost (after rebates)
    const netCost = totalSystemCost - rebates.totalRebates

    // First year annual savings
    const firstYearSavings = combinedResult.combinedAnnualSavings

    // Calculate 25-year projection
    // Note: For payback period calculation, we don't apply degradation or offset cap
    // as these are long-term effects that shouldn't affect the initial payback period
    const projection = calculateCombinedMultiYear(
      firstYearSavings,
      netCost,
      annualEscalationRate,
      0, // No degradation for payback calculation (only affects long-term profit)
      25,
      {
        baselineAnnualBill: combinedResult.baselineAnnualBill,
        offsetCapFraction: undefined // Don't cap savings for payback calculation
      }
    )

    return { ...projection, totalSystemCost, solarSystemCost, batteryCost }
  }, [combinedResult, selectedBattery, annualUsageKwh, effectiveSystemSizeKw, rebates.totalRebates, data.annualEscalator, offsetCapInfo.capFraction])

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-white to-amber-50 py-4 md:py-6">
      <div className="w-full max-w-none">
        {/* 2-Column Layout: Left = Inputs, Right = Metrics - Full width, scales with screen */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 ${manualMode ? 'gap-4 lg:gap-6 px-2 md:px-4 lg:px-6' : 'gap-4 lg:gap-6 xl:gap-8 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12'}`}>
          {/* LEFT COLUMN: All Inputs */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            {/* Input Section - Always Expanded on Desktop */}
            <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                {/* FRD Section 9: Headline 32-40px */}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Calculator Inputs</h2>
              </div>
              
              <div className="p-4 md:p-5 space-y-3">
              {/* Annual Usage - Full Width */}
              <div>
                {/* FRD Section 9: Body 16-18px (text-base = 16px, text-lg = 18px) */}
                <label className="block text-base md:text-lg font-semibold text-gray-700 mb-2">
                  Annual Usage (kWh)
                </label>
                <input
                  type="number"
                  value={annualUsageInput}
                  onChange={(e) => setAnnualUsageInput(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg ${
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
                {/* FRD Section 10: Info tooltip for extremely low/high usage */}
                {isMounted && !hasErrors && usageExtremelyLow && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-700">
                      Your usage is quite low. Consider a smaller system size for optimal cost-effectiveness.
                    </p>
                  </div>
                )}
                {isMounted && !hasErrors && usageExtremelyHigh && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-700">
                      Your usage is very high. You may benefit from a larger system or multiple batteries.
                    </p>
                  </div>
                )}
              </div>

              {/* System Size Customization - Only show in estimator mode when props provided */}
              {!manualMode && solarPanels !== undefined && onSolarPanelsChange && data.estimate?.system && (
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
                        onChange={(e) => onSolarPanelsChange(Math.max(0, Number(e.target.value)))}
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
              )}

              {/* Solar Production - Appears after system size, updates automatically */}
              <div>
                {/* FRD Section 9: Body 16-18px (text-base = 16px, text-lg = 18px) */}
                <label className="block text-base md:text-lg font-semibold text-gray-700 mb-2">
                  Annual Solar Production (kWh)
                  {estimateLoading && !manualMode && (
                    <span className="ml-2 text-sm font-normal text-blue-600">(Generating estimate...)</span>
                  )}
                  {overrideEstimateLoading && !manualMode && (
                    <span className="ml-2 text-sm font-normal text-green-600">(Updating from panel count...)</span>
                  )}
                </label>
                {!manualMode && solarPanels !== undefined && onSolarPanelsChange ? (
                  // In step mode: Display-only field that updates from panel count
                  <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-base md:text-lg font-semibold text-gray-700">
                    {solarProductionInput || '0'} kWh
                  </div>
                ) : (
                  // In manual mode: Allow editing
                  <input
                    type="number"
                    value={solarProductionInput}
                    onChange={(e) => setSolarProductionInput(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg"
                    min="0"
                    step="100"
                  />
                )}
                {!manualMode && solarPanels !== undefined && onSolarPanelsChange && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-700">
                      <strong>Tip:</strong> Adjust the number of solar panels above to change production. Production is calculated automatically based on your roof area and panel count.
                    </p>
                  </div>
                )}
                {estimateError && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-yellow-700">{estimateError}</p>
                  </div>
                )}
              </div>

              {/* Battery Selection - Custom Dropdown */}
              <div className="relative">
                {/* FRD Section 9: Body 16-18px (text-base = 16px, text-lg = 18px) */}
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-base md:text-lg font-semibold text-gray-700">
                    Choose Your Battery
                  </label>
                  <div className="relative group">
                    <Info className="text-blue-500 cursor-help hover:text-blue-600 transition-colors" size={18} />
                    <div className="absolute left-0 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                      <div className="font-semibold mb-1">Multiple Battery Selection</div>
                      <div>Select one or more batteries to combine. Capacities and power will be combined automatically.</div>
                      {selectedBatteryIds.length > 0 && selectedBattery && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div>Combined: {selectedBattery.nominalKwh.toFixed(1)} kWh nominal</div>
                          <div>{selectedBattery.usableKwh.toFixed(1)} kWh usable ({selectedBattery.usablePercent.toFixed(0)}%)</div>
                        </div>
                      )}
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    const newId = e.target.value
                    if (newId && !selectedBatteryIds.includes(newId)) {
                      // Only add if not already selected (prevent duplicates)
                      setSelectedBatteryIds([...selectedBatteryIds, newId])
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg appearance-none bg-white"
                >
                  <option value="" disabled>
                    {selectedBatteryIds.length === 0 
                      ? 'Select a battery...' 
                      : selectedBatteryIds.length >= BATTERY_SPECS.length
                      ? 'All batteries selected'
                      : 'Select another battery...'}
                  </option>
                  {BATTERY_SPECS.filter(battery => !selectedBatteryIds.includes(battery.id)).map(battery => (
                    <option 
                      key={battery.id} 
                      value={battery.id}
                    >
                      {battery.brand} {battery.model}
                    </option>
                  ))}
                </select>
                {/* Selected batteries display */}
                {selectedBatteryIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedBatteryIds.map((batteryId, index) => {
                      const battery = BATTERY_SPECS.find(b => b.id === batteryId)
                      if (!battery) return null
                      return (
                        <div
                          key={`${batteryId}-${index}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-300 rounded-lg text-sm"
                        >
                          <span className="font-medium text-gray-800">
                            {battery.brand} {battery.model}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              // Remove only this specific instance (by index)
                              setSelectedBatteryIds(selectedBatteryIds.filter((_, i) => i !== index))
                            }}
                            className="text-red-600 hover:text-red-800 font-bold text-lg leading-none"
                            aria-label={`Remove ${battery.brand} ${battery.model}`}
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                {selectedBatteryIds.length === 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    Please select at least one battery to continue.
                  </div>
                )}
                {selectedBatteryIds.length > 0 && selectedBattery && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold">
                      Combined: {selectedBattery.nominalKwh.toFixed(1)} kWh ({selectedBattery.usablePercent.toFixed(0)}% usable)
                    </span>
                  </div>
                )}
              </div>

              {/* Rate Plan */}
              <div>
                {/* FRD Section 9: Body 16-18px (text-base = 16px, text-lg = 18px) */}
                <label className="block text-base md:text-lg font-semibold text-gray-700 mb-2">
                  Rate Plan
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setRatePlan('TOU')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      ratePlan === 'TOU'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">TOU</div>
                    <div className="text-xs text-gray-600">Time-of-Use</div>
                  </button>
                  <button
                    onClick={() => setRatePlan('ULO')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      ratePlan === 'ULO'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">ULO</div>
                    <div className="text-xs text-gray-600">Ultra-Low Overnight</div>
                  </button>
                </div>
              </div>

              {/* Rebates Section - Only show in step mode (not standalone) */}
              {!manualMode && (
                <div className="pt-4 border-t-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Award className="text-green-600" size={20} />
                    Available Rebates
                  </h3>
                  <div className="space-y-3">
                    {/* Solar Rebate */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-gray-800 flex items-center gap-2">
                            <Sun className="text-blue-600" size={18} />
                            Solar Rebate
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            ${rebates.solarRebatePerKw.toLocaleString()}/kW (max ${rebates.solarRebateMax.toLocaleString()})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">
                            ${rebates.solarRebate.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(effectiveSystemSizeKw || 0).toFixed(1)} kW × ${rebates.solarRebatePerKw.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Battery Rebate */}
                    {selectedBattery && selectedBattery.nominalKwh > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              <Battery className="text-green-600" size={18} />
                              Battery Rebate
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              ${rebates.batteryRebatePerKwh.toLocaleString()}/kWh (max ${rebates.batteryRebateMax.toLocaleString()})
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                              ${rebates.batteryRebate.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {selectedBattery.nominalKwh.toFixed(1)} kWh × ${rebates.batteryRebatePerKwh.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total Rebates */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-800 text-lg">Total Rebates</div>
                        <div className="text-2xl font-bold text-green-700">
                          ${rebates.totalRebates.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Hero Metric Cards at bottom of inputs */}
            {hasErrors || hasBatteryError ? (
              <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-center">
                <AlertTriangle className="text-yellow-600 mx-auto mb-3" size={40} />
                <h3 className="text-lg font-bold text-yellow-800 mb-2">
                  {hasErrors ? 'Enter Annual Energy Usage' : 'Select at Least One Battery'}
                </h3>
                <p className="text-sm text-yellow-700">
                  {hasErrors 
                    ? 'Please enter a valid annual energy usage value above to see your savings calculations.'
                    : 'Please select at least one battery from the options above to see your savings calculations.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" suppressHydrationWarning>
                {/* Energy Sources */}
                <HeroMetricCard
                  icon={Sun}
                  label="Solar Offset"
                  value={heroMetrics.solarOffset}
                  caption="Powered directly by your solar panels."
                  color="blue"
                />
                <HeroMetricCard
                  icon={Battery}
                  label="Battery Solar Capture"
                  value={heroMetrics.batteryOffset}
                  caption="Powered by stored solar energy."
                  color="green"
                />
                <HeroMetricCard
                  icon={BarChart3}
                  label="Total Solar & Battery Offset"
                  value={heroMetrics.totalEnergyOffset}
                  caption={(() => {
                    // Check if offset is capped
                    const offsetCapPercent = offsetCapInfo.capFraction * 100
                    const isCapped = (heroMetrics.uncappedTotalOffset ?? 0) > offsetCapPercent + 0.1
                    if (isCapped) {
                      return `Free energy from solar and stored solar battery. Capped at ${offsetCapPercent.toFixed(0)}% to reflect winter limits.`
                    }
                    return "Free energy from solar and stored solar battery."
                  })()}
                  color="gold"
                />
                {/* Grid & Financial Metrics */}
                <HeroMetricCard
                  icon={AlertTriangle}
                  label="Buy from Grid"
                  value={heroMetrics.boughtFromGridPercent}
                  caption="Annual % of leftover electricity purchased"
                  color="blue"
                />
                <HeroMetricCard
                  icon={DollarSign}
                  label="Battery Load Management"
                  value={heroMetrics.costOfEnergyBoughtFromGrid}
                  caption="Annual cost after battery time of use optimization"
                  color="green"
                />
                <HeroMetricCard
                  icon={TrendingUp}
                  label="Total Bill Savings"
                  value={heroMetrics.totalSavings}
                  caption="Your annual bill reduction vs today."
                  color="gold"
                />
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: All Metrics */}
          <div className="space-y-4">

            {/* Section 3: Energy Flow Diagram */}
            {!hasErrors && <EnergyFlowDiagram result={result} combinedResult={combinedResult} annualUsageKwh={annualUsageKwh} solarProductionKwh={solarProductionKwh} offsetCapInfo={offsetCapInfo} data={data} />}

            {/* Section 4: Before/After Savings Bars with Tabs - Only show in step mode */}
            {!hasErrors && !manualMode && (
              <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setMetricsTab('current')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      metricsTab === 'current'
                        ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    Current Year
                  </button>
                  <button
                    onClick={() => setMetricsTab('payback')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      metricsTab === 'payback'
                        ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    Payback Period
                  </button>
                  <button
                    onClick={() => setMetricsTab('profit')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      metricsTab === 'profit'
                        ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    25-Year Profit
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-4 md:p-5">
                  {metricsTab === 'current' && (
                    <BeforeAfterBars
                      before={beforeAfterCosts.before}
                      after={beforeAfterCosts.after}
                      savings={beforeAfterCosts.savings}
                    />
                  )}

                  {metricsTab === 'payback' && (
                    multiYearProjection ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <Clock className="text-blue-600" size={32} />
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800">Payback Period</h3>
                            <p className="text-sm text-gray-600">Time to recover your investment</p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-300 rounded-xl p-8">
                          <div className="text-5xl font-bold text-blue-600 mb-2">
                            {multiYearProjection.paybackYears === Number.POSITIVE_INFINITY 
                              ? 'N/A' 
                              : `${multiYearProjection.paybackYears.toFixed(1)} years`
                            }
                          </div>
                          <p className="text-gray-600 text-sm">
                            {multiYearProjection.paybackYears === Number.POSITIVE_INFINITY
                              ? 'Savings do not exceed system cost within 25 years'
                              : `Your system will pay for itself in ${multiYearProjection.paybackYears.toFixed(1)} years`
                            }
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">System Cost</div>
                          <div className="text-xl font-bold text-gray-800">
                            ${multiYearProjection.totalSystemCost.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">After Rebates</div>
                          <div className="text-xl font-bold text-green-700">
                            ${multiYearProjection.netCost.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs text-gray-600 mb-2">First Year Annual Savings</div>
                        <div className="text-2xl font-bold text-blue-600">
                          ${beforeAfterCosts.savings.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Based on {ratePlan} rate plan • {(data.annualEscalator || 4.5)}% annual increase
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="text-gray-400 mx-auto mb-4" size={48} />
                      <p className="text-gray-600">Please enter your energy usage and select a battery to calculate payback period.</p>
                    </div>
                  )
                  )}

                  {metricsTab === 'profit' && (
                    multiYearProjection ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <TrendingUp className="text-green-600" size={32} />
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800">25-Year Profit</h3>
                            <p className="text-sm text-gray-600">Total profit after system payback</p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-8">
                          <div className="text-5xl font-bold text-green-600 mb-2">
                            ${multiYearProjection.netProfit25Year.toLocaleString()}
                          </div>
                          <p className="text-gray-600 text-sm">
                            Total profit over 25 years after recovering your investment
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Total 25-Year Savings</div>
                          <div className="text-xl font-bold text-gray-800">
                            ${multiYearProjection.totalSavings25Year.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Net Cost (After Rebates)</div>
                          <div className="text-xl font-bold text-blue-700">
                            ${multiYearProjection.netCost.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-xs text-gray-600 mb-2">Annual ROI</div>
                        <div className="text-2xl font-bold text-green-600">
                          {multiYearProjection.annualROI === 'N/A' 
                            ? 'N/A' 
                            : `${multiYearProjection.annualROI}%`
                          }
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Average annual return on investment over 25 years
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="text-gray-400 mx-auto mb-4" size={48} />
                      <p className="text-gray-600">Please enter your energy usage and select a battery to calculate 25-year profit.</p>
                    </div>
                  )
                  )}
                </div>
              </div>
            )}

            {/* Section 4b: Before/After Savings Bars (Standalone mode only) */}
            {!hasErrors && manualMode && (
              <BeforeAfterBars
                before={beforeAfterCosts.before}
                after={beforeAfterCosts.after}
                savings={beforeAfterCosts.savings}
              />
            )}

            {/* Section 5: Detailed Breakdown (Always shown, toggleable) */}
            <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
              <button
                onClick={() => setDetailedBreakdownExpanded(!detailedBreakdownExpanded)}
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-base font-semibold text-gray-800">
                  {detailedBreakdownExpanded ? 'Hide Detailed Breakdown' : 'Show Detailed Breakdown'}
                </span>
                {detailedBreakdownExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              
              {detailedBreakdownExpanded && (combinedResult || result) && (() => {
                // Use combined result breakdown if available, otherwise use FRD result
                const breakdown = combinedResult?.breakdown
                let solarDirectKwh = 0
                let solarDirectPercent = 0
                let batterySolarChargedKwh = 0
                let batterySolarChargedPercent = 0
                let batteryGridChargedKwh = 0
                let batteryGridChargedPercent = 0
                let gridRemainingKwh = 0
                let gridRemainingPercent = 0
                let effectiveCycles = 0

                // Always prefer FRD result for accurate separation of solar vs grid-charged battery
                if (result) {
                  // Use FRD result for accurate values
                  solarDirectKwh = result.solarToDay
                  solarDirectPercent = result.offsetPercentages.solarDirect
                  batterySolarChargedKwh = result.battSolarCharged
                  batterySolarChargedPercent = result.offsetPercentages.solarChargedBattery
                  batteryGridChargedKwh = result.battGridCharged
                  batteryGridChargedPercent = result.offsetPercentages.uloChargedBattery
                  gridRemainingKwh = (result.gridKWhByBucket.ultraLow || 0) +
                                    result.gridKWhByBucket.offPeak +
                                    result.gridKWhByBucket.midPeak +
                                    result.gridKWhByBucket.onPeak
                  gridRemainingPercent = result.offsetPercentages.gridRemaining
                  effectiveCycles = result.effectiveCycles
                } else if (breakdown && annualUsageKwh > 0) {
                  // Fallback: Calculate from combined result breakdown (less accurate)
                  const solarAllocated = breakdown.solarAllocation 
                    ? Object.values(breakdown.solarAllocation).reduce((sum: number, val: any) => sum + (val || 0), 0)
                    : 0
                  solarDirectKwh = solarAllocated
                  solarDirectPercent = (solarAllocated / annualUsageKwh) * 100

                  // Grid-charged battery (AI Mode enables grid charging for both TOU and ULO)
                  if (breakdown.batteryChargeFromUltraLow || breakdown.batteryChargeFromOffPeak) {
                    batteryGridChargedKwh = (breakdown.batteryChargeFromUltraLow || 0) + (breakdown.batteryChargeFromOffPeak || 0)
                    batteryGridChargedPercent = (batteryGridChargedKwh / annualUsageKwh) * 100
                  }

                  // Battery offsets from breakdown (this includes both solar and grid-charged, so we need to subtract grid-charged)
                  const batteryOffsets: any = breakdown.batteryOffsets || {}
                  const totalBatteryOffsetKwh = (batteryOffsets.onPeak || 0) + 
                                           (batteryOffsets.midPeak || 0) + 
                                           (batteryOffsets.offPeak || 0) +
                                           (batteryOffsets.ultraLow || 0)
                  // Solar-charged = total battery offset minus grid-charged
                  batterySolarChargedKwh = Math.max(0, totalBatteryOffsetKwh - batteryGridChargedKwh)
                  batterySolarChargedPercent = (batterySolarChargedKwh / annualUsageKwh) * 100

                  // Grid remaining
                  const usageAfterBattery: any = breakdown.usageAfterBattery || {}
                  gridRemainingKwh = (usageAfterBattery.ultraLow || 0) +
                                     (usageAfterBattery.offPeak || 0) +
                                     (usageAfterBattery.midPeak || 0) +
                                     (usageAfterBattery.onPeak || 0)
                  gridRemainingPercent = (gridRemainingKwh / annualUsageKwh) * 100
                }

                // Calculate totals for verification
                const totalKwh = solarDirectKwh + batterySolarChargedKwh + batteryGridChargedKwh + gridRemainingKwh
                const totalPercent = solarDirectPercent + batterySolarChargedPercent + batteryGridChargedPercent + gridRemainingPercent

                return (
                  <div className="p-4 border-t border-gray-200">
                    <div className="mb-3 text-sm text-gray-600">
                      <p className="mb-2">Energy sources that power your home:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><strong>Solar Direct:</strong> Energy used directly from solar panels</li>
                        <li><strong>Battery (Solar-charged):</strong> Energy from battery charged by solar (free)</li>
                        <li><strong>Battery (Grid-charged):</strong> Energy from battery charged from grid at cheap rates (AI Mode)</li>
                        <li><strong>Grid Remaining:</strong> Energy purchased directly from grid</li>
                      </ul>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">kWh</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="py-3 px-4 text-gray-700">Solar Direct</td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {solarDirectKwh.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-blue-600">
                            {solarDirectPercent.toFixed(1)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-gray-700">Battery (Solar-charged)</td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {batterySolarChargedKwh.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">
                            {batterySolarChargedPercent.toFixed(1)}%
                          </td>
                        </tr>
                        {batteryGridChargedKwh > 0 && (
                          <tr>
                            <td className="py-3 px-4 text-gray-700">Battery (Grid-charged)</td>
                            <td className="py-3 px-4 text-right text-gray-600">
                              {batteryGridChargedKwh.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-amber-600">
                              {batteryGridChargedPercent.toFixed(1)}%
                            </td>
                          </tr>
                        )}
                        <tr className="bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-800">Grid Remaining</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-600">
                            {gridRemainingKwh.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-600">
                            {gridRemainingPercent.toFixed(1)}%
                          </td>
                        </tr>
                        <tr className="border-t-2 border-gray-300 bg-gray-100">
                          <td className="py-3 px-4 font-bold text-gray-900">Total Annual Usage</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">
                            {totalKwh.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">
                            {totalPercent.toFixed(1)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

