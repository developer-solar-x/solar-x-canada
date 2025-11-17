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
} from '@/lib/simple-peak-shaving'
import { calculateSystemCost } from '@/config/pricing'
import type { StepBatteryPeakShavingSimpleProps } from '../StepBatteryPeakShavingSimple/types'

// Animated number component for smooth transitions
function AnimatedNumber({ value, decimals = 0, suffix = '%', prefix = '', className = '' }: { 
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
}) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
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

    if (startValue !== endValue) {
      requestAnimationFrame(animate)
    }
  }, [value])

  const formattedValue = displayValue >= 1000 && suffix === 'k' 
    ? (displayValue / 1000).toFixed(decimals)
    : displayValue.toFixed(decimals)
  
  return (
    <span className={className}>
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
  color 
}: { 
  icon: any
  label: string
  value: number
  suffix?: string
  caption: string
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
            <AnimatedNumber value={value} decimals={1} suffix={suffix} />
          )}
        </div>
        <div className="text-sm font-semibold text-gray-700 mb-1">{label}</div>
        <div className="text-xs text-gray-500">{caption}</div>
      </div>
    </div>
  )
}

// Energy Flow Diagram Component (Circular/Sankey style)
function EnergyFlowDiagram({ 
  result, 
  combinedResult, 
  annualUsageKwh 
}: { 
  result: FRDPeakShavingResult | null
  combinedResult: any
  annualUsageKwh: number
}) {
  // Calculate percentages from combined result if available, otherwise use FRD result
  let solarDirectPercent = 0
  let solarChargedBatteryPercent = 0
  let gridChargedBatteryPercent = 0
  let gridRemainingPercent = 0
  let totalOffset = 0

  if (combinedResult?.breakdown && annualUsageKwh > 0) {
    const breakdown = combinedResult.breakdown
    // Calculate solar direct
    const solarAllocated: number = breakdown.solarAllocation 
      ? (Object.values(breakdown.solarAllocation).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) as number)
      : 0
    solarDirectPercent = (solarAllocated / annualUsageKwh) * 100

    // Calculate battery offsets - separate solar-charged and grid-charged (ULO/off-peak)
    if (result?.offsetPercentages) {
      // Get separate percentages for solar-charged and grid-charged battery
      solarChargedBatteryPercent = result.offsetPercentages.solarChargedBattery || 0
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
      solarChargedBatteryPercent = totalBatteryPercent * 0.7 // Estimate 70% solar-charged
      gridChargedBatteryPercent = totalBatteryPercent * 0.3 // Estimate 30% grid-charged
    }

    // Grid remaining = only actual remaining grid usage (not including grid-charged battery)
    gridRemainingPercent = 100 - solarDirectPercent - solarChargedBatteryPercent - gridChargedBatteryPercent
    // Total Energy Offset = only FREE energy (solar direct + solar-charged battery)
    // Grid-charged battery is NOT free - it's purchased from the grid
    totalOffset = solarDirectPercent + solarChargedBatteryPercent
  } else if (result) {
    const { offsetPercentages } = result
    solarDirectPercent = offsetPercentages.solarDirect
    solarChargedBatteryPercent = offsetPercentages.solarChargedBattery || 0
    gridChargedBatteryPercent = offsetPercentages.uloChargedBattery || 0
    // Grid remaining = only actual remaining grid usage
    gridRemainingPercent = offsetPercentages.gridRemaining || 0
    // Total Energy Offset = only FREE energy (solar direct + solar-charged battery)
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
              <div className="text-sm text-gray-600">
                <AnimatedNumber value={savingsPercent} decimals={1} suffix="% reduction" />
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
  
  // Initialize input values from props or defaults
  const defaultUsage = data.peakShaving?.annualUsageKwh || 
                       data.energyUsage?.annualKwh || 
                       14000
  const defaultProduction = data.estimate?.production?.annualKwh || 
                           (manualMode && typeof window !== 'undefined' 
                             ? Number(window.localStorage.getItem('manual_estimator_production_kwh') || '8000')
                             : 8000)
  const defaultBattery = data.selectedBattery || 'renon-16'
  
  // Input values
  const [annualUsageInput, setAnnualUsageInput] = useState<string>(String(defaultUsage))
  const [solarProductionInput, setSolarProductionInput] = useState<string>(String(defaultProduction))
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>(defaultBattery)
  const [ratePlan, setRatePlan] = useState<'TOU' | 'ULO'>('ULO')
  // AI Optimization Mode is always ON (hidden from user) - allows grid charging at cheap rates for both TOU and ULO
  const aiMode = true

  // Parse numeric values
  const annualUsageKwh = Math.max(0, Number(annualUsageInput) || 0)
  const solarProductionKwh = Math.max(0, Number(solarProductionInput) || 0)
  const selectedBattery = BATTERY_SPECS.find(b => b.id === selectedBatteryId) || BATTERY_SPECS[0]

  // Calculate results using the same method as the old calculator for consistency
  const combinedResult = useMemo(() => {
    if (!annualUsageKwh || annualUsageKwh <= 0) return null
    if (!selectedBattery) return null

    try {
      const ratePlanObj: RatePlan = ratePlan === 'ULO' ? ULO_RATE_PLAN : TOU_RATE_PLAN
      const distribution: UsageDistribution = ratePlan === 'ULO' ? DEFAULT_ULO_DISTRIBUTION : DEFAULT_TOU_DISTRIBUTION

      // Use calculateSolarBatteryCombined for consistent results with the old calculator
      return calculateSolarBatteryCombined(
        annualUsageKwh,
        solarProductionKwh,
        selectedBattery,
        ratePlanObj,
        distribution,
        undefined, // offsetCapFraction - let it calculate automatically
        aiMode  // AI Mode enables battery grid charging for arbitrage (both TOU and ULO)
      )
    } catch (e) {
      console.error('Calculation error:', e)
      return null
    }
  }, [annualUsageKwh, solarProductionKwh, selectedBattery, ratePlan, aiMode])

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
    if (!combinedResult || !annualUsageKwh || annualUsageKwh <= 0) {
      return {
        solarOffset: 0,
        batteryOffset: 0,
        totalSavings: 0,
        totalEnergyOffset: 0,
        gridChargedBatteryPercent: 0,
        boughtFromGridPercent: 0,
        costOfEnergyBoughtFromGrid: 0,
      }
    }

    // Calculate percentages from combined result breakdown
    const breakdown = combinedResult.breakdown
    if (!breakdown) {
      // Fallback to FRD result if breakdown not available
      if (result) {
        const solarOffset = result.offsetPercentages.solarDirect
        // Only include solar-charged battery, not grid-charged (ULO-charged)
        const batteryOffset = result.offsetPercentages.solarChargedBattery
        const totalSavings = solarOffset + batteryOffset
        
        // Calculate bought from grid and cost percentage
        const gridChargedBatteryPercent = result.offsetPercentages.uloChargedBattery || 0
        const gridRemainingPercent = result.offsetPercentages.gridRemaining || 0
        const boughtFromGridPercent = gridChargedBatteryPercent + gridRemainingPercent
        
        // Get cost percentage from combined result if available
        let costOfEnergyBoughtFromGrid = 0
        let totalSavingsPercent = 0
        if (combinedResult) {
          const baselineBill = combinedResult.baselineAnnualBill || 0
          const postSolarBatteryBill = combinedResult.postSolarBatteryAnnualBill || 0
          if (baselineBill > 0) {
            costOfEnergyBoughtFromGrid = (postSolarBatteryBill / baselineBill) * 100
            const annualSavings = baselineBill - postSolarBatteryBill
            totalSavingsPercent = (annualSavings / baselineBill) * 100
          }
        }

        return { 
          solarOffset, 
          batteryOffset, 
          totalSavings: totalSavingsPercent,
          totalEnergyOffset: solarOffset + batteryOffset,
          gridChargedBatteryPercent,
          boughtFromGridPercent,
          costOfEnergyBoughtFromGrid,
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
      }
    }

    // Calculate solar direct offset
    const solarAllocated: number = breakdown.solarAllocation 
      ? (Object.values(breakdown.solarAllocation).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) as number)
      : 0
    const solarOffset = (solarAllocated / annualUsageKwh) * 100

    // Calculate battery offset - only solar-charged battery (not grid-charged)
    // Try to get from FRD result if available for accurate separation
    let batteryOffset = 0
    if (result?.offsetPercentages) {
      // Use FRD result to get accurate solar-charged battery percentage
      batteryOffset = result.offsetPercentages.solarChargedBattery
    } else {
      // Fallback: estimate from breakdown (less accurate)
    const batteryOffsets: any = breakdown.batteryOffsets || {}
    const batteryOffsetKwh = (batteryOffsets.onPeak || 0) + 
                             (batteryOffsets.midPeak || 0) + 
                             (batteryOffsets.offPeak || 0) +
                             (batteryOffsets.ultraLow || 0)
      // Conservative estimate: assume most battery is solar-charged
      batteryOffset = (batteryOffsetKwh / annualUsageKwh) * 100
    }

    // Total Energy Offset = solar + battery (free energy only)
    const totalEnergyOffset = solarOffset + batteryOffset

    // Calculate grid-charged battery percentage (ULO/off-peak charged)
    let gridChargedBatteryPercent = 0
    if (result?.offsetPercentages) {
      // For ULO: uloChargedBattery, for TOU: also uses uloChargedBattery field (off-peak charged)
      gridChargedBatteryPercent = result.offsetPercentages.uloChargedBattery || 0
    }

    // Calculate "Bought from cheap hours" = grid-charged battery + grid remaining
    let boughtFromGridPercent = 0
    if (result?.offsetPercentages) {
      // Grid-charged battery + remaining grid usage
      const gridRemainingPercent = result.offsetPercentages.gridRemaining || 0
      boughtFromGridPercent = gridChargedBatteryPercent + gridRemainingPercent
    } else {
      // Fallback: calculate from total
      boughtFromGridPercent = 100 - totalEnergyOffset
    }

    // Calculate "Cost of energy bought from grid" as percentage of original bill
    let costOfEnergyBoughtFromGrid = 0
    const baselineBill = combinedResult.baselineAnnualBill || 0
    const postSolarBatteryBill = combinedResult.postSolarBatteryAnnualBill || 0
    if (baselineBill > 0) {
      // Cost of energy bought from grid = new bill / original bill * 100
      costOfEnergyBoughtFromGrid = (postSolarBatteryBill / baselineBill) * 100
    }

    // Calculate Total Savings as percentage of original bill
    let totalSavingsPercent = 0
    if (baselineBill > 0) {
      const annualSavings = baselineBill - postSolarBatteryBill
      totalSavingsPercent = (annualSavings / baselineBill) * 100
    }

    return { 
      solarOffset, 
      batteryOffset, 
      totalSavings: totalSavingsPercent,
      totalEnergyOffset,
      gridChargedBatteryPercent,
      boughtFromGridPercent,
      costOfEnergyBoughtFromGrid,
    }
  }, [combinedResult, result, annualUsageKwh, solarProductionKwh, selectedBattery, data?.estimate])

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
                {!hasErrors && usageExtremelyLow && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-700">
                      Your usage is quite low. Consider a smaller system size for optimal cost-effectiveness.
                    </p>
                  </div>
                )}
                {!hasErrors && usageExtremelyHigh && (
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
                {capacityExceedsUsage && !hasErrors && (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  caption="Free energy from solar and stored solar battery."
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
                  icon={TrendingUp}
                  label="Total Savings"
                  value={heroMetrics.totalSavings}
                  caption="Your annual bill reduction vs today."
                  color="gold"
                />
                <HeroMetricCard
                  icon={DollarSign}
                  label="Cost of Energy from Grid"
                  value={heroMetrics.costOfEnergyBoughtFromGrid}
                  caption="Cost of grid energy as % of original bill."
                  color="green"
                />
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: All Metrics */}
          <div className="space-y-6">

            {/* Section 3: Energy Flow Diagram */}
            {!hasErrors && <EnergyFlowDiagram result={result} combinedResult={combinedResult} annualUsageKwh={annualUsageKwh} />}

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

                if (breakdown && annualUsageKwh > 0) {
                  // Calculate from combined result breakdown
                  const solarAllocated = breakdown.solarAllocation 
                    ? Object.values(breakdown.solarAllocation).reduce((sum: number, val: any) => sum + (val || 0), 0)
                    : 0
                  solarDirectKwh = solarAllocated
                  solarDirectPercent = (solarAllocated / annualUsageKwh) * 100

                  const batteryOffsets: any = breakdown.batteryOffsets || {}
                  batterySolarChargedKwh = (batteryOffsets.onPeak || 0) + 
                                           (batteryOffsets.midPeak || 0) + 
                                           (batteryOffsets.offPeak || 0) +
                                           (batteryOffsets.ultraLow || 0)
                  batterySolarChargedPercent = (batterySolarChargedKwh / annualUsageKwh) * 100

                  // Grid-charged battery (AI Mode enables grid charging for both TOU and ULO)
                  if (breakdown.batteryChargeFromUltraLow || breakdown.batteryChargeFromOffPeak) {
                    batteryGridChargedKwh = (breakdown.batteryChargeFromUltraLow || 0) + (breakdown.batteryChargeFromOffPeak || 0)
                    batteryGridChargedPercent = (batteryGridChargedKwh / annualUsageKwh) * 100
                  }

                  // Grid remaining
                  const usageAfterBattery: any = breakdown.usageAfterBattery || {}
                  gridRemainingKwh = (usageAfterBattery.ultraLow || 0) +
                                     (usageAfterBattery.offPeak || 0) +
                                     (usageAfterBattery.midPeak || 0) +
                                     (usageAfterBattery.onPeak || 0)
                  gridRemainingPercent = (gridRemainingKwh / annualUsageKwh) * 100
                } else if (result) {
                  // Fallback to FRD result
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
                }

                return (
                  <div className="p-6 border-t border-gray-200">
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

