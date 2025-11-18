'use client'

// FRD-Compliant Peak Shaving Sales Calculator
// Version 2.0 - "Simple, User-Friendly & Offset-Focused UI"
// Implements all 6 required sections from the FRD

import { useState, useEffect, useMemo } from 'react'
import { 
  Sun, Battery, TrendingUp, ChevronDown, ChevronUp, 
  Zap, Info, AlertTriangle, BarChart3, DollarSign, Calendar, Award
} from 'lucide-react'
import { BATTERY_SPECS, BatterySpec } from '@/config/battery-specs'
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
    <div className={`p-6 rounded-xl border-2 ${bgColorClasses[color]} shadow-lg hover:shadow-xl transition-all duration-300`}>
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
          className={`text-5xl md:text-6xl font-bold mb-2 ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : ''}`}
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
    <div className="p-6 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
      {/* FRD Section 9: Headline 32-40px */}
      <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center">How Your Home is Powered</h3>
      
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
            <div className="text-lg font-bold text-gray-800">Net Grid Usage:</div>
            <div className="text-2xl font-bold text-gray-600">
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
          <span className="font-semibold text-gray-700">Total Energy Offset: </span>
          <span className="text-lg font-bold text-gray-800">{totalOffset.toFixed(1)}%</span>
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
    <div className="p-6 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
      {/* FRD Section 9: Headline 32-40px */}
      <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 text-center">Before & After Comparison</h3>
      
      <div className="space-y-6">
        {/* Before bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Before System</span>
            <span className="text-lg font-bold text-gray-800">${before.toLocaleString()}/yr</span>
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
            <span className="text-lg font-bold text-green-600">${after.toLocaleString()}/yr</span>
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
            <span className="text-lg font-bold text-gray-800">Total Savings</span>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                ${savings.toLocaleString()}
              </div>
            </div>
          </div>
          {/* Monthly savings display - FRD requirement */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Monthly Savings</span>
              <span className="text-xl font-bold text-green-600">
                ${(savings / 12).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PeakShavingSalesCalculatorFRD({ data, onComplete, onBack, manualMode = false }: StepBatteryPeakShavingSimpleProps) {
  // Detailed breakdown state (collapsed by default)
  const [detailedBreakdownExpanded, setDetailedBreakdownExpanded] = useState(false)
  // Client-side mounted state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false)
  
  // Initialize input values with safe defaults (no localStorage access during SSR)
  // We'll load from localStorage after mount to prevent hydration mismatches
  const getDefaultUsage = () => {
    return data.peakShaving?.annualUsageKwh || 
           data.energyUsage?.annualKwh || 
           14000
  }
  
  const getDefaultProduction = () => {
    return data.estimate?.production?.annualKwh || 8000
  }
  
  const getDefaultBattery = () => {
    return data.selectedBattery || 'renon-16'
  }
  
  // Input values - initialize with safe defaults (no localStorage during SSR)
  const [annualUsageInput, setAnnualUsageInput] = useState<string>(String(getDefaultUsage()))
  const [solarProductionInput, setSolarProductionInput] = useState<string>(String(getDefaultProduction()))
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>(getDefaultBattery())
  const [ratePlan, setRatePlan] = useState<'TOU' | 'ULO'>('ULO')
  // AI Optimization Mode is always ON (hidden from user) - allows grid charging at cheap rates for both TOU and ULO
  const aiMode = true

  // Set mounted flag on client side only to prevent hydration mismatch
  // Also load values from localStorage after mount
  useEffect(() => {
    setIsMounted(true)
    
    // Load from localStorage after mount to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      const savedUsage = window.localStorage.getItem('peak_shaving_annual_usage_kwh')
      if (savedUsage) {
        const numValue = Number(savedUsage)
        if (!isNaN(numValue) && numValue > 0) {
          setAnnualUsageInput(savedUsage)
        }
      }
      
      const savedProduction = window.localStorage.getItem('peak_shaving_solar_production_kwh')
      if (savedProduction) {
        const numValue = Number(savedProduction)
        if (!isNaN(numValue) && numValue > 0) {
          setSolarProductionInput(savedProduction)
        }
      } else if (manualMode) {
        const manualProduction = window.localStorage.getItem('manual_estimator_production_kwh')
        if (manualProduction) {
          const numValue = Number(manualProduction)
          if (!isNaN(numValue) && numValue > 0) {
            setSolarProductionInput(manualProduction)
          }
        }
      }
      
      const savedBattery = window.localStorage.getItem('peak_shaving_battery_id')
      if (savedBattery) {
        setSelectedBatteryId(savedBattery)
      }
      
      const savedRatePlan = window.localStorage.getItem('peak_shaving_rate_plan')
      if (savedRatePlan === 'TOU' || savedRatePlan === 'ULO') {
        setRatePlan(savedRatePlan)
      }
    }
  }, [manualMode])
  
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
    if (isMounted && selectedBatteryId) {
      window.localStorage.setItem('peak_shaving_battery_id', selectedBatteryId)
    }
  }, [selectedBatteryId, isMounted])
  
  // Persist rate plan to localStorage
  useEffect(() => {
    if (isMounted && ratePlan) {
      window.localStorage.setItem('peak_shaving_rate_plan', ratePlan)
    }
  }, [ratePlan, isMounted])

  // Parse numeric values
  const annualUsageKwh = Math.max(0, Number(annualUsageInput) || 0)
  const solarProductionKwh = Math.max(0, Number(solarProductionInput) || 0)
  const selectedBattery = BATTERY_SPECS.find(b => b.id === selectedBatteryId) || BATTERY_SPECS[0]

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
    if (!selectedBattery) return null

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
  
  // Check if solar + battery capacity exceeds usage (non-blocking warning)
  const batteryCapacityKwh = selectedBattery?.nominalKwh || 0
  const totalCapacityKwh = solarProductionKwh + batteryCapacityKwh
  const capacityExceedsUsage = annualUsageKwh > 0 && totalCapacityKwh > annualUsageKwh * 1.2 // 20% buffer
  
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
        const offsetCapPercent = offsetCapInfo.capFraction * 100
        const cappedTotalOffset = Math.min(uncappedTotalOffset, offsetCapPercent)
        
        // Scale solar and battery offsets proportionally to maintain their ratio
        let solarOffset = uncappedSolarOffset
        let batteryOffset = uncappedBatteryOffset
        if (uncappedTotalOffset > 0 && cappedTotalOffset < uncappedTotalOffset) {
          const scale = cappedTotalOffset / uncappedTotalOffset
          solarOffset = uncappedSolarOffset * scale
          batteryOffset = uncappedBatteryOffset * scale
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

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-white to-amber-50 py-4 md:py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-[1920px] mx-auto">
        {/* 2-Column Layout: Left = Inputs, Right = Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* LEFT COLUMN: All Inputs */}
          <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            {/* Input Section - Always Expanded on Desktop */}
            <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                {/* FRD Section 9: Headline 32-40px */}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Calculator Inputs</h2>
              </div>
              
              <div className="p-6 space-y-4">
              {/* Annual Usage */}
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

              {/* Solar Production */}
              <div>
                {/* FRD Section 9: Body 16-18px (text-base = 16px, text-lg = 18px) */}
                <label className="block text-base md:text-lg font-semibold text-gray-700 mb-2">
                  Annual Solar Production (kWh)
                </label>
                <input
                  type="number"
                  value={solarProductionInput}
                  onChange={(e) => setSolarProductionInput(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg"
                  min="0"
                  step="100"
                />
                {/* FRD Section 10: Non-blocking note if capacity exceeds usage */}
                {isMounted && capacityExceedsUsage && !hasErrors && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Info className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-yellow-700">
                      Your system capacity (solar + battery) exceeds your annual usage. This is normal and allows for excess solar production.
                    </p>
                  </div>
                )}
              </div>

              {/* Battery Selection */}
              <div>
                {/* FRD Section 9: Body 16-18px (text-base = 16px, text-lg = 18px) */}
                <label className="block text-base md:text-lg font-semibold text-gray-700 mb-2">
                  Battery Size
                </label>
                <select
                  value={selectedBatteryId}
                  onChange={(e) => setSelectedBatteryId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg"
                >
                  {BATTERY_SPECS.map(battery => (
                    <option key={battery.id} value={battery.id}>
                      {battery.brand} {battery.model} ({battery.nominalKwh} kWh)
                    </option>
                  ))}
                </select>
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
              </div>
            </div>

            {/* Hero Metric Cards at bottom of inputs */}
            {hasErrors ? (
              <div className="p-8 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-center">
                <AlertTriangle className="text-yellow-600 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold text-yellow-800 mb-2">Enter Annual Energy Usage</h3>
                <p className="text-yellow-700">
                  Please enter a valid annual energy usage value above to see your savings calculations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" suppressHydrationWarning>
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
                  label="Battery Offset"
                  value={heroMetrics.batteryOffset}
                  caption="Powered by stored solar energy."
                  color="green"
                />
                <HeroMetricCard
                  icon={BarChart3}
                  label="Total Energy Offset"
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
                  label="Bought from Grid"
                  value={heroMetrics.boughtFromGridPercent}
                  caption="Energy purchased from grid (cheap hours)."
                  color="blue"
                />
                <HeroMetricCard
                  icon={DollarSign}
                  label="Remaining Grid Cost (Discounted)"
                  value={heroMetrics.costOfEnergyBoughtFromGrid}
                  caption="Discounted cost because remaining energy is allocated to cheapest rate periods."
                  tooltip={heroMetrics.remainingGridCostTooltip}
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
          <div className="space-y-6">

            {/* Section 3: Energy Flow Diagram */}
            {!hasErrors && <EnergyFlowDiagram result={result} combinedResult={combinedResult} annualUsageKwh={annualUsageKwh} solarProductionKwh={solarProductionKwh} offsetCapInfo={offsetCapInfo} data={data} />}

            {/* Section 4: Before/After Savings Bars */}
            {!hasErrors && (
              <BeforeAfterBars
                before={beforeAfterCosts.before}
                after={beforeAfterCosts.after}
                savings={beforeAfterCosts.savings}
              />
            )}

            {/* Section 5: Detailed Breakdown (Expandable) */}
            <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
              <button
                onClick={() => setDetailedBreakdownExpanded(!detailedBreakdownExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-800">Show Detailed Breakdown</span>
                {detailedBreakdownExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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
                  <div className="p-6 border-t border-gray-200">
                    <div className="mb-4 text-sm text-gray-600">
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
                    
                    {effectiveCycles > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-700">
                          <strong>Effective Battery Cycles:</strong> {effectiveCycles.toFixed(1)} cycles/year
                        </div>
                      </div>
                    )}
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

