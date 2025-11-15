'use client'

// Peak-Shaving Sales Calculator - FRD-Compliant Version 2.0
// Implements the "Simple, User-Friendly & Offset-Focused UI" requirements
// Uses the new FRD-compliant component with 6 required sections

import { PeakShavingSalesCalculatorFRD } from '../PeakShavingSalesCalculatorFRD'
import type { StepBatteryPeakShavingSimpleProps } from '../StepBatteryPeakShavingSimple/types'

// Wrapper component that uses the FRD-compliant calculator
export function PeakShavingSalesCalculator(props: StepBatteryPeakShavingSimpleProps) {
  return <PeakShavingSalesCalculatorFRD {...props} />
}
