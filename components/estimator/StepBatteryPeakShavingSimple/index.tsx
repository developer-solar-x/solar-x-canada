'use client'

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { Battery, DollarSign, TrendingUp, Calendar, ArrowRight, Check, ChevronDown, Percent, Zap, Clock, Info, TrendingDown, BarChart3, Home, Moon, Sun, Award, AlertTriangle, Plus, X } from 'lucide-react'
import { 
  BATTERY_SPECS, 
  BatterySpec, 
  calculateBatteryFinancials 
} from '@/config/battery-specs'
import { 
  RATE_PLANS, 
  RatePlan, 
  ULO_RATE_PLAN, 
  TOU_RATE_PLAN 
} from '@/config/rate-plans'
import { calculateSystemCost } from '@/config/pricing'
import {
  calculateSimplePeakShaving,
  calculateSimpleMultiYear,
  calculateCombinedMultiYear,
  calculateSolarBatteryCombined,
  calculateFRDPeakShaving,
  UsageDistribution,
  DEFAULT_TOU_DISTRIBUTION,
  DEFAULT_ULO_DISTRIBUTION,
  SimplePeakShavingResult,
  computeSolarBatteryOffsetCap,
  FRDPeakShavingResult,
} from '@/lib/simple-peak-shaving'
import type { CombinedPlanResult, StepBatteryPeakShavingSimpleProps, PlanResultMap } from './types'
import {
  AnnualSavingsModal,
  PaybackInfoModal,
  ProfitInfoModal,
  TouInfoModal,
  TouSavingsBreakdownModal,
  UloInfoModal,
  UloSavingsBreakdownModal,
} from './modals'
import {
  HeaderSection,
  MonthlyBillCard,
  SolarSystemCard,
} from './sections'

type LeftoverBreakdown = {
  ultraLow?: number
  offPeak: number
  midPeak: number
  onPeak: number
}

function clampBreakdown(
  breakdown: LeftoverBreakdown | undefined,
  targetTotal: number,
  order: Array<'ultraLow' | 'offPeak' | 'midPeak' | 'onPeak'>,
  caps?: Partial<Record<'ultraLow' | 'offPeak' | 'midPeak' | 'onPeak', number>>
) {
  const safeBreakdown: LeftoverBreakdown = {
    ultraLow: Math.max(0, breakdown?.ultraLow ?? 0),
    offPeak: Math.max(0, breakdown?.offPeak ?? 0),
    midPeak: Math.max(0, breakdown?.midPeak ?? 0),
    onPeak: Math.max(0, breakdown?.onPeak ?? 0),
  }

  if (targetTotal <= 0) {
    return {
      ultraLow: 0,
      offPeak: 0,
      midPeak: 0,
      onPeak: 0,
    }
  }

  let remaining = targetTotal
  const result: LeftoverBreakdown = { ultraLow: 0, offPeak: 0, midPeak: 0, onPeak: 0 }

  // First pass respects caps (max shift per period)
  order.forEach(period => {
    if (remaining <= 0) return
    const available = safeBreakdown[period] ?? 0
    if (available <= 0) return
    const cap = caps?.[period]
    const allowed = cap != null ? Math.max(0, Math.min(cap, available)) : available
    if (allowed <= 0) return
    const allocation = Math.min(allowed, remaining)
    result[period] = allocation
    remaining -= allocation
  })

  // Second pass uses any leftover room without caps so totals always reconcile
  if (remaining > 0) {
    order.forEach(period => {
      if (remaining <= 0) return
      const available = safeBreakdown[period] ?? 0
      const alreadyAllocated = result[period] ?? 0
      const spaceLeft = Math.max(0, available - alreadyAllocated)
      if (spaceLeft <= 0) return
      const allocation = Math.min(spaceLeft, remaining)
      result[period] = alreadyAllocated + allocation
      remaining -= allocation
    })
  }

  return result
}

