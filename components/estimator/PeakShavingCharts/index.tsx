'use client'

import { useMemo } from 'react'
import { BatteryComparison } from '../../../lib/battery-dispatch'
import { MonthlySavingsChart } from './components/MonthlySavingsChart'
import { CumulativeSavingsChart } from './components/CumulativeSavingsChart'
import { BeforeAfterComparison } from './components/BeforeAfterComparison'
import { HowItWorks } from './components/HowItWorks'
import { MonthlyComparisonChart } from './components/MonthlyComparisonChart'
import type { PeakShavingChartsProps } from './types'

export function PeakShavingCharts({ comparison }: PeakShavingChartsProps) {
  // Calculate monthly savings projection for first year
  const monthlyProjection = useMemo(() => {
    const monthlySavings = comparison.firstYearAnalysis.averageDailySavings * 30.42 // Average days per month
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i).toLocaleDateString('en-US', { month: 'short' }),
      savings: Math.round(monthlySavings)
    }))
  }, [comparison])

  // Calculate cumulative savings over 25 years
  const cumulativeSavings = useMemo(() => {
    return comparison.multiYearProjection.yearlyProjections.map(year => ({
      year: year.year,
      cumulative: year.cumulativeSavings,
      annual: year.annualSavings
    }))
  }, [comparison])

  // Find break-even point
  const breakEvenYear = useMemo(() => {
    return comparison.multiYearProjection.yearlyProjections.find(
      year => year.cumulativeSavings >= comparison.multiYearProjection.netCost
    )
  }, [comparison])

  // Calculate max value for scaling
  const maxCumulative = Math.max(...cumulativeSavings.map(d => d.cumulative))

  return (
    <div className="space-y-6">
      {/* Monthly Savings Bar Chart */}
      <MonthlySavingsChart
        monthlyProjection={monthlyProjection}
        averageMonthlySavings={comparison.firstYearAnalysis.averageDailySavings * 30.42}
      />

      {/* Cumulative Savings Line Chart */}
      <CumulativeSavingsChart
        cumulativeSavings={cumulativeSavings}
        maxCumulative={maxCumulative}
        breakEvenYear={breakEvenYear}
        netCost={comparison.multiYearProjection.netCost}
        paybackYears={comparison.multiYearProjection.paybackYears}
        totalSavings25Year={comparison.multiYearProjection.totalSavings25Year}
        netProfit25Year={comparison.multiYearProjection.netProfit25Year}
      />

      {/* Before vs After Bills */}
      <BeforeAfterComparison
        originalAnnualCost={comparison.firstYearAnalysis.originalAnnualCost}
        optimizedAnnualCost={comparison.firstYearAnalysis.optimizedAnnualCost}
        totalSavings={comparison.firstYearAnalysis.totalSavings}
      />

      {/* How It Works */}
      <HowItWorks
        totalKwhShifted={comparison.firstYearAnalysis.totalKwhShifted}
        cyclesPerYear={comparison.firstYearAnalysis.cyclesPerYear}
      />
    </div>
  )
}

// Export MonthlyComparisonChart for use elsewhere
export { MonthlyComparisonChart } from './components/MonthlyComparisonChart'

