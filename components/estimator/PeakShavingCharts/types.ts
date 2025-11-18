import { BatteryComparison } from '../../../lib/battery-dispatch'

export interface PeakShavingChartsProps {
  comparison: BatteryComparison
}

export interface MonthlySavingsChartProps {
  monthlyProjection: Array<{ month: string; savings: number }>
  averageMonthlySavings: number
}

export interface CumulativeSavingsChartProps {
  cumulativeSavings: Array<{ year: number; cumulative: number; annual: number }>
  maxCumulative: number
  breakEvenYear: { year: number; cumulative: number; annual: number } | undefined
  netCost: number
  paybackYears: number
  totalSavings25Year: number
  netProfit25Year: number
}

export interface BeforeAfterComparisonProps {
  originalAnnualCost: number
  optimizedAnnualCost: number
  totalSavings: number
}

export interface HowItWorksProps {
  totalKwhShifted: number
  cyclesPerYear: number
}

export interface MonthlyComparisonChartProps {
  beforeData: number[]
  afterData: number[]
  labels: string[]
}

