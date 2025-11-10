'use client'

import { useState, useEffect, useMemo } from 'react'
import { Battery, DollarSign, TrendingUp, Calendar, ArrowRight, Check, ChevronDown, Percent, Zap, Clock, Info, TrendingDown, BarChart3, Lightbulb, Home, Moon, Sun, Award, AlertTriangle, Plus, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { 
  BATTERY_SPECS, 
  BatterySpec, 
  calculateBatteryFinancials 
} from '../../config/battery-specs'
import { 
  RATE_PLANS, 
  RatePlan, 
  ULO_RATE_PLAN, 
  TOU_RATE_PLAN 
} from '../../config/rate-plans'
import { calculateSystemCost } from '../../config/pricing'
import {
  calculateSimplePeakShaving,
  calculateSimpleMultiYear,
  calculateCombinedMultiYear,
  calculateSolarBatteryCombined,
  UsageDistribution,
  DEFAULT_TOU_DISTRIBUTION,
  DEFAULT_ULO_DISTRIBUTION,
  SimplePeakShavingResult,
  computeSolarBatteryOffsetCap,
} from '../../lib/simple-peak-shaving'

interface StepBatteryPeakShavingSimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
  // Enable inline manual production editing without duplicating the UI
  manualMode?: boolean
}

// This shared shape keeps the combined savings data tidy across the TOU and ULO maps
type CombinedPlanResult = {
  annual: number
  monthly: number
  projection: any
  netCost: number
  baselineAnnualBill?: number
  postAnnualBill?: number
  solarOnlyAnnual?: number
  batteryAnnual?: number
  solarNetCost?: number
  solarRebateApplied?: number
  batteryNetCost?: number
  batteryRebateApplied?: number
  batteryGrossCost?: number
  solarProductionKwh?: number // Remember the solar production we modeled so readers can see it later
}

