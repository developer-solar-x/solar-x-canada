'use client'

import { useState, useEffect } from 'react'
import { UsageInputSelector } from '../UsageInputSelector'
import { calculateUsageFromBill } from './utils'
import { useBatteryCalculations } from './hooks'
import { BatterySelection } from './BatterySelection'
import { SelectedBatterySummary } from './sections/SelectedBatterySummary'
import { BatteryEducationSection } from './sections/BatteryEducationSection'
import { BatteryComparisonTable } from './sections/BatteryComparisonTable'
import { ComparisonBatteryCards } from './sections/ComparisonBatteryCards'
import { RATE_PLANS, RatePlan, ULO_RATE_PLAN } from '@/config/rate-plans'
import { generateAnnualUsagePattern } from '@/lib/usage-parser'
import type { UsageDataPoint } from '@/lib/battery-dispatch'
import type { StepBatteryPeakShavingProps } from './types'

export function StepBatteryPeakShaving({ data, onComplete, onBack }: StepBatteryPeakShavingProps) {
  // Calculate default annual usage from previous steps
  // Priority: energyUsage > monthlyBill calculation > fallback
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
  const [usageDataSource, setUsageDataSource] = useState<'csv' | 'monthly' | 'annual'>('annual')
  
  // Use custom hook for battery calculations
  const { batteryComparisons, monthlySavingsData, loading } = useBatteryCalculations({
    usageData,
    selectedBattery,
    showComparison,
    comparisonBatteries,
    selectedRatePlan,
  })

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
        
        {/* Usage Input Selector */}
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

      <BatterySelection
        selectedBattery={selectedBattery}
        onBatteryChange={setSelectedBattery}
        showComparison={showComparison}
        onToggleComparison={() => setShowComparison(!showComparison)}
        comparisonBatteries={comparisonBatteries}
        onToggleComparisonBattery={toggleComparisonBattery}
      />

      {/* Battery Comparison Results */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Calculating savings...</p>
        </div>
      ) : batteryComparisons.length > 0 && (
        <div className="space-y-6">
          {/* Selected Battery Summary */}
          {batteryComparisons
            .filter(comp => comp.battery.id === selectedBattery)
            .map(comparison => (
              <SelectedBatterySummary
                key="selected-summary"
                comparison={comparison}
                annualUsageKwh={annualUsageKwh}
                selectedRatePlan={selectedRatePlan}
                monthlySavingsData={monthlySavingsData}
              />
            ))}

          {/* Educational Section */}
          {batteryComparisons
            .filter(comp => comp.battery.id === selectedBattery)
            .map(comparison => (
              <BatteryEducationSection
                key="education"
                comparison={comparison}
                annualUsageKwh={annualUsageKwh}
                selectedRatePlan={selectedRatePlan}
                monthlySavingsData={monthlySavingsData}
              />
            ))}

          {/* Comparison Table */}
          {showComparison && comparisonBatteries.length > 0 && (
            <BatteryComparisonTable batteryComparisons={batteryComparisons} />
          )}

          {/* Detailed Cards for Comparison Batteries */}
          {showComparison && (
            <ComparisonBatteryCards
              batteryComparisons={batteryComparisons.filter(comp => 
                comparisonBatteries.includes(comp.battery.id)
              )}
            />
          )}
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

