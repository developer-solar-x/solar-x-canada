'use client'

// Import React to build the client page
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
// Import the Step 4 simple component to perfectly clone its UI
import { StepBatteryPeakShavingSimple } from '../../../components/estimator/StepBatteryPeakShavingSimple'

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

  // Render the exact cloned UI only (no extra top controls)
  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-navy-300 text-navy-600 bg-white hover:bg-navy-50 transition-colors text-sm font-semibold"
          >
            <span className="h-2 w-2 rounded-full bg-navy-400"></span>
            Back to SolarX Calculator
          </button>
        </div>
        <div className="bg-white/90 backdrop-blur-sm border border-emerald-200 shadow-xl rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-navy-600 shadow-lg">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20" />
                <path d="m4.93 4.93 14.14 14.14" />
                <path d="M2 12h20" />
                <path d="m4.93 19.07 14.14-14.14" />
              </svg>
            </div>
          </div>
        {/* Perfectly cloned Step 4 UI */}
        <StepBatteryPeakShavingSimple
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