export function StepBatteryPeakShavingSimple({ data, onComplete, onBack, manualMode = false }: StepBatteryPeakShavingSimpleProps) {
  // Info modals for rate plans
  const [showTouInfo, setShowTouInfo] = useState(false)
  const [showUloInfo, setShowUloInfo] = useState(false)
  const [showPaybackInfo, setShowPaybackInfo] = useState(false)
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
  const annualUsageKwh = Math.max(0, Number(annualUsageInput) || 0)
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
  const [touResults, setTouResults] = useState<Map<string, {result: SimplePeakShavingResult, projection: any, combined?: CombinedPlanResult}>>(new Map())
  // This state mirrors the same idea for the ULO plan so both cards get identical treatment
  const [uloResults, setUloResults] = useState<Map<string, {result: SimplePeakShavingResult, projection: any, combined?: CombinedPlanResult}>>(new Map())
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
        offsetCapInfo.capFraction
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
          baselineAnnualBill: baselineAnnualDisplay,
          postAnnualBill: newBillAnnual,
          solarOnlyAnnual: solarScaled,
          batteryAnnual: batteryScaled,
          solarNetCost: solarNet,
          solarRebateApplied: solarRebate,
          solarProductionKwh, // Preserve the solar production that fed this run
          batteryNetCost: netCost,
          batteryRebateApplied: batteryRebate,
          batteryGrossCost: battery.price,
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
        offsetCapInfo.capFraction
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
          baselineAnnualBill: baselineAnnualDisplay,
          postAnnualBill: newBillAnnual,
          solarOnlyAnnual: solarScaled,
          batteryAnnual: batteryScaled,
          solarNetCost: solarNet,
          solarRebateApplied: solarRebate,
          solarProductionKwh, // Preserve the modeled solar production for later displays
          batteryNetCost: netCost,
          batteryRebateApplied: batteryRebate,
          batteryGrossCost: battery.price,
        } as CombinedPlanResult,
      })
    }

    setUloResults(newResults)
  }, [annualUsageInput, selectedBatteries, uloDistribution, customRates.ulo, data.estimate, systemSizeKwOverride, overrideEstimate, effectiveSolarProductionKwh, offsetCapInfo.capFraction])

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
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row mb-3 text-center">
          <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
            <Battery className="text-white" size={32} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-500">
            Battery Savings Calculator
          </h2>
        </div>
        <p className="text-base sm:text-lg text-gray-600 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Lightbulb className="text-navy-500" size={20} />
          See how much you can save with peak-shaving battery storage
        </p>
      </div>

      {/* Solar System Information */}
      {data.estimate?.system && (
        <div className="card p-5 bg-gradient-to-br from-green-50 to-white border-2 border-green-300 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Sun className="text-white" size={24} />
            </div>
            <h3 className="text-lg font-bold text-navy-500">Your Solar System</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-medium">System Size</p>
              <p className="text-xl font-bold text-green-600">{(systemSizeKwOverride || data.estimate.system.sizeKw).toFixed(1)} kW</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Solar Panels</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={solarPanels}
                  min={0}
                  onChange={(e) => setSolarPanels(Math.max(0, Number(e.target.value)))}
                  className="w-24 px-2 py-1 border-2 border-green-300 rounded-md text-green-700 font-bold focus:ring-2 focus:ring-green-400 focus:border-green-400"
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Annual Production</p>
              {manualMode ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={manualProductionInput}
                    onChange={(e) => setManualProductionInput(e.target.value)}
                    className="w-28 px-2 py-1 border-2 border-green-300 rounded-md text-green-700 font-bold focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  />
                  <span className="text-sm font-semibold text-green-700">kWh</span>
                </div>
              ) : (
                <p className="text-xl font-bold text-green-600">{Math.round((overrideEstimate?.production?.annualKwh ?? data.estimate.production.annualKwh)).toLocaleString()} kWh</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Solar Rebate Available</p>
              <p className="text-xl font-bold text-green-600">
                ${Math.min((systemSizeKwOverride || data.estimate.system.sizeKw) * 1000, 5000).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Note about override */}
      {data.estimate?.system && (
        <div className="text-xs text-gray-600 px-1">
          Adjust the panel count to model a different array size for incentives and combined payback. Solar production remains from the current estimate in this step.
        </div>
      )}

      {/* Estimated Monthly Bill */}
      <div className="card p-5 bg-gradient-to-br from-navy-50 to-gray-50 border-2 border-navy-200 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-500 rounded-lg">
              <DollarSign className="text-white" size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Current Estimated Bill</p>
              <p className="text-2xl font-bold text-navy-500">
                ${Math.round(displayedMonthlyBill).toLocaleString()}/month
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 font-medium">Annual Usage</p>
            <p className="text-lg font-semibold text-gray-700 flex items-center gap-1">
              <Zap size={16} className="text-red-500" />
              {annualUsageKwh.toLocaleString()} kWh
            </p>
          </div>
        </div>
        {/* Friendly heads-up so folks know this bill includes every utility line item */}
        <div className="mt-3 text-xs text-gray-500 italic">
          This monthly estimate includes delivery, regulatory fees, and HST as well as energy usage, so it will be higher than the energy-only savings tables below.
        </div>
      </div>

      {/* Info Modals */}
      
      <Modal
        isOpen={showTouInfo}
        onClose={() => setShowTouInfo(false)}
        title="How We Calculate TOU Peak Shaving"
        message="This section mirrors the Time-of-Use savings card inside the battery comparison area so you can trace every assumption behind the annual results."
        variant="info"
        cancelText="Close"
      >
        {(() => {
          const touEntry = touResults.get('combined')
          if (!touEntry) {
            return (
              <div className="text-sm text-gray-700">
                We will show the full TOU breakdown as soon as the calculation finishes.
              </div>
            )
          }
          const formatMoney = (value: number) => `$${value.toFixed(2)}`
          const formatCents = (value: number) => `${value.toFixed(1)}¢/kWh`
          const weekdayRates = Array.from(new Map(TOU_RATE_PLAN.periods.map(period => [period.period, period.rate])))
          const weekendRate = TOU_RATE_PLAN.weekendRate ?? null
          const batteryPack = selectedBatteries
            .map(id => BATTERY_SPECS.find(spec => spec.id === id))
            .filter((spec): spec is BatterySpec => Boolean(spec))
          const totalUsableKwh = batteryPack.reduce((sum, spec) => sum + spec.usableKwh, 0)
          const totalInverterKw = batteryPack.reduce((sum, spec) => sum + (spec.inverterKw || 0), 0)
          const solarProductionKwh = touEntry.combined?.solarProductionKwh ?? (effectiveSolarProductionKwh || 0) // Pull the solar production that fed the combined run
          const before = touEntry.result.originalCost
          const after = touEntry.result.newCost
          const offsets = touEntry.result.batteryOffsets
          const leftover = touEntry.result.leftoverEnergy
          const cappedAnnual = touEntry.combined?.annual ?? touEntry.result.annualSavings
          const solarAnnual = touEntry.combined?.solarOnlyAnnual ?? 0
          const batteryAnnual = touEntry.combined?.batteryAnnual ?? 0
          const batteryOnlyAnnual = touResults.get('battery-only')?.result?.annualSavings ?? 0
          const shiftedKwh = offsets.offPeak + offsets.midPeak + offsets.onPeak + (offsets.ultraLow || 0)

          return (
            <div className="space-y-5 text-sm text-gray-700">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-blue-800 uppercase">Key givens</div>
                <ul className="mt-2 list-disc ml-5 space-y-1 text-xs text-gray-600">
                  {weekdayRates.map(([period, rate]) => (
                    <li key={period}>
                      {period === 'off-peak'
                        ? 'Weekday off-peak'
                        : period === 'mid-peak'
                        ? 'Weekday mid-peak'
                        : 'Weekday on-peak'} billed at <span className="font-semibold">{formatCents(rate)}</span>.
                    </li>
                  ))}
                  {weekendRate && (
                    <li>
                      Weekends and Ontario holidays priced at <span className="font-semibold">{formatCents(weekendRate)}</span> for every hour.
                    </li>
                  )}
                  <li>
                    Annual usage modeled: <span className="font-semibold">{annualUsageKwh.toLocaleString()} kWh</span>.
                  </li>
                  <li>
                    Battery stack: <span className="font-semibold">{batteryPack.map(spec => `${spec.brand} ${spec.model}`).join(' + ')}</span> delivering{' '}
                    <span className="font-semibold">{totalUsableKwh.toFixed(1)} kWh</span> usable storage and{' '}
                    <span className="font-semibold">{totalInverterKw.toFixed(1)} kW</span> peak discharge.
                  </li>
                  <li>
                    Solar production modeled: <span className="font-semibold">{solarProductionKwh.toLocaleString()} kWh</span>.
                  </li>
                  <li>Solar production offsets daytime loads first, then the battery discharges during the morning and evening on-peak windows.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <div>
                  <div className="font-semibold text-navy-600 mb-1">Bill without peak shaving</div>
                  <div>Off-Peak: <span className="font-semibold">{formatMoney(before.offPeak)}</span></div>
                  <div>Mid-Peak: <span className="font-semibold">{formatMoney(before.midPeak)}</span></div>
                  <div>On-Peak: <span className="font-semibold">{formatMoney(before.onPeak)}</span></div>
                  <div className="mt-2 text-red-600 font-semibold">Annual total: {formatMoney(before.total)}</div>
                </div>
                <div>
                  <div className="font-semibold text-navy-600 mb-1">Bill with battery help</div>
                  <div>Off-Peak: <span className="font-semibold">{formatMoney(after.offPeak)}</span></div>
                  <div>Mid-Peak: <span className="font-semibold">{formatMoney(after.midPeak)}</span></div>
                  <div>On-Peak: <span className="font-semibold">{formatMoney(after.onPeak)}</span></div>
                  <div className="mt-2 text-green-600 font-semibold">Annual total: {formatMoney(after.total)}</div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-navy-600">How the comparison card is built</div>
                <div>Combined annual savings after the winter safeguard: <span className="font-semibold text-navy-600">{formatMoney(cappedAnnual)}</span>.</div>
                <div>Solar slice inside the cap: <span className="font-semibold text-green-600">{formatMoney(solarAnnual)}</span>.</div>
                <div>
                  Battery slice inside the cap (the portion of the savings card credited to the battery after the winter safeguard is applied):{' '}
                  <span className="font-semibold text-blue-600">{formatMoney(Math.max(batteryAnnual, 0))}</span>.
                </div>
                <div>Battery-only result without the cap: <span className="font-semibold text-blue-600">{formatMoney(batteryOnlyAnnual)}</span>.</div>
                <div>
                  Energy shifted out of expensive hours: <span className="font-semibold">{shiftedKwh.toFixed(0)} kWh</span>. Remaining grid draw: <span className="font-semibold">{leftover.totalKwh.toFixed(0)} kWh</span> at{' '}
                  <span className="font-semibold">{formatCents(leftover.ratePerKwh * 100)}</span>, costing <span className="font-semibold">{formatMoney(leftover.costAtOffPeak)}</span>.
                </div>
              </div>

              <img
                src="/TOU.JPG"
                alt="Time-of-Use (TOU) illustration"
                className="w-full h-auto rounded-lg border-2 border-gray-200"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  const fallbacks = ['/TOU.jpg', '/TOU.jpeg', '/TOU.png', '/TOU.HPH']
                  const next = fallbacks.find((path) => path !== el.src.replace(window.location.origin, ''))
                  if (next) el.src = next
                }}
              />
            </div>
          )
        })()}
      </Modal>

      {/* 25-Year Profit Info Modal */}
      <Modal
        isOpen={showProfitInfo}
        onClose={() => setShowProfitInfo(false)}
        title="How 25‑Year Profit Is Calculated"
        message="We extend the same Year‑1 savings curve out to 25 years, then subtract the combined net cost to show the long-term outcome." 
        variant="info"
        cancelText="Close"
      >
        {(() => {
          // This helper keeps currency output friendly for folks reading the modal
          const formatMoney = (value: number) => `$${Math.round(value).toLocaleString()}`

          // Pull the same combined results used on the main cards so the narrative stays consistent
          const tou = touResults.get('combined')
          const ulo = uloResults.get('combined')

          // Extract long-term projection numbers with safe fallbacks
          const touProjection = tou?.combined?.projection
          const uloProjection = ulo?.combined?.projection
          const touTotalSavings = touProjection?.totalSavings25Year ?? 0
          const uloTotalSavings = uloProjection?.totalSavings25Year ?? 0
          const touProfit = touProjection?.netProfit25Year ?? 0
          const uloProfit = uloProjection?.netProfit25Year ?? 0
          const assumptions = touProjection?.assumptions || uloProjection?.assumptions

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">What the model assumes</span>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Year‑1 savings start with the same capped amount shown on the annual card.</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Long-term projection gently increases utility prices while trimming solar+battery performance to stay realistic.</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Total 25‑year savings add up that adjusted curve; profit simply subtracts the combined net cost.</div>
              </div>

              {/* TOU Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">Time-of-Use (TOU)</div>
                <div className="text-xs text-gray-700">Net cost: <span className="font-semibold">{formatMoney(tou?.combined?.netCost ?? 0)}</span></div>
                <div className="text-xs text-gray-700">25‑Year total savings: <span className="font-semibold text-navy-600">{formatMoney(touTotalSavings)}</span></div>
                <div className="text-xs text-gray-700">25‑Year profit: <span className="font-semibold text-green-600">{formatMoney(touProfit)}</span></div>
                <div className="text-[11px] text-gray-600 mt-1">Savings reflect the winter safeguard and the same solar+battery mix from the main view.</div>
              </div>

              {/* ULO Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">Ultra-Low Overnight (ULO)</div>
                <div className="text-xs text-gray-700">Net cost: <span className="font-semibold">{formatMoney(ulo?.combined?.netCost ?? 0)}</span></div>
                <div className="text-xs text-gray-700">25‑Year total savings: <span className="font-semibold text-navy-600">{formatMoney(uloTotalSavings)}</span></div>
                <div className="text-xs text-gray-700">25‑Year profit: <span className="font-semibold text-green-600">{formatMoney(uloProfit)}</span></div>
                <div className="text-[11px] text-gray-600 mt-1">Night charging plus the winter safeguard drive the difference versus TOU.</div>
              </div>

              <div className="text-xs text-gray-600 italic mt-2">
                Long-term profit is one more way to see the combined effect of capped savings, rate trends, and incentives.</div>
            </div>
          )
        })()}
      </Modal>

      <Modal
        isOpen={showUloInfo}
        onClose={() => setShowUloInfo(false)}
        title="How We Calculate ULO Peak Shaving"
        message="These numbers match the Ultra-Low Overnight savings card so you can double-check the midnight charging model and the winter safeguard split."
        variant="info"
        cancelText="Close"
      >
        {(() => {
          const uloEntry = uloResults.get('combined')
          if (!uloEntry) {
            return (
              <div className="text-sm text-gray-700">
                We will show the ULO breakdown as soon as the calculation finishes.
              </div>
            )
          }
          const formatMoney = (value: number) => `$${value.toFixed(2)}`
          const formatCents = (value: number) => `${value.toFixed(1)}¢/kWh`
          const weekdayRates = Array.from(new Map(ULO_RATE_PLAN.periods.map(period => [period.period, period.rate])))
          const weekendRate = ULO_RATE_PLAN.weekendRate ?? null
          const batteryPack = selectedBatteries
            .map(id => BATTERY_SPECS.find(spec => spec.id === id))
            .filter((spec): spec is BatterySpec => Boolean(spec))
          const totalUsableKwh = batteryPack.reduce((sum, spec) => sum + spec.usableKwh, 0)
          const totalInverterKw = batteryPack.reduce((sum, spec) => sum + (spec.inverterKw || 0), 0)
          const solarProductionKwh = uloEntry.combined?.solarProductionKwh ?? (effectiveSolarProductionKwh || 0) // Capture the solar production that powered the combined run
          const before = uloEntry.result.originalCost
          const after = uloEntry.result.newCost
          const offsets = uloEntry.result.batteryOffsets
          const leftover = uloEntry.result.leftoverEnergy
          const cappedAnnual = uloEntry.combined?.annual ?? uloEntry.result.annualSavings
          const solarAnnual = uloEntry.combined?.solarOnlyAnnual ?? 0
          const batteryAnnual = uloEntry.combined?.batteryAnnual ?? 0
          const batteryOnlyAnnual = uloResults.get('battery-only')?.result?.annualSavings ?? 0
          const shiftedKwh = (offsets.ultraLow || 0) + offsets.midPeak + offsets.onPeak + offsets.offPeak

          return (
            <div className="space-y-5 text-sm text-gray-700">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-blue-800 uppercase">Key givens</div>
                <ul className="mt-2 list-disc ml-5 space-y-1 text-xs text-gray-600">
                  {weekdayRates.map(([period, rate]) => (
                    <li key={period}>
                      {period === 'ultra-low'
                        ? 'Weekday 11PM–7AM ultra-low'
                        : period === 'mid-peak'
                        ? 'Weekday mid-peak'
                        : 'Weekday on-peak'} priced at <span className="font-semibold">{formatCents(rate)}</span>.
                    </li>
                  ))}
                  {weekendRate && (
                    <li>
                      Weekends and holidays priced at <span className="font-semibold">{formatCents(weekendRate)}</span> all day.
                    </li>
                  )}
                  <li>
                    Annual usage modeled: <span className="font-semibold">{annualUsageKwh.toLocaleString()} kWh</span>.
                  </li>
                  <li>
                    Battery stack: <span className="font-semibold">{batteryPack.map(spec => `${spec.brand} ${spec.model}`).join(' + ')}</span> holding{' '}
                    <span className="font-semibold">{totalUsableKwh.toFixed(1)} kWh</span> usable capacity with{' '}
                    <span className="font-semibold">{totalInverterKw.toFixed(1)} kW</span> peak discharge.
                  </li>
                  <li>
                    Solar production modeled: <span className="font-semibold">{solarProductionKwh.toLocaleString()} kWh</span>.
                  </li>
                  <li>The battery charges during the 3.9¢ ultra-low window, then discharges across the 4–9 PM on-peak period to avoid the 39.1¢ rate.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <div>
                  <div className="font-semibold text-navy-600 mb-1">Bill without ultra-low shifting</div>
                  <div>Ultra-Low: <span className="font-semibold">{formatMoney(before.ultraLow || 0)}</span></div>
                  <div>Mid-Peak: <span className="font-semibold">{formatMoney(before.midPeak)}</span></div>
                  <div>On-Peak: <span className="font-semibold">{formatMoney(before.onPeak)}</span></div>
                  <div className="mt-2 text-red-600 font-semibold">Annual total: {formatMoney(before.total)}</div>
                </div>
                <div>
                  <div className="font-semibold text-navy-600 mb-1">Bill with battery shifting</div>
                  <div>Ultra-Low (charging cost): <span className="font-semibold">{formatMoney(after.ultraLow || 0)}</span></div>
                  <div>Mid-Peak: <span className="font-semibold">{formatMoney(after.midPeak)}</span></div>
                  <div>On-Peak: <span className="font-semibold">{formatMoney(after.onPeak)}</span></div>
                  <div className="mt-2 text-green-600 font-semibold">Annual total: {formatMoney(after.total)}</div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-navy-600">How the comparison card is built</div>
                <div>Combined annual savings after the winter safeguard: <span className="font-semibold text-navy-600">{formatMoney(cappedAnnual)}</span>.</div>
                <div>Solar slice inside the cap: <span className="font-semibold text-green-600">{formatMoney(solarAnnual)}</span>.</div>
                <div>
                  Battery slice inside the cap (the portion of the savings card credited to the battery after the winter safeguard is applied):{' '}
                  <span className="font-semibold text-blue-600">{formatMoney(Math.max(batteryAnnual, 0))}</span>.
                </div>
                <div>Battery-only result without the cap: <span className="font-semibold text-blue-600">{formatMoney(batteryOnlyAnnual)}</span>.</div>
                <div>
                  Energy shifted out of expensive hours: <span className="font-semibold">{shiftedKwh.toFixed(0)} kWh</span>. Remaining grid draw at the safeguard rate: <span className="font-semibold">{leftover.totalKwh.toFixed(0)} kWh</span> costing{' '}
                  <span className="font-semibold">{formatMoney(leftover.costAtOffPeak)}</span> at <span className="font-semibold">{formatCents(leftover.ratePerKwh * 100)}</span>.
                </div>
              </div>

              <img
                src="/ULO.JPG"
                alt="Ultra-Low Overnight (ULO) illustration"
                className="w-full h-auto rounded-lg border-2 border-gray-200"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  const fallbacks = ['/ULO.jpg', '/ULO.jpeg', '/ULO.png']
                  const next = fallbacks.find((path) => path !== el.src.replace(window.location.origin, ''))
                  if (next) el.src = next
                }}
              />
            </div>
          )
        })()}
      </Modal>

      {/* Payback Info Modal */}
      <Modal
        isOpen={showPaybackInfo}
        onClose={() => setShowPaybackInfo(false)}
        title="How Full System Payback Is Calculated"
        message="We combine the capped Year‑1 savings with a gentle long-term curve to show when the system fully repays its upfront cost." 
        variant="info"
        cancelText="Close"
      >
        {(() => {
          const tou = touResults.get('combined')
          const ulo = uloResults.get('combined')

          const formatMoney = (value: number | undefined) => `$${Math.round(value || 0).toLocaleString()}`

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">What we include</span>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Net cost: solar + battery after incentives — the investment the system must earn back.</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Year‑1 savings: the capped annual savings, shown with the same solar/battery split as the summary card.</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Long-term curve: savings rise gently with utility rates and taper slightly each year to reflect real-world performance.</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Payback moment: the first year when cumulative savings exceed the combined net cost (or “N/A” if that point never arrives).</div>
              </div>

              {/* TOU Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">Time-of-Use (TOU)</div>
                <div className="text-xs text-gray-700">Net cost: <span className="font-semibold">{formatMoney(tou?.combined?.netCost)}</span></div>
                <div className="text-xs text-gray-600 ml-1 mt-1">• Solar net (after rebate): {formatMoney(tou?.combined?.solarNetCost)}</div>
                {tou?.combined?.solarRebateApplied ? (
                  <div className="text-[11px] text-gray-500 ml-3">Solar rebate applied: {formatMoney(tou.combined.solarRebateApplied)}</div>
                ) : null}
                <div className="text-xs text-gray-600 ml-1">• Battery net (after rebate): {formatMoney(tou?.combined?.batteryNetCost)}</div>
                {tou?.combined?.batteryRebateApplied ? (
                  <div className="text-[11px] text-gray-500 ml-3">
                    Battery rebate applied: {formatMoney(tou.combined.batteryRebateApplied)}
                    {tou?.combined?.batteryGrossCost ? (
                      <>
                        {' '}(from {formatMoney(tou.combined.batteryGrossCost)})
                      </>
                    ) : null}
                  </div>
                ) : tou?.combined?.batteryGrossCost ? (
                  <div className="text-[11px] text-gray-500 ml-3">Battery price: {formatMoney(tou.combined.batteryGrossCost)}</div>
                ) : null}
                <div className="text-xs text-gray-700">Year 1 savings: <span className="font-semibold">{formatMoney(tou?.combined?.annual)}</span></div>
                <div className="text-xs text-gray-700">Payback: <span className="font-bold text-navy-600">{(() => {
                  const years = tou?.combined?.projection?.paybackYears
                  if (years == null || years === Number.POSITIVE_INFINITY) return 'N/A'
                  return `${years.toFixed(1)} years`
                })()}</span></div>
                <div className="text-[11px] text-gray-600 mt-1">Savings glide gently over time while rates rise, producing a realistic payback slope.</div>
              </div>

              {/* ULO Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">Ultra-Low Overnight (ULO)</div>
                <div className="text-xs text-gray-700">Net cost: <span className="font-semibold">{formatMoney(ulo?.combined?.netCost)}</span></div>
                <div className="text-xs text-gray-600 ml-1 mt-1">• Solar net (after rebate): {formatMoney(ulo?.combined?.solarNetCost)}</div>
                {ulo?.combined?.solarRebateApplied ? (
                  <div className="text-[11px] text-gray-500 ml-3">Solar rebate applied: {formatMoney(ulo.combined.solarRebateApplied)}</div>
                ) : null}
                <div className="text-xs text-gray-600 ml-1">• Battery net (after rebate): {formatMoney(ulo?.combined?.batteryNetCost)}</div>
                {ulo?.combined?.batteryRebateApplied ? (
                  <div className="text-[11px] text-gray-500 ml-3">
                    Battery rebate applied: {formatMoney(ulo.combined.batteryRebateApplied)}
                    {ulo?.combined?.batteryGrossCost ? (
                      <>
                        {' '}(from {formatMoney(ulo.combined.batteryGrossCost)})
                      </>
                    ) : null}
                  </div>
                ) : ulo?.combined?.batteryGrossCost ? (
                  <div className="text-[11px] text-gray-500 ml-3">Battery price: {formatMoney(ulo.combined.batteryGrossCost)}</div>
                ) : null}
                <div className="text-xs text-gray-700">Year 1 savings: <span className="font-semibold">{formatMoney(ulo?.combined?.annual)}</span></div>
                <div className="text-xs text-gray-700">Payback: <span className="font-bold text-navy-600">{(() => {
                  const years = ulo?.combined?.projection?.paybackYears
                  if (years == null || years === Number.POSITIVE_INFINITY) return 'N/A'
                  return `${years.toFixed(1)} years`
                })()}</span></div>
                <div className="text-[11px] text-gray-600 mt-1">Night charging and the same winter safeguard are both included, which is why ULO often pays back sooner.</div>
              </div>

              <ul className="list-disc ml-6 text-xs text-gray-600">
                <li>If the net cost is ≤ 0, payback is 0 years.</li>
                <li>If capped savings never exceed the cost, payback shows as N/A so you know the system never breaks even under these assumptions.</li>
              </ul>
            </div>
          )
        })()}
      </Modal>

      {/* TOU savings section explainer keeps the context handy for that card stack */}
      <Modal
        isOpen={showTouSavingsSectionInfo}
        onClose={() => setShowTouSavingsSectionInfo(false)}
        title="TOU Savings & Remaining Costs"
        message="Here is how each number inside the Time-of-Use savings panel is built."
        variant="info"
        cancelText="Got it"
      >
        {(() => {
          // Grab the combined TOU record so the modal mirrors the visible cards
          const tou = touResults.get('combined')
          if (!tou) {
            // Safety fallback in case data has not loaded yet
            return <div className="text-sm text-gray-700">We will show the full breakdown once the simulation finishes running.</div>
          }

          // Keep helper formatters tiny and friendly for readers
          const formatMoney = (value: number) => `$${value.toFixed(2)}`
          const formatKwh = (value: number) => `${value.toFixed(0)} kWh`

          // Pull the before/after cost tables so we can reference each row plainly
          const before = tou.result.originalCost
          const after = tou.result.newCost
          const offsets = tou.result.batteryOffsets
          const leftover = tou.result.leftoverEnergy

          // Calculate a quick view of how many kWh the battery moved across all periods
          const shiftedKwh = offsets.offPeak + offsets.midPeak + offsets.onPeak + (offsets.ultraLow || 0)

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">What the rows compare</span>
                <ul className="mt-2 list-disc ml-5 text-xs text-gray-600 space-y-1">
                  <li>Before peak shaving totals the bill if the battery never helped.</li>
                  <li>After peak shaving shows the same usage once the battery discharges into peak windows.</li>
                  <li>The Total line is simply the sum of Off-, Mid-, and On-Peak rows on each side.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div>
                  <div className="text-xs font-semibold text-navy-600 mb-1">Bill without battery</div>
                  <div className="text-xs text-gray-600">Off-Peak: <span className="font-semibold">{formatMoney(before.offPeak)}</span></div>
                  <div className="text-xs text-gray-600">Mid-Peak: <span className="font-semibold">{formatMoney(before.midPeak)}</span></div>
                  <div className="text-xs text-gray-600">On-Peak: <span className="font-semibold">{formatMoney(before.onPeak)}</span></div>
                  <div className="text-xs font-semibold text-red-600 mt-2">Total: {formatMoney(before.total)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-navy-600 mb-1">Bill with battery help</div>
                  <div className="text-xs text-gray-600">Off-Peak: <span className="font-semibold">{formatMoney(after.offPeak)}</span></div>
                  <div className="text-xs text-gray-600">Mid-Peak: <span className="font-semibold">{formatMoney(after.midPeak)}</span></div>
                  <div className="text-xs text-gray-600">On-Peak: <span className="font-semibold">{formatMoney(after.onPeak)}</span></div>
                  <div className="text-xs font-semibold text-green-600 mt-2">Total: {formatMoney(after.total)}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-navy-600">How the battery is working</div>
                <div>• Energy shifted out of expensive hours: <span className="font-semibold">{formatKwh(shiftedKwh)}</span>.</div>
                <div>• Still bought from the grid: <span className="font-semibold">{formatKwh(leftover.totalKwh)}</span> at <span className="font-semibold">{(leftover.ratePerKwh * 100).toFixed(2)}¢/kWh</span>.</div>
                <div>• Cost of that remainder: <span className="font-semibold">{formatMoney(leftover.costAtOffPeak)}</span> ({leftover.costPercent.toFixed(2)}% of the original bill).</div>
              </div>

              <div className="text-xs text-gray-500 italic">Savings in this section equal {formatMoney(before.total - after.total)} per year — exactly the difference between the two totals above.</div>

              {(() => {
                const combinedBatteryPiece = Math.max(0, tou.combined?.batteryAnnual ?? 0)
                if (combinedBatteryPiece > 1) return null
                return (
                  <div className="text-[11px] text-gray-500 italic">
                    Battery slice showing $0? That simply means solar production already maxed out the winter cap (92%), so the combined view has no headroom left to display the battery’s share—even though the battery plan card still shows its standalone savings.
                  </div>
                )
              })()}
            </div>
          )
        })()}
      </Modal>

      {/* ULO savings section explainer mirrors the same idea but calls out the overnight top-ups */}
      <Modal
        isOpen={showUloSavingsSectionInfo}
        onClose={() => setShowUloSavingsSectionInfo(false)}
        title="ULO Savings & Remaining Costs"
        message="This is the detailed view of the Ultra-Low Overnight savings math."
        variant="info"
        cancelText="Understood"
      >
        {(() => {
          // Pick up the combined Ultra-Low result so values line up with the visible panel
          const ulo = uloResults.get('combined')
          if (!ulo) {
            // Friendly fallback while calculations load
            return <div className="text-sm text-gray-700">Hang tight—once the simulation finishes we will show the step-by-step costs.</div>
          }

          // Use soft helpers for formatting money and energy
          const formatMoney = (value: number) => `$${value.toFixed(2)}`
          const formatKwh = (value: number) => `${value.toFixed(0)} kWh`

          // Grab before/after tables and leftover summary for easy reference
          const before = ulo.result.originalCost
          const after = ulo.result.newCost
          const offsets = ulo.result.batteryOffsets
          const leftover = ulo.result.leftoverEnergy

          // Total stored energy covers ultra-low, mid-peak, and on-peak buckets depending on what the battery could move
          const shiftedKwh = offsets.offPeak + offsets.midPeak + offsets.onPeak + (offsets.ultraLow || 0)

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Reading the table</span>
                <ul className="mt-2 list-disc ml-5 text-xs text-gray-600 space-y-1">
                  <li>Ultra-Low rows reflect overnight charging — these barely change because the rate is already cheap.</li>
                  <li>Mid- and On-Peak rows shrink because the battery discharges during those pricey windows.</li>
                  <li>Totals are simply the column sums; the gap between them is the savings you see in the green banner.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div>
                  <div className="text-xs font-semibold text-navy-600 mb-1">Before the battery helps</div>
                  <div className="text-xs text-gray-600">Ultra-Low: <span className="font-semibold">{formatMoney(before.ultraLow ?? 0)}</span></div>
                  <div className="text-xs text-gray-600">Weekend: <span className="font-semibold">{formatMoney(before.offPeak)}</span></div>
                  <div className="text-xs text-gray-600">Mid-Peak: <span className="font-semibold">{formatMoney(before.midPeak)}</span></div>
                  <div className="text-xs text-gray-600">On-Peak: <span className="font-semibold">{formatMoney(before.onPeak)}</span></div>
                  <div className="text-xs font-semibold text-red-600 mt-2">Total: {formatMoney(before.total)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-navy-600 mb-1">After the battery shifts usage</div>
                  <div className="text-xs text-gray-600">Ultra-Low: <span className="font-semibold">{formatMoney(after.ultraLow ?? 0)}</span></div>
                  <div className="text-xs text-gray-600">Weekend: <span className="font-semibold">{formatMoney(after.offPeak)}</span></div>
                  <div className="text-xs text-gray-600">Mid-Peak: <span className="font-semibold">{formatMoney(after.midPeak)}</span></div>
                  <div className="text-xs text-gray-600">On-Peak: <span className="font-semibold">{formatMoney(after.onPeak)}</span></div>
                  <div className="text-xs font-semibold text-green-600 mt-2">Total: {formatMoney(after.total)}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-navy-600">Battery action in plain numbers</div>
                <div>• Energy shifted out of expensive periods: <span className="font-semibold">{formatKwh(shiftedKwh)}</span>.</div>
                <div>• Remaining grid energy: <span className="font-semibold">{formatKwh(leftover.totalKwh)}</span>, now billed at <span className="font-semibold">{(leftover.ratePerKwh * 100).toFixed(2)}¢/kWh</span>.</div>
                <div>• Cost of that remainder: <span className="font-semibold">{formatMoney(leftover.costAtOffPeak)}</span> ({leftover.costPercent.toFixed(2)}% of the original bill).</div>
              </div>

              <div className="text-xs text-gray-500 italic">That is why the savings banner shows {formatMoney(before.total - after.total)} per year — it is the exact gap between the two totals above.</div>

              {(() => {
                const combinedBatteryPiece = Math.max(0, ulo.combined?.batteryAnnual ?? 0)
                if (combinedBatteryPiece > 1) return null
                return (
                  <div className="text-[11px] text-gray-500 italic">
                    If the battery column reads $0, solar alone already pushed savings to the winter cap, so the combined split hides the incremental battery portion even though the standalone battery card still shows its impact.
                  </div>
                )
              })()}
            </div>
          )
        })()}
      </Modal>

      {/* Savings & 25-Year Profit Info Modal */}
      <Modal
        isOpen={showSavingsInfo}
        onClose={() => setShowSavingsInfo(false)}
        title="How Annual Savings Are Calculated"
        message="We compare today’s bill with the projected bill after solar plus battery to share a realistic Year‑1 savings estimate."
        variant="info"
        cancelText="Close"
      >
        {(() => {
          // Helper to keep formatting tidy and human-friendly
          const formatMoney = (value: number) => `$${Math.round(value).toLocaleString()}`

          // Pull combined plan snapshots so we can reference the exact values shown on the summary tiles
          const tou = touResults.get('combined')
          const ulo = uloResults.get('combined')

          // Baseline numbers come from the same "Current Estimated Bill" card
          const baselineMonthly = displayedMonthlyBill
          const baselineAnnual = baselineMonthly * 12

          // Safely read the annual savings straight from the combined maps
          const touAnnualSavings = Math.max(0, tou?.combined?.annual ?? 0)
          const uloAnnualSavings = Math.max(0, ulo?.combined?.annual ?? 0)

          // Break the combined savings into solar and battery pieces using the same scaled values we show on the card
          const touSolarPiece = tou?.combined?.solarOnlyAnnual ?? 0
          const touBatteryPiece = tou?.combined?.batteryAnnual ?? 0
          const uloSolarPiece = ulo?.combined?.solarOnlyAnnual ?? 0
          const uloBatteryPiece = ulo?.combined?.batteryAnnual ?? 0

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">What the numbers mean</span>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Current bill (baseline): {formatMoney(baselineMonthly)}/month — the starting point for every calculation.</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Projected bill (after upgrades): same usage, but with solar generation and smart battery shifting applied.</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Annual savings = Baseline bill × 12 − Projected bill × 12, limited by a winter safeguard so estimates stay sensible.</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Monthly savings = Annual savings ÷ 12 — an easy way to compare against your current bill.</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">• Solar vs. Battery split mirrors the main card so you can explain which component delivers the benefit.</div>
              </div>

              {/* TOU Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">Time-of-Use (TOU)</div>
                <div className="text-xs text-gray-700">
                  Annual savings: <span className="font-semibold text-navy-600">{formatMoney(touAnnualSavings)}</span> = {formatMoney(touSolarPiece)} (Solar) + {formatMoney(touBatteryPiece)} (Battery)
                </div>
                <div className="text-xs text-gray-700">
                  Monthly savings: <span className="font-semibold text-navy-600">{formatMoney(touAnnualSavings / 12)}</span>
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  These match the TOU card after applying the winter safeguard. The split simply reflects the capped total.
                </div>
              {touBatteryPiece < 1 && (
                <div className="text-[11px] text-gray-500 italic mt-1">
                  Battery showing $0 here? Solar savings already reached the winter cap, so the combined split has no extra room to display the battery slice—even though the battery-only plan still reports its standalone benefit.
                </div>
              )}
              </div>

              {/* ULO Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">Ultra-Low Overnight (ULO)</div>
                <div className="text-xs text-gray-700">
                  Annual savings: <span className="font-semibold text-navy-600">{formatMoney(uloAnnualSavings)}</span> = {formatMoney(uloSolarPiece)} (Solar) + {formatMoney(uloBatteryPiece)} (Battery)
                </div>
                <div className="text-xs text-gray-700">
                  Monthly savings: <span className="font-semibold text-navy-600">{formatMoney(uloAnnualSavings / 12)}</span>
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  ULO savings reflect cheaper overnight charging, lower daytime grid costs, and the same winter safeguard.
                </div>
              {uloBatteryPiece < 1 && (
                <div className="text-[11px] text-gray-500 italic mt-1">
                  Battery column resting at $0? Solar alone maxed out the winter cap, so the combined split hides the incremental battery portion even though the battery plan card still shows its own savings.
                </div>
              )}
              </div>

              <div className="text-xs text-gray-600 italic mt-2">
                <span className="font-semibold">Why the plans differ:</span> Each rate plan has unique peak prices. The battery fills up when power is cheapest and discharges when it is most expensive, so the savings depend on the plan you pick.
              </div>
            </div>
          )
        })()}
      </Modal>

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
              value={annualUsageInput}
              onChange={(e) => setAnnualUsageInput(e.target.value)}
              className="w-full px-4 py-4 pr-16 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold text-navy-600 shadow-sm transition-all"
              min="0"
              step="100"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              kWh
            </div>
          </div>
        </div>

         {/* Rate Plan Info */}
         <div>
           <label className="flex items-center gap-2 text-sm font-semibold text-navy-600 mb-3">
             <BarChart3 className="text-red-500" size={18} />
             Compare Savings by Rate Plan
           </label>
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
                     <div className="w-32 text-xs font-semibold text-navy-600">Ultra-Low:</div>
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
                     <div className="w-32 text-xs font-semibold text-navy-600">Mid-Peak:</div>
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
                     <div className="w-32 text-xs font-semibold text-navy-600">On-Peak:</div>
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
                     <div className="w-32 text-xs font-semibold text-navy-600">Weekend:</div>
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
           
           {/* Big Numbers - Both Plans */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-red-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <DollarSign className="text-red-500" size={22} />
                  </div>
                  <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Annual Savings</div>
                </div>
                <button
                  onClick={() => setShowSavingsInfo(true)}
                  className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-700 text-xs font-semibold"
                >
                  <Info size={16} /> Info
                </button>
              </div>
               <div className="space-y-2">
                 <div>
                  <div className="text-xs text-gray-500">TOU Plan (Solar + Battery)</div>
                  <div className="text-2xl font-bold text-red-600">
                    ${Math.round((touData.combined?.annual || 0)).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    ${Math.round((touData.combined?.monthly || 0)).toLocaleString()}/month
                  </div>
                 </div>
                 <div className="border-t border-gray-200 pt-2">
                  <div className="text-xs text-gray-500">ULO Plan (Solar + Battery)</div>
                  <div className="text-2xl font-bold text-red-600">
                    ${Math.round((uloData.combined?.annual || 0)).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    ${Math.round((uloData.combined?.monthly || 0)).toLocaleString()}/month
                  </div>
                 </div>
               </div>
             </div>

             <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-navy-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-navy-100 rounded-lg">
                    <Calendar className="text-navy-500" size={22} />
                  </div>
                  <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Payback Period (Full System)</div>
                </div>
                <button
                  onClick={() => setShowPaybackInfo(true)}
                  className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-700 text-xs font-semibold"
                >
                  <Info size={16} /> Info
                </button>
              </div>
               {(() => {
                 // Use the same precomputed combined figures as the modal
                const touPaybackYears = touData.combined?.projection?.paybackYears
                const uloPaybackYears = uloData.combined?.projection?.paybackYears

                 return (
                   <div className="space-y-4">
                     <div>
                       <div className="flex items-center gap-1 mb-1">
                         <Sun size={14} className="text-navy-400" />
                         <div className="text-xs text-gray-500 font-medium">TOU Plan</div>
                       </div>
                       <div className="text-2xl font-bold text-navy-600">
                        {touPaybackYears == null || touPaybackYears === Number.POSITIVE_INFINITY
                          ? 'N/A'
                          : `${touPaybackYears.toFixed(1)} years`}
                       </div>
                     </div>
                     <div className="border-t border-gray-200 pt-3">
                       <div className="flex items-center gap-1 mb-1">
                         <Moon size={14} className="text-navy-400" />
                         <div className="text-xs text-gray-500 font-medium">ULO Plan</div>
                       </div>
                       <div className="text-2xl font-bold text-navy-600">
                        {uloPaybackYears == null || uloPaybackYears === Number.POSITIVE_INFINITY
                          ? 'N/A'
                          : `${uloPaybackYears.toFixed(1)} years`}
                       </div>
                     </div>
                   </div>
                 )
               })()}
             </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-green-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="text-green-600" size={22} />
                  </div>
                  <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">25-Year Profit</div>
                </div>
                <button
                  onClick={() => setShowProfitInfo(true)}
                  className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-700 text-xs font-semibold"
                >
                  <Info size={16} /> Info
                </button>
              </div>
               <div className="space-y-2">
                 <div>
                   <div className="text-xs text-gray-500">TOU Plan (Solar + Battery)</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${(touData.combined?.projection?.netProfit25Year ?? touData.projection.netProfit25Year).toLocaleString()}
                  </div>
                 </div>
                 <div className="border-t border-gray-200 pt-2">
                   <div className="text-xs text-gray-500">ULO Plan (Solar + Battery)</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${(uloData.combined?.projection?.netProfit25Year ?? uloData.projection.netProfit25Year).toLocaleString()}
                  </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Detailed Cost Breakdown - Side by Side */}
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
                       <span className="font-semibold">${touData.result.newCost.offPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Mid-Peak:</span>
                       <span className="font-semibold">${touData.result.newCost.midPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>On-Peak:</span>
                       <span className="font-semibold">${touData.result.newCost.onPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-green-600">
                       <span>Total:</span>
                       <span>${touData.result.newCost.total.toFixed(2)}</span>
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
                         <span className="font-semibold">${uloData.result.newCost.ultraLow?.toFixed(2)}</span>
                       </div>
                     )}
                     <div className="flex justify-between">
                       <span>Weekend:</span>
                       <span className="font-semibold">${uloData.result.newCost.offPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Mid-Peak:</span>
                       <span className="font-semibold">${uloData.result.newCost.midPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>On-Peak:</span>
                       <span className="font-semibold">${uloData.result.newCost.onPeak.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-green-600">
                       <span>Total:</span>
                       <span>${uloData.result.newCost.total.toFixed(2)}</span>
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
                  // Friendly reminder that we anchor the solar production number
                  const solarProductionKwh = effectiveSolarProductionKwh
                  
                  // Gentle explanation: aim to cover half the year with daytime panels but cap at true production
                  const daytimeTargetKwh = annualUsageKwh * 0.5
                  const solarOffsetKwh = Math.min(daytimeTargetKwh, solarProductionKwh)
                  const solarOffsetPercent = annualUsageKwh > 0 ? (solarOffsetKwh / annualUsageKwh) * 100 : 0
                  
                  // Easy-to-read total battery capacity used across periods
                  const touBatteryOffsetKwh = touData.result.batteryOffsets.onPeak + 
                                             touData.result.batteryOffsets.midPeak + 
                                             touData.result.batteryOffsets.offPeak + 
                                             (touData.result.batteryOffsets.ultraLow || 0)
                  
                  // Simple leftover solar number after daytime needs are met
                  const touSolarLeftover = Math.max(0, solarProductionKwh - solarOffsetKwh)
                  
                  // Remaining energy after panels work during the day
                  const touRemainingAfterDay = Math.max(0, annualUsageKwh - solarOffsetKwh)
                  
                  // Stored-solar-at-night calculation keeps friendly language
                  const nightTimeOffsetTou = Math.min(touRemainingAfterDay, touSolarLeftover, touBatteryOffsetKwh)
                  const nightTimeOffsetTouPercent = annualUsageKwh > 0 ? (nightTimeOffsetTou / annualUsageKwh) * 100 : 0
                  
                  // Visual number showing how much solar actually makes it into the battery
                  const touBatteryUsedBySolar = Math.min(touSolarLeftover, nightTimeOffsetTou)
                  
                  // Capacity left in the battery that the grid can top up
                  const touBatteryCapacityAfterSolar = Math.max(0, touBatteryOffsetKwh - touBatteryUsedBySolar)
                  
                  // Remaining load after daytime solar and stored solar lighten the bill
                  const touRemainingAfterSolar = Math.max(0, annualUsageKwh - solarOffsetKwh - nightTimeOffsetTou)
                  
                  // Grid top-up sized to whatever space remains in the battery and the home load
                  const touGridChargeUsed = Math.min(touBatteryCapacityAfterSolar, touRemainingAfterSolar)
                  const touTopUpPercent = annualUsageKwh > 0 ? (touGridChargeUsed / annualUsageKwh) * 100 : 0
                  
                  // Final sliver of usage not covered by solar or battery support
                  const touActualLeftoverAfterFullBattery = Math.max(0, annualUsageKwh - (solarOffsetKwh + nightTimeOffsetTou + touGridChargeUsed))
                  const touActualLeftoverPercent = annualUsageKwh > 0 ? (touActualLeftoverAfterFullBattery / annualUsageKwh) * 100 : 0
                  const touRemainderPercent = touActualLeftoverPercent
                   
                  // Combined offset number before any realistic cap is applied
                  const touCombinedOffsetRaw = solarOffsetKwh + nightTimeOffsetTou
                  const touCombinedOffsetMaxKwh = Math.min(touCombinedOffsetRaw, annualUsageKwh)
                  const touCombinedOffsetPercentRaw = annualUsageKwh > 0 ? (touCombinedOffsetMaxKwh / annualUsageKwh) * 100 : 0
                  const touCombinedOffsetPercent = Math.min(touCombinedOffsetPercentRaw, offsetCapPercent)
                  const touCombinedOffset = (touCombinedOffsetPercent / 100) * annualUsageKwh
                  const touOffsetCapped = touCombinedOffsetPercent < touCombinedOffsetPercentRaw - 0.1

                  // Covered energy after cap plus the matching remainder helps explain the realistic limit
                  const touCappedCoveredKwh = touCombinedOffset
                  const touCappedRemainderKwh = Math.max(0, annualUsageKwh - touCappedCoveredKwh)
                  const touCappedRemainderPercent = annualUsageKwh > 0 ? (touCappedRemainderKwh / annualUsageKwh) * 100 : 0

                  // Keep proportional reductions gentle when the cap activates
                  let adjustedNightTimeOffsetTou = nightTimeOffsetTou
                  let adjustedGridChargeTou = touGridChargeUsed
                  if (touOffsetCapped && touCombinedOffsetPercentRaw > 0) {
                    const reductionFraction = touCombinedOffsetPercent / touCombinedOffsetPercentRaw
                    adjustedNightTimeOffsetTou = nightTimeOffsetTou * reductionFraction
                    adjustedGridChargeTou = Math.min(touGridChargeUsed * reductionFraction, touBatteryCapacityAfterSolar)
                  }

                  // Show the small shifts caused by the cap so customers track the story
                  const touSolarBatteryReduction = Math.max(0, nightTimeOffsetTou - adjustedNightTimeOffsetTou)
                  const touAdjustedGridCharge = adjustedGridChargeTou
                  const touAdjustedLeftover = Math.max(0, touActualLeftoverAfterFullBattery + touSolarBatteryReduction)
                  const touShownGridKwh = touAdjustedGridCharge + touAdjustedLeftover
                  const touShownGridPercent = annualUsageKwh > 0 ? (touShownGridKwh / annualUsageKwh) * 100 : 0
                   
                  // Customer-friendly bucket of cheap energy from the grid
                  const touLeftoverKwh = Math.max(0, touActualLeftoverAfterFullBattery + touSolarBatteryReduction)
                  const touLeftoverRate = touData.result.leftoverEnergy.ratePerKwh
                  const touLowRateEnergyKwh = touAdjustedGridCharge + touLeftoverKwh
                  const touLowRatePercent = touShownGridPercent
                  const touOriginalBill = touData.result.originalCost.total || 1
                  const touLeftoverCostPercent = ((touLowRateEnergyKwh * touLeftoverRate) / touOriginalBill) * 100
                  const touTotalSavingsPercent = Math.max(0, 100 - touLeftoverCostPercent)
                  const touSavingsKwhEquivalent = (annualUsageKwh * touTotalSavingsPercent) / 100
                  
                  // Easy comparables for average bill rate before and after battery support
                  const touOriginalEffectiveRate = annualUsageKwh > 0 ? (touOriginalBill / annualUsageKwh) * 100 : 0
                  const touNewBill = touData.result.newCost.total || 0
                  const touNewEffectiveRate = annualUsageKwh > 0 ? (touNewBill / annualUsageKwh) * 100 : 0
                  const touBillSavings = Math.max(0, touOriginalBill - touNewBill)
                  
                   // Get TOU on-peak rate for comparison
                   const touRatePlan = getCustomTouRatePlan()
                   const touOnPeakRate = touRatePlan.periods.find(p => p.period === 'on-peak')?.rate || 20.3
                   const touOffPeakRate = touRatePlan.periods.find(p => p.period === 'off-peak')?.rate ?? touRatePlan.periods[0]?.rate ?? 7.4
                   const touMidPeakRate = touRatePlan.periods.find(p => p.period === 'mid-peak')?.rate ?? 10.2
                   
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

                          {/* Gentle card that explains how daylight solar trims the bill */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Sun className="text-green-600" size={20} />
                                <span className="font-bold text-gray-700">Daytime covered by solar</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">{solarOffsetPercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">{solarOffsetKwh.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Energy your panels cover during the day</div>
                          </div>

                          {/* Simple card sharing how the battery stretches solar into the night */}
                          <div className="bg-gradient-to-r from-navy-50 to-blue-50 rounded-xl p-4 border-2 border-navy-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Moon className="text-navy-600" size={20} />
                                <span className="font-bold text-gray-700">Nighttime covered by battery</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-navy-600">{nightTimeOffsetTouPercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">{nightTimeOffsetTou.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Stored solar used at night (excludes grid top-up in total %)</div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-gray-600 pl-7">
                              <div>Solar → Battery: <span className="font-semibold text-navy-600">{touBatteryUsedBySolar.toFixed(0)} kWh</span></div>
                              <div>Battery top-up (cheap grid): <span className="font-semibold text-navy-600">{touAdjustedGridCharge.toFixed(0)} kWh</span></div>
                              <div>Small remainder (still from grid): <span className="font-semibold text-navy-600">{touActualLeftoverAfterFullBattery.toFixed(0)} kWh</span></div>
                            </div>
                          </div>

                          {/* Summary card bundling the full offset picture in one spot */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-300 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="text-green-600" size={20} />
                                <span className="font-bold text-gray-700">Total covered (solar + battery)</span>
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
                            <div className="text-xs text-gray-600 pl-7">Battery top-up {touAdjustedGridCharge.toFixed(0)} kWh + small remainder {touLeftoverKwh.toFixed(0)} kWh</div>
                            <div className="text-[11px] text-gray-500 pl-7">All of this energy is billed at the cheap overnight rate.</div>
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
                              Savings can exceed offset because any remaining energy is bought at ultra-low or off-peak rates.
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
                                Low-rate energy priced at {(touLeftoverRate * 100).toFixed(2)}¢/kWh: battery top-up {touAdjustedGridCharge.toFixed(0)} kWh + small remainder {touLeftoverKwh.toFixed(0)} kWh • vs on-peak {touOnPeakRate.toFixed(2)}¢/kWh.
                              </span>
                            </div>
                          </div>

                          
                        </div>
                       </div>
                     </div>
                   )
                 })()}
                 
                 {/* ULO Calculation Card */}
                 {(() => {
                  // Friendly reminder that we anchor the solar production number
                  const solarProductionKwh = effectiveSolarProductionKwh
                  
                  // Gentle explanation: aim to cover half the year with daytime panels but cap at true production
                  const daytimeTargetKwh = annualUsageKwh * 0.5
                  const solarOffsetKwh = Math.min(daytimeTargetKwh, solarProductionKwh)
                  const solarOffsetPercent = annualUsageKwh > 0 ? (solarOffsetKwh / annualUsageKwh) * 100 : 0
                  
                  // Easy-to-read total battery capacity used across periods
                  const uloBatteryOffsetKwh = uloData.result.batteryOffsets.onPeak + 
                                             uloData.result.batteryOffsets.midPeak + 
                                             uloData.result.batteryOffsets.offPeak + 
                                             (uloData.result.batteryOffsets.ultraLow || 0)
                  
                  // Simple leftover solar number after daytime needs are met
                  const uloSolarLeftover = Math.max(0, solarProductionKwh - solarOffsetKwh)
                  
                  // Remaining energy after panels work during the day
                  const uloRemainingAfterDay = Math.max(0, annualUsageKwh - solarOffsetKwh)
                  
                  // Stored-solar-at-night calculation keeps friendly language
                  const nightTimeOffsetUlo = Math.min(uloRemainingAfterDay, uloSolarLeftover, uloBatteryOffsetKwh)
                  const nightTimeOffsetUloPercent = annualUsageKwh > 0 ? (nightTimeOffsetUlo / annualUsageKwh) * 100 : 0
                  
                  // Visual number showing how much solar actually makes it into the battery
                  const uloBatteryUsedBySolar = Math.min(uloSolarLeftover, nightTimeOffsetUlo)
                  
                  // Capacity left in the battery that the grid can top up
                  const uloBatteryCapacityAfterSolar = Math.max(0, uloBatteryOffsetKwh - uloBatteryUsedBySolar)
                  
                  // Remaining load after daytime solar and stored solar lighten the bill
                  const uloRemainingAfterSolar = Math.max(0, annualUsageKwh - solarOffsetKwh - nightTimeOffsetUlo)
                  
                  // Grid top-up sized to whatever space remains in the battery and the home load
                  const uloGridChargeUsed = Math.min(uloBatteryCapacityAfterSolar, uloRemainingAfterSolar)
                  const uloTopUpPercent = annualUsageKwh > 0 ? (uloGridChargeUsed / annualUsageKwh) * 100 : 0
                  
                  // Final sliver of usage not covered by solar or battery support
                  const uloActualLeftoverAfterFullBattery = Math.max(0, annualUsageKwh - (solarOffsetKwh + nightTimeOffsetUlo + uloGridChargeUsed))
                  const uloActualLeftoverPercent = annualUsageKwh > 0 ? (uloActualLeftoverAfterFullBattery / annualUsageKwh) * 100 : 0
                  const uloRemainderPercent = uloActualLeftoverPercent
                   
                  // Combined offset number before any realistic cap is applied
                  const uloCombinedOffsetRaw = solarOffsetKwh + nightTimeOffsetUlo
                  const uloCombinedOffsetMaxKwh = Math.min(uloCombinedOffsetRaw, annualUsageKwh)
                  const uloCombinedOffsetPercentRaw = annualUsageKwh > 0 ? (uloCombinedOffsetMaxKwh / annualUsageKwh) * 100 : 0
                  const uloCombinedOffsetPercent = Math.min(uloCombinedOffsetPercentRaw, offsetCapPercent)
                  const uloCombinedOffset = (uloCombinedOffsetPercent / 100) * annualUsageKwh
                  const uloOffsetCapped = uloCombinedOffsetPercent < uloCombinedOffsetPercentRaw - 0.1

                  // Covered energy after cap plus the matching remainder helps explain the realistic limit
                  const uloCappedCoveredKwh = uloCombinedOffset
                  const uloCappedRemainderKwh = Math.max(0, annualUsageKwh - uloCappedCoveredKwh)
                  const uloCappedRemainderPercent = annualUsageKwh > 0 ? (uloCappedRemainderKwh / annualUsageKwh) * 100 : 0

                  let adjustedNightTimeOffsetUlo = nightTimeOffsetUlo
                  let adjustedGridChargeUlo = uloGridChargeUsed
                  if (uloOffsetCapped && uloCombinedOffsetPercentRaw > 0) {
                    const reductionFraction = uloCombinedOffsetPercent / uloCombinedOffsetPercentRaw
                    adjustedNightTimeOffsetUlo = nightTimeOffsetUlo * reductionFraction
                    adjustedGridChargeUlo = Math.min(uloGridChargeUsed * reductionFraction, uloBatteryCapacityAfterSolar)
                  }

                  const uloSolarBatteryReduction = Math.max(0, nightTimeOffsetUlo - adjustedNightTimeOffsetUlo)
                  const uloAdjustedGridCharge = adjustedGridChargeUlo
                  const uloAdjustedLeftover = Math.max(0, uloActualLeftoverAfterFullBattery + uloSolarBatteryReduction)
                  const uloShownGridKwh = uloAdjustedGridCharge + uloAdjustedLeftover
                  const uloShownGridPercent = annualUsageKwh > 0 ? (uloShownGridKwh / annualUsageKwh) * 100 : 0
                   
                  // ULO: low-rate energy bucket (battery top-up + still from grid)
                  const uloLeftoverKwh = uloAdjustedLeftover
                  const uloLeftoverRate = uloData.result.leftoverEnergy.ratePerKwh
                  const uloLowRateEnergyKwh = uloAdjustedGridCharge + uloLeftoverKwh
                  const uloLowRatePercent = uloShownGridPercent
                  const uloOriginalBill = uloData.result.originalCost.total || 1
                  const uloLeftoverCostPercent = ((uloLowRateEnergyKwh * uloLeftoverRate) / uloOriginalBill) * 100
                  const uloTotalSavingsPercent = Math.max(0, 100 - uloLeftoverCostPercent)
                  const uloSavingsKwhEquivalent = (annualUsageKwh * uloTotalSavingsPercent) / 100
                  
                  // Easy comparables for average bill rate before and after battery support
                  const uloOriginalEffectiveRate = annualUsageKwh > 0 ? (uloOriginalBill / annualUsageKwh) * 100 : 0
                  const uloNewBill = uloData.result.newCost.total || 0
                  const uloNewEffectiveRate = annualUsageKwh > 0 ? (uloNewBill / annualUsageKwh) * 100 : 0
                  const uloBillSavings = Math.max(0, uloOriginalBill - uloNewBill)
                  
                   // Get ULO on-peak rate for comparison
                   const uloRatePlan = getCustomUloRatePlan()
                   const uloOnPeakRate = uloRatePlan.periods.find(p => p.period === 'on-peak')?.rate || 39.1
                   const uloMidPeakRate = uloRatePlan.periods.find(p => p.period === 'mid-peak')?.rate ?? 17.1
                   const uloOffPeakRate = uloRatePlan.periods.find(p => p.period === 'off-peak')?.rate ?? 10.0
                   const uloUltraLowRate = uloRatePlan.periods.find(p => p.period === 'ultra-low')?.rate ?? 2.4
                   
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

                          {/* Gentle card that explains how daylight solar trims the bill */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Sun className="text-green-600" size={20} />
                                <span className="font-bold text-gray-700">Daytime covered by solar</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">{solarOffsetPercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">{solarOffsetKwh.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Energy your panels cover during the day</div>
                          </div>

                          {/* Simple card sharing how the battery stretches solar into the night */}
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Moon className="text-red-600" size={20} />
                                <span className="font-bold text-gray-700">Nighttime covered by battery</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-600">{nightTimeOffsetUloPercent.toFixed(2)}%</div>
                                <div className="text-xs text-gray-600">{nightTimeOffsetUlo.toFixed(0)} kWh/year</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 pl-7">Stored solar used at night (excludes grid top-up in total %)</div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-gray-600 pl-7">
                              <div>Solar → Battery: <span className="font-semibold text-red-600">{uloBatteryUsedBySolar.toFixed(0)} kWh</span></div>
                              <div>Battery top-up (cheap grid): <span className="font-semibold text-red-600">{uloAdjustedGridCharge.toFixed(0)} kWh</span></div>
                              <div>Small remainder (still from grid): <span className="font-semibold text-red-600">{uloActualLeftoverAfterFullBattery.toFixed(0)} kWh</span></div>
                            </div>
                          </div>

                          {/* Summary card bundling the full offset picture in one spot */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-300">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="text-green-600" size={20} />
                                <span className="font-bold text-gray-700">Total covered (solar + battery)</span>
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
                            <div className="text-[11px] text-gray-500 pl-7">All billed at the ultra-low overnight price.</div>
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
                              Savings can exceed offset because any remaining energy is bought at ultra-low overnight rates.
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
                                Charged at your cheapest rate {(uloLeftoverRate * 100).toFixed(2)}¢/kWh: battery top-up {uloAdjustedGridCharge.toFixed(0)} kWh + small remainder {uloLeftoverKwh.toFixed(0)} kWh • vs on-peak {uloOnPeakRate.toFixed(2)}¢/kWh.
                              </span>
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

