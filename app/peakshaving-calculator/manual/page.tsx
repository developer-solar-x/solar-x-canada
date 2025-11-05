'use client'

// Import React to build the client page
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
// Import the Step 4 simple component to perfectly clone its UI
import { StepBatteryPeakShavingSimple } from '../../../components/estimator/StepBatteryPeakShavingSimple'

// Export default Next.js page component
export default function Page() {
  const router = useRouter()
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
        annualKwh: 8000 // manual annual production (no NREL)
      },
      savings: {
        annualSavings: undefined // let the step compute savings consistently
      },
      costs: {
        netCost: undefined // let the step compute net costs from pricing + rebates
      }
    },
    // Default annual usage; the step's input can still override locally
    peakShaving: { annualUsageKwh: 18000 },
    energyUsage: { annualKwh: 18000 },
    monthlyBill: undefined,
    // Persisted battery selection can be blank; UI provides selection
    selectedBattery: 'renon-16',
    // No overrides to keep behavior predictable
    solarOverride: undefined
  }), [])

  // Render the exact cloned UI only (no extra top controls)
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Perfectly cloned Step 4 UI */}
        <StepBatteryPeakShavingSimple
          data={data}
          onComplete={() => { /* no-op in manual clone */ }}
          onBack={() => router.push('/')}
          manualMode
        />
      </div>
    </section>
  )
}
