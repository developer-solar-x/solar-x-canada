'use client'

import { useState, useEffect } from 'react'
import { Battery, DollarSign, TrendingUp, Calendar, ArrowRight, Check, ChevronDown, Percent, Zap, Clock, Info, TrendingDown, BarChart3, Lightbulb, Home, Moon, Sun, Award } from 'lucide-react'
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
import {
  calculateSimplePeakShaving,
  calculateSimpleMultiYear,
  UsageDistribution,
  DEFAULT_TOU_DISTRIBUTION,
  DEFAULT_ULO_DISTRIBUTION,
  SimplePeakShavingResult
} from '../../lib/simple-peak-shaving'

interface StepBatteryPeakShavingSimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack: () => void
}

export function StepBatteryPeakShavingSimple({ data, onComplete, onBack }: StepBatteryPeakShavingSimpleProps) {
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
  
  const defaultUsage = data.energyUsage?.annualKwh || 
                       (data.monthlyBill ? calculateUsageFromBill(data.monthlyBill) : null) || 
                       data.annualUsageKwh || 
                       14000
  
  // State
  const [annualUsageKwh, setAnnualUsageKwh] = useState<number>(defaultUsage)
  const [selectedBattery, setSelectedBattery] = useState<string>(data.selectedBattery || 'renon-16')
  const [comparisonBatteries, setComparisonBatteries] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [touDistribution, setTouDistribution] = useState<UsageDistribution>(DEFAULT_TOU_DISTRIBUTION)
  const [uloDistribution, setUloDistribution] = useState<UsageDistribution>(DEFAULT_ULO_DISTRIBUTION)
  const [touResults, setTouResults] = useState<Map<string, {result: SimplePeakShavingResult, projection: any}>>(new Map())
  const [uloResults, setUloResults] = useState<Map<string, {result: SimplePeakShavingResult, projection: any}>>(new Map())
  const [showCustomRates, setShowCustomRates] = useState(false)
  
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

  // Calculate TOU results for all batteries
  useEffect(() => {
    const batteriesToCalculate = [selectedBattery, ...comparisonBatteries]
    const newResults = new Map<string, {result: SimplePeakShavingResult, projection: any}>()
    const touRatePlan = getCustomTouRatePlan()

    // Get solar rebate if solar system exists
    const systemSizeKw = data.estimate?.system?.sizeKw || 0
    const solarRebatePerKw = 500
    const solarMaxRebate = 5000
    const solarRebate = systemSizeKw > 0 ? Math.min(systemSizeKw * solarRebatePerKw, solarMaxRebate) : 0

    batteriesToCalculate.forEach(batteryId => {
      const battery = BATTERY_SPECS.find(b => b.id === batteryId)
      if (!battery) return

      const calcResult = calculateSimplePeakShaving(
        annualUsageKwh,
        battery,
        touRatePlan,
        touDistribution
      )

      // Calculate battery rebate
      const batteryRebate = Math.min(battery.nominalKwh * 300, 5000)
      // Calculate net cost including both battery and solar rebates
      const netCost = battery.price - batteryRebate - solarRebate
      const multiYear = calculateSimpleMultiYear(calcResult, netCost, 0.05, 25)

      newResults.set(batteryId, { result: calcResult, projection: multiYear })
    })

    setTouResults(newResults)
  }, [annualUsageKwh, selectedBattery, comparisonBatteries, touDistribution, customRates.tou, data.estimate])

  // Calculate ULO results for all batteries
  useEffect(() => {
    const batteriesToCalculate = [selectedBattery, ...comparisonBatteries]
    const newResults = new Map<string, {result: SimplePeakShavingResult, projection: any}>()
    const uloRatePlan = getCustomUloRatePlan()

    // Get solar rebate if solar system exists
    const systemSizeKw = data.estimate?.system?.sizeKw || 0
    const solarRebatePerKw = 500
    const solarMaxRebate = 5000
    const solarRebate = systemSizeKw > 0 ? Math.min(systemSizeKw * solarRebatePerKw, solarMaxRebate) : 0

    batteriesToCalculate.forEach(batteryId => {
      const battery = BATTERY_SPECS.find(b => b.id === batteryId)
      if (!battery) return

      const calcResult = calculateSimplePeakShaving(
        annualUsageKwh,
        battery,
        uloRatePlan,
        uloDistribution
      )

      // Calculate battery rebate
      const batteryRebate = Math.min(battery.nominalKwh * 300, 5000)
      // Calculate net cost including both battery and solar rebates
      const netCost = battery.price - batteryRebate - solarRebate
      const multiYear = calculateSimpleMultiYear(calcResult, netCost, 0.05, 25)

      newResults.set(batteryId, { result: calcResult, projection: multiYear })
    })

    setUloResults(newResults)
  }, [annualUsageKwh, selectedBattery, comparisonBatteries, uloDistribution, customRates.ulo, data.estimate])

  // Toggle comparison battery
  const toggleComparisonBattery = (batteryId: string) => {
    if (batteryId === selectedBattery) return
    
    if (comparisonBatteries.includes(batteryId)) {
      setComparisonBatteries(comparisonBatteries.filter(id => id !== batteryId))
    } else {
      setComparisonBatteries([...comparisonBatteries, batteryId])
    }
  }

  const handleComplete = () => {
    const selectedTouResult = touResults.get(selectedBattery)
    const selectedUloResult = uloResults.get(selectedBattery)
    onComplete({
      ...data,
      selectedBattery,
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
        },
        comparisonBatteries
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-medium">System Size</p>
              <p className="text-xl font-bold text-green-600">{data.estimate.system.sizeKw} kW</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Solar Panels</p>
              <p className="text-xl font-bold text-green-600">{data.estimate.system.numPanels}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Annual Production</p>
              <p className="text-xl font-bold text-green-600">{Math.round(data.estimate.production.annualKwh).toLocaleString()} kWh</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Solar Offset</p>
              <p className="text-xl font-bold text-green-600">
                {Math.min(100, Math.round((data.estimate.production.annualKwh / (annualUsageKwh || 1)) * 100))}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Solar Rebate Available</p>
              <p className="text-xl font-bold text-green-600">
                ${Math.min(data.estimate.system.sizeKw * 500, 5000).toLocaleString()}
              </p>
            </div>
          </div>
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
          const solarNet = data.estimate?.costs?.netCost || 0
          const solarAnnual = data.estimate?.savings?.annualSavings || 0
          const tou = touResults.get(selectedBattery)
          const ulo = uloResults.get(selectedBattery)
          const batteryTouNet = tou?.projection?.netCost || 0
          const batteryUloNet = ulo?.projection?.netCost || 0
          const batteryTouAnnual = tou?.result?.annualSavings || 0
          const batteryUloAnnual = ulo?.result?.annualSavings || 0

          const fullTouNet = solarNet + batteryTouNet
          const fullUloNet = solarNet + batteryUloNet
          const fullTouAnnual = solarAnnual + batteryTouAnnual
          const fullUloAnnual = solarAnnual + batteryUloAnnual

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
                  Net Cost = ${solarNet.toLocaleString()} + ${batteryTouNet.toLocaleString()} = <span className="font-semibold">${fullTouNet.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-700">
                  Annual Savings = ${solarAnnual.toLocaleString()} + ${batteryTouAnnual.toLocaleString()} = <span className="font-semibold">${fullTouAnnual.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  Payback = {fullTouNet <= 0 ? '0' : fullTouAnnual > 0 ? `${(fullTouNet).toLocaleString()} ÷ ${fullTouAnnual.toLocaleString()}` : 'N/A'} = <span className="font-bold text-navy-600">{fullTouPayback === Infinity ? 'N/A' : `${fullTouPayback.toFixed(1)} years`}</span>
                </div>
              </div>

              {/* ULO Sample */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-semibold text-navy-600 mb-1">ULO Sample</div>
                <div className="text-xs text-gray-700">
                  Net Cost = ${solarNet.toLocaleString()} + ${batteryUloNet.toLocaleString()} = <span className="font-semibold">${fullUloNet.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-700">
                  Annual Savings = ${solarAnnual.toLocaleString()} + ${batteryUloAnnual.toLocaleString()} = <span className="font-semibold">${fullUloAnnual.toLocaleString()}</span>
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
              value={annualUsageKwh}
              onChange={(e) => setAnnualUsageKwh(Number(e.target.value))}
              className="w-full px-4 py-4 pr-16 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold text-navy-600 shadow-sm transition-all"
              min="1000"
              max="50000"
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

      {/* Battery Selection - Dropdown */}
      <div className="card p-6 shadow-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-red-100 rounded-lg">
            <Battery className="text-red-500" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-navy-500">Choose Your Battery</h3>
        </div>
        
        <div className="space-y-5">
          {/* Dropdown for main battery selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-navy-600 mb-2">
              <Award className="text-red-500" size={16} />
              Select Battery Model
            </label>
             <div className="relative">
               <select
                 value={selectedBattery}
                 onChange={(e) => setSelectedBattery(e.target.value)}
                 className="w-full px-4 py-4 pr-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold text-navy-600 bg-white shadow-sm appearance-none cursor-pointer transition-all"
               >
                 {BATTERY_SPECS.map(battery => (
                   <option key={battery.id} value={battery.id}>
                     {battery.brand} {battery.model}
                   </option>
                 ))}
               </select>
               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={24} />
             </div>
          </div>

          {/* Selected Battery Info Card */}
          {(() => {
            const battery = BATTERY_SPECS.find(b => b.id === selectedBattery)
            if (!battery) return null
            const financials = calculateBatteryFinancials(battery)
            
            // Calculate solar rebate if solar system exists
            const systemSizeKw = data.estimate?.system?.sizeKw || 0
            const solarRebatePerKw = 500
            const solarMaxRebate = 5000
            const solarRebate = systemSizeKw > 0 ? Math.min(systemSizeKw * solarRebatePerKw, solarMaxRebate) : 0
            
            // Calculate total rebates (battery + solar)
            const totalRebates = financials.rebate + solarRebate
            
            // Calculate net cost with solar rebate
            const netCostWithSolarRebate = battery.price - totalRebates
            
            return (
              <div className="p-5 bg-gradient-to-br from-red-50 to-white border-2 border-red-500 rounded-xl shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Battery size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-bold text-navy-500 text-xl">{battery.brand} {battery.model}</div>
                      <div className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-semibold">
                        SELECTED
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <DollarSign size={18} className="text-gray-500" />
                        <div>
                          <div className="text-xs text-gray-600 font-medium">Price</div>
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

          {/* Compare with other batteries */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 transition-colors"
            >
              {showComparison ? (
                <>
                  <ChevronDown size={16} className="transform rotate-180 transition-transform" />
                  Hide Comparison
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Compare with Other Batteries
                </>
              )}
            </button>
            
            {showComparison && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-600 font-medium">
                  Select additional batteries to compare:
                </p>
                 <div className="flex flex-wrap gap-2">
                   {BATTERY_SPECS.filter(b => b.id !== selectedBattery).map(battery => (
                     <button
                       key={battery.id}
                       onClick={() => toggleComparisonBattery(battery.id)}
                       className={`px-3 py-2 rounded-lg text-sm border-2 transition-all flex items-center gap-1 ${
                         comparisonBatteries.includes(battery.id)
                           ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-sm'
                           : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                       }`}
                     >
                       {comparisonBatteries.includes(battery.id) && <Check size={14} />}
                       {battery.brand} {battery.model}
                     </button>
                   ))}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

       {/* Results - Selected Battery - Both TOU and ULO */}
       {touResults.get(selectedBattery) && uloResults.get(selectedBattery) && (() => {
         const touData = touResults.get(selectedBattery)!
         const uloData = uloResults.get(selectedBattery)!
         const battery = BATTERY_SPECS.find(b => b.id === selectedBattery)!
         
         return (
         <div className="card p-8 bg-gradient-to-br from-white to-gray-50 border-2 border-navy-300 shadow-xl">
           <div className="flex items-center justify-center gap-3 mb-8">
             <div className="p-3 bg-gradient-to-br from-navy-500 to-navy-600 rounded-xl shadow-lg">
               <TrendingUp className="text-white" size={32} />
             </div>
             <h3 className="text-3xl font-bold text-navy-500">
               {battery.brand} {battery.model} - Savings Comparison
             </h3>
           </div>
           
           {/* Big Numbers - Both Plans */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-red-300 transition-all">
               <div className="flex items-center gap-2 mb-3">
                 <div className="p-2 bg-red-100 rounded-lg">
                   <DollarSign className="text-red-500" size={22} />
                 </div>
                 <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Annual Savings</div>
               </div>
               <div className="space-y-2">
                 <div>
                   <div className="text-xs text-gray-500">TOU Plan</div>
                   <div className="text-2xl font-bold text-red-600">
                     ${touData.result.annualSavings.toFixed(0)}
                   </div>
                   <div className="text-xs text-gray-600">
                     ${touData.result.monthlySavings.toFixed(0)}/month
                   </div>
                 </div>
                 <div className="border-t border-gray-200 pt-2">
                   <div className="text-xs text-gray-500">ULO Plan</div>
                   <div className="text-2xl font-bold text-red-600">
                     ${uloData.result.annualSavings.toFixed(0)}
                   </div>
                   <div className="text-xs text-gray-600">
                     ${uloData.result.monthlySavings.toFixed(0)}/month
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
                 const solarNetCost = data.estimate?.costs?.netCost || 0
                 const solarAnnualSavings = data.estimate?.savings?.annualSavings || 0
                 const batteryTouNet = touData.projection.netCost || 0
                 const batteryUloNet = uloData.projection.netCost || 0
                 const batteryTouAnnual = touData.result.annualSavings || 0
                 const batteryUloAnnual = uloData.result.annualSavings || 0

                 const fullTouDen = solarAnnualSavings + batteryTouAnnual
                 const fullUloDen = solarAnnualSavings + batteryUloAnnual
                 const fullTouNet = solarNetCost + batteryTouNet
                 const fullUloNet = solarNetCost + batteryUloNet

                 const fullTouPayback = fullTouNet <= 0 ? 0 : (fullTouDen > 0 ? fullTouNet / fullTouDen : Infinity)
                 const fullUloPayback = fullUloNet <= 0 ? 0 : (fullUloDen > 0 ? fullUloNet / fullUloDen : Infinity)

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
               <div className="flex items-center gap-2 mb-3">
                 <div className="p-2 bg-green-100 rounded-lg">
                   <TrendingUp className="text-green-600" size={22} />
                 </div>
                 <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">25-Year Profit</div>
               </div>
               <div className="space-y-2">
                 <div>
                   <div className="text-xs text-gray-500">TOU Plan</div>
                   <div className="text-2xl font-bold text-green-600">
                     ${touData.projection.netProfit25Year.toLocaleString()}
                   </div>
                 </div>
                 <div className="border-t border-gray-200 pt-2">
                   <div className="text-xs text-gray-500">ULO Plan</div>
                   <div className="text-2xl font-bold text-green-600">
                     ${uloData.projection.netProfit25Year.toLocaleString()}
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

         </div>
         )
       })()}

      {/* Battery Comparison Table */}
      {comparisonBatteries.length > 0 && (
        <div className="card p-8 shadow-xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-navy-100 rounded-lg">
              <BarChart3 className="text-navy-500" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-navy-500">Battery Comparison - TOU vs ULO</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* TOU Comparison */}
            <div className="border-2 border-gray-300 rounded-xl p-5 bg-white shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-navy-500 rounded-lg">
                  <Sun className="text-white" size={16} />
                </div>
                <h4 className="font-bold text-navy-500 text-lg">Time-of-Use Results</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-navy-600">Battery</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-navy-600">Savings</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-navy-600">Payback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {touResults.get(selectedBattery) && (() => {
                      const battery = BATTERY_SPECS.find(b => b.id === selectedBattery)!
                      const { result, projection } = touResults.get(selectedBattery)!
                      return (
                        <tr key={selectedBattery} className="bg-red-50 font-semibold">
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <Battery size={12} className="text-red-500" />
                              <span className="text-xs text-navy-600">{battery.brand} {battery.model}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right text-green-600 text-xs">${result.annualSavings.toFixed(0)}/yr</td>
                          <td className="px-2 py-2 text-right text-xs">{projection.paybackYears.toFixed(1)}y</td>
                        </tr>
                      )
                    })()}
                    {comparisonBatteries.map(batteryId => {
                      const battery = BATTERY_SPECS.find(b => b.id === batteryId)
                      if (!battery || !touResults.get(batteryId)) return null
                      const { result, projection } = touResults.get(batteryId)!
                      return (
                        <tr key={batteryId} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-xs text-navy-600">{battery.brand} {battery.model}</td>
                          <td className="px-2 py-2 text-right text-green-600 text-xs">${result.annualSavings.toFixed(0)}/yr</td>
                          <td className="px-2 py-2 text-right text-xs">{projection.paybackYears.toFixed(1)}y</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ULO Comparison */}
            <div className="border-2 border-gray-300 rounded-xl p-5 bg-white shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-red-500 rounded-lg">
                  <Moon className="text-white" size={16} />
                </div>
                <h4 className="font-bold text-navy-500 text-lg">Ultra-Low Overnight Results</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-navy-600">Battery</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-navy-600">Savings</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-navy-600">Payback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {uloResults.get(selectedBattery) && (() => {
                      const battery = BATTERY_SPECS.find(b => b.id === selectedBattery)!
                      const { result, projection } = uloResults.get(selectedBattery)!
                      return (
                        <tr key={selectedBattery} className="bg-red-50 font-semibold">
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <Battery size={12} className="text-red-500" />
                              <span className="text-xs text-navy-600">{battery.brand} {battery.model}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right text-green-600 text-xs">${result.annualSavings.toFixed(0)}/yr</td>
                          <td className="px-2 py-2 text-right text-xs">{projection.paybackYears.toFixed(1)}y</td>
                        </tr>
                      )
                    })()}
                    {comparisonBatteries.map(batteryId => {
                      const battery = BATTERY_SPECS.find(b => b.id === batteryId)
                      if (!battery || !uloResults.get(batteryId)) return null
                      const { result, projection } = uloResults.get(batteryId)!
                      return (
                        <tr key={batteryId} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-xs text-navy-600">{battery.brand} {battery.model}</td>
                          <td className="px-2 py-2 text-right text-green-600 text-xs">${result.annualSavings.toFixed(0)}/yr</td>
                          <td className="px-2 py-2 text-right text-xs">{projection.paybackYears.toFixed(1)}y</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Comparison Summary */}
          <div className="mt-6 p-5 bg-gradient-to-r from-navy-50 to-gray-50 rounded-xl border-2 border-navy-300 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-navy-500 rounded-lg flex-shrink-0">
                <Lightbulb className="text-white" size={20} />
              </div>
              <div>
                <p className="text-base font-bold text-navy-600 mb-2 flex items-center gap-2">
                  <Info size={18} className="text-navy-500" />
                  Comparison Tip
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Compare the annual savings and payback periods for each rate plan. 
                  The best choice depends on your energy usage patterns and whether you can shift consumption to overnight hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-8 gap-4">
        <button
          onClick={onBack}
          className="px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all font-bold text-lg shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <ArrowRight size={20} className="rotate-180" />
          Back
        </button>
        <button
          onClick={handleComplete}
          className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          Continue to Next Step
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}

