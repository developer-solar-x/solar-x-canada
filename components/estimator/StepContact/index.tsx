'use client'

// Step 8: Contact form and lead submission

import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { isValidEmail } from '@/lib/utils'
import { useContactFormData } from './hooks/useContactFormData'
import { useAutoSave } from './hooks/useAutoSave'
import { ContactFormFields } from './components/ContactFormFields'
import { SuccessView } from './components/SuccessView'
import { validateContactForm } from './utils/validation'
import type { StepContactProps } from './types'

export function StepContact({ data, onComplete, onBack }: StepContactProps) {
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
      // Submit lead to API
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
            Connect with SolarX installers for next steps
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

