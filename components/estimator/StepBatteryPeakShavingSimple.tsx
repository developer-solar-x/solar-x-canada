'use client'

import { useState, useEffect } from 'react'
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
import { calculateSavings as calculateProvinceSolarSavings } from '../../config/provinces'
import {
  calculateSimplePeakShaving,
  calculateSimpleMultiYear,
  calculateSolarOnlySavings,
  UsageDistribution,
  DEFAULT_TOU_DISTRIBUTION,
  DEFAULT_ULO_DISTRIBUTION,
  SimplePeakShavingResult
} from '../../lib/simple-peak-shaving'

interface StepBatteryPeakShavingSimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
  // Enable inline manual production editing without duplicating the UI
  manualMode?: boolean
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
  const [selectedBatteries, setSelectedBatteries] = useState<string[]>([data.selectedBattery || 'renon-16'])
  const [touDistribution, setTouDistribution] = useState<UsageDistribution>(DEFAULT_TOU_DISTRIBUTION)
  const [uloDistribution, setUloDistribution] = useState<UsageDistribution>(DEFAULT_ULO_DISTRIBUTION)
  const [touResults, setTouResults] = useState<Map<string, {result: SimplePeakShavingResult, projection: any, combined?: { annual: number, monthly: number, projection: any, netCost: number } }>>(new Map())
  const [uloResults, setUloResults] = useState<Map<string, {result: SimplePeakShavingResult, projection: any, combined?: { annual: number, monthly: number, projection: any, netCost: number } }>>(new Map())
  const [showCustomRates, setShowCustomRates] = useState(false)
  const [showSavingsInfo, setShowSavingsInfo] = useState(false)
  // Hydrate annual usage from storage after mount (both standalone and estimator)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Priority 1: Check if props already have a value (from estimator data or peakShaving)
    const fromProps = data.peakShaving?.annualUsageKwh || data.energyUsage?.annualKwh
    if (fromProps && fromProps > 0) {
      const propsValue = String(fromProps)
      if (propsValue !== annualUsageInput) {
        setAnnualUsageInput(propsValue)
      }
      // Also persist this value to localStorage for consistency
      const storageKey = 'estimator_annualUsageKwh'
      localStorage.setItem(storageKey, propsValue)
      // Persist manual copy for the manual page as well
      if (manualMode) {
        localStorage.setItem('manual_estimator_annual_kwh', propsValue)
      }
      return
    }
    
    // Priority 2: Check localStorage (different keys for standalone vs estimator)
    // When manualMode, prefer manual key, else fall back to shared key
    const manualKey = 'manual_estimator_annual_kwh'
    const sharedKey = 'estimator_annualUsageKwh'
    const stored = manualMode ? (localStorage.getItem(manualKey) || localStorage.getItem(sharedKey))
                              : localStorage.getItem(sharedKey)
    if (stored && stored !== '0' && Number(stored) > 0) {
      const storedValue = String(stored)
      if (storedValue !== annualUsageInput) {
        setAnnualUsageInput(storedValue)
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

  // Manual production override state (only used when manualMode is enabled)
  const [manualProductionInput, setManualProductionInput] = useState<number | null>(null)

  useEffect(() => {
    if (!manualMode) return
    if (typeof window === 'undefined') return
    // Try restore from localStorage first
    const stored = window.localStorage.getItem('manual_estimator_production_kwh')
    if (stored !== null && !Number.isNaN(Number(stored))) {
      setManualProductionInput(Number(stored))
      return
    }
    // Fallback to provided estimate
    const initial = (overrideEstimate?.production?.annualKwh ?? data.estimate?.production?.annualKwh ?? 0)
    setManualProductionInput(prev => (prev == null ? initial : prev))
  }, [manualMode, data.estimate?.production?.annualKwh, overrideEstimate?.production?.annualKwh])

  useEffect(() => {
    if (!manualMode) return
    if (typeof window === 'undefined') return
    if (manualProductionInput == null) return
    window.localStorage.setItem('manual_estimator_production_kwh', String(Math.max(0, manualProductionInput)))
  }, [manualMode, manualProductionInput])

  const effectiveSolarProductionKwh = (
    manualMode && manualProductionInput != null
      ? manualProductionInput
      : (overrideEstimate?.production?.annualKwh ?? data.estimate?.production?.annualKwh ?? 0)
  )

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
    const newResults = new Map<string, {result: SimplePeakShavingResult, projection: any, combined?: { annual: number, monthly: number, projection: any, netCost: number } }>()
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
      // Solar annual savings: estimator value when available; manual uses rate/distribution-based solar-only savings
      const solarAnnual = (currentEstimate?.savings?.annualSavings != null)
        ? currentEstimate.savings.annualSavings
        : (manualMode
            ? calculateProvinceSolarSavings(effectiveSolarProductionKwh, 0, 'ON', annualUsageKwh).annualSavings
            : calculateSolarOnlySavings(annualUsageKwh, effectiveSolarProductionKwh, touRatePlan, touDistribution).annualSavings)
      const combinedAnnual = calcResult.annualSavings + solarAnnual
      const combinedMonthly = Math.round(combinedAnnual / 12)
      const manualSolarNet = Math.max(0, calculateSystemCost(effectiveSystemSizeKw) - solarRebate)
      const solarNet = (currentEstimate?.costs?.netCost != null) ? currentEstimate.costs.netCost : manualSolarNet
      const combinedNet = Math.max(0, solarNet + netCost)
      // Client requirement: 5% annual escalation for 25-year totals, payback = Net / Year 1 Annual
      const escalated = calculateSimpleMultiYear({ annualSavings: combinedAnnual } as any, combinedNet, 0.05, 25)
      const simplePayback = combinedAnnual > 0 ? Math.round((combinedNet / combinedAnnual) * 10) / 10 : Number.POSITIVE_INFINITY
      const combinedProjection = { ...escalated, paybackYears: simplePayback }

      newResults.set('combined', { result: calcResult, projection: multiYear, combined: { annual: combinedAnnual, monthly: combinedMonthly, projection: combinedProjection, netCost: combinedNet } })
    }

    setTouResults(newResults)
  }, [annualUsageInput, selectedBatteries, touDistribution, customRates.tou, data.estimate, systemSizeKwOverride, overrideEstimate, effectiveSolarProductionKwh])

  // Calculate ULO results for selected batteries
  useEffect(() => {
    const newResults = new Map<string, {result: SimplePeakShavingResult, projection: any, combined?: { annual: number, monthly: number, projection: any, netCost: number } }>()
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
      const solarAnnual = (currentEstimate?.savings?.annualSavings != null)
        ? currentEstimate.savings.annualSavings
        : (manualMode
            ? calculateProvinceSolarSavings(effectiveSolarProductionKwh, 0, 'ON', annualUsageKwh).annualSavings
            : calculateSolarOnlySavings(annualUsageKwh, effectiveSolarProductionKwh, uloRatePlan, uloDistribution).annualSavings)
      const combinedAnnual = calcResult.annualSavings + solarAnnual
      const combinedMonthly = Math.round(combinedAnnual / 12)
      const manualSolarNet = Math.max(0, calculateSystemCost(effectiveSystemSizeKw) - solarRebate)
      const solarNet = (currentEstimate?.costs?.netCost != null) ? currentEstimate.costs.netCost : manualSolarNet
      const combinedNet = Math.max(0, solarNet + netCost)
      // Client requirement: 5% annual escalation for 25-year totals, payback = Net / Year 1 Annual
      const escalated = calculateSimpleMultiYear({ annualSavings: combinedAnnual } as any, combinedNet, 0.05, 25)
      const simplePayback = combinedAnnual > 0 ? Math.round((combinedNet / combinedAnnual) * 10) / 10 : Number.POSITIVE_INFINITY
      const combinedProjection = { ...escalated, paybackYears: simplePayback }

      newResults.set('combined', { result: calcResult, projection: multiYear, combined: { annual: combinedAnnual, monthly: combinedMonthly, projection: combinedProjection, netCost: combinedNet } })
    }

    setUloResults(newResults)
  }, [annualUsageInput, selectedBatteries, uloDistribution, customRates.ulo, data.estimate, systemSizeKwOverride, overrideEstimate, effectiveSolarProductionKwh])

  const handleComplete = () => {
    const selectedTouResult = touResults.get('combined')
    const selectedUloResult = uloResults.get('combined')
    onComplete({
      ...data,
      solarOverride: { numPanels: solarPanels, sizeKw: systemSizeKwOverride },
      selectedBatteries,
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
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
            <Battery className="text-white" size={32} />
          </div>
          <h2 className="text-4xl font-bold text-navy-500">
            Battery Savings Calculator
          </h2>
        </div>
        <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    value={Math.round(effectiveSolarProductionKwh)}
                    onChange={(e) => setManualProductionInput(Math.max(0, Number(e.target.value)))}
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
                ${Math.round((annualUsageKwh * 0.223) / 12).toLocaleString()}/month
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
      </div>

      {/* Info Modals */}
      
      <Modal
        isOpen={showTouInfo}
        onClose={() => setShowTouInfo(false)}
        title="About Time-of-Use (TOU)"
        message="TOU rates vary by time of day: lower rates overnight/off-peak, higher during on-peak hours. Batteries can charge when rates are low and discharge when rates are high."
        variant="info"
        cancelText="Close"
      >
        <img
          src="/TOU.JPG"
          alt="Time-of-Use (TOU) illustration"
          className="w-full h-auto rounded-lg border-2 border-gray-200"
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement
            const fallbacks = ['/TOU.jpg', '/TOU.jpeg', '/TOU.png', '/TOU.HPH']
            const next = fallbacks.find((p) => p !== el.src.replace(window.location.origin, ''))
            if (next) el.src = next
          }}
        />
      </Modal>

      <Modal
        isOpen={showUloInfo}
        onClose={() => setShowUloInfo(false)}
        title="About Ultra-Low Overnight (ULO)"
        message="ULO plans offer ultra-low rates overnight (e.g., 11 PM–7 AM). Perfect for EV charging and for charging your battery to use during expensive daytime periods."
        variant="info"
        cancelText="Close"
      >
        <img
          src="/ULO.JPG"
          alt="Ultra-Low Overnight (ULO) illustration"
          className="w-full h-auto rounded-lg border-2 border-gray-200"
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement
            const fallbacks = ['/ULO.jpg', '/ULO.jpeg', '/ULO.png']
            const next = fallbacks.find((p) => p !== el.src.replace(window.location.origin, ''))
            if (next) el.src = next
          }}
        />
      </Modal>

      {/* Payback Info Modal */}
      <Modal
        isOpen={showPaybackInfo}
        onClose={() => setShowPaybackInfo(false)}
        title="How Full System Payback Is Calculated"
        message="We calculate payback using the combined cost and combined savings of the solar + battery system."
        variant="info"
        cancelText="Close"
      >
        {(() => {
          const currentEstimate = overrideEstimate || data.estimate
          const systemSizeKw = effectiveSystemSizeKw
          const solarRebatePerKw = 1000
          const solarMaxRebate = 5000
          const solarRebate = systemSizeKw > 0 ? Math.min(systemSizeKw * solarRebatePerKw, solarMaxRebate) : 0
          const manualSolarNet = Math.max(0, calculateSystemCost(systemSizeKw) - solarRebate)
          const solarNet = (currentEstimate?.costs?.netCost != null) ? currentEstimate.costs.netCost : manualSolarNet
          // Use calculated solar-only savings when estimate value is not present
          const solarAnnualTou = (currentEstimate?.savings?.annualSavings != null)
            ? currentEstimate.savings.annualSavings
            : calculateSolarOnlySavings(annualUsageKwh, effectiveSolarProductionKwh, getCustomTouRatePlan(), touDistribution).annualSavings
          const solarAnnualUlo = (currentEstimate?.savings?.annualSavings != null)
            ? currentEstimate.savings.annualSavings
            : calculateSolarOnlySavings(annualUsageKwh, effectiveSolarProductionKwh, getCustomUloRatePlan(), uloDistribution).annualSavings
          const tou = touResults.get('combined')
          const ulo = uloResults.get('combined')
          
          // Calculate combined battery specs
          const batteries = selectedBatteries.map(id => BATTERY_SPECS.find(b => b.id === id)).filter(Boolean) as BatterySpec[]
          const combinedBattery = batteries.length > 0 ? batteries.reduce((combined, current) => ({
            ...combined,
            nominalKwh: combined.nominalKwh + current.nominalKwh,
            usableKwh: combined.usableKwh + current.usableKwh,
            price: combined.price + current.price
          })) : null
          
          // Battery-only net cost (program rebate only; solar rebate accounted in solarNet)
          const batteryProgramRebate = Math.min((combinedBattery?.nominalKwh || 0) * 300, 5000)
          const batteryBasePrice = combinedBattery?.price || 0
          const batteryNet = Math.max(0, batteryBasePrice - batteryProgramRebate)
          const batteryTouNet = batteryNet
          const batteryUloNet = batteryNet
          const batteryTouAnnual = tou?.result?.annualSavings || 0
          const batteryUloAnnual = ulo?.result?.annualSavings || 0

          // Battery price from spec to show rebate breakdown
          const batteryPrice = batteryBasePrice
          // Display battery rebate as PROGRAM rebate only (do not include solar allocation)
          const batteryTouRebate = batteryProgramRebate
          const batteryUloRebate = batteryProgramRebate

          const fullTouNet = solarNet + batteryTouNet
          const fullUloNet = solarNet + batteryUloNet
          const fullTouAnnual = solarAnnualTou + batteryTouAnnual
          const fullUloAnnual = solarAnnualUlo + batteryUloAnnual

          const fullTouPayback = fullTouNet <= 0 ? 0 : (fullTouAnnual > 0 ? fullTouNet / fullTouAnnual : Infinity)
          const fullUloPayback = fullUloNet <= 0 ? 0 : (fullUloAnnual > 0 ? fullUloNet / fullUloAnnual : Infinity)

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Formula</span>
                <div className="mt-1 text-xs text-gray-600 ml-1">Payback (years) = (Solar Net Cost + Battery Net Cost) ÷ (Solar Annual Savings + Battery Annual Savings)</div>
              </div>

              {/* TOU Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">TOU Sample</div>
                <div className="text-xs text-gray-700">
                  Net Cost = ${solarNet.toLocaleString()} + ${batteryTouNet.toLocaleString()} = <span className="font-semibold">${(fullTouNet).toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-gray-600">
                  Rebates: Solar ${solarRebate.toLocaleString()} + Battery ${batteryTouRebate.toLocaleString()} (Battery price ${batteryPrice.toLocaleString()} − Rebate ${batteryTouRebate.toLocaleString()})
                </div>
                <div className="text-xs text-gray-700">
                  Annual Savings = ${Math.round(solarAnnualTou).toLocaleString()} + ${batteryTouAnnual.toLocaleString()} = <span className="font-semibold">${fullTouAnnual.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  Payback = {fullTouNet <= 0 ? '0' : fullTouAnnual > 0 ? `${(fullTouNet).toLocaleString()} ÷ ${fullTouAnnual.toLocaleString()}` : 'N/A'} = <span className="font-bold text-navy-600">{fullTouPayback === Infinity ? 'N/A' : `${fullTouPayback.toFixed(1)} years`}</span>
                </div>
              </div>

              {/* ULO Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">ULO Sample</div>
                <div className="text-xs text-gray-700">
                  Net Cost = ${solarNet.toLocaleString()} + ${batteryUloNet.toLocaleString()} = <span className="font-semibold">${(fullUloNet).toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-gray-600">
                  Rebates: Solar ${solarRebate.toLocaleString()} + Battery ${batteryUloRebate.toLocaleString()} (Battery price ${batteryPrice.toLocaleString()} − Rebate ${batteryUloRebate.toLocaleString()})
                </div>
                <div className="text-xs text-gray-700">
                  Annual Savings = ${Math.round(solarAnnualUlo).toLocaleString()} + ${batteryUloAnnual.toLocaleString()} = <span className="font-semibold">${fullUloAnnual.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  Payback = {fullUloNet <= 0 ? '0' : fullUloAnnual > 0 ? `${(fullUloNet).toLocaleString()} ÷ ${fullUloAnnual.toLocaleString()}` : 'N/A'} = <span className="font-bold text-navy-600">{fullUloPayback === Infinity ? 'N/A' : `${fullUloPayback.toFixed(1)} years`}</span>
                </div>
              </div>

              <ul className="list-disc ml-6 text-xs text-gray-600">
                <li>If total net cost ≤ 0, payback is 0 years.</li>
                <li>If total annual savings is 0, payback is shown as N/A.</li>
                <li>Numbers above use your current estimate and selected battery.</li>
              </ul>
            </div>
          )
        })()}
      </Modal>

      {/* Savings & 25-Year Profit Info Modal */}
      <Modal
        isOpen={showSavingsInfo}
        onClose={() => setShowSavingsInfo(false)}
        title="How Annual Savings & 25‑Year Profit Are Calculated"
        message="We calculate annual savings and 25‑year profit by combining your solar system with the battery savings from each rate plan."
        variant="info"
        cancelText="Close"
      >
        {(() => {
          const solarNet = (overrideEstimate || data.estimate)?.costs?.netCost || 0
          // Compute solar annual savings consistently with manualMode and rate plan
          const solarAnnualTou = (overrideEstimate || data.estimate)?.savings?.annualSavings ?? (
            manualMode
              ? calculateProvinceSolarSavings(effectiveSolarProductionKwh, 0, 'ON', annualUsageKwh).annualSavings
              : calculateSolarOnlySavings(annualUsageKwh, effectiveSolarProductionKwh, getCustomTouRatePlan(), touDistribution).annualSavings
          )
          const solarAnnualUlo = (overrideEstimate || data.estimate)?.savings?.annualSavings ?? (
            manualMode
              ? calculateProvinceSolarSavings(effectiveSolarProductionKwh, 0, 'ON', annualUsageKwh).annualSavings
              : calculateSolarOnlySavings(annualUsageKwh, effectiveSolarProductionKwh, getCustomUloRatePlan(), uloDistribution).annualSavings
          )
          const tou = touResults.get('combined')
          const ulo = uloResults.get('combined')
          const batteryTouAnnual = tou?.result?.annualSavings || 0
          const batteryUloAnnual = ulo?.result?.annualSavings || 0
          const fullTouAnnual = Math.round(solarAnnualTou + batteryTouAnnual)
          const fullUloAnnual = Math.round(solarAnnualUlo + batteryUloAnnual)

          const touProfit = tou?.combined?.projection?.netProfit25Year || 0
          const uloProfit = ulo?.combined?.projection?.netProfit25Year || 0

          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Formulas</span>
                <div className="mt-1 text-xs text-gray-600 ml-1">Year‑1 Bill Before = Σ(kWh × rate(period))</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">Year‑1 Bill After = Σ(kWh_after_battery × rate(period))</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">Annual Savings (Year‑1) = Bill Before − Bill After</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">Combined Annual Savings = Solar Annual Savings + Battery Annual Savings</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">Escalated Year n Savings = Annual Savings × 1.05^(n−1)</div>
                <div className="mt-1 text-xs text-gray-600 ml-1">25‑Year Profit = Σ( Escalated Year n Savings ) − Combined Net Investment</div>
              </div>

              {/* TOU Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">TOU Sample</div>
                <div className="text-xs text-gray-700">
                  Combined Annual Savings = ${Math.round(solarAnnualTou).toLocaleString()} (Solar) + ${batteryTouAnnual.toLocaleString()} (Battery) = <span className="font-semibold">${fullTouAnnual.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  25‑Year Profit = <span className="font-bold text-green-600">${touProfit.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  (Sum of annual savings with 5% escalation over 25 years minus combined net investment)
                </div>
              </div>

              {/* ULO Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">ULO Sample</div>
                <div className="text-xs text-gray-700">
                  Combined Annual Savings = ${Math.round(solarAnnualUlo).toLocaleString()} (Solar) + ${batteryUloAnnual.toLocaleString()} (Battery) = <span className="font-semibold">${fullUloAnnual.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  25‑Year Profit = <span className="font-bold text-green-600">${uloProfit.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  (Sum of annual savings with 5% escalation over 25 years minus combined net investment)
                </div>
              </div>

              <div className="text-xs text-gray-600 italic mt-2">
                <span className="font-semibold">Why TOU and ULO differ:</span> Each rate plan has different time‑of‑use prices and charging rates. Battery charges at cheap hours (ultra‑low overnight for ULO, off‑peak for TOU) and discharges during expensive peak hours, so the savings depend on the rate structure.
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
         <div>
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
                 const touCombinedAnnual = touData.combined?.annual || 0
                 const uloCombinedAnnual = uloData.combined?.annual || 0
                 const touCombinedNet = touData.combined?.netCost || 0
                 const uloCombinedNet = uloData.combined?.netCost || 0

                 const fullTouPayback = touCombinedNet <= 0 ? 0 : (touCombinedAnnual > 0 ? touCombinedNet / touCombinedAnnual : Infinity)
                 const fullUloPayback = uloCombinedNet <= 0 ? 0 : (uloCombinedAnnual > 0 ? uloCombinedNet / uloCombinedAnnual : Infinity)

                 return (
                   <div className="space-y-4">
                     <div>
                       <div className="flex items-center gap-1 mb-1">
                         <Sun size={14} className="text-navy-400" />
                         <div className="text-xs text-gray-500 font-medium">TOU Plan</div>
                       </div>
                       <div className="text-2xl font-bold text-navy-600">
                         {fullTouPayback === Infinity ? 'N/A' : `${fullTouPayback.toFixed(1)} years`}
                       </div>
                     </div>
                     <div className="border-t border-gray-200 pt-3">
                       <div className="flex items-center gap-1 mb-1">
                         <Moon size={14} className="text-navy-400" />
                         <div className="text-xs text-gray-500 font-medium">ULO Plan</div>
                       </div>
                       <div className="text-2xl font-bold text-navy-600">
                         {fullUloPayback === Infinity ? 'N/A' : `${fullUloPayback.toFixed(1)} years`}
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
                  onClick={() => setShowSavingsInfo(true)}
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
               <div className="flex items-center justify-center gap-2 mb-5">
                 <Sun className="text-navy-500" size={20} />
                 <h4 className="font-bold text-navy-500 text-lg">Time-of-Use (TOU) Plan</h4>
               </div>
               <div className="grid grid-cols-2 gap-4">
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
                      {touData.result.savingsPercent.toFixed(1)}% reduction
                    </div>
                  </div>
                </div>
              </div>
             </div>

             {/* ULO Cost Breakdown */}
             <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-300 hover:border-navy-300 transition-all">
               <div className="flex items-center justify-center gap-2 mb-5">
                 <Moon className="text-navy-500" size={20} />
                 <h4 className="font-bold text-navy-500 text-lg">Ultra-Low Overnight (ULO) Plan</h4>
               </div>
               <div className="grid grid-cols-2 gap-4">
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
                      {uloData.result.savingsPercent.toFixed(1)}% reduction
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
               
               <div className="grid md:grid-cols-2 gap-6">
                 {/* TOU Calculation Card */}
                 {(() => {
                  // Get solar production (manual in standalone)
                  const solarProductionKwh = effectiveSolarProductionKwh
                  
                  // Daytime offset = 50% of total annual consumption, BUT capped at actual solar production
                  const daytimeTargetKwh = annualUsageKwh * 0.5
                  const solarOffsetKwh = Math.min(daytimeTargetKwh, solarProductionKwh)
                  const solarOffsetPercent = annualUsageKwh > 0 ? (solarOffsetKwh / annualUsageKwh) * 100 : 0
                  
                  // Calculate TOU battery offset capacity
                  const touBatteryOffsetKwh = touData.result.batteryOffsets.onPeak + 
                                             touData.result.batteryOffsets.midPeak + 
                                             touData.result.batteryOffsets.offPeak + 
                                             (touData.result.batteryOffsets.ultraLow || 0)
                  
                  // Solar leftover = excess solar after covering daytime consumption
                  const touSolarLeftover = Math.max(0, solarProductionKwh - solarOffsetKwh)
                  
                  // Remaining consumption after daytime solar coverage
                  const touRemainingAfterDay = Math.max(0, annualUsageKwh - solarOffsetKwh)
                  
                  // Nighttime offset from stored solar = min of (remaining consumption, leftover solar, battery capacity)
                  // This is ONLY stored solar used at night (excludes grid top-up)
                  const nightTimeOffsetTou = Math.min(touRemainingAfterDay, touSolarLeftover, touBatteryOffsetKwh)
                  const nightTimeOffsetTouPercent = annualUsageKwh > 0 ? (nightTimeOffsetTou / annualUsageKwh) * 100 : 0
                  
                  // Solar → Battery: how much solar is stored in battery (limited by battery capacity and leftover solar)
                  const touBatteryUsedBySolar = Math.min(touSolarLeftover, nightTimeOffsetTou)
                  
                  // Battery capacity available for grid charging (after solar storage)
                  const touBatteryCapacityAfterSolar = Math.max(0, touBatteryOffsetKwh - touBatteryUsedBySolar)
                  
                  // Remaining consumption after solar (both daytime direct + nighttime from battery)
                  const touRemainingAfterSolar = Math.max(0, annualUsageKwh - solarOffsetKwh - nightTimeOffsetTou)
                  
                  // Grid charge used = battery top-up from grid (limited by remaining consumption and available battery capacity)
                  const touGridChargeUsed = Math.min(touBatteryCapacityAfterSolar, touRemainingAfterSolar)
                  const touTopUpPercent = annualUsageKwh > 0 ? (touGridChargeUsed / annualUsageKwh) * 100 : 0
                  
                  // True leftover = consumption still not covered after all solar + battery (solar + grid charged)
                  const touActualLeftoverAfterFullBattery = Math.max(0, annualUsageKwh - (solarOffsetKwh + nightTimeOffsetTou + touGridChargeUsed))
                  const touActualLeftoverPercent = annualUsageKwh > 0 ? (touActualLeftoverAfterFullBattery / annualUsageKwh) * 100 : 0
                  const touRemainderPercent = touActualLeftoverPercent
                   
                  // Calculate combined offset (exclude grid-charged battery top-up), capped at 100%
                  const touCombinedOffsetRaw = solarOffsetKwh + nightTimeOffsetTou
                  const touCombinedOffset = Math.min(touCombinedOffsetRaw, annualUsageKwh)
                  const touCombinedOffsetPercent = annualUsageKwh > 0 ? (touCombinedOffset / annualUsageKwh) * 100 : 0
                   
                  // TOU: low-rate energy bucket (battery top-up + still from grid)
                  const touLeftoverKwh = touActualLeftoverAfterFullBattery
                  const touLeftoverRate = touData.result.leftoverEnergy.ratePerKwh
                  const touLowRateEnergyKwh = touGridChargeUsed + touLeftoverKwh
                  const touLowRatePercent = annualUsageKwh > 0 ? (touLowRateEnergyKwh / annualUsageKwh) * 100 : 0
                  const touOriginalBill = touData.result.originalCost.total || 1
                  const touLeftoverCostPercent = ((touLowRateEnergyKwh * touLeftoverRate) / touOriginalBill) * 100
                   
                   // Get TOU on-peak rate for comparison
                   const touRatePlan = getCustomTouRatePlan()
                   const touOnPeakRate = touRatePlan.periods.find(p => p.period === 'on-peak')?.rate || 20.3
                   
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
                         <div className="grid grid-cols-2 gap-4">
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
                         
                         <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <Sun className="text-green-600" size={20} />
                               <span className="font-bold text-gray-700">Daytime covered by solar</span>
                             </div>
                             <div className="text-right">
                               <div className="text-2xl font-bold text-green-600">{solarOffsetKwh.toFixed(0)}</div>
                               <div className="text-xs text-gray-600">({solarOffsetPercent.toFixed(1)}%)</div>
                             </div>
                           </div>
                           <div className="text-xs text-gray-600 pl-7">Energy your panels cover during the day</div>
                         </div>
                         
                          <div className="bg-gradient-to-r from-navy-50 to-blue-50 rounded-xl p-4 border-2 border-navy-200">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <Moon className="text-navy-600" size={20} />
                               <span className="font-bold text-gray-700">Nighttime covered by battery</span>
                             </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-navy-600">{nightTimeOffsetTou.toFixed(0)}</div>
                              <div className="text-xs text-gray-600">kWh/year ({nightTimeOffsetTouPercent.toFixed(1)}%)</div>
                            </div>
                           </div>
                            <div className="text-xs text-gray-600 pl-7">Stored solar used at night (excludes grid top‑up in total %)</div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-600 pl-7">
                            <div>Solar → Battery: <span className="font-semibold text-navy-600">{touBatteryUsedBySolar.toFixed(0)} kWh</span></div>
                            <div>Battery top‑up: <span className="font-semibold text-navy-600">{touGridChargeUsed.toFixed(0)} kWh</span> <span className="text-gray-500">({touTopUpPercent.toFixed(1)}%)</span></div>
                            <div>Small remainder: <span className="font-semibold text-navy-600">{touActualLeftoverAfterFullBattery.toFixed(0)} kWh</span> <span className="text-gray-500">({touRemainderPercent.toFixed(1)}%)</span></div>
                          </div>
                         </div>
                         
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-300">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <BarChart3 className="text-green-600" size={20} />
                               <span className="font-bold text-gray-700">Total covered (solar + battery)</span>
                             </div>
                             <div className="text-right">
                               <div className="text-2xl font-bold text-green-600">{touCombinedOffset.toFixed(0)}</div>
                               <div className="text-xs text-gray-600">({touCombinedOffsetPercent.toFixed(1)}%)</div>
                             </div>
                           </div>
                           <div className="text-xs text-gray-600 pl-7">Everything you don’t need to buy from the grid</div>
                         </div>
                         
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <AlertTriangle className="text-red-600" size={20} />
                              <span className="font-bold text-gray-700">Bought from the grid (cheap hours)</span>
                             </div>
                             <div className="text-right">
                              <div className="text-2xl font-bold text-red-600">{touLowRateEnergyKwh.toFixed(0)}</div>
                              <div className="text-xs text-gray-600">({touLowRatePercent.toFixed(1)}%)</div>
                             </div>
                           </div>
                          <div className="text-xs text-gray-600 pl-7">Battery top‑up {touGridChargeUsed.toFixed(0)} kWh + small remainder {touLeftoverKwh.toFixed(0)} kWh</div>
                         </div>
                         
                         <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-300">
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
                              Charged at your cheapest rate {(touLeftoverRate * 100).toFixed(1)}¢/kWh: battery top‑up {touGridChargeUsed.toFixed(0)} kWh + small remainder {touLeftoverKwh.toFixed(0)} kWh • vs on‑peak {touOnPeakRate.toFixed(1)}¢/kWh
                            </span>
                          </div>
                         </div>
                       </div>
                     </div>
                   )
                 })()}
                 
                 {/* ULO Calculation Card */}
                 {(() => {
                  // Get solar production (manual in standalone)
                  const solarProductionKwh = effectiveSolarProductionKwh
                  
                  // Daytime offset = 50% of total annual consumption, BUT capped at actual solar production
                  const daytimeTargetKwh = annualUsageKwh * 0.5
                  const solarOffsetKwh = Math.min(daytimeTargetKwh, solarProductionKwh)
                  const solarOffsetPercent = annualUsageKwh > 0 ? (solarOffsetKwh / annualUsageKwh) * 100 : 0
                  
                  // Calculate ULO battery offset capacity
                  const uloBatteryOffsetKwh = uloData.result.batteryOffsets.onPeak + 
                                             uloData.result.batteryOffsets.midPeak + 
                                             uloData.result.batteryOffsets.offPeak + 
                                             (uloData.result.batteryOffsets.ultraLow || 0)
                  
                  // Solar leftover = excess solar after covering daytime consumption
                  const uloSolarLeftover = Math.max(0, solarProductionKwh - solarOffsetKwh)
                  
                  // Remaining consumption after daytime solar coverage
                  const uloRemainingAfterDay = Math.max(0, annualUsageKwh - solarOffsetKwh)
                  
                  // Nighttime offset from stored solar = min of (remaining consumption, leftover solar, battery capacity)
                  // This is ONLY stored solar used at night (excludes grid top-up)
                  const nightTimeOffsetUlo = Math.min(uloRemainingAfterDay, uloSolarLeftover, uloBatteryOffsetKwh)
                  const nightTimeOffsetUloPercent = annualUsageKwh > 0 ? (nightTimeOffsetUlo / annualUsageKwh) * 100 : 0
                  
                  // Solar → Battery: how much solar is stored in battery (limited by battery capacity and leftover solar)
                  const uloBatteryUsedBySolar = Math.min(uloSolarLeftover, nightTimeOffsetUlo)
                  
                  // Battery capacity available for grid charging (after solar storage)
                  const uloBatteryCapacityAfterSolar = Math.max(0, uloBatteryOffsetKwh - uloBatteryUsedBySolar)
                  
                  // Remaining consumption after solar (both daytime direct + nighttime from battery)
                  const uloRemainingAfterSolar = Math.max(0, annualUsageKwh - solarOffsetKwh - nightTimeOffsetUlo)
                  
                  // Grid charge used = battery top-up from grid (limited by remaining consumption and available battery capacity)
                  const uloGridChargeUsed = Math.min(uloBatteryCapacityAfterSolar, uloRemainingAfterSolar)
                  const uloTopUpPercent = annualUsageKwh > 0 ? (uloGridChargeUsed / annualUsageKwh) * 100 : 0
                  
                  // True leftover = consumption still not covered after all solar + battery (solar + grid charged)
                  const uloActualLeftoverAfterFullBattery = Math.max(0, annualUsageKwh - (solarOffsetKwh + nightTimeOffsetUlo + uloGridChargeUsed))
                  const uloActualLeftoverPercent = annualUsageKwh > 0 ? (uloActualLeftoverAfterFullBattery / annualUsageKwh) * 100 : 0
                  const uloRemainderPercent = uloActualLeftoverPercent
                   
                  // Calculate combined offset (exclude grid-charged battery top-up), capped at 100%
                  const uloCombinedOffsetRaw = solarOffsetKwh + nightTimeOffsetUlo
                  const uloCombinedOffset = Math.min(uloCombinedOffsetRaw, annualUsageKwh)
                  const uloCombinedOffsetPercent = annualUsageKwh > 0 ? (uloCombinedOffset / annualUsageKwh) * 100 : 0
                   
                  // ULO: low-rate energy bucket (battery top-up + still from grid)
                  const uloLeftoverKwh = uloActualLeftoverAfterFullBattery
                  const uloLeftoverRate = uloData.result.leftoverEnergy.ratePerKwh
                  const uloLowRateEnergyKwh = uloGridChargeUsed + uloLeftoverKwh
                  const uloLowRatePercent = annualUsageKwh > 0 ? (uloLowRateEnergyKwh / annualUsageKwh) * 100 : 0
                  const uloOriginalBill = uloData.result.originalCost.total || 1
                  const uloLeftoverCostPercent = ( (uloLowRateEnergyKwh * uloLeftoverRate) / uloOriginalBill) * 100
                   
                   // Get ULO on-peak rate for comparison
                   const uloRatePlan = getCustomUloRatePlan()
                   const uloOnPeakRate = uloRatePlan.periods.find(p => p.period === 'on-peak')?.rate || 39.1
                   
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
                         <div className="grid grid-cols-2 gap-4">
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
                         
                         <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <Sun className="text-green-600" size={20} />
                               <span className="font-bold text-gray-700">Daytime covered by solar</span>
                             </div>
                             <div className="text-right">
                               <div className="text-2xl font-bold text-green-600">{solarOffsetKwh.toFixed(0)}</div>
                               <div className="text-xs text-gray-600">({solarOffsetPercent.toFixed(1)}%)</div>
                             </div>
                           </div>
                           <div className="text-xs text-gray-600 pl-7">Energy your panels cover during the day</div>
                         </div>
                         
                         <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <Moon className="text-red-600" size={20} />
                               <span className="font-bold text-gray-700">Nighttime covered by battery</span>
                             </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-600">{nightTimeOffsetUlo.toFixed(0)}</div>
                              <div className="text-xs text-gray-600">kWh/year ({nightTimeOffsetUloPercent.toFixed(1)}%)</div>
                            </div>
                           </div>
                            <div className="text-xs text-gray-600 pl-7">Stored solar used at night (excludes grid top‑up in total %)</div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-600 pl-7">
                            <div>Solar → Battery: <span className="font-semibold text-red-600">{uloBatteryUsedBySolar.toFixed(0)} kWh</span></div>
                            <div>Battery top‑up: <span className="font-semibold text-red-600">{uloGridChargeUsed.toFixed(0)} kWh</span> <span className="text-gray-500">({uloTopUpPercent.toFixed(1)}%)</span></div>
                            <div>Small remainder: <span className="font-semibold text-red-600">{uloActualLeftoverAfterFullBattery.toFixed(0)} kWh</span> <span className="text-gray-500">({uloRemainderPercent.toFixed(1)}%)</span></div>
                          </div>
                         </div>
                         
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-300">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <BarChart3 className="text-green-600" size={20} />
                               <span className="font-bold text-gray-700">Total covered (solar + battery)</span>
                             </div>
                             <div className="text-right">
                               <div className="text-2xl font-bold text-green-600">{uloCombinedOffset.toFixed(0)}</div>
                               <div className="text-xs text-gray-600">({uloCombinedOffsetPercent.toFixed(1)}%)</div>
                             </div>
                           </div>
                           <div className="text-xs text-gray-600 pl-7">Everything you don’t need to buy from the grid</div>
                         </div>
                         
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <AlertTriangle className="text-red-600" size={20} />
                              <span className="font-bold text-gray-700">Bought from the grid (cheap hours)</span>
                             </div>
                             <div className="text-right">
                              <div className="text-2xl font-bold text-red-600">{uloLowRateEnergyKwh.toFixed(0)}</div>
                              <div className="text-xs text-gray-600">({uloLowRatePercent.toFixed(1)}%)</div>
                             </div>
                           </div>
                          <div className="text-xs text-gray-600 pl-7">Battery top‑up {uloGridChargeUsed.toFixed(0)} kWh + small remainder {uloLeftoverKwh.toFixed(0)} kWh</div>
                         </div>
                         
                         <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-300">
                           <div className="flex items-center justify-between mb-2">
                             <span className="font-bold text-gray-700">Cost of energy bought from grid</span>
                             <div className="text-right">
                               <div className="text-2xl font-bold text-green-600">{uloLeftoverCostPercent.toFixed(2)}%</div>
                               <div className="text-xs text-gray-600">of total bill</div>
                             </div>
                           </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                            <Info size={14} className="text-red-500 flex-shrink-0" />
                            <span className="text-xs text-gray-600">
                              Charged at your cheapest rate {(uloLeftoverRate * 100).toFixed(1)}¢/kWh: battery top‑up {uloGridChargeUsed.toFixed(0)} kWh + small remainder {uloLeftoverKwh.toFixed(0)} kWh • vs on‑peak {uloOnPeakRate.toFixed(1)}¢/kWh
                            </span>
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

