'use client'

// Step 8: Contact form and lead submission

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { isValidEmail } from '@/lib/utils'
import { useContactFormData } from './hooks/useContactFormData'
import { useAutoSave } from './hooks/useAutoSave'
import { ContactFormFields } from './components/ContactFormFields'
import { SuccessView } from './components/SuccessView'
import { validateContactForm } from './utils/validation'
import type { StepContactProps } from './types'

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
  const [submitted, setSubmitted] = useState(false)
  const [leadId, setLeadId] = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      // TODO: API connection disabled - will be connected later
      // For now, just simulate success without calling the API
      console.log('Form submission (API disabled):', {
        formData,
        estimateData: data.estimate,
      })

      // Simulate API response
      const mockLeadId = `mock-${Date.now()}`
      setLeadId(mockLeadId)
      
      // Store estimate data in sessionStorage for results page
      if (data.estimate) {
        // Calculate rebates from estimate data
        const solarRebate = data.estimate.costs?.incentives || 0
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
        
        sessionStorage.setItem('calculatorResults', JSON.stringify({
          estimate: finalEstimate,
          leadData: {
            firstName: formData.fullName?.split(' ')[0] || '',
            lastName: formData.fullName?.split(' ').slice(1).join(' ') || '',
            email: formData.email,
            address: data.address,
            province: data.province || 'ON',
          },
          batteryImpact: data.batteryDetails ? {
            annualSavings: data.batteryDetails?.firstYearAnalysis?.totalSavings || 0,
            monthlySavings: data.batteryDetails?.firstYearAnalysis?.totalSavings ? Math.round(data.batteryDetails.firstYearAnalysis.totalSavings / 12) : 0,
            batterySizeKwh: data.batteryDetails?.battery?.nominalKwh || 0,
          } : undefined,
          selectedBattery: data.selectedBattery, // Store selected battery info
          batteryDetails: data.batteryDetails, // Store full battery details
          peakShaving: data.peakShaving,
          solarRebate,
          batteryRebate,
          combinedTotalCost,
          combinedNetCost,
          displayPlan,
          solarOverride: data.solarOverride, // Include solar override to match StepReview
          // Additional data for comprehensive results summary
          mapSnapshot: data.mapSnapshot,
          roofData: {
            roofAreaSqft: data.roofAreaSqft,
            roofType: data.roofType,
            roofPitch: data.roofPitch,
            shadingLevel: data.shadingLevel,
            roofAge: data.roofAge,
            roofPolygon: data.roofPolygon,
            roofSections: data.roofSections,
          },
          photos: data.photos,
          photoSummary: data.photoSummary,
          monthlyBill: data.monthlyBill,
          energyUsage: data.energyUsage,
          appliances: data.appliances,
          addOns: data.addOns,
          tou: data.peakShaving?.tou,
          ulo: data.peakShaving?.ulo,
        }))
      }
      
      // Redirect to results page
      router.push(`/results?leadId=${mockLeadId}`)
      
      // Also call onComplete for backward compatibility
      onComplete({ ...formData, leadId: mockLeadId })

      // Uncomment below when ready to connect to API:
      /*
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...data,
          estimateData: data.estimate,
          systemSizeKw: data.estimate?.system?.sizeKw,
          estimatedCost: data.estimate?.costs?.totalCost,
          netCostAfterIncentives: data.estimate?.costs?.netCost,
          annualSavings: data.estimate?.savings?.annualSavings,
          paybackYears: data.estimate?.savings?.paybackYears,
          annualProductionKwh: data.estimate?.production?.annualKwh,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit lead')
      }

      const result = await response.json()
      setLeadId(result.data.leadId)
      setSubmitted(true)
      onComplete({ ...formData, leadId: result.data.leadId })
      */

    } catch (error) {
      console.error('Submission error:', error)
      setErrors({ submit: 'Failed to submit. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  // Success view
  if (submitted) {
    return <SuccessView email={formData.email} leadId={leadId} />
  }

  // Form view
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-navy-500 mb-2">
            Get Your Detailed Quote
          </h2>
          <p className="text-gray-600">
            Connect with certified installers for next steps
          </p>
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
  )
}

