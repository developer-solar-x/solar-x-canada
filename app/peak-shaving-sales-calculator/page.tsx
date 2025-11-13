'use client'

// Peak-Shaving Sales Calculator Page - Bento Grid Format
// This page provides a compact bento grid layout version of the peak-shaving calculator

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PeakShavingSalesCalculator } from '@/components/estimator/PeakShavingSalesCalculator'

// Export default Next.js page component
export default function Page() {
  const router = useRouter()
  // Read persisted manual values when available
  const [persisted, setPersisted] = useState<{ usage?: number; production?: number }>(() => ({ }))
  useEffect(() => {
    if (typeof window === 'undefined') return
    const usageStr = window.localStorage.getItem('manual_estimator_annual_kwh') || window.localStorage.getItem('estimator_annualUsageKwh')
    const prodStr = window.localStorage.getItem('manual_estimator_production_kwh')
    setPersisted({
      usage: usageStr && Number(usageStr) > 0 ? Number(usageStr) : undefined,
      production: prodStr && Number(prodStr) > 0 ? Number(prodStr) : undefined,
    })
  }, [])
  // Build a data object to seed manual values into the cloned UI
  const data = useMemo(() => ({
    // No coordinates so the child won't call the estimator API
    coordinates: undefined,
    // Provide a basic estimate object with manual production and system size
    estimate: {
      system: {
        sizeKw: 6.0, // default manual system size (derived from panels)
        numPanels: 12, // default panel count
        panelWattage: 500 // default panel wattage to keep math consistent
      },
      production: {
        // Prefer persisted production when available; let component manage blank gracefully
        annualKwh: persisted.production ?? undefined as unknown as number
      },
      savings: {
        annualSavings: undefined // let the step compute savings consistently
      },
      costs: {
        netCost: undefined // let the step compute net costs from pricing + rebates
      }
    },
    // Default annual usage; the step's input can still override locally
    peakShaving: { annualUsageKwh: persisted.usage ?? undefined as unknown as number },
    energyUsage: { annualKwh: persisted.usage ?? undefined as unknown as number },
    monthlyBill: undefined,
    // Persisted battery selection can be blank; UI provides selection
    selectedBattery: 'renon-16',
    // No overrides to keep behavior predictable
    solarOverride: undefined
  }), [persisted])

  // Render the bento grid calculator
  return (
    <section className="h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col overflow-hidden">
      <div className="max-w-[1920px] mx-auto w-full h-full flex flex-col px-2 py-2 md:px-4 md:py-2">
        {/* Compact Header with back button and title - Responsive */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0 gap-2">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1 px-2 py-1.5 md:px-2 md:py-1 rounded-full border border-navy-300 text-navy-600 bg-white hover:bg-navy-50 active:bg-navy-100 transition-colors text-xs md:text-xs font-semibold touch-manipulation"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-navy-400"></span>
            <span className="hidden sm:inline">Back</span>
          </button>
          
          {/* Compact Page Title - Responsive */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="p-1.5 md:p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-navy-600 shadow">
              <svg className="h-4 w-4 md:h-4 md:w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20" />
                <path d="m4.93 4.93 14.14 14.14" />
                <path d="M2 12h20" />
                <path d="m4.93 19.07 14.14-14.14" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm md:text-sm font-bold text-navy-600 truncate">Peak-Shaving Sales Calculator</h1>
            </div>
          </div>
        </div>
        
        {/* Bento Grid Calculator - Takes remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <PeakShavingSalesCalculator
            data={data}
            onComplete={() => { /* no-op in manual clone */ }}
            onBack={() => router.push('/')}
            manualMode
          />
        </div>
      </div>
    </section>
  )
}

