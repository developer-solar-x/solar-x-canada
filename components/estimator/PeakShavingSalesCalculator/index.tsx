'use client'

// Peak-Shaving Sales Calculator - Bento Grid Layout
// This component reorganizes the peak-shaving calculator into a compact bento grid format
// All functionality remains the same, but content is arranged in vertical sections to fit on one screen

import { StepBatteryPeakShavingSimple } from '../StepBatteryPeakShavingSimple'
import type { StepBatteryPeakShavingSimpleProps } from '../StepBatteryPeakShavingSimple/types'

// Wrapper component that uses the same logic but wraps it in a bento grid container
export function PeakShavingSalesCalculator(props: StepBatteryPeakShavingSimpleProps) {
  return (
    <div className="bento-sales-grid">
      {/* Bento Grid Container - Multi-column layout that fits in viewport */}
      <div className="bento-container">
        {/* Main Content - Uses the existing component with compact styling */}
        <div className="bento-content">
          <StepBatteryPeakShavingSimple {...props} />
        </div>
      </div>
    </div>
  )
}
