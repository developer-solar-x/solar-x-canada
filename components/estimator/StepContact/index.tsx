'use client'

// Step 8: Contact form and lead submission

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { isValidEmail } from '@/lib/utils'
import { useContactFormData } from './hooks/useContactFormData'
import { useAutoSave } from './hooks/useAutoSave'
import { ContactFormFields } from './components/ContactFormFields'
import { validateContactForm } from './utils/validation'
import { extractSimplifiedData } from '@/lib/estimator-data-simplifier'
import type { StepContactProps } from './types'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

export function StepContact({ data, onComplete, onBack }: StepContactProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredContactTime: 'anytime',
    preferredContactMethod: 'phone',
    comments: '',
    consent: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [leadId, setLeadId] = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showDebugNetMetering, setShowDebugNetMetering] = useState(false)

  // Use custom hooks
  useContactFormData({ data, formData, setFormData })
  useAutoSave({ formData, data, setSaving, saveTimeoutRef })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateContactForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)

    try {
              // Extract simplified data structure including contact form data
              const dataWithContact = {
                ...data,
                ...formData, // Include contact form fields (fullName, phone, etc.)
              }
              
              // Debug: Log what data is available before extraction
              console.log('🔍 Data available for extraction:', {
                hasPeakShaving: !!data.peakShaving,
                hasEstimate: !!data.estimate,
                hasSolarOverride: !!data.solarOverride,
                hasSelectedBatteryIds: !!(data as any).selectedBatteryIds,
                peakShavingKeys: data.peakShaving ? Object.keys(data.peakShaving) : [],
                estimateKeys: data.estimate ? Object.keys(data.estimate) : [],
              })
              
              const simplifiedData = extractSimplifiedData(dataWithContact)
              
              // Debug: Log what was extracted
              console.log('📦 Extracted simplified data:', {
                hasTou: !!simplifiedData.tou,
                hasUlo: !!simplifiedData.ulo,
                hasProduction: !!simplifiedData.production,
                hasCosts: !!simplifiedData.costs,
                systemSizeKw: simplifiedData.systemSizeKw,
                numPanels: simplifiedData.numPanels,
                annualUsageKwh: simplifiedData.annualUsageKwh,
              })
      
      // Save final HRS residential state into partial leads before creating full lead
      const partialLeadEmail = simplifiedData.email || formData.email || data.email
      const isDetailedHrsResidentialPartial =
        simplifiedData.estimatorMode === 'detailed' &&
        simplifiedData.programType === 'hrs_residential' &&
        simplifiedData.leadType === 'residential'
      const isQuickBatteryResidentialPartial =
        simplifiedData.estimatorMode === 'easy' &&
        simplifiedData.programType === 'hrs_residential' &&
        simplifiedData.leadType === 'residential' &&
        simplifiedData.hasBattery !== false
      const isQuickNetMeteringPartial =
        simplifiedData.estimatorMode === 'easy' &&
        simplifiedData.programType === 'net_metering' &&
        simplifiedData.leadType === 'residential'

      const shouldSavePartialLead =
        partialLeadEmail &&
        isValidEmail(partialLeadEmail) &&
        (isDetailedHrsResidentialPartial || isQuickBatteryResidentialPartial || isQuickNetMeteringPartial)

      if (shouldSavePartialLead) {
        try {
          const response = await fetch('/api/partial-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: partialLeadEmail,
              estimatorData: {
                ...dataWithContact,
                email: partialLeadEmail,
              },
              currentStep: 8, // Contact / Submit step
            }),
          })

          if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            console.error('Failed to save partial lead (Contact):', response.status, err)
          }
        } catch (error) {
          console.error('Failed to save Contact progress (partial lead):', error)
        }
      }

      // Determine which API endpoint to use
      const isDetailedHrsResidential = isDetailedHrsResidentialPartial
      
      const apiEndpoint = isDetailedHrsResidential ? '/api/leads/hrs-residential' : '/api/leads'
      
      // For detailed HRS residential, send simplified data with original data for fallback extraction
      // For other leads, use the existing format
      const requestBody = isDetailedHrsResidential
        ? {
            ...simplifiedData, // Send simplified data structure
            // Include original data structure for fallback extraction in API
            _originalData: {
              peakShaving: data.peakShaving,
              estimate: data.estimate,
              solarOverride: data.solarOverride,
              batteryDetails: data.batteryDetails,
              energyUsage: data.energyUsage,
            }
          }
        : {
            ...formData,
            ...data,
            // Include simplifiedData as full_data_json for quick estimates
            // This ensures all fields are available in full_data_json
            full_data_json: simplifiedData,
            selectedAddOns: data.selectedAddOns || simplifiedData.selectedAddOns || [],
        estimateData: data.estimate,
            systemSizeKw: data.estimate?.system?.sizeKw,
            estimatedCost: data.estimate?.costs?.totalCost,
            netCostAfterIncentives: data.estimate?.costs?.netCost,
            annualSavings: data.estimate?.savings?.annualSavings,
            paybackYears: data.estimate?.savings?.paybackYears,
            annualProductionKwh: data.estimate?.production?.annualKwh,
          }
      
      // Save to database via API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit lead')
      }

      const result = await response.json()
      const leadId = result.leadId || result.data?.leadId || `lead-${Date.now()}`
      setLeadId(leadId)
      
      // Don't save to localStorage (too large, causes quota exceeded error)
      // Data is already saved to database via API, will be fetched using leadId
      console.log('💾 Data saved to database with leadId:', leadId)
      console.log('📦 Simplified data structure (for reference):')
      console.log('📏 JSON Size:', JSON.stringify(simplifiedData).length, 'bytes')
      console.log('📋 Pretty JSON:')
      console.log(JSON.stringify(simplifiedData, null, 2))
      
      // Store estimate data in sessionStorage for results page
      if (data.estimate) {
        // Calculate rebates from estimate data
        const isNetMetering = data.programType === 'net_metering'
        const solarRebate = isNetMetering ? 0 : (data.estimate.costs?.incentives || 0)
        const batteryPrice = data.batteryDetails?.battery?.price || 0
        const batteryNetCost = data.batteryDetails?.multiYearProjection?.netCost || 0
        const batteryRebate = batteryPrice > 0 ? Math.max(0, batteryPrice - batteryNetCost) : 0
        
        // Calculate combined costs
        const combinedTotalCost = data.estimate.costs?.totalCost + (batteryPrice || 0)
        const combinedNetCost = (data.estimate.costs?.netCost || 0) + (batteryNetCost || 0)
        
        // Determine which rate plan is better
        const touAnnual = data.peakShaving?.tou?.allResults?.combined?.combined?.annual || 
                         data.peakShaving?.tou?.allResults?.combined?.annual || 0
        const uloAnnual = data.peakShaving?.ulo?.allResults?.combined?.combined?.annual || 
                         data.peakShaving?.ulo?.allResults?.combined?.annual || 0
        const displayPlan = data.peakShaving?.ratePlan || (uloAnnual > touAnnual ? 'ulo' : 'tou')
        
        // Ensure estimate uses the override system size if available (matches battery savings display)
        // If we have exact panel count, calculate system size directly from it (exact calculation)
        // 14 panels × 500W = 7000W = 7.0 kW exactly
        const panelWattage = 500 // Standard panel wattage
        const numPanels = data.solarOverride?.numPanels ?? data.estimate?.system?.numPanels
        let finalSystemSizeKw: number
        if (numPanels && numPanels > 0) {
          // Calculate directly from panel count: exact calculation, no rounding needed
          // Always prefer panel count calculation to ensure exact values (14 panels = 7.0 kW)
          finalSystemSizeKw = (numPanels * panelWattage) / 1000
        } else {
          // Fallback: use provided system size and round to nearest 0.5
          const rawSystemSizeKw = data.solarOverride?.sizeKw ?? data.estimate?.system?.sizeKw ?? 0
          finalSystemSizeKw = Math.round(rawSystemSizeKw * 2) / 2
        }
        
        const finalEstimate = data.estimate ? {
          ...data.estimate,
          system: {
            ...data.estimate.system,
            // Override with calculated system size from exact panel count
            sizeKw: finalSystemSizeKw,
            numPanels: numPanels ?? data.estimate.system.numPanels,
          }
        } : data.estimate
        
        // Debug logging (remove after confirming fix)
        console.log('💾 Storing calculator results:', {
          numPanels: data.solarOverride?.numPanels,
          calculatedFromPanels: data.solarOverride?.numPanels ? (data.solarOverride.numPanels * panelWattage) / 1000 : null,
          finalSystemSizeKw,
          solarOverrideSizeKw: data.solarOverride?.sizeKw,
          estimateSystemSizeKw: data.estimate?.system?.sizeKw,
          finalEstimateSystemSizeKw: finalEstimate?.system?.sizeKw,
        })
        
        // Log final results for debugging
        console.log('🎉 FINAL SUBMISSION - Simplified Data Structure:')
        console.log(JSON.stringify(simplifiedData, null, 2))
        console.log('📡 Using API endpoint:', apiEndpoint)
        console.log('📊 Final Results Summary:')
        console.log('  📍 Location:', {
          address: simplifiedData.address,
          email: simplifiedData.email,
          coordinates: simplifiedData.coordinates,
        })
        console.log('  🏠 Roof:', {
          areaSqft: simplifiedData.roofAreaSqft,
          type: simplifiedData.roofType,
          pitch: simplifiedData.roofPitch,
          shading: simplifiedData.shadingLevel,
        })
        console.log('  ⚡ Energy:', {
          monthlyBill: simplifiedData.monthlyBill,
          annualUsageKwh: simplifiedData.annualUsageKwh,
          annualEscalator: simplifiedData.annualEscalator,
        })
        console.log('  🔋 Battery:', {
          selectedBatteryIds: simplifiedData.selectedBatteryIds,
          systemSizeKw: simplifiedData.systemSizeKw,
          numPanels: simplifiedData.numPanels,
        })
        console.log('  💰 TOU Plan:', {
          solar: simplifiedData.tou?.solar,
          batterySolarCapture: simplifiedData.tou?.batterySolarCapture,
          totalOffset: simplifiedData.tou?.totalOffset,
          buyFromGrid: simplifiedData.tou?.buyFromGrid,
          annualSavings: simplifiedData.tou?.annualSavings,
          monthlySavings: simplifiedData.tou?.monthlySavings,
          profit25Year: simplifiedData.tou?.profit25Year,
          paybackPeriod: simplifiedData.tou?.paybackPeriod,
        })
        console.log('  💰 ULO Plan:', {
          solar: simplifiedData.ulo?.solar,
          batterySolarCapture: simplifiedData.ulo?.batterySolarCapture,
          totalOffset: simplifiedData.ulo?.totalOffset,
          buyFromGrid: simplifiedData.ulo?.buyFromGrid,
          annualSavings: simplifiedData.ulo?.annualSavings,
          monthlySavings: simplifiedData.ulo?.monthlySavings,
          profit25Year: simplifiedData.ulo?.profit25Year,
          paybackPeriod: simplifiedData.ulo?.paybackPeriod,
        })
        console.log('  🔁 Net Metering (raw):', data.netMetering || null)
        console.log('  📈 Production:', {
          annualKwh: simplifiedData.production?.annualKwh,
          monthlyKwh: simplifiedData.production?.monthlyKwh?.length || 0,
          dailyAverageKwh: simplifiedData.production?.dailyAverageKwh,
        })
        console.log('  💵 Costs:', {
          totalCost: simplifiedData.costs?.totalCost,
          netCost: simplifiedData.costs?.netCost,
          incentives: simplifiedData.costs?.incentives,
          totalCostWithoutTax: simplifiedData.costs?.totalCostWithoutTax,
          totalCostWithoutTaxAndIncentives: simplifiedData.costs?.totalCostWithoutTaxAndIncentives,
        })
        console.log('  📞 Contact:', {
          fullName: simplifiedData.fullName,
          phone: simplifiedData.phone,
          email: simplifiedData.email,
          preferredContactTime: simplifiedData.preferredContactTime,
          preferredContactMethod: simplifiedData.preferredContactMethod,
        })
        console.log('  🌍 Environmental:', simplifiedData.environmental)
        console.log('📏 Total Data Size:', JSON.stringify(simplifiedData).length, 'bytes')
        
        // Don't save to localStorage (too large, causes quota exceeded error)
        // Data is already saved to database via API, will be fetched using leadId
        console.log('💾 Data saved to database with leadId:', leadId)
        
        // Save minimal data to sessionStorage for immediate redirect (just leadId)
        // The results page will fetch full data from database using leadId
        try {
          sessionStorage.setItem('calculatorResults', JSON.stringify({ leadId }))
          console.log('✅ LeadId saved to sessionStorage for immediate redirect')
        } catch (error) {
          console.warn('Failed to save leadId to sessionStorage:', error)
          // Non-critical, results page can still fetch from API using leadId from URL
        }
      }
      
      // Redirect to results page immediately
      router.push(`/results?leadId=${leadId}`)
      
      // Call onComplete with contact form data
      onComplete({ ...formData, leadId })

    } catch (error) {
      console.error('Submission error:', error)
      setErrors({ submit: 'Failed to submit. Please try again.' })
      setSubmitting(false)
    }
  }

  // Form view
  return (
    <>
      {/* Full-page loading overlay during submission - fixed to viewport */}
      {submitting && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-red-500 mb-4" size={48} />
          <p className="text-xl font-semibold text-gray-700 mb-2">Submitting your request...</p>
          <p className="text-sm text-gray-500">Redirecting to your results</p>
        </div>
      )}
      
      <div className="max-w-2xl mx-auto relative">
      <div className="card p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-navy-500 mb-2">
            Get Your Detailed Quote
          </h2>
          <p className="text-gray-600">
            Connect with certified installers for next steps
          </p>
        </div>

        {/* Not a contract or quote disclaimer */}
        <div className="mb-6 flex items-start gap-2 text-xs text-gray-700">
          <InfoTooltip
            content="This calculator is for educational and informational purposes only. It does not constitute a quote, contract, guarantee of performance, or confirmation of eligibility for any program or incentive. A qualified installer must provide a formal proposal and conduct a site assessment before any system is approved or installed."
          />
          <span>These results are not a contract or quote – a qualified installer must provide a formal proposal.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ContactFormFields
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />

          {/* Trust indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            {['Secure SSL', 'No Spam', 'No Obligation', 'Response in 24hrs'].map((badge, i) => (
              <div key={i} className="text-center text-xs font-semibold text-navy-500 p-2 bg-blue-50 rounded border border-blue-200">
                {badge}
              </div>
            ))}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Save indicator */}
          {saving && (
            <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={14} />
              Saving progress...
            </div>
          )}

          {/* Submit button */}
          <div className="flex gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={submitting || saving}
                className="btn-outline border-gray-300 text-gray-700 flex-1"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || saving}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Submitting...
                </>
              ) : (
                'Get My Detailed Quote'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

