import { useEffect } from 'react'
import { BLENDED_RATE } from '../constants'
import type { UseEnergyCalculationProps } from '../types'

export function useEnergyCalculation({
  useMonthlyBill,
  monthlyBillInput,
  annualUsageInput,
  setAnnualUsageInput
}: UseEnergyCalculationProps) {
  const estimatedAnnualKwh = useMonthlyBill && monthlyBillInput
    ? Math.round((parseFloat(monthlyBillInput) / BLENDED_RATE) * 12)
    : 0

  // Pre-fill annual usage with our best estimate if the field is empty
  useEffect(() => {
    if (useMonthlyBill) {
      if ((!annualUsageInput || Number(annualUsageInput) === 0) && estimatedAnnualKwh > 0) {
        setAnnualUsageInput(String(estimatedAnnualKwh))
      }
    }
  }, [estimatedAnnualKwh, annualUsageInput, useMonthlyBill, setAnnualUsageInput])

  const parsedAnnualUsage = parseFloat(annualUsageInput)
  const manualAnnualUsage = !useMonthlyBill && Number.isFinite(parsedAnnualUsage) && parsedAnnualUsage > 0
    ? Math.round(parsedAnnualUsage)
    : 0
  const finalAnnualUsage = (manualAnnualUsage > 0 ? manualAnnualUsage : estimatedAnnualKwh) || Math.round(parsedAnnualUsage) || 0

  return {
    finalAnnualUsage,
    estimatedAnnualKwh
  }
}

