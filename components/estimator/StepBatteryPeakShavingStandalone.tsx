'use client'

// Standalone Peak-Shaving Calculator wrapper component
// This isolates the standalone behavior from the shared simple component,
// avoiding any changes or flags in the existing estimator flow.

import { useCallback, useEffect } from 'react'
import { StepBatteryPeakShavingSimple } from './StepBatteryPeakShavingSimple'

interface Props {
  onBack?: () => void
}

export function StepBatteryPeakShavingStandalone({ onBack }: Props) {
  const handleComplete = useCallback(() => {
    // No-op in standalone; results are for on-screen review
  }, [])

  const handleBack = useCallback(() => {
    if (onBack) return onBack()
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) window.history.back()
      else window.location.href = '/'
    }
  }, [onBack])

  // Hide navigation buttons that belong to the shared component in standalone context
  useEffect(() => {
    const hideNav = () => {
      const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      buttons.forEach(btn => {
        if (btn.textContent && btn.textContent.includes('Continue to Next Step')) {
          btn.style.display = 'none'
        }
      })
    }
    hideNav()
    const observer = new MutationObserver(hideNav)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return (
    <StepBatteryPeakShavingSimple
      data={{}}
      onComplete={handleComplete}
      onBack={handleBack}
    />
  )
}


