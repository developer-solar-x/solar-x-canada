'use client'

// Peak Shaving Calculator Page - Bento Grid Format
// This page provides a compact bento grid layout version of the peak-shaving calculator

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PeakShavingSalesCalculator } from '@/components/estimator/PeakShavingSalesCalculator'
import { LeadCaptureModal } from '@/components/peak-shaving/LeadCaptureModal'

// Export default Next.js page component
export default function Page() {
  const router = useRouter()
  const [isVerified, setIsVerified] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)
  
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

  // Function to check access (reusable) - defined before use
  const checkAccess = useCallback(async (email: string, recordAccess: boolean = false) => {
    try {
      // Check if access is still valid
      const response = await fetch('/api/peak-shaving/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.canAccess) {
        // Access is valid
        if (recordAccess) {
          // Record access (only when explicitly requested, e.g., on first verification)
          const recordResponse = await fetch('/api/peak-shaving/record-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })

          if (!recordResponse.ok) {
            // Failed to record - might be limit reached
            const recordData = await recordResponse.json()
            throw new Error(recordData.error || 'Failed to record access')
          }
        }
        return { canAccess: true, data }
      } else {
        // Access denied - limit reached or not verified
        return { canAccess: false, reason: data.reason, data }
      }
    } catch (error) {
      console.error('Error checking access:', error)
      throw error
    }
  }, [])

  // Check if user is already verified on mount
  useEffect(() => {
    const performCheck = async () => {
      if (typeof window === 'undefined') return

      const storedEmail = localStorage.getItem('peak_shaving_verified_email')
      if (!storedEmail) {
        setIsCheckingAccess(false)
        return
      }

      try {
        const result = await checkAccess(storedEmail, false) // Don't record on page load

        if (result.canAccess) {
          // Access is valid - allow them to use the calculator
          setVerifiedEmail(storedEmail)
          setIsVerified(true)
        } else {
          // Access denied - limit reached or not verified
          // Clear localStorage to force re-verification
          localStorage.removeItem('peak_shaving_verified_email')
          setVerifiedEmail(null)
          setIsVerified(false)
        }
      } catch (error) {
        // On error, clear storage and show modal
        localStorage.removeItem('peak_shaving_verified_email')
        setVerifiedEmail(null)
        setIsVerified(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }

    performCheck()
  }, [checkAccess])

  // Re-check access when user returns to the tab (to enforce limits)
  useEffect(() => {
    if (typeof window === 'undefined' || !isVerified || !verifiedEmail) return

    const handleVisibilityChange = async () => {
      // Only check when tab becomes visible
      if (document.visibilityState === 'visible') {
        try {
          const result = await checkAccess(verifiedEmail, false) // Don't record, just check

          if (!result.canAccess) {
            // Limit reached while they were away - clear access
            localStorage.removeItem('peak_shaving_verified_email')
            setVerifiedEmail(null)
            setIsVerified(false)
            // Optionally show a message
            alert('Your access has expired. You have reached your usage limit (2 uses).')
          }
        } catch (error) {
          console.error('Error re-checking access:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isVerified, verifiedEmail, checkAccess])

  const handleVerified = async (email: string) => {
    try {
      const isSolarXEmail = email.toLowerCase().endsWith('@solar-x.ca')
      
      if (isSolarXEmail) {
        // Solar-X emails: Check access but don't record/log it
        const result = await checkAccess(email, false) // Don't record for Solar-X
        
        if (!result.canAccess) {
          // Access denied (shouldn't happen for verified Solar-X emails)
          localStorage.removeItem('peak_shaving_verified_email')
          return
        }

        // Grant access without logging
        localStorage.setItem('peak_shaving_verified_email', email)
        setVerifiedEmail(email)
        setIsVerified(true)
        return
      }

      // Regular users: Check access and record it (this increments usage count)
      const result = await checkAccess(email, true) // Record access on verification

      if (!result.canAccess) {
        // Access denied - limit reached
        // Clear any stored email to force re-verification
        localStorage.removeItem('peak_shaving_verified_email')
        // Modal will stay open showing the error
        return
      }

      // Store verified email in localStorage only if access is granted
      localStorage.setItem('peak_shaving_verified_email', email)
      setVerifiedEmail(email)
      setIsVerified(true)
    } catch (error) {
      console.error('Error verifying access:', error)
      // On error, clear storage and don't store email
      localStorage.removeItem('peak_shaving_verified_email')
    }
  }
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

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </section>
    )
  }

  // Render the FRD-compliant calculator
  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={!isVerified}
        onVerified={handleVerified}
      />

      {isVerified && (
        <div className="max-w-[1920px] mx-auto w-full">
          {/* Compact Header with back button and title - Responsive */}
          <div className="flex items-center justify-between p-4 md:p-6 gap-2">
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
          
          {/* FRD Calculator - Scrollable on mobile, full screen on wide screen */}
          <PeakShavingSalesCalculator
            data={data}
            onComplete={() => { /* no-op in manual clone */ }}
            onBack={() => router.push('/')}
            manualMode
          />
        </div>
      )}
    </section>
  )
}

