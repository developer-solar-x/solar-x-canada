export interface StepEnergySimpleProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  onUpgradeMode?: () => void
}

export interface InputToggleProps {
  useMonthlyBill: boolean
  onToggle: (useMonthlyBill: boolean) => void
}

export interface PlanTypeSelectorProps {
  planType: 'battery'
  onPlanTypeChange: (type: 'battery') => void
}

export interface AnnualUsageInputProps {
  annualUsageInput: string
  onAnnualUsageChange: (value: string) => void
}

export interface MonthlyBillInputProps {
  monthlyBillInput: string
  onMonthlyBillChange: (value: string) => void
}

export interface UpgradePromptProps {
  onUpgrade: () => void
}

export interface UseEnergyCalculationProps {
  useMonthlyBill: boolean
  monthlyBillInput: string
  annualUsageInput: string
  setAnnualUsageInput: (value: string) => void
}

