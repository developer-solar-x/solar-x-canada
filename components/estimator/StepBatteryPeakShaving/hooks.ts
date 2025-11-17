import { useEffect, useState } from 'react'
import { BATTERY_SPECS, BatterySpec } from '@/config/battery-specs'
import { RatePlan } from '@/config/rate-plans'
import {
  compareBatteryOptions,
  BatteryComparison,
  UsageDataPoint
} from '@/lib/battery-dispatch'
import {
  calculateMonthlySavings,
  MonthlySavings
} from '@/lib/monthly-savings-calculator'

interface UseBatteryCalculationsParams {
  usageData: UsageDataPoint[]
  selectedBattery: string
  showComparison: boolean
  comparisonBatteries: string[]
  selectedRatePlan: RatePlan
}

export function useBatteryCalculations({
  usageData,
  selectedBattery,
  showComparison,
  comparisonBatteries,
  selectedRatePlan,
}: UseBatteryCalculationsParams) {
  const [batteryComparisons, setBatteryComparisons] = useState<BatteryComparison[]>([])
  const [monthlySavingsData, setMonthlySavingsData] = useState<Map<string, MonthlySavings[]>>(new Map())
  const [loading, setLoading] = useState(false)

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

  return {
    batteryComparisons,
    monthlySavingsData,
    loading,
  }
}

