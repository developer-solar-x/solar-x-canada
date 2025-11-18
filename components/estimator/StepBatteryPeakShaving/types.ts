import type { RatePlan } from '@/config/rate-plans'
import type { BatteryComparison, UsageDataPoint } from '@/lib/battery-dispatch'
import type { MonthlySavings } from '@/lib/monthly-savings-calculator'

export interface StepBatteryPeakShavingProps {
  data: any // Estimator data from previous steps
  onComplete: (data: any) => void
  onBack: () => void
}

export interface SelectedBatterySummaryProps {
  comparison: BatteryComparison
  annualUsageKwh: number
  selectedRatePlan: RatePlan
  monthlySavingsData: Map<string, MonthlySavings[]>
}

export interface BatteryEducationSectionProps {
  comparison: BatteryComparison
  annualUsageKwh: number
  selectedRatePlan: RatePlan
  monthlySavingsData: Map<string, MonthlySavings[]>
}

export interface BatteryComparisonTableProps {
  batteryComparisons: BatteryComparison[]
}

export interface ComparisonBatteryCardsProps {
  batteryComparisons: BatteryComparison[]
}

