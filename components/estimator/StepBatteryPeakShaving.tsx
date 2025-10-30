'use client'

import { useState, useEffect } from 'react'
import { Check, Zap, Battery, DollarSign, TrendingDown, TrendingUp, Info, AlertTriangle, CheckCircle, Calendar, BarChart3, Lightbulb, Clock, Repeat, ArrowDownCircle, ArrowUpCircle, Shield, PiggyBank } from 'lucide-react'
import { 
  BATTERY_SPECS, 
  BatterySpec, 
  calculateBatteryFinancials,
  BatteryFinancials 
} from '../../config/battery-specs'
import { 
  RATE_PLANS, 
  RatePlan, 
  ULO_RATE_PLAN, 
  TOU_RATE_PLAN 
} from '../../config/rate-plans'
import {
  generateAnnualUsagePattern,
  aggregateToMonthly
} from '../../lib/usage-parser'
import {
  analyzeAnnualDispatch,
  calculateMultiYearProjection,
  compareBatteryOptions,
  BatteryComparison,
  AnnualDispatchAnalysis,
  UsageDataPoint
} from '../../lib/battery-dispatch'
import { 
  calculateMonthlySavings, 
  calculateMonthlySavingsStats,
  MonthlySavings 
} from '../../lib/monthly-savings-calculator'
import { UsageInputSelector } from './UsageInputSelector'

// Props interface for the component
interface StepBatteryPeakShavingProps {
  data: any // Estimator data from previous steps
  onComplete: (data: any) => void
  onBack: () => void
}