export function StepBatteryPeakShavingSimple({ data, onComplete, onBack, manualMode = false }: StepBatteryPeakShavingSimpleProps) {
  // Info modals for rate plans
  const [showTouInfo, setShowTouInfo] = useState(false)
  const [showUloInfo, setShowUloInfo] = useState(false)
  const [showPaybackInfo, setShowPaybackInfo] = useState(false)
  const [showCostTables, setShowCostTables] = useState(false) // Simple toggle so readers can show/hide the detailed cost tables (hidden by default)
  // Check if estimate is being loaded (solar system size needed for rebate calculation)
  const [estimateLoading, setEstimateLoading] = useState(!data.estimate?.system?.sizeKw)
  
  // Wait for estimate to be available
  useEffect(() => {
    if (data.estimate?.system?.sizeKw) {
      setEstimateLoading(false)
    }
  }, [data.estimate])
  
  // Calculate default usage from monthly bill
  const calculateUsageFromBill = (monthlyBill: number) => {
    const avgRate = 0.223
    const monthlyKwh = monthlyBill / avgRate
    return Math.round(monthlyKwh * 12)
  }
  
  // Calculate default usage - prefer persisted value from peakShaving, then energyUsage, then calculated
  // Note: localStorage will be checked in useEffect after mount (SSR-safe)
  const defaultUsage = data.peakShaving?.annualUsageKwh || 
                       data.energyUsage?.annualKwh || 
                       (data.monthlyBill ? calculateUsageFromBill(data.monthlyBill) : null) || 
                       data.annualUsageKwh || 
                       14000
  
  // State
  // Allow blank input by storing as string; derive numeric where needed (SSR-safe)
  const [annualUsageInput, setAnnualUsageInput] = useState<string>(defaultUsage ? String(defaultUsage) : '')
  const annualUsageScrollRef = useRef<{ scrollY: number; elementTop: number } | null>(null)
  const annualUsageInputRef = useRef<HTMLInputElement | null>(null)
  const annualUsageKwh = Math.max(0, Number(annualUsageInput) || 0)
  // Persist and restore scroll position so returning to the calculator keeps the viewer in context
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const storageKey = manualMode ? 'manual_peak_shaving_scroll' : 'estimator_peak_shaving_scroll'

    const saved = window.sessionStorage.getItem(storageKey)
    if (saved) {
      window.scrollTo(0, Number(saved))
    }

    const handleScroll = () => {
      if (document.body.style.position === 'fixed') return
      window.sessionStorage.setItem(storageKey, String(window.scrollY))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [manualMode])

  // Restore the viewer's scroll position after annual usage edits so the page doesn't jump to the top
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    if (annualUsageScrollRef.current == null) return
    const { scrollY, elementTop } = annualUsageScrollRef.current
    const currentTop = annualUsageInputRef.current?.getBoundingClientRect().top ?? elementTop
    const adjustment = currentTop - elementTop
    window.scrollTo(0, scrollY + adjustment)
    annualUsageScrollRef.current = null
  }, [annualUsageInput])

  const handleAnnualUsageChange = (value: string) => {
    if (typeof window !== 'undefined') {
      if (document.body.style.position !== 'fixed') {
        const elementTop = annualUsageInputRef.current?.getBoundingClientRect().top ?? 0
        annualUsageScrollRef.current = {
          scrollY: window.scrollY,
          elementTop,
        }
        const storageKey = manualMode ? 'manual_peak_shaving_scroll' : 'estimator_peak_shaving_scroll'
        window.sessionStorage.setItem(storageKey, String(window.scrollY))
      }
    }
    setAnnualUsageInput(value)
  }
  // This value keeps a simple blended electricity rate handy when we have to estimate bills from usage
  const assumedAverageRate = 0.223
  // This figure mirrors the bill card so every section references the same current monthly bill
  const displayedMonthlyBill = data.monthlyBill && data.monthlyBill > 0
    ? Number(data.monthlyBill)
    : (annualUsageKwh * assumedAverageRate) / 12
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([data.selectedBattery || 'renon-16'])
  const [touDistribution, setTouDistribution] = useState<UsageDistribution>(DEFAULT_TOU_DISTRIBUTION)
  const [uloDistribution, setUloDistribution] = useState<UsageDistribution>(DEFAULT_ULO_DISTRIBUTION)
  // This state holds the TOU simulations including the combo view so values stay in sync across the screen
  const [touResults, setTouResults] = useState<PlanResultMap>(new Map())
  // This state mirrors the same idea for the ULO plan so both cards get identical treatment
  const [uloResults, setUloResults] = useState<PlanResultMap>(new Map())
  // This state remembers if the custom rate inputs should be visible for the person using the tool
  const [showCustomRates, setShowCustomRates] = useState(false)
  // This state keeps track of whether the usage breakdown editor is open so folks can hide it when they do not need it
  const [showUsageDistribution, setShowUsageDistribution] = useState(false)
  // Track whether the global savings explainer modal is showing for quick help
  const [showSavingsInfo, setShowSavingsInfo] = useState(false)
  // Track if the TOU savings section helper modal should be visible
  const [showTouSavingsSectionInfo, setShowTouSavingsSectionInfo] = useState(false)
  // Track if the ULO savings section helper modal should be visible
  const [showUloSavingsSectionInfo, setShowUloSavingsSectionInfo] = useState(false)
  // This state toggles the 25-year profit explainer so folks can explore the long-term story when they are ready
  const [showProfitInfo, setShowProfitInfo] = useState(false)
  // AI Optimization Mode state (default OFF) - allows grid charging at ULO rate when enabled
  const [aiMode, setAiMode] = useState(false)
  // Hydrate annual usage from storage after mount (both standalone and estimator)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const manualKey = 'manual_estimator_annual_kwh'
    const sharedKey = 'estimator_annualUsageKwh'
    
    // In manualMode, prefer saved manual/shared value first to prevent props from overwriting user input
    if (manualMode) {
      const stored = localStorage.getItem(manualKey) || localStorage.getItem(sharedKey)
      if (stored && stored !== '0' && Number(stored) > 0) {
        const storedValue = String(stored)
        if (storedValue !== annualUsageInput) {
          setAnnualUsageInput(storedValue)
        }
        return
      }
    }

    // Fall back to props when available
    const fromProps = data.peakShaving?.annualUsageKwh || data.energyUsage?.annualKwh
    if (fromProps && fromProps > 0) {
      const propsValue = String(fromProps)
      if (propsValue !== annualUsageInput) {
        setAnnualUsageInput(propsValue)
      }
      localStorage.setItem(sharedKey, propsValue)
      if (manualMode) {
        localStorage.setItem(manualKey, propsValue)
      }
      return
    }

    // For non-manual mode, try shared storage as a fallback
    if (!manualMode) {
      const stored = localStorage.getItem(sharedKey)
      if (stored && stored !== '0' && Number(stored) > 0) {
        const storedValue = String(stored)
        if (storedValue !== annualUsageInput) {
          setAnnualUsageInput(storedValue)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist annual usage (both standalone and estimator modes)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!annualUsageInput || Number(annualUsageInput) <= 0) return
    
  // Persist to estimator key
  const storageKey = 'estimator_annualUsageKwh'
  localStorage.setItem(storageKey, annualUsageInput)
  // Persist to manual key if manualMode
  if (manualMode) {
    localStorage.setItem('manual_estimator_annual_kwh', annualUsageInput)
  }
}, [annualUsageInput])

  // Allow overriding solar panel count/system size for rebate and display
  // Prefer user's saved override from previous step navigation
  const initialPanels = (data.solarOverride?.numPanels ?? data.estimate?.system?.numPanels) || 0
  const panelWattage = data.estimate?.system?.panelWattage || 500
  const [solarPanels, setSolarPanels] = useState<number>(initialPanels)
  const systemSizeKwOverride = Math.round(((solarPanels * panelWattage) / 1000) * 10) / 10

  // Override estimate (updated production when panels change)
  const [overrideEstimate, setOverrideEstimate] = useState<any>(null)

  // Manual production override input as string to allow temporary blank (better editing UX)
  const [manualProductionInput, setManualProductionInput] = useState<string>('')

  useEffect(() => {
    if (!manualMode) return
    if (typeof window === 'undefined') return
    // Try restore from localStorage first
    const stored = window.localStorage.getItem('manual_estimator_production_kwh')
    if (stored !== null) {
      setManualProductionInput(stored)
      return
    }
    // Fallback to provided estimate
    const initial = (overrideEstimate?.production?.annualKwh ?? data.estimate?.production?.annualKwh ?? 0)
    setManualProductionInput(prev => (prev === '' ? String(Math.max(0, Math.round(initial))) : prev))
  }, [manualMode, data.estimate?.production?.annualKwh, overrideEstimate?.production?.annualKwh])

  useEffect(() => {
    if (!manualMode) return
    if (typeof window === 'undefined') return
    // If blank, clear persisted value so the input can be truly empty
    if (manualProductionInput === '') {
      window.localStorage.removeItem('manual_estimator_production_kwh')
      return
    }
    const n = Math.max(0, Number(manualProductionInput) || 0)
    window.localStorage.setItem('manual_estimator_production_kwh', String(n))
  }, [manualMode, manualProductionInput])

  const effectiveSolarProductionKwh = (
    manualMode
      ? Math.max(0, Number(manualProductionInput) || 0)
      : (overrideEstimate?.production?.annualKwh ?? data.estimate?.production?.annualKwh ?? 0)
  )

  const offsetCapInfo = useMemo(() => (
    computeSolarBatteryOffsetCap({
      usageKwh: Math.max(0, annualUsageKwh || 0),
      productionKwh: Math.max(0, effectiveSolarProductionKwh || 0),
      roofPitch: overrideEstimate?.roof?.pitch ?? data.roofPitch ?? data.estimate?.roofPitch ?? data.estimate?.roof?.pitch,
      roofAzimuth: data.roofAzimuth ?? overrideEstimate?.roof?.azimuth ?? data.estimate?.roofAzimuth ?? data.estimate?.roof?.azimuth,
      roofSections: data.roofSections,
    })
  ), [
    annualUsageKwh,
    effectiveSolarProductionKwh,
    overrideEstimate?.roof?.pitch,
    data.roofPitch,
    data.estimate?.roofPitch,
    data.estimate?.roof?.pitch,
    data.roofAzimuth,
    overrideEstimate?.roof?.azimuth,
    data.estimate?.roofAzimuth,
    data.estimate?.roof?.azimuth,
    data.roofSections,
  ])

  const offsetCapPercent = offsetCapInfo.capFraction * 100

  // Persist and restore manual solar panel count to keep system size consistent across reloads
  useEffect(() => {
    if (!manualMode) return
    if (typeof window === 'undefined') return
    const storedPanels = window.localStorage.getItem('manual_estimator_solar_panels')
    if (storedPanels !== null && !Number.isNaN(Number(storedPanels))) {
      const n = Number(storedPanels)
      if (n > 0 && n !== solarPanels) setSolarPanels(n)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualMode])

  useEffect(() => {
    if (!manualMode) return
    if (typeof window === 'undefined') return
    if (solarPanels != null) {
      window.localStorage.setItem('manual_estimator_solar_panels', String(solarPanels))
    }
  }, [manualMode, solarPanels])
  const effectiveSystemSizeKw = (systemSizeKwOverride || data.estimate?.system?.sizeKw || 0)

  const canContinue = (() => {
    // require positive annual usage
    if (!(annualUsageKwh && annualUsageKwh > 0)) return false
    return true
  })()

  // Friendly formatter so the custom rate cards can show the current usage share beside each rate
const formatUsageShare = (value?: number) => `${(value ?? 0).toFixed(1)}%`
const formatKwh = (value: number) => `${Math.round(value).toLocaleString()} kWh`
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

  // When panel count changes, re-run estimate with override size to refresh annual kWh
  useEffect(() => {
    const run = async () => {
      if (!data?.coordinates) return
      if (!solarPanels || solarPanels <= 0) { setOverrideEstimate(null); return }
      try {
        const resp = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            roofAreaSqft: data.roofAreaSqft,
            overrideSystemSizeKw: systemSizeKwOverride,
          }),
        })
        if (resp.ok) {
          const json = await resp.json()
          setOverrideEstimate(json.data)
        }
      } catch (e) {
        console.warn('Override estimate failed', e)
      }
    }
    run()
  }, [solarPanels])
  
  // Custom editable rates (initialize with defaults)
  const [customRates, setCustomRates] = useState({
    ulo: {
      ultraLow: 3.9,
      midPeak: 15.7,
      onPeak: 39.1,
      weekendOffPeak: 9.8
    },
    tou: {
      offPeak: 9.8,
      midPeak: 15.7,
      onPeak: 20.3
    }
  })

  // Create custom rate plans with user's editable rates
  const getCustomTouRatePlan = (): RatePlan => {
    return {
      ...TOU_RATE_PLAN,
      periods: TOU_RATE_PLAN.periods.map(period => ({
        ...period,
        rate: period.period === 'off-peak' ? customRates.tou.offPeak :
              period.period === 'mid-peak' ? customRates.tou.midPeak :
              customRates.tou.onPeak
      })),
      weekendRate: customRates.tou.offPeak
    }
  }

  const getCustomUloRatePlan = (): RatePlan => {
    return {
      ...ULO_RATE_PLAN,
      periods: ULO_RATE_PLAN.periods.map(period => ({
        ...period,
        rate: period.period === 'ultra-low' ? customRates.ulo.ultraLow :
              period.period === 'mid-peak' ? customRates.ulo.midPeak :
              customRates.ulo.onPeak
      })),
      weekendRate: customRates.ulo.weekendOffPeak
    }
  }

  // Calculate TOU results for selected batteries
  useEffect(() => {
    const newResults = new Map<string, {result: SimplePeakShavingResult, projection: any, combined?: CombinedPlanResult}>()
    const touRatePlan = getCustomTouRatePlan()

    // Get solar rebate if solar system exists
    const systemSizeKw = effectiveSystemSizeKw
    const solarRebatePerKw = 1000
    const solarMaxRebate = 5000
    const solarRebate = systemSizeKw > 0 ? Math.min(systemSizeKw * solarRebatePerKw, solarMaxRebate) : 0

    // Find all selected batteries
    const batteries = selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
    
    // Create combined battery spec from all selected batteries
    const battery = batteries.length > 0 ? batteries.reduce((combined, current, idx) => {
      if (idx === 0) return { ...current }
      return {
        ...combined,
        nominalKwh: combined.nominalKwh + current.nominalKwh,
        usableKwh: combined.usableKwh + current.usableKwh,
        price: combined.price + current.price
      }
    }, batteries[0]) : null

    if (battery) {
      const solarProductionKwh = effectiveSolarProductionKwh

      const calcResult = calculateSimplePeakShaving(
        annualUsageKwh,
        battery,
        touRatePlan,
        touDistribution,
        solarProductionKwh > 0 ? solarProductionKwh : undefined
      )

      // Calculate battery rebate (program only)
      const batteryRebate = Math.min(battery.nominalKwh * 300, 5000)
      // Battery net cost excludes solar rebate (counted in solar side)
      const netCost = battery.price - batteryRebate
      const multiYear = calculateSimpleMultiYear(calcResult, netCost, 0.05, 25)

      // Combined (Solar + Battery) figures
      const currentEstimate = overrideEstimate || data.estimate
      const combinedModel = calculateSolarBatteryCombined(
        annualUsageKwh,
        solarProductionKwh,
        battery,
        touRatePlan,
        touDistribution,
        offsetCapInfo.capFraction,
        false  // AI Mode only applies to ULO plans
      )
      const combinedAnnualRaw = combinedModel.combinedAnnualSavings
      // Clamp savings so they never exceed the current bill the homeowner is paying today
      const baselineAnnualDisplay = displayedMonthlyBill * 12
      const combinedAnnual = Math.min(baselineAnnualDisplay, combinedAnnualRaw)
      const combinedMonthly = Math.round(combinedAnnual / 12)
      const newBillAnnual = Math.max(0, baselineAnnualDisplay - combinedAnnual)

      // Keep the solar and battery contributions proportional when clamping is required
      const solarRaw = Math.max(0, combinedModel.solarOnlySavings)
      const batteryRaw = Math.max(0, combinedModel.batteryOnTopSavings)
      const totalRaw = solarRaw + batteryRaw
      const scalingFactor = totalRaw > 0 ? Math.min(1, combinedAnnual / totalRaw) : 0
      const solarScaled = totalRaw > 0 ? solarRaw * scalingFactor : 0
      const batteryScaled = totalRaw > 0 ? batteryRaw * scalingFactor : 0
      const manualSolarNet = Math.max(0, calculateSystemCost(effectiveSystemSizeKw) - solarRebate)
      const solarNet = (currentEstimate?.costs?.netCost != null) ? currentEstimate.costs.netCost : manualSolarNet
      const combinedNet = Math.max(0, solarNet + netCost)
      // Client requirement: 5% annual escalation for 25-year totals, payback = Net / Year 1 Annual
      const escalated = calculateSimpleMultiYear({ annualSavings: combinedAnnual } as any, combinedNet, 0.05, 25)
      const simplePayback = combinedAnnual > 0 ? Math.round((combinedNet / combinedAnnual) * 10) / 10 : Number.POSITIVE_INFINITY
      const combinedProjection = calculateCombinedMultiYear(
        combinedAnnual,
        combinedNet,
        0.05,
        0.005,
        25,
        {
          baselineAnnualBill: baselineAnnualDisplay,
          offsetCapFraction: offsetCapInfo.capFraction,
        }
      )

      newResults.set('combined', {
        result: calcResult,
        projection: multiYear,
        combined: {
          annual: combinedAnnual,
          monthly: combinedMonthly,
          projection: combinedProjection,
          netCost: combinedNet,
          baselineAnnualBill: baselineAnnualDisplay, // Includes delivery/fixed fees for display
          postAnnualBill: newBillAnnual, // Includes delivery/fixed fees for display
          baselineAnnualBillEnergyOnly: combinedModel.baselineAnnualBill, // Energy-only baseline (matches ChatGPT)
          postSolarBatteryAnnualBillEnergyOnly: combinedModel.postSolarBatteryAnnualBill, // Energy-only final (matches ChatGPT)
          solarOnlyAnnual: solarScaled,
          batteryAnnual: batteryScaled,
          solarNetCost: solarNet,
          solarRebateApplied: solarRebate,
          solarProductionKwh, // Preserve the solar production that fed this run
          batteryNetCost: netCost,
          batteryRebateApplied: batteryRebate,
          batteryGrossCost: battery.price,
          breakdown: combinedModel.breakdown,
        } as CombinedPlanResult,
      })
    }

    setTouResults(newResults)
  }, [annualUsageInput, selectedBatteries, touDistribution, customRates.tou, data.estimate, systemSizeKwOverride, overrideEstimate, effectiveSolarProductionKwh, offsetCapInfo.capFraction])

  // Calculate ULO results for selected batteries
  useEffect(() => {
    const newResults = new Map<string, {result: SimplePeakShavingResult, projection: any, combined?: CombinedPlanResult}>()
    const uloRatePlan = getCustomUloRatePlan()

    // Get solar rebate if solar system exists
    const systemSizeKw = effectiveSystemSizeKw
    const solarRebatePerKw = 1000
    const solarMaxRebate = 5000
    const solarRebate = systemSizeKw > 0 ? Math.min(systemSizeKw * solarRebatePerKw, solarMaxRebate) : 0

    // Find all selected batteries
    const batteries = selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
    
    // Create combined battery spec from all selected batteries
    const battery = batteries.length > 0 ? batteries.reduce((combined, current, idx) => {
      if (idx === 0) return { ...current }
      return {
        ...combined,
        nominalKwh: combined.nominalKwh + current.nominalKwh,
        usableKwh: combined.usableKwh + current.usableKwh,
        price: combined.price + current.price
      }
    }, batteries[0]) : null

    if (battery) {
      const solarProductionKwh = effectiveSolarProductionKwh

      const calcResult = calculateSimplePeakShaving(
        annualUsageKwh,
        battery,
        uloRatePlan,
        uloDistribution,
        solarProductionKwh > 0 ? solarProductionKwh : undefined
      )

      // Calculate battery rebate (program only)
      const batteryRebate = Math.min(battery.nominalKwh * 300, 5000)
      // Battery net cost excludes solar rebate (counted in solar side)
      const netCost = battery.price - batteryRebate
      const multiYear = calculateSimpleMultiYear(calcResult, netCost, 0.05, 25)

      // Combined (Solar + Battery) figures
      const currentEstimate = overrideEstimate || data.estimate
      const combinedModel = calculateSolarBatteryCombined(
        annualUsageKwh,
        solarProductionKwh,
        battery,
        uloRatePlan,
        uloDistribution,
        offsetCapInfo.capFraction,
        aiMode  // AI Mode applies to ULO plans
      )
      const combinedAnnualRaw = combinedModel.combinedAnnualSavings
      // Clamp to keep savings realistic relative to today’s bill
      const baselineAnnualDisplay = displayedMonthlyBill * 12
      const combinedAnnual = Math.min(baselineAnnualDisplay, combinedAnnualRaw)
      const combinedMonthly = Math.round(combinedAnnual / 12)
      const newBillAnnual = Math.max(0, baselineAnnualDisplay - combinedAnnual)

      const solarRaw = Math.max(0, combinedModel.solarOnlySavings)
      const batteryRaw = Math.max(0, combinedModel.batteryOnTopSavings)
      const totalRaw = solarRaw + batteryRaw
      const scalingFactor = totalRaw > 0 ? Math.min(1, combinedAnnual / totalRaw) : 0
      const solarScaled = totalRaw > 0 ? solarRaw * scalingFactor : 0
      const batteryScaled = totalRaw > 0 ? batteryRaw * scalingFactor : 0
      const manualSolarNet = Math.max(0, calculateSystemCost(effectiveSystemSizeKw) - solarRebate)
      const solarNet = (currentEstimate?.costs?.netCost != null) ? currentEstimate.costs.netCost : manualSolarNet
      const combinedNet = Math.max(0, solarNet + netCost)
      // Client requirement: 5% annual escalation for 25-year totals, payback = Net / Year 1 Annual
      const escalated = calculateSimpleMultiYear({ annualSavings: combinedAnnual } as any, combinedNet, 0.05, 25)
      const simplePayback = combinedAnnual > 0 ? Math.round((combinedNet / combinedAnnual) * 10) / 10 : Number.POSITIVE_INFINITY
      const combinedProjection = calculateCombinedMultiYear(
        combinedAnnual,
        combinedNet,
        0.05,
        0.005,
        25,
        {
          baselineAnnualBill: baselineAnnualDisplay,
          offsetCapFraction: offsetCapInfo.capFraction,
        }
      )

      newResults.set('combined', {
        result: calcResult,
        projection: multiYear,
        combined: {
          annual: combinedAnnual,
          monthly: combinedMonthly,
          projection: combinedProjection,
          netCost: combinedNet,
          baselineAnnualBill: baselineAnnualDisplay, // Includes delivery/fixed fees for display
          postAnnualBill: newBillAnnual, // Includes delivery/fixed fees for display
          baselineAnnualBillEnergyOnly: combinedModel.baselineAnnualBill, // Energy-only baseline (matches ChatGPT)
          postSolarBatteryAnnualBillEnergyOnly: combinedModel.postSolarBatteryAnnualBill, // Energy-only final (matches ChatGPT)
          solarOnlyAnnual: solarScaled,
          batteryAnnual: batteryScaled,
          solarNetCost: solarNet,
          solarRebateApplied: solarRebate,
          solarProductionKwh, // Preserve the modeled solar production for later displays
          batteryNetCost: netCost,
          batteryRebateApplied: batteryRebate,
          batteryGrossCost: battery.price,
          breakdown: combinedModel.breakdown,
        } as CombinedPlanResult,
      })
    }

    setUloResults(newResults)
  }, [annualUsageInput, selectedBatteries, uloDistribution, customRates.ulo, data.estimate, systemSizeKwOverride, overrideEstimate, effectiveSolarProductionKwh, offsetCapInfo.capFraction, aiMode])

  // Calculate FRD results for offset percentage display
  const frdResults = useMemo(() => {
    if (!annualUsageKwh || annualUsageKwh <= 0) return { tou: null, ulo: null }
    
    const batteries = selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
    if (batteries.length === 0) return { tou: null, ulo: null }
    
    const battery = batteries.reduce((combined, current, idx) => {
      if (idx === 0) return { ...current }
      return {
        ...combined,
        nominalKwh: combined.nominalKwh + current.nominalKwh,
        usableKwh: combined.usableKwh + current.usableKwh,
        price: combined.price + current.price
      }
    }, batteries[0])
    
    try {
      const touResult = calculateFRDPeakShaving(
        annualUsageKwh,
        effectiveSolarProductionKwh,
        battery,
        getCustomTouRatePlan(),
        touDistribution,
        false, // AI Mode only for ULO
        { p_day: 0.5, p_night: 0.5 }
      )
      
      const uloResult = calculateFRDPeakShaving(
        annualUsageKwh,
        effectiveSolarProductionKwh,
        battery,
        getCustomUloRatePlan(),
        uloDistribution,
        aiMode, // AI Mode for ULO
        { p_day: 0.5, p_night: 0.5 }
      )
      
      return { tou: touResult, ulo: uloResult }
    } catch (e) {
      console.warn('FRD calculation error:', e)
      return { tou: null, ulo: null }
    }
  }, [annualUsageKwh, effectiveSolarProductionKwh, selectedBatteries, touDistribution, uloDistribution, customRates.tou, customRates.ulo, aiMode])

  const handleComplete = () => {
    const selectedTouResult = touResults.get('combined')
    const selectedUloResult = uloResults.get('combined')
    // Derive battery price and program-net using selected batteries
    const batteries = selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
    const combinedBattery = batteries.length > 0 ? batteries.reduce((combined, current, idx) => {
      if (idx === 0) return { ...current }
      return {
        ...combined,
        nominalKwh: combined.nominalKwh + current.nominalKwh,
        usableKwh: combined.usableKwh + current.usableKwh,
        price: combined.price + current.price,
      }
    }, batteries[0]) : null
    const programBatteryRebate = combinedBattery ? Math.min(combinedBattery.nominalKwh * 300, 5000) : 0
    const programBatteryNet = combinedBattery ? Math.max(0, combinedBattery.price - programBatteryRebate) : null
    onComplete({
      ...data,
      solarOverride: { numPanels: solarPanels, sizeKw: systemSizeKwOverride },
      selectedBatteries,
      ...(combinedBattery ? {
        batteryDetails: {
          battery: {
            price: combinedBattery.price,
            usableKwh: combinedBattery.usableKwh,
          },
          multiYearProjection: {
            netCost: programBatteryNet,
          },
          firstYearAnalysis: {
            totalSavings: (selectedTouResult?.result?.annualSavings || selectedUloResult?.result?.annualSavings || 0),
          },
        },
      } : {}),
      peakShaving: {
        annualUsageKwh,
        tou: {
          distribution: touDistribution,
          result: selectedTouResult?.result,
          projection: selectedTouResult?.projection,
          allResults: Object.fromEntries(touResults)
        },
        ulo: {
          distribution: uloDistribution,
          result: selectedUloResult?.result,
          projection: selectedUloResult?.projection,
          allResults: Object.fromEntries(uloResults)
        }
      }
    })
  }

  // Show loading while estimate is being generated
  if (estimateLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
        <div className="p-4 bg-gradient-to-br from-navy-500 to-navy-600 rounded-xl shadow-lg">
          <Zap className="text-white animate-pulse" size={48} />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-navy-500 mb-2">
            Calculating Your Solar System
          </h3>
          <p className="text-gray-600 mb-4">
            Analyzing your roof and generating solar estimates...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <HeaderSection />

      {data.estimate?.system && (
        <SolarSystemCard
          system={data.estimate.system}
          systemSizeKwOverride={systemSizeKwOverride}
          solarPanels={solarPanels}
          onSolarPanelsChange={(value) => setSolarPanels(value)}
          manualMode={manualMode}
          manualProductionInput={manualProductionInput}
          onManualProductionChange={(value) => setManualProductionInput(value)}
          annualProductionEstimate={overrideEstimate?.production?.annualKwh ?? data.estimate.production.annualKwh}
        />
      )}
      
      {/* Note about override */}
      {data.estimate?.system && (
        <div className="text-xs text-gray-600 px-1">
          Adjust the panel count to model a different array size for incentives and combined payback. Solar production remains from the current estimate in this step.
        </div>
      )}

      {/* Estimated Monthly Bill */}
      <MonthlyBillCard
        displayedMonthlyBill={displayedMonthlyBill}
        annualUsageKwh={annualUsageKwh}
      />

      {/* Info Modals */}
      
      <TouInfoModal
        open={showTouInfo}
        onClose={() => setShowTouInfo(false)}
        annualUsageKwh={annualUsageKwh}
        touResults={touResults}
      />

      {/* 25-Year Profit Info Modal */}
      <ProfitInfoModal
        open={showProfitInfo}
        onClose={() => setShowProfitInfo(false)}
        touResults={touResults}
        uloResults={uloResults}
      />

      <UloInfoModal
        open={showUloInfo}
        onClose={() => setShowUloInfo(false)}
        uloResults={uloResults}
      />

      {/* Payback Info Modal */}
      <PaybackInfoModal
        open={showPaybackInfo}
        onClose={() => setShowPaybackInfo(false)}
        touResults={touResults}
        uloResults={uloResults}
      />

      {/* TOU savings section explainer keeps the context handy for that card stack */}
      <TouSavingsBreakdownModal
        open={showTouSavingsSectionInfo}
        onClose={() => setShowTouSavingsSectionInfo(false)}
        results={touResults}
        formatKwh={formatKwh}
      />

      {/* ULO savings section explainer mirrors the same idea but calls out the overnight top-ups */}
      <UloSavingsBreakdownModal
        open={showUloSavingsSectionInfo}
        onClose={() => setShowUloSavingsSectionInfo(false)}
        results={uloResults}
        formatKwh={formatKwh}
      />

      {/* Savings & 25-Year Profit Info Modal */}
      <AnnualSavingsModal
        open={showSavingsInfo}
        onClose={() => setShowSavingsInfo(false)}
        touResults={touResults}
        uloResults={uloResults}
        displayedMonthlyBill={displayedMonthlyBill}
      />

      {/* Input Section */}
      <div className="card p-6 space-y-6 shadow-md">
        {/* Annual Usage */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy-600 mb-3">
            <Zap className="text-red-500" size={18} />
            Annual Energy Usage (kWh)
          </label>
          <div className="relative">
            <input
              type="number"
              ref={annualUsageInputRef}
              value={annualUsageInput}
              onChange={(e) => handleAnnualUsageChange(e.target.value)}
              className={`w-full px-4 py-4 pr-16 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold text-navy-600 shadow-sm transition-all ${
                annualUsageKwh <= 0 && annualUsageInput !== '' 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-gray-300'
              }`}
              min="0"
              step="100"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              kWh
            </div>
          </div>
          {annualUsageKwh <= 0 && annualUsageInput !== '' && (
            <div className="mt-2 flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-red-700">
                <strong>Invalid input:</strong> Annual energy usage must be greater than 0 kWh to calculate savings. Please enter a valid value.
              </p>
            </div>
          )}
        </div>

         {/* Rate Plan Info */}
         <div>
           <label className="flex items-center gap-2 text-sm font-semibold text-navy-600 mb-3">
             <BarChart3 className="text-red-500" size={18} />
             Compare Savings by Rate Plan
           </label>
           
           {/* AI Optimization Mode Toggle - Shared for both plans */}
           <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl shadow-sm">
             <label className="flex items-center justify-between cursor-pointer group">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-navy-600">
                   <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                   </svg>
                 </div>
                 <div>
                   <div className="text-sm font-semibold text-navy-600">AI Optimization Mode</div>
                   <div className="text-xs text-gray-600">Enable grid charging at ULO rate (affects ULO plan only)</div>
                 </div>
               </div>
               <button
                 type="button"
                 onClick={() => setAiMode(!aiMode)}
                 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                   aiMode ? 'bg-red-500' : 'bg-gray-300'
                 }`}
                 role="switch"
                 aria-checked={aiMode}
                 aria-label="Toggle AI Optimization Mode"
               >
                 <span
                   className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                     aiMode ? 'translate-x-6' : 'translate-x-1'
                   }`}
                 />
               </button>
             </label>
             {aiMode && (
               <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                 <p className="text-xs text-blue-800">
                   <strong>AI EMC Active:</strong> The Energy Management Controller automatically fills your battery at cheap ULO rates (11 PM - 7 AM) and discharges during expensive peak hours to maximize savings. <strong>This feature only affects the ULO plan.</strong>
                 </p>
               </div>
             )}
           </div>

           <div className="grid md:grid-cols-2 gap-4">
             <div className="p-5 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <Sun className="text-navy-500" size={20} />
                   <h4 className="font-bold text-navy-500">Time-of-Use (TOU)</h4>
                 </div>
                 <button
                   onClick={() => setShowTouInfo(true)}
                   className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-700 text-xs font-semibold"
                 >
                   <Info size={16} /> Info
                 </button>
               </div>
               <p className="text-sm text-gray-700 flex items-start gap-2">
                 <Home size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                 Standard time-based pricing for most households
               </p>
             </div>
             <div className="p-5 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <Moon className="text-navy-500" size={20} />
                   <h4 className="font-bold text-navy-500">Ultra-Low Overnight (ULO)</h4>
                 </div>
                 <button
                   onClick={() => setShowUloInfo(true)}
                   className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-700 text-xs font-semibold"
                 >
                   <Info size={16} /> Info
                 </button>
               </div>
               <p className="text-sm text-gray-700 flex items-start gap-2">
                 <Zap size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                 Best for EV owners and those who can shift usage to overnight hours
               </p>
             </div>
           </div>
         </div>

         {/* Custom Rate Editor */}
         <div className="pt-4 border-t border-gray-200">
           <button
             onClick={() => setShowCustomRates(!showCustomRates)}
             className="text-sm text-navy-600 hover:text-navy-700 font-semibold flex items-center gap-2 transition-colors"
           >
             {showCustomRates ? (
               <>
                 <ChevronDown size={16} className="transform rotate-180 transition-transform" />
                 Hide Custom Rates
               </>
             ) : (
               <>
                 <ChevronDown size={16} />
                 Edit Custom Rates
               </>
             )}
           </button>
           
           {showCustomRates && (
             <div className="mt-4 space-y-4">
               <p className="text-sm text-gray-600 font-medium mb-3">
                 Customize electricity rates (¢/kWh) for both rate plans:
               </p>
               
               <div className="grid md:grid-cols-2 gap-4">
                 {/* TOU Rates */}
                 <div className="space-y-3 bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                   <h4 className="font-bold text-navy-500 mb-2">Time-of-Use (TOU)</h4>
                   <div className="flex items-center gap-2">
                     <div className="w-32 text-xs font-semibold text-navy-600">Off-Peak:</div>
                     <input
                       type="number"
                       value={customRates.tou.offPeak}
                       onChange={(e) => setCustomRates({...customRates, tou: {...customRates.tou, offPeak: Number(e.target.value)}})}
                       className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                       min="0"
                       max="100"
                       step="0.1"
                     />
                     <span className="text-xs text-gray-600">¢/kWh</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-32 text-xs font-semibold text-navy-600">Mid-Peak:</div>
                     <input
                       type="number"
                       value={customRates.tou.midPeak}
                       onChange={(e) => setCustomRates({...customRates, tou: {...customRates.tou, midPeak: Number(e.target.value)}})}
                       className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                       min="0"
                       max="100"
                       step="0.1"
                     />
                     <span className="text-xs text-gray-600">¢/kWh</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-32 text-xs font-semibold text-navy-600">On-Peak:</div>
                     <input
                       type="number"
                       value={customRates.tou.onPeak}
                       onChange={(e) => setCustomRates({...customRates, tou: {...customRates.tou, onPeak: Number(e.target.value)}})}
                       className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                       min="0"
                       max="100"
                       step="0.1"
                     />
                     <span className="text-xs text-gray-600">¢/kWh</span>
                   </div>
                   <div className="pt-2 border-t border-gray-300">
                     <button
                       onClick={() => setCustomRates({...customRates, tou: {offPeak: 9.8, midPeak: 15.7, onPeak: 20.3}})}
                       className="text-xs text-navy-600 hover:text-navy-700 font-semibold"
                     >
                       Reset to OEB Defaults
                     </button>
                   </div>
                 </div>

                 {/* ULO Rates */}
                 <div className="space-y-3 bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                   <h4 className="font-bold text-navy-500 mb-2">Ultra-Low Overnight (ULO)</h4>
                   <div className="flex items-center gap-2">
                    <div className="w-32">
                      <div className="text-xs font-semibold text-navy-600">Ultra-Low:</div>
                      <div className="text-[10px] text-gray-500">Usage share {formatUsageShare(uloDistribution.ultraLowPercent)}</div>
                    </div>
                     <input
                       type="number"
                       value={customRates.ulo.ultraLow}
                       onChange={(e) => setCustomRates({...customRates, ulo: {...customRates.ulo, ultraLow: Number(e.target.value)}})}
                       className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                       min="0"
                       max="100"
                       step="0.1"
                     />
                     <span className="text-xs text-gray-600">¢/kWh</span>
                   </div>
                   <div className="flex items-center gap-2">
                    <div className="w-32">
                      <div className="text-xs font-semibold text-navy-600">Mid-Peak:</div>
                      <div className="text-[10px] text-gray-500">Usage share {formatUsageShare(uloDistribution.midPeakPercent)}</div>
                    </div>
                     <input
                       type="number"
                       value={customRates.ulo.midPeak}
                       onChange={(e) => setCustomRates({...customRates, ulo: {...customRates.ulo, midPeak: Number(e.target.value)}})}
                       className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                       min="0"
                       max="100"
                       step="0.1"
                     />
                     <span className="text-xs text-gray-600">¢/kWh</span>
                   </div>
                   <div className="flex items-center gap-2">
                    <div className="w-32">
                      <div className="text-xs font-semibold text-navy-600">On-Peak:</div>
                      <div className="text-[10px] text-gray-500">Usage share {formatUsageShare(uloDistribution.onPeakPercent)}</div>
                    </div>
                     <input
                       type="number"
                       value={customRates.ulo.onPeak}
                       onChange={(e) => setCustomRates({...customRates, ulo: {...customRates.ulo, onPeak: Number(e.target.value)}})}
                       className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                       min="0"
                       max="100"
                       step="0.1"
                     />
                     <span className="text-xs text-gray-600">¢/kWh</span>
                   </div>
                   <div className="flex items-center gap-2">
                    <div className="w-32">
                      <div className="text-xs font-semibold text-navy-600">Weekend:</div>
                      <div className="text-[10px] text-gray-500">Usage share {formatUsageShare(uloDistribution.offPeakPercent)}</div>
                    </div>
                     <input
                       type="number"
                       value={customRates.ulo.weekendOffPeak}
                       onChange={(e) => setCustomRates({...customRates, ulo: {...customRates.ulo, weekendOffPeak: Number(e.target.value)}})}
                       className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                       min="0"
                       max="100"
                       step="0.1"
                     />
                     <span className="text-xs text-gray-600">¢/kWh</span>
                   </div>
                   <div className="pt-2 border-t border-gray-300">
                     <button
                       onClick={() => setCustomRates({...customRates, ulo: {ultraLow: 3.9, midPeak: 15.7, onPeak: 39.1, weekendOffPeak: 9.8}})}
                       className="text-xs text-navy-600 hover:text-navy-700 font-semibold"
                     >
                       Reset to OEB Defaults
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           )}
         </div>

        {/* Usage Distribution */}
        <div className="pt-4 border-t border-gray-200">
          {/* This wrapper gives a gentle break before the optional usage editor so the screen feels calmer */}
          {/* This button lets people choose when they want to view the usage split section */}
          <button
            onClick={() => setShowUsageDistribution(!showUsageDistribution)}
            className="text-sm text-navy-600 hover:text-navy-700 font-semibold flex items-center gap-2 transition-colors"
          >
            {showUsageDistribution ? (
              <>
                {/* This arrow flips upward to hint that the section can now be tucked away */}
                <ChevronDown size={16} className="transform rotate-180 transition-transform" />
                {/* This text invites the user to hide the usage breakdown when they are finished */}
                Hide Usage Distribution
              </>
            ) : (
              <>
                {/* This arrow points downward to suggest that more helpful details are available */}
                <ChevronDown size={16} />
                {/* This text invites the user to open the usage breakdown when they are curious */}
                Edit Usage Distribution
              </>
            )}
          </button>

          {showUsageDistribution && (
            <div className="mt-4">
              {/* This row shares the heading and reminder so totals stay accurate */}
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Percent className="text-red-500" size={18} />
                </div>
                <label className="text-sm font-semibold text-navy-600">
                  Usage Distribution by Rate Period
                </label>
                <div className="ml-auto">
                  <div className="flex items-center gap-1 px-3 py-1 bg-navy-100 rounded-full">
                    <Info size={14} className="text-navy-600" />
                    <span className="text-xs text-navy-600 font-medium">Must total 100%</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* TOU Distribution */}
                <div className="space-y-3 bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-300 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="text-navy-500" size={18} />
                    <h4 className="font-bold text-navy-500">Time-of-Use (TOU)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-semibold text-navy-600">On-Peak:</div>
                    <input
                      type="number"
                      value={touDistribution.onPeakPercent}
                      onChange={(e) => setTouDistribution({...touDistribution, onPeakPercent: Number(e.target.value)})}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-semibold text-navy-600">Mid-Peak:</div>
                    <input
                      type="number"
                      value={touDistribution.midPeakPercent}
                      onChange={(e) => setTouDistribution({...touDistribution, midPeakPercent: Number(e.target.value)})}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-semibold text-navy-600">Off-Peak:</div>
                    <input
                      type="number"
                      value={touDistribution.offPeakPercent}
                      onChange={(e) => setTouDistribution({...touDistribution, offPeakPercent: Number(e.target.value)})}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                  <div className="pt-2 border-t border-gray-300">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-navy-600">
                        Total: {(
                          touDistribution.offPeakPercent +
                          touDistribution.midPeakPercent +
                          touDistribution.onPeakPercent
                        ).toFixed(1)}%
                      </div>
                      {Math.abs(touDistribution.offPeakPercent + touDistribution.midPeakPercent + touDistribution.onPeakPercent - 100) > 0.1 ? (
                        <span className="text-red-600 text-xs font-semibold">(must = 100%)</span>
                      ) : (
                        <Check className="text-green-600" size={14} />
                      )}
                    </div>
                  </div>
                </div>

                {/* ULO Distribution */}
                <div className="space-y-3 bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-300 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="text-navy-500" size={18} />
                    <h4 className="font-bold text-navy-500">Ultra-Low Overnight (ULO)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-semibold text-navy-600">On-Peak:</div>
                    <input
                      type="number"
                      value={uloDistribution.onPeakPercent}
                      onChange={(e) => setUloDistribution({...uloDistribution, onPeakPercent: Number(e.target.value)})}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-semibold text-navy-600">Mid-Peak:</div>
                    <input
                      type="number"
                      value={uloDistribution.midPeakPercent}
                      onChange={(e) => setUloDistribution({...uloDistribution, midPeakPercent: Number(e.target.value)})}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-semibold text-navy-600">Weekend:</div>
                    <input
                      type="number"
                      value={uloDistribution.offPeakPercent}
                      onChange={(e) => setUloDistribution({...uloDistribution, offPeakPercent: Number(e.target.value)})}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs font-semibold text-navy-600">Ultra-Low:</div>
                    <input
                      type="number"
                      value={uloDistribution.ultraLowPercent || 0}
                      onChange={(e) => setUloDistribution({...uloDistribution, ultraLowPercent: Number(e.target.value)})}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-xs text-gray-600">%</span>
                  </div>
                  <div className="pt-2 border-t border-gray-300">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-navy-600">
                        Total: {(
                          (uloDistribution.ultraLowPercent || 0) +
                          uloDistribution.offPeakPercent +
                          uloDistribution.midPeakPercent +
                          uloDistribution.onPeakPercent
                        ).toFixed(1)}%
                      </div>
                      {Math.abs((uloDistribution.ultraLowPercent || 0) + uloDistribution.offPeakPercent + uloDistribution.midPeakPercent + uloDistribution.onPeakPercent - 100) > 0.1 ? (
                        <span className="text-red-600 text-xs font-semibold">(must = 100%)</span>
                      ) : (
                        <Check className="text-green-600" size={14} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Battery Selection - Multiple Batteries */}
      <div className="card p-6 shadow-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-red-100 rounded-lg">
            <Battery className="text-red-500" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-navy-500">Choose Your Batteries</h3>
        </div>
        
        <div className="space-y-5">
          {/* Battery Selection List */}
          {selectedBatteries.map((batteryId, index) => {
            const battery = BATTERY_SPECS.find(b => b.id === batteryId)
            if (!battery) return null
            
            return (
              <div key={`${batteryId}-${index}`} className="p-4 bg-gradient-to-br from-red-50 to-white border-2 border-red-300 rounded-xl shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <Battery size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-navy-600 text-sm mb-2">
                        Battery {index + 1}
                      </div>
                      <div className="relative">
                        <select
                          value={batteryId}
                          onChange={(e) => {
                            const newBatteries = [...selectedBatteries]
                            newBatteries[index] = e.target.value
                            setSelectedBatteries(newBatteries)
                          }}
                          className="w-full px-3 py-2 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base font-bold text-navy-600 bg-white shadow-sm appearance-none cursor-pointer transition-all"
                        >
                          {BATTERY_SPECS.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.brand} {b.model}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                      </div>
                    </div>
                  </div>
                  {selectedBatteries.length > 1 && (
                    <button
                      onClick={() => setSelectedBatteries(selectedBatteries.filter((_, i) => i !== index))}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="text-red-500" size={20} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add Battery Button */}
          {selectedBatteries.length < 3 && (
            <button
              onClick={() => setSelectedBatteries([...selectedBatteries, BATTERY_SPECS[0].id])}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-red-500 hover:bg-red-50 hover:text-navy-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="text-red-500" size={20} />
              <span className="font-semibold">Add Another Battery</span>
            </button>
          )}

          {/* Combined Battery Summary */}
          {(() => {
            const batteries = selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
            if (batteries.length === 0) return null
            
            // Create combined battery spec
            const battery = batteries.reduce((combined, current, idx) => {
              if (idx === 0) return { ...current }
              return {
                ...combined,
                nominalKwh: combined.nominalKwh + current.nominalKwh,
                usableKwh: combined.usableKwh + current.usableKwh,
                price: combined.price + current.price
              }
            }, batteries[0])
            
            const financials = calculateBatteryFinancials(battery)
            
            // Calculate solar rebate if solar system exists (use standalone/manual or estimate override)
            const systemSizeKw = effectiveSystemSizeKw
            const solarRebatePerKw = 1000
            const solarMaxRebate = 5000
            const solarRebate = systemSizeKw > 0 ? Math.min(systemSizeKw * solarRebatePerKw, solarMaxRebate) : 0
            
            // Calculate total rebates
            const totalRebates = financials.rebate + solarRebate
            const netCostWithSolarRebate = battery.price - totalRebates
            
            return (
              <div className="p-5 bg-gradient-to-br from-red-50 to-white border-2 border-red-500 rounded-xl shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Battery size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold text-navy-500 text-xl">
                        {batteries.map(b => `${b.brand} ${b.model}`).join(' + ')}
                      </div>
                      <div className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-semibold">
                        SELECTED
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <DollarSign size={18} className="text-gray-500" />
                        <div>
                          <div className="text-xs text-gray-600 font-medium">Total Price</div>
                          <div className="font-bold text-navy-600">${battery.price.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown size={18} className="text-green-600" />
                        <div>
                          <div className="text-xs text-gray-600 font-medium">Battery Rebate</div>
                          <div className="font-bold text-green-600">-${financials.rebate.toLocaleString()}</div>
                        </div>
                      </div>
                      {solarRebate > 0 && (
                        <div className="flex items-center gap-2">
                          <Sun size={18} className="text-green-600" />
                          <div>
                            <div className="text-xs text-gray-600 font-medium">Solar Rebate</div>
                            <div className="font-bold text-green-600">-${solarRebate.toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Award size={18} className={netCostWithSolarRebate < 0 ? 'text-green-600' : 'text-red-500'} />
                        <div>
                          <div className="text-xs text-gray-600 font-medium">Net Cost</div>
                          <div className={`font-bold ${netCostWithSolarRebate < 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {netCostWithSolarRebate < 0 ? '+' : ''}${Math.abs(netCostWithSolarRebate).toLocaleString()}
                            {netCostWithSolarRebate < 0 && <span className="text-xs ml-1">(Credit)</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

       {/* Results - Both TOU and ULO */}
       {touResults.get('combined') && uloResults.get('combined') && (() => {
         const touData = touResults.get('combined')!
         const uloData = uloResults.get('combined')!
         const batteries = selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)!).filter(Boolean)
         
         return (
         <div className="card p-8 bg-gradient-to-br from-white to-gray-50 border-2 border-navy-300 shadow-xl">
           <div className="flex items-center justify-center gap-3 mb-8">
             <div className="p-3 bg-gradient-to-br from-navy-500 to-navy-600 rounded-xl shadow-lg">
               <TrendingUp className="text-white" size={32} />
             </div>
            <h3 className="text-3xl font-bold text-navy-500">
              {batteries.map(b => `${b.brand} ${b.model}`).join(' + ')} - Savings Comparison
            </h3>
           </div>
           
          {/* Combined TOU vs ULO comparison card - All metrics in one table */}
          {(() => {
            // Show message if annual usage is invalid
            if (!annualUsageKwh || annualUsageKwh <= 0) {
              return (
                <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
                    <div>
                      <h4 className="text-lg font-semibold text-yellow-800 mb-2">Enter Annual Energy Usage</h4>
                      <p className="text-sm text-yellow-700">
                        Please enter a valid annual energy usage value (greater than 0 kWh) above to see your savings comparison. 
                        The calculator needs your energy consumption data to calculate potential savings from solar and battery systems.
                      </p>
                    </div>
                  </div>
                </div>
              )
            }
            
            // Pre-calculate all breakdown and offset data for the unified table
            const touBreakdown = touData.combined?.breakdown
            const uloBreakdown = uloData.combined?.breakdown
            
            if (!touBreakdown || !uloBreakdown) {
              return (
                <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={24} />
                    <div>
                      <h4 className="text-lg font-semibold text-blue-800 mb-2">Calculating Results...</h4>
                      <p className="text-sm text-blue-700">
                        Please wait while we calculate your savings comparison. Make sure you have entered valid values for annual usage, solar production, and selected a battery.
                      </p>
                    </div>
                  </div>
                </div>
              )
            }

            // Calculate total offset: solar directly consumed + battery discharge
            const touSolarOffset = Object.values(touBreakdown.solarAllocation || {}).reduce((sum, v) => sum + (v || 0), 0)
            const touBatteryOffset = (touBreakdown.batteryOffsets?.onPeak || 0) + (touBreakdown.batteryOffsets?.midPeak || 0) + (touBreakdown.batteryOffsets?.offPeak || 0)
            const touTotalOffset = touSolarOffset + touBatteryOffset
            const touOffsetPercent = annualUsageKwh > 0 ? (touTotalOffset / annualUsageKwh) * 100 : 0

            const uloSolarOffset = Object.values(uloBreakdown.solarAllocation || {}).reduce((sum, v) => sum + (v || 0), 0)
            const uloBatteryOffset = (uloBreakdown.batteryOffsets?.onPeak || 0) + (uloBreakdown.batteryOffsets?.midPeak || 0) + (uloBreakdown.batteryOffsets?.offPeak || 0)
            const uloTotalOffset = uloSolarOffset + uloBatteryOffset
            const uloOffsetPercent = annualUsageKwh > 0 ? (uloTotalOffset / annualUsageKwh) * 100 : 0

            // Get energy-only baseline and final costs
            const touBaseline = touData.combined?.baselineAnnualBillEnergyOnly || 0
            const touFinal = touData.combined?.postSolarBatteryAnnualBillEnergyOnly || 0
            const touSavings = touBaseline - touFinal

            const uloBaseline = uloData.combined?.baselineAnnualBillEnergyOnly || 0
            const uloFinal = uloData.combined?.postSolarBatteryAnnualBillEnergyOnly || 0
            const uloSavings = uloBaseline - uloFinal

            return (
          <div className="mb-8">
            {/* Single unified card containing all metrics */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
              {/* Header area */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                {/* Title */}
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingUp className="text-red-500" size={22} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-700">Plan Comparison (TOU vs ULO)</h4>
                </div>
                {/* Subtitle note */}
                <p className="text-xs text-gray-500">
                  These results include both solar production and battery dispatch for each utility rate plan.
                </p>
              </div>

              {/* Energy-only note */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Costs shown are energy charges only (excluding HST, delivery, and fixed fees) to match maximum savings calculation.
                </p>
              </div>

              {/* Unified table with all metrics */}
              <div className="overflow-hidden border border-gray-200 rounded-xl">
                {/* Column headers */}
                <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <div className="px-4 py-3">Metric</div>
                  <div className="px-4 py-3 text-center text-blue-600">
                    <Sun className="inline mr-1" size={14} />
                    TOU Plan
                  </div>
                  <div className="px-4 py-3 text-center text-amber-600">
                    <Moon className="inline mr-1" size={14} />
                    ULO Plan
                  </div>
                </div>

                {/* Baseline (No System) row */}
                <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200 bg-gray-50">
                  <div className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700">Baseline (No System)</span>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="text-lg font-bold text-gray-800">${Math.round(touBaseline).toLocaleString()}/yr</div>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="text-lg font-bold text-gray-800">${Math.round(uloBaseline).toLocaleString()}/yr</div>
                  </div>
                </div>

                {/* After Solar + Battery row */}
                <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200">
                  <div className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700">After Solar + Battery</span>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="text-lg font-bold text-green-600">${Math.round(touFinal).toLocaleString()}/yr</div>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="text-lg font-bold text-green-600">${Math.round(uloFinal).toLocaleString()}/yr</div>
                  </div>
                </div>

                {/* Annual savings row */}
                <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200 bg-green-50">
                  <div className="px-4 py-4 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-700">Annual Savings</span>
                    <button
                      onClick={() => setShowSavingsInfo(true)}
                      className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-700 text-xs font-semibold"
                    >
                      <Info size={14} /> Info
                    </button>
                  </div>
                  <div className="px-4 py-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      ${Math.round((touData.combined?.annual || 0)).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">
                      ${Math.round((touData.combined?.monthly || 0)).toLocaleString()}/month
                    </div>
                  </div>
                  <div className="px-4 py-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      ${Math.round((uloData.combined?.annual || 0)).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">
                      ${Math.round((uloData.combined?.monthly || 0)).toLocaleString()}/month
                    </div>
                  </div>
                </div>

                {/* Offset & Allocation row - Only show if we have valid results and usage > 0 */}
                {annualUsageKwh > 0 && (frdResults.tou || frdResults.ulo) ? (
                  <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200 bg-blue-50">
                    <div className="px-4 py-4">
                      <span className="text-sm font-semibold text-gray-700">Energy Offset & Allocation</span>
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <div>• Powered by solar</div>
                        <div>• Powered by solar-charged battery</div>
                        {aiMode && <div>• Powered by ULO-charged battery (AI Mode)</div>}
                        <div>• Remaining from grid</div>
                      </div>
                    </div>
                    <div className="px-4 py-4 space-y-2">
                      {frdResults.tou ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Solar Direct:</span>
                            <span className="font-bold text-green-600">{frdResults.tou.offsetPercentages.solarDirect.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Solar→Battery:</span>
                            <span className="font-bold text-blue-600">{frdResults.tou.offsetPercentages.solarChargedBattery.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Grid:</span>
                            <span className="font-bold text-gray-600">{frdResults.tou.offsetPercentages.gridRemaining.toFixed(1)}%</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 italic">Not available</div>
                      )}
                    </div>
                    <div className="px-4 py-4 space-y-2">
                      {frdResults.ulo ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Solar Direct:</span>
                            <span className="font-bold text-green-600">{frdResults.ulo.offsetPercentages.solarDirect.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Solar→Battery:</span>
                            <span className="font-bold text-blue-600">{frdResults.ulo.offsetPercentages.solarChargedBattery.toFixed(1)}%</span>
                          </div>
                          {aiMode && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">ULO→Battery:</span>
                              <span className="font-bold text-amber-600">{frdResults.ulo.offsetPercentages.uloChargedBattery.toFixed(1)}%</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Grid:</span>
                            <span className="font-bold text-gray-600">{frdResults.ulo.offsetPercentages.gridRemaining.toFixed(1)}%</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 italic">Not available</div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Payback period row */}
                <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200">
                  <div className="px-4 py-4 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-700">Payback Period (Full System)</span>
                    <button
                      onClick={() => setShowPaybackInfo(true)}
                      className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-700 text-xs font-semibold"
                    >
                      <Info size={14} /> Info
                    </button>
                  </div>
                  <div className="px-4 py-4 text-center">
                        <div className="text-2xl font-bold text-navy-600">
                      {(() => {
                        const touPaybackYears = touData.combined?.projection?.paybackYears
                        return touPaybackYears == null || touPaybackYears === Number.POSITIVE_INFINITY
                          ? 'N/A'
                          : `${touPaybackYears.toFixed(1)} years`
                      })()}
                    </div>
                  </div>
                  <div className="px-4 py-4 text-center">
                    <div className="text-2xl font-bold text-navy-600">
                      {(() => {
                        const uloPaybackYears = uloData.combined?.projection?.paybackYears
                        return uloPaybackYears == null || uloPaybackYears === Number.POSITIVE_INFINITY
                          ? 'N/A'
                          : `${uloPaybackYears.toFixed(1)} years`
                      })()}
                    </div>
                  </div>
                </div>

                {/* 25-year profit row */}
                <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-gray-200">
                  <div className="px-4 py-4 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-700">25-Year Profit</span>
                    <button
                      onClick={() => setShowProfitInfo(true)}
                      className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-700 text-xs font-semibold"
                    >
                      <Info size={14} /> Info
                    </button>
                  </div>
                  <div className="px-4 py-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${(
                        touData.combined?.projection?.netProfit25Year ?? touData.projection.netProfit25Year
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="px-4 py-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${(
                        uloData.combined?.projection?.netProfit25Year ?? uloData.projection.netProfit25Year
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            )
          })()}


           {/* Detailed Cost Breakdown - Side by Side */}
          {/* Friendly toggle so homeowners can hide the cost comparison tables */}
          <div className="flex items-center justify-between mt-8 mb-4">
            <h3 className="text-lg font-bold text-navy-600">Detailed Cost Comparison</h3>
            <button
              type="button"
              onClick={() => setShowCostTables(prev => !prev)}
              className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-navy-300 text-navy-600 hover:bg-navy-50 transition-colors"
            >
              {showCostTables ? 'Hide Before/After Tables' : 'Show Before/After Tables'}
            </button>
          </div>

          {showCostTables && (() => {
            const touBreakdown = touData?.combined?.breakdown
            const touRatePlan = getCustomTouRatePlan()
            const touRates = {
              offPeak: (touRatePlan.periods.find(p => p.period === 'off-peak')?.rate ?? touRatePlan.weekendRate ?? 9.8) / 100,
              midPeak: (touRatePlan.periods.find(p => p.period === 'mid-peak')?.rate ?? 15.7) / 100,
              onPeak: (touRatePlan.periods.find(p => p.period === 'on-peak')?.rate ?? 20.3) / 100,
            }

            const touAfterDisplay = touBreakdown
              ? {
                  offPeak: (touBreakdown.usageAfterBattery.offPeak || 0) * touRates.offPeak,
                  midPeak: (touBreakdown.usageAfterBattery.midPeak || 0) * touRates.midPeak,
                  onPeak: (touBreakdown.usageAfterBattery.onPeak || 0) * touRates.onPeak,
                  total: ((touBreakdown.usageAfterBattery.offPeak || 0) * touRates.offPeak) +
                         ((touBreakdown.usageAfterBattery.midPeak || 0) * touRates.midPeak) +
                         ((touBreakdown.usageAfterBattery.onPeak || 0) * touRates.onPeak)
                }
              : {
                  offPeak: touData?.result?.newCost.offPeak ?? 0,
                  midPeak: touData?.result?.newCost.midPeak ?? 0,
                  onPeak: touData?.result?.newCost.onPeak ?? 0,
                  total: touData?.result?.newCost.total ?? 0,
                }

            const uloBreakdown = uloData?.combined?.breakdown
            const uloRatePlan = getCustomUloRatePlan()
            const uloRates = {
              ultraLow: (uloRatePlan.periods.find(p => p.period === 'ultra-low')?.rate ?? 3.9) / 100,
              offPeak: (uloRatePlan.periods.find(p => p.period === 'off-peak')?.rate ?? uloRatePlan.weekendRate ?? 9.8) / 100,
              midPeak: (uloRatePlan.periods.find(p => p.period === 'mid-peak')?.rate ?? 15.7) / 100,
              onPeak: (uloRatePlan.periods.find(p => p.period === 'on-peak')?.rate ?? 39.1) / 100,
            }

            const uloAfterDisplay = uloBreakdown
              ? {
                  ultraLow: (uloBreakdown.usageAfterBattery.ultraLow || 0) * uloRates.ultraLow,
                  offPeak: (uloBreakdown.usageAfterBattery.offPeak || 0) * uloRates.offPeak,
                  midPeak: (uloBreakdown.usageAfterBattery.midPeak || 0) * uloRates.midPeak,
                  onPeak: (uloBreakdown.usageAfterBattery.onPeak || 0) * uloRates.onPeak,
                  total:
                    ((uloBreakdown.usageAfterBattery.ultraLow || 0) * uloRates.ultraLow) +
                    ((uloBreakdown.usageAfterBattery.offPeak || 0) * uloRates.offPeak) +
                    ((uloBreakdown.usageAfterBattery.midPeak || 0) * uloRates.midPeak) +
                    ((uloBreakdown.usageAfterBattery.onPeak || 0) * uloRates.onPeak),
                }
              : {
                  ultraLow: uloData?.result?.newCost.ultraLow ?? 0,
                  offPeak: uloData?.result?.newCost.offPeak ?? 0,
                  midPeak: uloData?.result?.newCost.midPeak ?? 0,
                  onPeak: uloData?.result?.newCost.onPeak ?? 0,
                  total: uloData?.result?.newCost.total ?? 0,
                }

            return (
           <div className="grid md:grid-cols-2 gap-6 mb-6">
             {/* TOU Cost Breakdown */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-300 hover:border-navy-300 transition-all">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sun className="text-navy-500" size={20} />
                  <h4 className="font-bold text-navy-500 text-lg">Time-of-Use (TOU) Plan</h4>
                </div>
                <button
                  onClick={() => setShowTouInfo(true)}
                  className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-700 text-xs font-semibold"
                >
                  <Info size={16} />
                  View How It’s Calculated
                </button>
               </div>
              {/* Let readers know these rows exclude the non-usage fees */}
              <div className="mb-3 text-xs text-gray-500 italic">
                Energy charges only are shown here. Delivery, regulatory, and fixed fees remain unchanged by the battery.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                  <div className="text-sm font-semibold text-gray-700 mb-3">Before Peak Shaving</div>
                   <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                       <span>Off-Peak:</span>
                       <span className="font-semibold">${touData.result.originalCost.offPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Mid-Peak:</span>
                       <span className="font-semibold">${touData.result.originalCost.midPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>On-Peak:</span>
                       <span className="font-semibold">${touData.result.originalCost.onPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-red-600">
                       <span>Total:</span>
                       <span>${touData.result.originalCost.total.toFixed(2)}</span>
                     </div>
                   </div>
                 </div>
                 <div>
                  <div className="text-sm font-semibold text-gray-700 mb-3">After Peak Shaving</div>
                   <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                       <span>Off-Peak:</span>
                      <span className="font-semibold">${touAfterDisplay.offPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Mid-Peak:</span>
                      <span className="font-semibold">${touAfterDisplay.midPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>On-Peak:</span>
                      <span className="font-semibold">${touAfterDisplay.onPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-green-600">
                       <span>Total:</span>
                      <span>${touAfterDisplay.total.toFixed(2)}</span>
                     </div>
                    <div className="text-[11px] text-gray-500 italic">
                      Battery (charged from solar excess) discharges during peak hours, eliminating mid/on-peak costs. Remaining grid usage is allocated to off-peak rates.
                    </div>
                   </div>
                 </div>
               </div>
              <div className="mt-5 p-4 bg-gradient-to-r from-green-50 via-white to-navy-50 rounded-xl border-2 border-green-400 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-500 rounded-lg">
                      <TrendingUp size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-navy-600">Annual Savings:</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300">Battery only</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      ${touData.result.annualSavings.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {touData.result.savingsPercent.toFixed(2)}% reduction
                    </div>
                  </div>
                </div>
              </div>
             </div>

             {/* ULO Cost Breakdown */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-300 hover:border-navy-300 transition-all">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Moon className="text-navy-500" size={20} />
                  <h4 className="font-bold text-navy-500 text-lg">Ultra-Low Overnight (ULO) Plan</h4>
                </div>
                <button
                  onClick={() => setShowUloInfo(true)}
                  className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-700 text-xs font-semibold"
                >
                  <Info size={16} />
                  View How It’s Calculated
                </button>
               </div>
              {/* Clear note that delivery and other fixed fees are outside this table */}
              <div className="mb-3 text-xs text-gray-500 italic">
                These rows cover energy usage only—the fixed delivery and regulatory charges on your bill stay constant.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                  <div className="text-sm font-semibold text-gray-700 mb-3">Before Peak Shaving</div>
                   <div className="space-y-2 text-sm">
                     {uloData.result.usageByPeriod.ultraLow !== undefined && (
                       <div className="flex justify-between">
                         <span>Ultra-Low:</span>
                         <span className="font-semibold">${uloData.result.originalCost.ultraLow?.toFixed(2)}</span>
                       </div>
                     )}
                     <div className="flex justify-between">
                       <span>Weekend:</span>
                       <span className="font-semibold">${uloData.result.originalCost.offPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Mid-Peak:</span>
                       <span className="font-semibold">${uloData.result.originalCost.midPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>On-Peak:</span>
                       <span className="font-semibold">${uloData.result.originalCost.onPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-red-600">
                       <span>Total:</span>
                       <span>${uloData.result.originalCost.total.toFixed(2)}</span>
                     </div>
                   </div>
                 </div>
                 <div>
                  <div className="text-sm font-semibold text-gray-700 mb-3">After Peak Shaving</div>
                   <div className="space-y-2 text-sm">
                     {uloData.result.newCost.ultraLow !== undefined && (
                       <div className="flex justify-between">
                         <span>Ultra-Low:</span>
                        <span className="font-semibold">${uloAfterDisplay.ultraLow.toFixed(2)}</span>
                       </div>
                     )}
                     <div className="flex justify-between">
                       <span>Weekend:</span>
                      <span className="font-semibold">${uloAfterDisplay.offPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Mid-Peak:</span>
                      <span className="font-semibold">${uloAfterDisplay.midPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>On-Peak:</span>
                      <span className="font-semibold">${uloAfterDisplay.onPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-green-600">
                       <span>Total:</span>
                      <span>${uloAfterDisplay.total.toFixed(2)}</span>
                     </div>
                    <div className="text-[11px] text-gray-500 italic">
                      Remaining grid costs live in the weekend/off-peak and ultra-low rows; the peak windows drop to $0 after shifting.
                    </div>
                   </div>
                 </div>
               </div>
              <div className="mt-5 p-4 bg-gradient-to-r from-green-50 via-white to-navy-50 rounded-xl border-2 border-green-400 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-500 rounded-lg">
                      <TrendingUp size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-navy-600">Annual Savings:</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300">Battery only</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      ${uloData.result.annualSavings.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {uloData.result.savingsPercent.toFixed(2)}% reduction
                    </div>
                  </div>
                </div>
              </div>
             </div>
           </div>
            )
          })()}

          {/* Solar + Battery combined distribution card for TOU plan */}
          {(() => {
            const breakdown = touData.combined?.breakdown
            if (!breakdown) return null

            const totalUsage = annualUsageKwh || Object.values(breakdown.originalUsage).reduce((sum, v) => sum + v, 0)
            const solarCapKwh = breakdown.solarCapKwh ?? totalUsage * 0.5

            const periodMeta: Array<{ key: 'midPeak' | 'onPeak' | 'offPeak' | 'ultraLow'; label: string; description: string }> = [
              { key: 'onPeak', label: 'Weekday On-Peak', description: '7 AM – 11 AM & 5 PM – 7 PM weekdays' },
              { key: 'midPeak', label: 'Weekday Mid-Peak', description: '11 AM – 5 PM weekdays' },
              { key: 'offPeak', label: 'Weekend & Off-Peak', description: 'Night + weekend hours' },
            ]

            return (
              <div className="card mt-4 mb-6 p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 shadow-lg rounded-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                    <BarChart3 className="text-white" size={28} />
                  </div>
                    <div>
                      <h3 className="text-2xl font-bold text-blue-700">Solar + Battery Peak-Shaving Distribution (TOU)</h3>
                    </div>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-200">
                    <thead className="bg-blue-100/80">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wide">TOU Period</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wide">Annual Usage</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wide">Solar Allocation</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wide">Left After Solar</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wide">Grid After Solar + Battery</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-100">
                      {periodMeta.map(period => {
                        const original = breakdown.originalUsage[period.key] || 0
                        const solar = breakdown.solarAllocation?.[period.key] ?? 0
                        const leftoverSolar = breakdown.usageAfterSolar[period.key] || 0
                        const gridAfterBattery = breakdown.usageAfterBattery[period.key] || 0
                        const usagePercent = totalUsage > 0 ? original / totalUsage : 0
                        const solarPercent = solarCapKwh > 0 ? solar / solarCapKwh : 0

                        return (
                          <tr key={period.key} className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-blue-900">{period.label}</div>
                              <div className="text-[11px] text-blue-600">{period.description}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="font-bold text-gray-800">{formatKwh(original)}</div>
                              <div className="text-[11px] text-gray-500">{formatPercent(usagePercent)}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="font-bold text-green-700">{formatKwh(solar)}</div>
                              <div className="text-[11px] text-gray-500">{formatPercent(solarPercent)}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="font-bold text-gray-800">{formatKwh(leftoverSolar)}</div>
                              <div className="text-[11px] text-gray-500">After solar only</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="font-bold text-red-600">{formatKwh(gridAfterBattery)}</div>
                              <div className="text-[11px] text-gray-500">Purchased from grid</div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )
          })()}

          {/* Solar + Battery combined distribution card driven by the new spreadsheet logic */}
          {(() => {
            // Pull the combined ULO breakdown that now includes the solar + battery sharing story
            const breakdown = uloData.combined?.breakdown
            if (!breakdown) return null

            // Helper to format kilowatt-hours in a friendly way for homeowners reading the table
            // Helper to format percentages with one decimal place so the row sums are easy to verify at a glance
            const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

            // Total annual usage keeps all percentage math tidy and mirrors the inputs on the left-hand cards
            const totalUsage = annualUsageKwh || Object.values(breakdown.originalUsage).reduce((sum, v) => sum + v, 0)
            // Solar cap (50% of annual usage or production, whichever is smaller) provided by the new client formula
            const solarCapKwh = breakdown.solarCapKwh ?? totalUsage * 0.5
            // Lookup describing each ULO bucket in everyday language so the table reads naturally
            const periodMeta: Array<{ key: 'midPeak' | 'onPeak' | 'offPeak' | 'ultraLow'; label: string; description: string }> = [
              { key: 'midPeak', label: 'Weekday Mid-Peak', description: '7 AM – 4 PM and 9 PM – 11 PM weekday hours' },
              { key: 'onPeak', label: 'Weekday On-Peak', description: '4 PM – 9 PM weekday hours' },
              { key: 'offPeak', label: 'Weekend Off-Peak', description: '7 AM – 11 PM on weekends and statutory holidays' },
              { key: 'ultraLow', label: 'Ultra-Low Overnight', description: '11 PM – 7 AM every day' },
            ]

            return (
              <div className="card mt-4 mb-6 p-6 bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 shadow-lg rounded-2xl">
                {/* Warm header with the chart badge that signals this is the combined-story section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-400 rounded-xl shadow-md">
                      <BarChart3 className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-amber-700">Solar + Battery Peak-Shaving Distribution</h3>
                    </div>
                  </div>
                </div>

                {/* Table summarising the allocation and leftovers per period */}
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-amber-200">
                    <thead className="bg-amber-100/80">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">ULO Period</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Annual Usage</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Solar Allocation</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Left After Solar</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Grid After Solar + Battery</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-amber-100">
                      {periodMeta.map(period => {
                        const original = breakdown.originalUsage[period.key] || 0
                        const solar = breakdown.solarAllocation?.[period.key] ?? 0
                        const leftoverSolar = breakdown.usageAfterSolar[period.key] || 0
                        const gridAfterBattery = breakdown.usageAfterBattery[period.key] || 0
                        const usagePercent = totalUsage > 0 ? original / totalUsage : 0
                        const solarPercent = solarCapKwh > 0 ? solar / solarCapKwh : 0
                        return (
                          <tr key={period.key} className="hover:bg-amber-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-amber-900">{period.label}</div>
                              <div className="text-[11px] text-amber-600">{period.description}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="font-bold text-gray-800">{formatKwh(original)}</div>
                              <div className="text-[11px] text-gray-500">{formatPercent(usagePercent)}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="font-bold text-green-700">{formatKwh(solar)}</div>
                              <div className="text-[11px] text-gray-500">{formatPercent(solarPercent)}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="font-bold text-gray-800">{formatKwh(leftoverSolar)}</div>
                              <div className="text-[11px] text-gray-500">After solar only</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="font-bold text-red-600">{formatKwh(gridAfterBattery)}</div>
                              <div className="text-[11px] text-gray-500">Purchased from grid</div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Quick takeaway row so readers understand why overnight energy grows */}
              </div>
            )
          })()}


           {/* Full Calculation Breakdown - Card Layout */}
           {(touData.result || uloData.result) && (
             <div className="mt-6">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-navy-500 rounded-lg">
                   <BarChart3 className="text-white" size={24} />
                 </div>
                 <h4 className="text-2xl font-bold text-navy-600">Full Offset Calculation Breakdown</h4>
               </div>
               <p className="text-xs text-gray-600 mb-4">
                 Offset is capped to keep expectations realistic in winter. Savings can exceed offset because any remaining grid energy is bought at low overnight rates.
               </p>
               
               <div className="grid md:grid-cols-2 gap-6">
                 {/* TOU Calculation Card */}
                 {(() => {
                 // Use FRD results for consistent calculations
                 const touFrd = frdResults.tou
                 if (!touFrd) return null
                 
                 // FRD-based offset percentages and kWh values
                 const solarDirectPercent = touFrd.offsetPercentages.solarDirect
                 const solarDirectKwh = (solarDirectPercent / 100) * annualUsageKwh
                 
                 const solarBatteryPercent = touFrd.offsetPercentages.solarChargedBattery
                 const solarBatteryKwh = (solarBatteryPercent / 100) * annualUsageKwh
                 
                 // Battery top-up from grid (should be 0 for TOU, but use FRD value for consistency)
                 const touChargedBatteryKwh = touFrd.battGridCharged || 0
                 
                 const gridRemainingPercent = touFrd.offsetPercentages.gridRemaining
                 const gridRemainingKwh = (gridRemainingPercent / 100) * annualUsageKwh
                 
                 // Combined offset (solar direct + solar-charged battery)
                 const touCombinedOffsetPercent = solarDirectPercent + solarBatteryPercent
                 const touCombinedOffset = solarDirectKwh + solarBatteryKwh
                 
                 const solarProductionKwh = effectiveSolarProductionKwh
                 
                 // Battery totals from FRD
                 const touBatteryOffsetKwh = touData.result.batteryOffsets.onPeak + 
                                            touData.result.batteryOffsets.midPeak + 
                                            touData.result.batteryOffsets.offPeak + 
                                            (touData.result.batteryOffsets.ultraLow || 0)
                 
                 // For display purposes
                 const touActualLeftoverAfterFullBattery = gridRemainingKwh
                 const touRemainderPercent = gridRemainingPercent
                 
                 // Check if offset is capped
                 const touOffsetCapped = touCombinedOffsetPercent < offsetCapPercent - 0.1

                 // Grid energy breakdown (no grid charging for TOU from battery perspective)
                 const touShownGridKwh = gridRemainingKwh
                 const touShownGridPercent = gridRemainingPercent
                   
                 // Get savings from FRD results
                 const touOriginalBill = touData.result.originalCost.total || 1
                 const touNewBill = touData.result.newCost.total || 0
                 const touBillSavings = Math.max(0, touOriginalBill - touNewBill)
                 const touTotalSavingsPercent = touOriginalBill > 0 ? (touBillSavings / touOriginalBill) * 100 : 0
                   
                 // Get TOU rates for display
                  const touRatePlan = getCustomTouRatePlan()
                 const touOffPeakRate = touRatePlan.periods.find(p => p.period === 'off-peak')?.rate ?? touRatePlan.periods[0]?.rate ?? 9.8
                  const touLeftoverRate = touData.result.leftoverEnergy.ratePerKwh
                 const touLeftoverKwh = gridRemainingKwh
                 const touAdjustedGridCharge = 0 // No grid charging for TOU (battery only charges from solar)
                  
                 // Calculate correct blended rate for TOU
                 const touOnPeakRate = touRatePlan.periods.find(p => p.period === 'on-peak')?.rate || 20.3
                  const touBatteryChargingCost = touAdjustedGridCharge * (touOffPeakRate / 100)
                  const touLeftoverCost = touLeftoverKwh * touLeftoverRate
                  const touTotalGridCost = touBatteryChargingCost + touLeftoverCost
                 const touLowRateEnergyKwh = touAdjustedGridCharge + touLeftoverKwh
                 const touLowRatePercent = gridRemainingPercent // Grid remaining percentage
                  const touCorrectBlendedRate = touLowRateEnergyKwh > 0 ? touTotalGridCost / touLowRateEnergyKwh : 0
                 // Use touNewBill instead of touTotalGridCost to ensure percentages add to 100%
                 const touLeftoverCostPercent = touOriginalBill > 0 ? (touNewBill / touOriginalBill) * 100 : 0
                  
                  // Keep the storytelling grounded by anchoring to the original peak-priced usage
                  const touPeakPricedUsageKwh =
                    (touData.result.usageByPeriod.onPeak ?? 0) +
                    (touData.result.usageByPeriod.midPeak ?? 0)
                  // Translate the savings percentage into a relatable kWh figure
                  const touSavingsKwhEquivalentRaw = (annualUsageKwh * touTotalSavingsPercent) / 100
                  const touSavingsKwhEquivalent = Math.min(touPeakPricedUsageKwh, touSavingsKwhEquivalentRaw)
                  const touPostProgramsOffPeakUsage =
                    (touData.result.usageByPeriod.offPeak ?? 0) +
                    touAdjustedGridCharge
                  const touOffPeakRoomForRemainder = Math.max(
                    0,
                    (annualUsageKwh * (touDistribution.offPeakPercent / 100)) - touPostProgramsOffPeakUsage
                  )
                  const touOffPeakCap = Math.min(
                    touLeftoverKwh,
                    touOffPeakRoomForRemainder + (annualUsageKwh * 0.05)
                  )
                  // Use FRD gridKWhByBucket for accurate breakdown (matches FRD calculation)
                  let touLeftoverBreakdown: LeftoverBreakdown
                  if (touFrd?.gridKWhByBucket) {
                    const rawBreakdown = {
                      offPeak: touFrd.gridKWhByBucket.offPeak || 0,
                      midPeak: touFrd.gridKWhByBucket.midPeak || 0,
                      onPeak: touFrd.gridKWhByBucket.onPeak || 0,
                      ultraLow: 0
                    }
                    const rawTotal = rawBreakdown.offPeak + rawBreakdown.midPeak + rawBreakdown.onPeak
                    
                    // Scale breakdown to match touLeftoverKwh if totals don't match
                    if (rawTotal > 0 && Math.abs(rawTotal - touLeftoverKwh) > 0.01) {
                      const scale = touLeftoverKwh / rawTotal
                      touLeftoverBreakdown = {
                        offPeak: rawBreakdown.offPeak * scale,
                        midPeak: rawBreakdown.midPeak * scale,
                        onPeak: rawBreakdown.onPeak * scale,
                        ultraLow: 0
                      }
                    } else {
                      touLeftoverBreakdown = rawBreakdown
                    }
                  } else {
                    touLeftoverBreakdown = clampBreakdown(
                      touData.result.leftoverEnergy.breakdown,
                      touLeftoverKwh,
                      ['offPeak', 'midPeak', 'onPeak'],
                      { offPeak: touOffPeakCap }
                    )
                  }
                  
                  // Easy comparables for average bill rate before and after battery support
                  const touOriginalEffectiveRate = annualUsageKwh > 0 ? (touOriginalBill / annualUsageKwh) * 100 : 0
                  const touNewEffectiveRate = annualUsageKwh > 0 ? (touNewBill / annualUsageKwh) * 100 : 0
                   
                   return (
                     <div className="bg-gradient-to-br from-navy-50 to-white rounded-2xl border-2 border-navy-300 shadow-lg p-6">
                       {/* TOU Header */}
                       <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-navy-200">
                         <div className="p-2 bg-navy-500 rounded-xl">
                           <Sun className="text-white" size={24} />
                         </div>
                         <div>
                           <h5 className="text-xl font-bold text-navy-600">Time-of-Use (TOU)</h5>
                           <p className="text-sm text-gray-600">Standard rate plan</p>
                         </div>
                       </div>
                       
                       {/* TOU Metrics */}
                       <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                             <div className="text-xs font-semibold text-gray-600 mb-1">Total Consumption</div>
                             <div className="text-2xl font-bold text-gray-800">{annualUsageKwh.toLocaleString()}</div>
                             <div className="text-xs text-gray-500">kWh/year</div>
                           </div>
                           <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                             <div className="text-xs font-semibold text-gray-600 mb-1">Solar Production</div>
                             <div className="text-2xl font-bold text-green-600">{solarProductionKwh > 0 ? solarProductionKwh.toLocaleString() : '0'}</div>
                             <div className="text-xs text-gray-500">kWh/year</div>
                           </div>
                         </div>
                         
                        {/* Friendly heading reminding the reader that the next cards talk about offsets */}
                        <div className="space-y-4 bg-white/80 border border-navy-100 rounded-2xl p-4">
                          {/* Plain-language heading so people notice the offset cluster */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-navy-600 uppercase tracking-wide">Offset Coverage</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-navy-200 to-transparent" />
                          </div>

                         {/* FRD: Solar Direct - energy covered directly by solar */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Sun className="text-green-600" size={20} />
                                <span className="font-bold text-gray-700">Daytime covered by solar</span>
                              </div>
                              <div className="text-right">
                               <div className="text-2xl font-bold text-green-600">{solarDirectPercent.toFixed(2)}%</div>
                               <div className="text-xs text-gray-600">{solarDirectKwh.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Energy your panels cover during the day</div>
                          </div>

                         {/* Nighttime covered by battery - combines Solar→Battery + Grid top-up */}
                          <div className="bg-gradient-to-r from-navy-50 to-blue-50 rounded-xl p-4 border-2 border-navy-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Moon className="text-navy-600" size={20} />
                                <span className="font-bold text-gray-700">Nighttime covered by battery</span>
                              </div>
                              <div className="text-right">
                               <div className="text-2xl font-bold text-navy-600">{solarBatteryPercent.toFixed(2)}%</div>
                               <div className="text-xs text-gray-600">{solarBatteryKwh.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Stored solar used at night (excludes grid top-up in total %)</div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-gray-600 pl-7">
                             <div>Solar → Battery: <span className="font-semibold text-navy-600">{solarBatteryKwh.toFixed(0)} kWh</span></div>
                             {touChargedBatteryKwh > 0 ? (
                               <div>Battery top-up (cheap grid): <span className="font-semibold text-navy-600">{touChargedBatteryKwh.toFixed(0)} kWh</span></div>
                             ) : (
                               <div>Battery top-up: <span className="font-semibold text-navy-600">Not available (TOU plan)</span></div>
                             )}
                             <div>Remainder (still from grid): <span className="font-semibold text-navy-600">{touActualLeftoverAfterFullBattery.toFixed(0)} kWh</span></div>
                            </div>
                          </div>

                          {/* Summary card bundling the full offset picture in one spot */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-300 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="text-green-600" size={20} />
                                <span className="font-bold text-gray-700">Total Offset by Solar + Battery</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">{touCombinedOffsetPercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">{touCombinedOffset.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Everything you don't need to buy from the grid</div>
                            {touOffsetCapped && (
                              <div className="text-[11px] text-amber-600 pl-7 mt-1">
                                Capped at {offsetCapPercent.toFixed(0)}% to reflect winter limits
                                {offsetCapInfo.matchesUsage ? ' (solar production closely matches annual usage).' : '.'}
                                {offsetCapInfo.orientationBonus || offsetCapInfo.productionBonus ? (
                                  <span className="block">
                                    Bonus applied for
                                    {offsetCapInfo.orientationBonus ? ' steep south-facing roof' : ''}
                                    {offsetCapInfo.orientationBonus && offsetCapInfo.productionBonus ? ' and' : ''}
                                    {offsetCapInfo.productionBonus ? ' 10%+ extra production' : ''}.
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Friendly heading reminding the reader that the next cards cover dollars saved */}
                        <div className="space-y-4 bg-white/80 border border-navy-100 rounded-2xl p-4">
                          {/* Plain-language heading so viewers see this is the savings set */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-navy-600 uppercase tracking-wide">Savings & Remaining Costs</span>
                            {/* Tiny info button offers a plain-language explainer for this whole section */}
                            <button
                              type="button"
                              onClick={() => setShowTouSavingsSectionInfo(true)}
                              className="inline-flex items-center justify-center rounded-full border border-navy-200 text-navy-500 hover:bg-navy-50 transition px-1.5 py-1"
                              aria-label="How are savings and remaining costs calculated for TOU?"
                            >
                              <Info size={14} />
                            </button>
                            <div className="h-px flex-1 bg-gradient-to-r from-navy-200 to-transparent" />
                          </div>
                          <p className="text-[11px] text-gray-600 pl-1">Savings follow the bill: {`100% - Cost of energy bought from the grid`}.</p>

                          {/* Straightforward card spelling out what still comes from the grid */}
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="text-red-600" size={20} />
                                <span className="font-bold text-gray-700">Bought from the grid (cheap hours)</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-600">{touLowRatePercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">{touLowRateEnergyKwh.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">
                              {touAdjustedGridCharge > 0 ? (
                                <>Battery top-up {touAdjustedGridCharge.toFixed(0)} kWh + remainder {touLeftoverKwh.toFixed(0)} kWh</>
                              ) : (
                                <>Remainder {touLeftoverKwh.toFixed(0)} kWh (no grid charging for TOU)</>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 pl-7">
                              Blended rate {(touCorrectBlendedRate * 100).toFixed(2)}¢/kWh • Remainder {touLeftoverKwh.toFixed(0)} kWh allocated:
                              {touLeftoverBreakdown.offPeak > 0 && ` ${touLeftoverBreakdown.offPeak.toFixed(0)} kWh off-peak`}
                              {touLeftoverBreakdown.midPeak > 0 && `, ${touLeftoverBreakdown.midPeak.toFixed(0)} kWh mid-peak`}
                              {touLeftoverBreakdown.onPeak > 0 && `, ${touLeftoverBreakdown.onPeak.toFixed(0)} kWh on-peak`}
                              {touAdjustedGridCharge > 0 && ` • Battery top-up ${touAdjustedGridCharge.toFixed(0)} kWh charged off-peak @ ${touOffPeakRate.toFixed(1)}¢/kWh`}
                            </div>
                          </div>

                          {/* Helpful card that clarifies how the remaining grid power is priced */}
                          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-300 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-gray-700">Cost of energy bought from grid</span>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">{touLeftoverCostPercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">of total bill</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                              <Info size={14} className="text-navy-500 flex-shrink-0" />
                              <span className="text-xs text-gray-600">
                                Blended rate {(touCorrectBlendedRate * 100).toFixed(2)}¢/kWh: battery top-up {touAdjustedGridCharge.toFixed(0)} kWh @ {touOffPeakRate.toFixed(1)}¢/kWh + remainder {touLeftoverKwh.toFixed(0)} kWh (allocated to cheapest available hours) • vs on-peak {touOnPeakRate.toFixed(2)}¢/kWh.
                              </span>
                            </div>
                          </div>

                          {/* Calm card sharing how the savings show up on the bill */}
                          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-300 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-gray-700">Total savings</span>
                              <div className="text-right">
                               <div className="text-2xl font-bold text-green-600">{touTotalSavingsPercent.toFixed(2)}%</div>
                               <div className="text-xs text-gray-600">Equivalent to {touSavingsKwhEquivalent.toFixed(0)} kWh/year of peak-priced energy avoided</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">
                              Savings can exceed offset because remaining energy is prioritized for cheaper rate periods.
                            </div>
                          </div>

                          
                        </div>
                       </div>
                     </div>
                   )
                 })()}
                 
                 {/* ULO Calculation Card */}
                 {(() => {
                 // Use FRD results for consistent calculations
                 const uloFrd = frdResults.ulo
                 if (!uloFrd) return null
                 
                 // FRD-based offset percentages and kWh values
                 const solarDirectPercent = uloFrd.offsetPercentages.solarDirect
                 const solarDirectKwh = (solarDirectPercent / 100) * annualUsageKwh
                 
                 const solarBatteryPercent = uloFrd.offsetPercentages.solarChargedBattery
                 const solarBatteryKwh = (solarBatteryPercent / 100) * annualUsageKwh
                 
                 const uloChargedBatteryPercent = uloFrd.offsetPercentages.uloChargedBattery || 0
                 const uloChargedBatteryKwh = (uloChargedBatteryPercent / 100) * annualUsageKwh
                 
                 const gridRemainingPercent = uloFrd.offsetPercentages.gridRemaining
                 const gridRemainingKwh = (gridRemainingPercent / 100) * annualUsageKwh
                 
                 // Combined offset (solar direct + all battery sources)
                 const uloCombinedOffsetPercent = solarDirectPercent + solarBatteryPercent + uloChargedBatteryPercent
                 const uloCombinedOffset = solarDirectKwh + solarBatteryKwh + uloChargedBatteryKwh
                 
                 const solarProductionKwh = effectiveSolarProductionKwh
                 
                 // Battery totals from data
                 const uloBatteryOffsetKwh = uloData.result.batteryOffsets.onPeak + 
                                            uloData.result.batteryOffsets.midPeak + 
                                            uloData.result.batteryOffsets.offPeak + 
                                            (uloData.result.batteryOffsets.ultraLow || 0)
                 
                 // For display purposes
                 const uloActualLeftoverAfterFullBattery = gridRemainingKwh
                 const uloRemainderPercent = gridRemainingPercent
                 
                 // Check if offset is capped
                 const uloOffsetCapped = uloCombinedOffsetPercent < offsetCapPercent - 0.1

                 // Grid energy breakdown  
                 const uloShownGridKwh = gridRemainingKwh
                 const uloShownGridPercent = gridRemainingPercent
                 
                 // Get savings from combined results (includes AI Mode effects)
                 // Use combined results which account for AI Mode, fallback to result if combined not available
                 const uloOriginalBill = uloData.combined?.baselineAnnualBillEnergyOnly || uloData.result.originalCost.total || 1
                 const uloNewBill = uloData.combined?.postSolarBatteryAnnualBillEnergyOnly || uloData.result.newCost.total || 0
                 const uloBillSavings = Math.max(0, uloOriginalBill - uloNewBill)
                 const uloTotalSavingsPercent = uloOriginalBill > 0 ? (uloBillSavings / uloOriginalBill) * 100 : 0
                   
                 // Get ULO rates for display
                  const uloRatePlan = getCustomUloRatePlan()
                 const uloLeftoverRate = uloData.result.leftoverEnergy.ratePerKwh
                 const uloLeftoverKwh = gridRemainingKwh
                 const uloUltraLowRate = uloRatePlan.periods.find(p => p.period === 'ultra-low')?.rate ?? 3.9
                  const uloOnPeakRate = uloRatePlan.periods.find(p => p.period === 'on-peak')?.rate || 39.1
                 
                 // Grid energy display values (battery top-up + remainder)
                 const uloAdjustedGridCharge = uloChargedBatteryKwh // Battery charged from grid at ULO rate (AI Mode)
                 const uloLowRateEnergyKwh = uloAdjustedGridCharge + uloLeftoverKwh // Total energy from grid
                 const uloLowRatePercent = annualUsageKwh > 0 ? (uloLowRateEnergyKwh / annualUsageKwh) * 100 : 0
                 const uloBatteryChargingCost = uloChargedBatteryKwh * (uloUltraLowRate / 100)
                  const uloLeftoverCost = uloLeftoverKwh * uloLeftoverRate
                  const uloTotalGridCost = uloBatteryChargingCost + uloLeftoverCost
                  const uloCorrectBlendedRate = uloLowRateEnergyKwh > 0 ? uloTotalGridCost / uloLowRateEnergyKwh : 0
                 // Use uloNewBill instead of uloTotalGridCost to ensure percentages add to 100%
                 const uloLeftoverCostPercent = uloOriginalBill > 0 ? (uloNewBill / uloOriginalBill) * 100 : 0
                  
                  // Keep the storytelling grounded by anchoring to the original peak-priced usage
                  const uloPeakPricedUsageKwh =
                    (uloData.result.usageByPeriod.onPeak ?? 0) +
                    (uloData.result.usageByPeriod.midPeak ?? 0)
                  // Translate the savings percentage into a relatable kWh figure
                  const uloSavingsKwhEquivalentRaw = (annualUsageKwh * uloTotalSavingsPercent) / 100
                  const uloSavingsKwhEquivalent = Math.min(uloPeakPricedUsageKwh, uloSavingsKwhEquivalentRaw)
                  const uloLeftoverBreakdown = clampBreakdown(
                    uloData.result.leftoverEnergy.breakdown,
                    uloLeftoverKwh,
                    ['ultraLow', 'offPeak', 'midPeak', 'onPeak']
                  )
                  
                  // Easy comparables for average bill rate before and after battery support
                  const uloOriginalEffectiveRate = annualUsageKwh > 0 ? (uloOriginalBill / annualUsageKwh) * 100 : 0
                  const uloNewEffectiveRate = annualUsageKwh > 0 ? (uloNewBill / annualUsageKwh) * 100 : 0
                   
                   return (
                     <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl border-2 border-red-300 shadow-lg p-6">
                       {/* ULO Header */}
                       <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-red-200">
                         <div className="p-2 bg-red-500 rounded-xl">
                           <Moon className="text-white" size={24} />
                         </div>
                         <div>
                           <h5 className="text-xl font-bold text-navy-600">Ultra-Low Overnight (ULO)</h5>
                           <p className="text-sm text-gray-600">Best for overnight usage</p>
                         </div>
                       </div>
                       
                       {/* ULO Metrics */}
                       <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                             <div className="text-xs font-semibold text-gray-600 mb-1">Total Consumption</div>
                             <div className="text-2xl font-bold text-gray-800">{annualUsageKwh.toLocaleString()}</div>
                             <div className="text-xs text-gray-500">kWh/year</div>
                           </div>
                           <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                             <div className="text-xs font-semibold text-gray-600 mb-1">Solar Production</div>
                             <div className="text-2xl font-bold text-green-600">{solarProductionKwh > 0 ? solarProductionKwh.toLocaleString() : '0'}</div>
                             <div className="text-xs text-gray-500">kWh/year</div>
                           </div>
                         </div>
                         
                        {/* Friendly heading reminding the reader that the next cards talk about offsets */}
                        <div className="space-y-4 bg-white/80 border border-red-100 rounded-2xl p-4">
                          {/* Plain-language heading so people notice the offset cluster */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-navy-600 uppercase tracking-wide">Offset Coverage</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-red-200 to-transparent" />
                          </div>

                         {/* FRD: Solar Direct - energy covered directly by solar */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Sun className="text-green-600" size={20} />
                                <span className="font-bold text-gray-700">Daytime covered by solar</span>
                              </div>
                              <div className="text-right">
                               <div className="text-2xl font-bold text-green-600">{solarDirectPercent.toFixed(2)}%</div>
                               <div className="text-xs text-gray-600">{solarDirectKwh.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Energy your panels cover during the day</div>
                          </div>

                         {/* Nighttime covered by battery - combines Solar→Battery + Grid top-up (ULO→Battery) */}
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Moon className="text-red-600" size={20} />
                                <span className="font-bold text-gray-700">Nighttime covered by battery</span>
                              </div>
                              <div className="text-right">
                               <div className="text-2xl font-bold text-red-600">{solarBatteryPercent.toFixed(2)}%</div>
                               <div className="text-xs text-gray-600">{solarBatteryKwh.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Stored solar used at night (excludes grid top-up in total %)</div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-gray-600 pl-7">
                             <div>Solar → Battery: <span className="font-semibold text-red-600">{solarBatteryKwh.toFixed(0)} kWh</span></div>
                             <div>Battery top-up (cheap grid): <span className="font-semibold text-red-600">{uloChargedBatteryKwh.toFixed(0)} kWh</span></div>
                             <div>Remainder (still from grid): <span className="font-semibold text-red-600">{uloActualLeftoverAfterFullBattery.toFixed(0)} kWh</span></div>
                            </div>
                          </div>

                          {/* Summary card bundling the full offset picture in one spot */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-300">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="text-green-600" size={20} />
                                <span className="font-bold text-gray-700">Total Offset by Solar + Battery</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">{uloCombinedOffsetPercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">{uloCombinedOffset.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Everything you don't need to buy from the grid</div>
                            {uloOffsetCapped && (
                              <div className="text-[11px] text-amber-600 pl-7 mt-1">
                                Capped at {offsetCapPercent.toFixed(0)}% to reflect winter limits
                                {offsetCapInfo.matchesUsage ? ' (solar production closely matches annual usage).' : '.'}
                                {offsetCapInfo.orientationBonus || offsetCapInfo.productionBonus ? (
                                  <span className="block">
                                    Bonus applied for
                                    {offsetCapInfo.orientationBonus ? ' steep south-facing roof' : ''}
                                    {offsetCapInfo.orientationBonus && offsetCapInfo.productionBonus ? ' and' : ''}
                                    {offsetCapInfo.productionBonus ? ' 10%+ extra production' : ''}.
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Friendly heading reminding the reader that the next cards cover dollars saved */}
                        <div className="space-y-4 bg-white/80 border border-red-100 rounded-2xl p-4">
                          {/* Plain-language heading so viewers see this is the savings set */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-navy-600 uppercase tracking-wide">Savings & Remaining Costs</span>
                            {/* Same friendly info button but tailored for the ULO explanation */}
                            <button
                              type="button"
                              onClick={() => setShowUloSavingsSectionInfo(true)}
                              className="inline-flex items-center justify-center rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition px-1.5 py-1"
                              aria-label="How are savings and remaining costs calculated for ULO?"
                            >
                              <Info size={14} />
                            </button>
                            <div className="h-px flex-1 bg-gradient-to-r from-red-200 to-transparent" />
                          </div>
                          <p className="text-[11px] text-gray-600 pl-1">Savings = 100% − Cost of energy bought from the grid.</p>

                          {/* Straightforward card spelling out what still comes from the grid */}
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="text-red-600" size={20} />
                                <span className="font-bold text-gray-700">Bought from the grid (cheap hours)</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-600">{uloLowRatePercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">{uloLowRateEnergyKwh.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Battery top-up {uloAdjustedGridCharge.toFixed(0)} kWh + small remainder {uloLeftoverKwh.toFixed(0)} kWh</div>
                            <div className="text-[11px] text-gray-500 pl-7">
                              Blended rate {(uloCorrectBlendedRate * 100).toFixed(2)}¢/kWh • Remainder {uloLeftoverKwh.toFixed(0)} kWh allocated:
                              {uloLeftoverBreakdown.ultraLow > 0 && ` ${uloLeftoverBreakdown.ultraLow.toFixed(0)} kWh ultra-low`}
                              {uloLeftoverBreakdown.offPeak > 0 && `, ${uloLeftoverBreakdown.offPeak.toFixed(0)} kWh off-peak`}
                              {uloLeftoverBreakdown.midPeak > 0 && `, ${uloLeftoverBreakdown.midPeak.toFixed(0)} kWh mid-peak`}
                              {uloLeftoverBreakdown.onPeak > 0 && `, ${uloLeftoverBreakdown.onPeak.toFixed(0)} kWh on-peak`}
                              {uloAdjustedGridCharge > 0 && ` • Battery top-up ${uloAdjustedGridCharge.toFixed(0)} kWh charged ultra-low @ ${uloUltraLowRate.toFixed(1)}¢/kWh`}
                            </div>
                          </div>

                          {/* Helpful card that clarifies how the remaining grid power is priced */}
                          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-300 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-gray-700">Cost of energy bought from grid</span>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">{uloLeftoverCostPercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">of total bill</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                              <Info size={14} className="text-navy-500 flex-shrink-0" />
                              <span className="text-xs text-gray-600">
                                Blended rate {(uloCorrectBlendedRate * 100).toFixed(2)}¢/kWh: battery top-up {uloAdjustedGridCharge.toFixed(0)} kWh @ {uloUltraLowRate.toFixed(1)}¢/kWh + remainder {uloLeftoverKwh.toFixed(0)} kWh (allocated to cheapest available hours) • vs on-peak {uloOnPeakRate.toFixed(2)}¢/kWh.
                              </span>
                            </div>
                          </div>

                          {/* Calm card sharing how the savings show up on the bill */}
                          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-300 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-gray-700">Total savings</span>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">{uloTotalSavingsPercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">Equivalent to {uloSavingsKwhEquivalent.toFixed(0)} kWh/year of peak-priced energy avoided</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">
                              Savings can exceed offset because remaining energy is prioritized for cheaper rate periods.
                            </div>
                          </div>
                        </div>
                       </div>
                     </div>
                   )
                 })()}
               </div>
             </div>
           )}

         </div>
         )
       })()}

      {/* Navigation */}
      <div className="flex justify-between pt-8 gap-4">
        <button
          onClick={onBack}
          className="px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all font-bold text-lg shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <ArrowRight size={20} className="rotate-180" />
          Back
        </button>
        {!manualMode && (
          <button
            onClick={handleComplete}
            disabled={!canContinue}
            className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center gap-2 ${canContinue ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-xl' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Continue to Next Step
            <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

