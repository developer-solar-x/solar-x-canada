'use client'

// This page renders the simple peak-shaving battery savings calculator as a standalone experience.
// It intentionally does not call NREL/PVWATTS or the solar estimate API.

import { useCallback } from 'react'
import Link from 'next/link'
import { StepBatteryPeakShavingSimple } from '@/components/estimator/StepBatteryPeakShavingSimple'

export default function PeakShavingCalculatorPage() {
  // simple, empty data seed — calculator will let the user enter annual usage
  const data: any = {}

  // no-op complete handler — this standalone page doesn't persist wizard progress
  const handleComplete = useCallback((updated: any) => {
    // intentionally blank in standalone mode
  }, [])

  // back handler — sends users to homepage
  const handleBack = useCallback(() => {
    // Next Link preferred in UI; for handler we can rely on browser history
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.location.href = '/'
      }
    }
  }, [])

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Simple top nav back/home links for standalone context */}
      <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span className="text-navy-500 font-semibold">Peak-Shaving Calculator</span>
      </div>

      {/* Standalone calculator; standalone flag disables solar/NREL dependencies */}
      <StepBatteryPeakShavingSimple
        data={data}
        onComplete={handleComplete}
        onBack={handleBack}
        standalone
      />
    </main>
  )
}