export function StepBatteryPeakShaving({ data, onComplete, onBack }: StepBatteryPeakShavingProps) {
  // Calculate default annual usage from previous steps
  // Priority: energyUsage > monthlyBill calculation > fallback
  const calculateUsageFromBill = (monthlyBill: number) => {
    // All-in blended rate for Ontario (includes energy + delivery + regulatory + HST)
    // Energy charges: 9.8-39.1¢/kWh (varies by TOU/ULO)
    // Delivery charges: ~$50-70/month fixed + variable
    // Regulatory charges: ~$5-15/month
    // HST: 13% on top
    // Typical all-in rate: 22-24¢/kWh for residential customers
    const avgRate = 0.223 // 22.3¢/kWh blended rate (includes all charges)
    const monthlyKwh = monthlyBill / avgRate
    return Math.round(monthlyKwh * 12)
  }
  
  const defaultUsage = data.energyUsage?.annualKwh || 
                       (data.monthlyBill ? calculateUsageFromBill(data.monthlyBill) : null) || 
                       data.annualUsageKwh || 
                       18000 // Default to 18,000 kWh for battery systems (higher usage households)
  
  // State management
  const [selectedRatePlan, setSelectedRatePlan] = useState<RatePlan>(ULO_RATE_PLAN)
  const [selectedBattery, setSelectedBattery] = useState<string>(data.selectedBattery || 'renon-16')
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonBatteries, setComparisonBatteries] = useState<string[]>([])
  const [annualUsageKwh, setAnnualUsageKwh] = useState<number>(defaultUsage)
  const [usageData, setUsageData] = useState<UsageDataPoint[]>([])
  const [batteryComparisons, setBatteryComparisons] = useState<BatteryComparison[]>([])
  const [loading, setLoading] = useState(false)
  const [usageDataSource, setUsageDataSource] = useState<'csv' | 'monthly' | 'annual'>('annual')
  const [monthlySavingsData, setMonthlySavingsData] = useState<Map<string, MonthlySavings[]>>(new Map())

  // Calculate usage data when inputs change (only for annual input mode)
  useEffect(() => {
    // Only auto-generate if using annual input mode
    if (usageDataSource === 'annual') {
      const newUsageData = generateAnnualUsagePattern(
        annualUsageKwh,
        selectedRatePlan,
        new Date().getFullYear(),
        true // Use seasonal adjustment
      )
      setUsageData(newUsageData)
    }
  }, [annualUsageKwh, selectedRatePlan, usageDataSource])
  
  // Handle usage data change from UsageInputSelector
  const handleUsageDataChange = (data: UsageDataPoint[], source: 'csv' | 'monthly' | 'annual') => {
    setUsageData(data)
    setUsageDataSource(source)
  }

  // Calculate battery comparisons when usage data or selected battery changes
  useEffect(() => {
    if (usageData.length === 0) return

    setLoading(true)
    
    // Run calculation asynchronously to avoid blocking UI
    const calculateAsync = async () => {
    // Always calculate for the selected battery
    const batteriesToAnalyze = [selectedBattery]
    
    // Add comparison batteries if comparison mode is enabled
    if (showComparison && comparisonBatteries.length > 0) {
      batteriesToAnalyze.push(...comparisonBatteries)
    }
    
    // Get battery specs
    const batteries = batteriesToAnalyze
      .map(id => BATTERY_SPECS.find(b => b.id === id))
      .filter(b => b !== undefined) as BatterySpec[]

      // Compare batteries (wrapped in setTimeout to allow UI to update)
      await new Promise(resolve => setTimeout(resolve, 0))
      
    const comparisons = compareBatteryOptions(
      usageData,
      batteries,
      selectedRatePlan,
      0.05 // 5% rate escalation
    )

      // Calculate monthly savings for each battery
      const newMonthlySavingsMap = new Map<string, MonthlySavings[]>()
      batteries.forEach(battery => {
        const monthlySavings = calculateMonthlySavings(usageData, battery, selectedRatePlan)
        newMonthlySavingsMap.set(battery.id, monthlySavings)
      })

    setBatteryComparisons(comparisons)
      setMonthlySavingsData(newMonthlySavingsMap)
    setLoading(false)
    }
    
    calculateAsync()
  }, [usageData, selectedBattery, showComparison, comparisonBatteries, selectedRatePlan])

  // Toggle comparison battery
  const toggleComparisonBattery = (batteryId: string) => {
    if (batteryId === selectedBattery) return // Can't compare with itself
    
    if (comparisonBatteries.includes(batteryId)) {
      setComparisonBatteries(comparisonBatteries.filter(id => id !== batteryId))
    } else {
      setComparisonBatteries([...comparisonBatteries, batteryId])
    }
  }

  // Handle completion
  const handleComplete = () => {
    // Get the selected battery details
    const selectedBatteryData = batteryComparisons.find(
      comp => comp.battery.id === selectedBattery
    )
    
    onComplete({
      ...data,
      selectedBattery,
      batteryDetails: selectedBatteryData,
      peakShaving: {
        ratePlan: selectedRatePlan.id,
        annualUsageKwh,
        selectedBattery,
        comparisons: batteryComparisons
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-navy-500 mb-2">
          Peak-Shaving Battery Calculator
        </h2>
        <p className="text-gray-600">
          See how much you can save by charging your battery during cheap hours and using it during expensive peak times
        </p>
      </div>

      {/* Input Section */}
      <div className="card p-6 space-y-4">
        <h3 className="text-xl font-semibold text-navy-500 mb-4">Your Details</h3>
        
        {/* Show estimated monthly bill from annual usage */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            Estimated monthly bill: <strong>${Math.round((annualUsageKwh * 0.223) / 12).toLocaleString()}/month</strong>
          </p>
        </div>
        
        {/* Usage Input Selector - NEW COMPONENT */}
        <UsageInputSelector
          ratePlan={selectedRatePlan}
          annualUsageKwh={annualUsageKwh}
          onUsageDataChange={handleUsageDataChange}
          onAnnualUsageChange={setAnnualUsageKwh}
        />
        
        {/* Usage Warnings */}
        {annualUsageKwh > 30000 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              🚨 <strong>Warning:</strong> Your calculated usage of {annualUsageKwh.toLocaleString()} kWh/year is extremely high for a residential property (average is 10,000-15,000 kWh/year).
            </p>
            <p className="text-xs text-red-700 mt-1">
              This may indicate incorrect data. Please verify. A typical $200/month bill = ~10,700 kWh/year, $260/month = ~14,000 kWh/year.
            </p>
          </div>
        )}

        {/* Rate Plan Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Your Rate Plan
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RATE_PLANS.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedRatePlan(plan)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedRatePlan.id === plan.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <div className="font-semibold text-navy-500">{plan.name}</div>
                <div className="text-sm text-gray-600 mt-1">{plan.description}</div>
                {selectedRatePlan.id === plan.id && (
                  <div className="mt-2 text-sm text-red-600 font-medium">
                    ✓ Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Battery Selection - Primary Choice */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-navy-500 mb-2">
          Choose Your Battery
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Select the battery system for your home. This will be included in your quote.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BATTERY_SPECS.map(battery => {
            const financials = calculateBatteryFinancials(battery)
            const isSelected = selectedBattery === battery.id
            
            return (
              <button
                key={battery.id}
                onClick={() => setSelectedBattery(battery.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'border-red-500 bg-red-50 shadow-lg'
                    : 'border-gray-300 hover:border-red-300 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-navy-500">{battery.brand}</div>
                    <div className="text-sm text-gray-600">{battery.model}</div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{battery.usableKwh} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">${battery.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rebate:</span>
                    <span className="font-medium text-green-600">
                      -${financials.rebate.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold text-gray-700">Net Cost:</span>
                    <span className="font-bold text-navy-500">
                      ${financials.netPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {battery.description && (
                  <p className="text-xs text-gray-500 mt-2">{battery.description}</p>
                )}
              </button>
            )
          })}
        </div>
        
        {/* Optional: Compare with other batteries */}
        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            {showComparison ? '− Hide' : '+ Compare with other options'}
          </button>
          
          {showComparison && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-3">
                Select additional batteries to compare (optional):
              </p>
              <div className="flex flex-wrap gap-2">
                {BATTERY_SPECS.filter(b => b.id !== selectedBattery).map(battery => (
                  <button
                    key={battery.id}
                    onClick={() => toggleComparisonBattery(battery.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      comparisonBatteries.includes(battery.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {battery.brand} {battery.model}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Battery Comparison Results */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Calculating savings...</p>
        </div>
      ) : batteryComparisons.length > 0 && (
        <div className="space-y-6">
          {/* Selected Battery Summary */}
          {batteryComparisons.filter(comp => comp.battery.id === selectedBattery).map(comparison => (
            <div key="selected-summary" className="card p-6 border-2 border-red-500 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                    <Battery size={24} className="text-white" />
                </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">SELECTED</span>
                    </div>
                    <h3 className="text-xl font-bold text-navy-500">
                      {comparison.battery.brand} {comparison.battery.model}
                </h3>
                    <p className="text-sm text-gray-600">{comparison.battery.usableKwh} kWh Usable Capacity</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-navy-50 to-navy-100 p-4 rounded-xl border border-navy-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="text-navy-500" size={16} />
                    <div className="text-xs font-semibold text-navy-600 uppercase tracking-wide">Net Cost</div>
                  </div>
                  <div className="text-2xl font-bold text-navy-600">
                    ${comparison.multiYearProjection.netCost.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">After rebates</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="text-blue-600" size={16} />
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Year 1 Savings</div>
                  </div>
                  <div className={`text-2xl font-bold ${comparison.firstYearAnalysis.totalSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ${comparison.firstYearAnalysis.totalSavings.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{(comparison.firstYearAnalysis.totalSavings / 12).toFixed(0)}/month</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-gray-600" size={16} />
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Payback</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-700">
                    {comparison.metrics.paybackYears > 0 && comparison.metrics.paybackYears < 100 ? `${comparison.metrics.paybackYears.toFixed(1)}y` : 'N/A'}
                </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {comparison.metrics.paybackYears > 0 && comparison.metrics.paybackYears < 100 ? 'Break-even period' : 'Not profitable'}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-red-600" size={16} />
                    <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">25-Year Total</div>
                  </div>
                  <div className={`text-2xl font-bold ${comparison.multiYearProjection.netProfit25Year >= 0 ? 'text-navy-600' : 'text-red-600'}`}>
                    ${comparison.multiYearProjection.netProfit25Year.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Net profit</div>
                </div>
              </div>
              
              {/* Profitability Check */}
              {comparison.firstYearAnalysis.totalSavings < 0 && (
                <div className="mt-4 p-5 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-800 mb-2">
                        Battery Not Cost-Effective with Current Usage Pattern
                      </p>
                      <p className="text-sm text-red-700 mb-3">
                        Based on your usage pattern, the battery would cost more to operate than it saves. Batteries work best when you have high usage during peak hours (4PM-9PM on weekdays).
                      </p>
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-900 mb-2">Consider these options:</p>
                        <ul className="text-sm text-red-800 space-y-1.5">
                          <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>Moving high-energy appliances (EV charging, pool, hot tub) to peak hours</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>Increasing overall usage to 18,000+ kWh/year</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>Confirming you're on ULO or TOU rates (not flat rate)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>A grid-tied solar system without battery may be more economical</span>
                          </li>
                      </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Performance Metrics */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-navy-50 rounded-lg p-3 border border-navy-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Repeat className="text-navy-500" size={14} />
                    <span className="text-xs font-semibold text-navy-600 uppercase">Cycles/Year</span>
                  </div>
                  <div className="text-lg font-bold text-navy-600">{comparison.firstYearAnalysis.cyclesPerYear}</div>
                  <div className="text-xs text-gray-600">Active days</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="text-blue-500" size={14} />
                    <span className="text-xs font-semibold text-blue-600 uppercase">Energy Shifted</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{comparison.firstYearAnalysis.totalKwhShifted.toFixed(0)} kWh</div>
                  <div className="text-xs text-gray-600">Per year</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="text-gray-600" size={14} />
                    <span className="text-xs font-semibold text-gray-700 uppercase">Usage Pattern</span>
                  </div>
                  <div className="text-lg font-bold text-gray-700">{annualUsageKwh.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">kWh/year</div>
                </div>
              </div>

              {/* Technical Details Accordion */}
              <details className="mt-4 group">
                <summary className="flex items-center gap-2 text-sm text-navy-500 cursor-pointer hover:text-navy-600 font-semibold">
                  <Info size={16} />
                  <span>View Technical Details</span>
                  <svg className="w-4 h-4 ml-auto transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm font-semibold text-navy-600 mb-3">Calculation Details</div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Original Annual Bill:</span>
                      <span className="font-semibold text-navy-600">${comparison.firstYearAnalysis.originalAnnualCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Optimized Annual Bill:</span>
                      <span className="font-semibold text-blue-600">${comparison.firstYearAnalysis.optimizedAnnualCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Battery Capacity:</span>
                      <span className="font-semibold text-navy-600">{comparison.battery.usableKwh} kWh</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Inverter Power:</span>
                      <span className="font-semibold text-navy-600">{comparison.battery.inverterKw} kW</span>
                    </div>
                  </div>
                </div>
              </details>
              
              <div className="mt-5 p-4 bg-navy-50 border border-navy-200 rounded-lg">
                <p className="text-sm text-navy-700 flex items-start gap-2">
                  <CheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                  <span>This battery will be included in your custom quote. You can review all details in the next step.</span>
                </p>
              </div>
            </div>
          ))}

          {/* Educational Section - How Battery Savings Work */}
          {batteryComparisons.filter(comp => comp.battery.id === selectedBattery).map(comparison => (
            <div key="education" className="space-y-6">
              {/* Rate Comparison Visual */}
              <div className="card p-6 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-navy-500 rounded-xl flex items-center justify-center">
                    <Lightbulb className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-500">Understanding Battery Arbitrage</h3>
                    <p className="text-sm text-gray-600">How your battery generates savings</p>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-500 via-navy-500 to-red-500 rounded-full mb-5"></div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  {/* Charging */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-300 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                        <ArrowDownCircle className="text-white" size={24} />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-navy-500">Charging</div>
                        <div className="text-xs font-semibold text-blue-700">
                          {selectedRatePlan.id === 'ulo' ? '11PM - 7AM Daily' : 'Off-Peak Hours'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <div className="text-3xl font-bold text-blue-600">
                        {selectedRatePlan.id === 'ulo' ? '3.9' : '9.8'}¢
                      </div>
                      <div className="text-sm text-gray-600">per kWh</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg p-2">
                      <Battery size={16} className="text-blue-500" />
                      <span className="font-semibold">{comparison.battery.usableKwh.toFixed(1)} kWh</span>
                      <span className="text-gray-600">stored daily</span>
                    </div>
                  </div>

                  {/* Discharging */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border-2 border-red-300 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-md">
                        <ArrowUpCircle className="text-white" size={24} />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-navy-500">Discharging</div>
                        <div className="text-xs font-semibold text-red-700">
                          {selectedRatePlan.id === 'ulo' ? '4PM - 9PM Weekdays' : 'On-Peak Hours'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <div className="text-3xl font-bold text-red-600">
                        {selectedRatePlan.id === 'ulo' ? '39.1' : '20.3'}¢
                      </div>
                      <div className="text-sm text-gray-600">per kWh</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg p-2">
                      <Zap size={16} className="text-red-500" />
                      <span className="font-semibold">{comparison.battery.usableKwh.toFixed(1)} kWh</span>
                      <span className="text-gray-600">used daily</span>
                    </div>
                  </div>
                </div>

                {/* Arbitrage Spread */}
                <div className="bg-gradient-to-r from-navy-500 via-navy-600 to-blue-600 text-white rounded-xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-white" size={20} />
                    <span className="text-sm font-bold uppercase tracking-wide">Your Savings Calculation</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs opacity-80 mb-1">Price Arbitrage</div>
                      <div className="text-2xl font-bold">
                        {selectedRatePlan.id === 'ulo' ? '35.2' : '10.5'}¢
                      </div>
                      <div className="text-xs opacity-80">profit per kWh</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-80 mb-1">Daily Profit</div>
                      <div className="text-2xl font-bold">
                        ${(comparison.firstYearAnalysis.totalSavings / comparison.firstYearAnalysis.cyclesPerYear).toFixed(2)}
                      </div>
                      <div className="text-xs opacity-80">per active day</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-80 mb-1">Annual Savings</div>
                      <div className="text-2xl font-bold">
                        ${comparison.firstYearAnalysis.totalSavings.toFixed(0)}
                      </div>
                      <div className="text-xs opacity-80">{comparison.firstYearAnalysis.cyclesPerYear} days/year</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-sm">
                    <DollarSign size={16} />
                    <span className="opacity-90">
                      Savings = ({selectedRatePlan.id === 'ulo' ? '39.1' : '20.3'}¢ - {selectedRatePlan.id === 'ulo' ? '3.9' : '9.8'}¢) × {comparison.battery.usableKwh.toFixed(1)} kWh × {comparison.firstYearAnalysis.cyclesPerYear} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Cycle Visualization */}
              <div className="card p-6 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-navy-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <BarChart3 className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-500">24-Hour Operation Cycle</h3>
                    <p className="text-sm text-gray-600">Typical {selectedRatePlan.id === 'ulo' ? 'weekday' : 'day'} battery activity</p>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-navy-500 to-blue-500 rounded-full mb-5"></div>

                {/* Timeline Visualization */}
                <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                  {/* Hour markers */}
                  <div className="absolute inset-x-0 bottom-0 flex text-xs text-gray-500">
                    {Array.from({length: 25}, (_, i) => i).map(hour => (
                      <div key={hour} className="flex-1 text-center border-l border-gray-300" style={{fontSize: '9px'}}>
                        {hour === 0 ? '12AM' : hour === 12 ? '12PM' : hour < 12 ? `${hour}` : hour === 24 ? '12' : `${hour-12}`}
                      </div>
                    ))}
                  </div>

                  {/* Rate periods */}
                  {selectedRatePlan.id === 'ulo' ? (
                    <>
                      {/* Ultra-low: 23:00-07:00 (charging) */}
                      <div className="absolute top-0 h-20 bg-blue-100 border-2 border-blue-500" style={{left: '0%', width: '29.17%'}}>
                        <div className="p-2 text-xs font-semibold text-blue-900">
                          Charging<br/>3.9¢/kWh
                        </div>
                      </div>
                      {/* Mid-peak: 07:00-16:00 */}
                      <div className="absolute top-0 h-20 bg-gray-100" style={{left: '29.17%', width: '37.5%'}}>
                        <div className="p-2 text-xs font-semibold text-gray-700">
                          Mid-Peak<br/>15.7¢
                        </div>
                      </div>
                      {/* On-peak: 16:00-21:00 (discharging) */}
                      <div className="absolute top-0 h-20 bg-red-100 border-2 border-red-500" style={{left: '66.67%', width: '20.83%'}}>
                        <div className="p-2 text-xs font-semibold text-red-900">
                          Discharge<br/>39.1¢/kWh
                        </div>
                      </div>
                      {/* Mid-peak: 21:00-23:00 */}
                      <div className="absolute top-0 h-20 bg-gray-100" style={{left: '87.5%', width: '8.33%'}}>
                      </div>
                      {/* Wrap: 23:00-24:00 */}
                      <div className="absolute top-0 h-20 bg-blue-100 border-2 border-blue-500" style={{left: '95.83%', width: '4.17%'}}>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Off-peak: 00:00-07:00 (charging) */}
                      <div className="absolute top-0 h-20 bg-blue-100 border-2 border-blue-500" style={{left: '0%', width: '29.17%'}}>
                        <div className="p-2 text-xs font-semibold text-blue-900">
                          Charging<br/>9.8¢/kWh
                        </div>
                      </div>
                      {/* On-peak: 07:00-11:00 (discharging) */}
                      <div className="absolute top-0 h-20 bg-red-100 border-2 border-red-500" style={{left: '29.17%', width: '16.67%'}}>
                        <div className="p-2 text-xs font-semibold text-red-900">
                          Discharge<br/>20.3¢/kWh
                        </div>
                      </div>
                      {/* Mid-peak: 11:00-17:00 */}
                      <div className="absolute top-0 h-20 bg-gray-100" style={{left: '45.84%', width: '25%'}}>
                        <div className="p-2 text-xs font-semibold text-gray-700">
                          Mid-Peak<br/>15.7¢
                        </div>
                      </div>
                      {/* On-peak: 17:00-19:00 (discharging) */}
                      <div className="absolute top-0 h-20 bg-red-100 border-2 border-red-500" style={{left: '70.84%', width: '8.33%'}}>
                      </div>
                      {/* Off-peak: 19:00-24:00 */}
                      <div className="absolute top-0 h-20 bg-blue-100" style={{left: '79.17%', width: '20.83%'}}>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
                    <span>Charging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-500 rounded"></div>
                    <span>Discharging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                    <span>Idle</span>
                  </div>
                </div>
              </div>

              {/* Is This Right For Me? */}
              <div className="card p-6 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-navy-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Info className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-500">Is This Battery Right for You?</h3>
                    <p className="text-sm text-gray-600">Compare your situation</p>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-navy-500 to-blue-500 rounded-full mb-5"></div>

                <div className="grid md:grid-cols-2 gap-5">
                  {/* Best For */}
                  <div className="bg-gradient-to-br from-blue-50 to-navy-50 rounded-xl p-5 border-2 border-blue-300 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <CheckCircle className="text-white" size={18} />
                      </div>
                      <div className="text-lg font-bold text-navy-600">Ideal Candidates</div>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-700">
                      <li className="flex items-start gap-3 bg-white/60 rounded-lg p-2">
                        <CheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                        <span><strong>{selectedRatePlan.name}</strong> customers</span>
                      </li>
                      <li className="flex items-start gap-3 bg-white/60 rounded-lg p-2">
                        <CheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                        <span>Usage above <strong>15,000 kWh/year</strong></span>
                      </li>
                      <li className="flex items-start gap-3 bg-white/60 rounded-lg p-2">
                        <CheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                        <span>High evening usage <strong>(4-9PM weekdays)</strong></span>
                      </li>
                      <li className="flex items-start gap-3 bg-white/60 rounded-lg p-2">
                        <CheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                        <span>EV charging, pool pumps, hot tubs</span>
                      </li>
                      <li className="flex items-start gap-3 bg-white/60 rounded-lg p-2">
                        <CheckCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                        <span>Want backup power during outages</span>
                      </li>
                    </ul>
                  </div>

                  {/* May Not Be Ideal */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-300 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="text-white" size={18} />
                      </div>
                      <div className="text-lg font-bold text-gray-700">Not Recommended For</div>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-700">
                      <li className="flex items-start gap-3 bg-white/60 rounded-lg p-2">
                        <AlertTriangle className="text-gray-500 flex-shrink-0 mt-0.5" size={16} />
                        <span>Usage below <strong>12,000 kWh/year</strong></span>
                      </li>
                      <li className="flex items-start gap-3 bg-white/60 rounded-lg p-2">
                        <AlertTriangle className="text-gray-500 flex-shrink-0 mt-0.5" size={16} />
                        <span>On <strong>flat rate</strong> (not TOU/ULO)</span>
                      </li>
                      <li className="flex items-start gap-3 bg-white/60 rounded-lg p-2">
                        <AlertTriangle className="text-gray-500 flex-shrink-0 mt-0.5" size={16} />
                        <span>Already shift usage to off-peak hours</span>
                      </li>
                      <li className="flex items-start gap-3 bg-white/60 rounded-lg p-2">
                        <AlertTriangle className="text-gray-500 flex-shrink-0 mt-0.5" size={16} />
                        <span>Low evening usage (away from home)</span>
                      </li>
                      <li className="flex items-start gap-3 bg-white/60 rounded-lg p-2">
                        <AlertTriangle className="text-gray-500 flex-shrink-0 mt-0.5" size={16} />
                        <span>Budget-constrained (solar-only is cheaper)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Your Situation */}
                <div className="mt-5 bg-gradient-to-br from-navy-50 to-blue-50 border-2 border-navy-300 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-navy-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-white" size={18} />
                    </div>
                    <div className="text-lg font-bold text-navy-600">Your Profile Analysis</div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                      {annualUsageKwh >= 15000 ? (
                        <CheckCircle className="text-blue-500 flex-shrink-0" size={18} />
                      ) : (
                        <AlertTriangle className="text-gray-500 flex-shrink-0" size={18} />
                      )}
                      <span className="text-navy-700">Annual usage: <strong>{annualUsageKwh.toLocaleString()} kWh/year</strong> 
                        <span className={`ml-2 text-xs font-semibold ${annualUsageKwh >= 15000 ? 'text-blue-600' : 'text-gray-600'}`}>
                          {annualUsageKwh >= 15000 ? '(Good for battery)' : '(Below ideal)'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                      <CheckCircle className="text-blue-500 flex-shrink-0" size={18} />
                      <span className="text-navy-700">Rate plan: <strong>{selectedRatePlan.name}</strong> 
                        <span className="ml-2 text-xs font-semibold text-blue-600">(Ideal for arbitrage)</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                      {comparison.firstYearAnalysis.totalSavings >= 0 ? (
                        <CheckCircle className="text-blue-500 flex-shrink-0" size={18} />
                      ) : (
                        <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />
                      )}
                      <span className="text-navy-700">Projected savings: <strong>${comparison.firstYearAnalysis.totalSavings.toFixed(0)}/year</strong> 
                        <span className={`ml-2 text-xs font-semibold ${comparison.firstYearAnalysis.totalSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {comparison.firstYearAnalysis.totalSavings >= 0 ? '(Profitable)' : '(Not profitable)'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="card p-6 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-navy-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Calendar className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-500">First Year Savings Breakdown</h3>
                    <p className="text-sm text-gray-600">Month-by-month performance</p>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-navy-500 to-blue-500 rounded-full mb-5"></div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="bg-gradient-to-br from-navy-50 to-navy-100 rounded-xl p-4 border border-navy-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={14} className="text-navy-500" />
                      <div className="text-xs font-semibold text-navy-600 uppercase tracking-wide">Monthly Range</div>
                    </div>
                    {(() => {
                      const batterySavings = monthlySavingsData.get(comparison.battery.id) || []
                      if (batterySavings.length > 0) {
                        const stats = calculateMonthlySavingsStats(batterySavings)
                        return (
                          <>
                            <div className="text-2xl font-bold text-navy-600">
                              ${stats.minMonthlySavings.toFixed(0)}-${stats.maxMonthlySavings.toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-600">
                              {stats.minMonth.slice(0, 3)} to {stats.maxMonth.slice(0, 3)}
                            </div>
                          </>
                        )
                      }
                      return (
                        <div className="text-2xl font-bold text-navy-600">
                          ${(comparison.firstYearAnalysis.totalSavings / 12).toFixed(0)}
                        </div>
                      )
                    })()}
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={14} className="text-blue-500" />
                      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Weekdays</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      ${((comparison.firstYearAnalysis.totalSavings / comparison.firstYearAnalysis.cyclesPerYear) * 21).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600">~21 days/month</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-gray-500" />
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Weekends</div>
                    </div>
                    <div className="text-xl font-bold text-gray-600">
                      $0
                    </div>
                    <div className="text-xs text-gray-600">No on-peak</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat size={14} className="text-red-500" />
                      <div className="text-xs font-semibold text-red-600 uppercase tracking-wide">Per Cycle</div>
                    </div>
                    <div className="text-xl font-bold text-red-600">
                      ${(comparison.firstYearAnalysis.totalSavings / comparison.firstYearAnalysis.cyclesPerYear).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">Daily profit</div>
                  </div>
                </div>

                {/* Variable monthly savings bar chart */}
                <div className="space-y-2">
                  {(() => {
                    // Get monthly savings data for this battery
                    const batterySavings = monthlySavingsData.get(comparison.battery.id) || []
                    
                    // If no data, fall back to equal distribution
                    if (batterySavings.length === 0) {
                      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => {
                        const monthlySavings = comparison.firstYearAnalysis.totalSavings / 12
                        return (
                          <div key={month} className="flex items-center gap-2">
                            <div className="w-12 text-xs text-gray-600">{month}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-navy-500 h-full flex items-center justify-end pr-2 text-xs text-white font-semibold"
                                style={{width: '100%'}}
                              >
                                ${monthlySavings.toFixed(0)}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    }
                    
                    // Calculate max for scaling
                    const maxSavings = Math.max(...batterySavings.map(m => m.savings), 1)
                    const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                    
                    return batterySavings.map((monthData, idx) => {
                      const width = (monthData.savings / maxSavings) * 100
                      return (
                        <div key={monthData.monthName} className="flex items-center gap-2">
                          <div className="w-12 text-xs text-gray-600">{monthAbbreviations[idx]}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-navy-500 h-full flex items-center justify-end pr-2 text-xs text-white font-semibold"
                              style={{width: `${Math.max(width, 15)}%`}}
                            >
                              ${monthData.savings.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>

                <div className="mt-4 p-3 bg-navy-500 text-white rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-90">First Year Total</div>
                      <div className="text-2xl font-bold">
                        ${comparison.firstYearAnalysis.totalSavings.toFixed(0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-90">25-Year Total</div>
                      <div className="text-2xl font-bold">
                        ${comparison.multiYearProjection.totalSavings25Year.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Comparison Table - Only if comparing with others */}
          {showComparison && comparisonBatteries.length > 0 && (
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-navy-500 mb-4">
                Battery Comparison
              </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Battery
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Net Cost
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Year 1 Savings
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      25-Year Savings
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Payback
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      ROI/Year
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {batteryComparisons.map(comparison => (
                    <tr key={comparison.battery.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-navy-500">
                          {comparison.battery.brand} {comparison.battery.model}
                        </div>
                        <div className="text-sm text-gray-600">
                          {comparison.battery.usableKwh} kWh usable
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium">
                        ${comparison.multiYearProjection.netCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-green-600">
                        ${comparison.firstYearAnalysis.totalSavings.toFixed(0)}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-green-600">
                        ${comparison.multiYearProjection.totalSavings25Year.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right font-medium">
                        {comparison.metrics.paybackYears.toFixed(1)} years
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-red-600">
                        {comparison.metrics.annualROI.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Detailed Cards for Comparison Batteries */}
          {showComparison && batteryComparisons.filter(comp => comparisonBatteries.includes(comp.battery.id)).map(comparison => (
            <div key={comparison.battery.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold text-navy-500">
                    {comparison.battery.brand} {comparison.battery.model}
                  </h4>
                  <p className="text-gray-600">{comparison.battery.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Value Score</div>
                  <div className="text-2xl font-bold text-red-500">
                    {comparison.metrics.savingsPerDollarInvested.toFixed(2)}x
                  </div>
                  <div className="text-xs text-gray-500">Savings per $ invested</div>
                </div>
              </div>

              {/* Financial Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Battery Price</div>
                  <div className="text-lg font-bold text-navy-500">
                    ${comparison.battery.price.toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Rebate</div>
                  <div className="text-lg font-bold text-green-600">
                    -${calculateBatteryFinancials(comparison.battery).rebate.toLocaleString()}
                  </div>
                </div>
                <div className="bg-navy-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Net Cost</div>
                  <div className="text-lg font-bold text-navy-600">
                    ${comparison.multiYearProjection.netCost.toLocaleString()}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Payback Period</div>
                  <div className="text-lg font-bold text-red-600">
                    {comparison.metrics.paybackYears.toFixed(1)} yrs
                  </div>
                </div>
              </div>

              {/* Savings Details */}
              <div className="border-t pt-4">
                <h5 className="font-semibold text-navy-500 mb-3">Savings Breakdown</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Year 1 Savings</div>
                    <div className="text-xl font-bold text-green-600">
                      ${comparison.firstYearAnalysis.totalSavings.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ~${(comparison.firstYearAnalysis.totalSavings / 12).toFixed(0)}/month
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">25-Year Total Savings</div>
                    <div className="text-xl font-bold text-green-600">
                      ${comparison.multiYearProjection.totalSavings25Year.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      With 5% annual rate increase
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Net Profit (25 years)</div>
                    <div className="text-xl font-bold text-navy-600">
                      ${comparison.multiYearProjection.netProfit25Year.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      After paying off battery cost
                    </div>
                  </div>
                </div>
              </div>

              {/* Energy Details */}
              <div className="border-t pt-4 mt-4">
                <h5 className="font-semibold text-navy-500 mb-3">Energy Performance</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">kWh Shifted/Year</div>
                    <div className="font-bold text-navy-500">
                      {comparison.firstYearAnalysis.totalKwhShifted.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Cycles/Year</div>
                    <div className="font-bold text-navy-500">
                      {comparison.firstYearAnalysis.cyclesPerYear}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Original Bill</div>
                    <div className="font-bold text-navy-500">
                      ${comparison.firstYearAnalysis.originalAnnualCost.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Optimized Bill</div>
                    <div className="font-bold text-green-600">
                      ${comparison.firstYearAnalysis.optimizedAnnualCost.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleComplete}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

