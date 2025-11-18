import { RatePlan } from '../../../config/rate-plans'
import { UsageDataPoint } from '../../../lib/battery-dispatch'

export interface UsageInputSelectorProps {
  ratePlan: RatePlan
  annualUsageKwh: number
  onUsageDataChange: (data: UsageDataPoint[], source: 'csv' | 'monthly' | 'annual') => void
  onAnnualUsageChange: (kwh: number) => void
}

export type InputMethod = 'annual' | 'monthly' | 'csv'

export interface MethodSelectorProps {
  inputMethod: InputMethod
  onMethodChange: (method: InputMethod) => void
}

export interface AnnualInputProps {
  annualUsageKwh: number
  onAnnualUsageChange: (kwh: number) => void
}

export interface MonthlyInputProps {
  monthlyValues: number[]
  onMonthlyChange: (monthIndex: number, value: string) => void
  onAutoDistribute: () => void
  onApply: () => void
}

export interface CSVUploadProps {
  onFileUpload: (file: File) => void
  csvFile: File | null
  csvStatus: 'idle' | 'processing' | 'success' | 'error'
  csvMessage: string
  onClearError: () => void
}

