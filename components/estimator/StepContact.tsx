'use client'

// Step 5: Contact form and lead submission

import { useState } from 'react'
import { CheckCircle, Loader2, Download } from 'lucide-react'
import { isValidEmail, isValidPhone, formatPhone } from '@/lib/utils'

interface StepContactProps {
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
}

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

  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number'
    }

    if (!formData.consent) {
      newErrors.consent = 'You must agree to receive communications'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
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
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="card p-12">
          {/* Success icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={48} />
            </div>
          </div>

          {/* Success message */}
          <h2 className="text-3xl font-bold text-navy-500 mb-4">
            Estimate Sent Successfully!
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            We've emailed your estimate to <strong>{formData.email}</strong>
          </p>

          {/* Next steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-navy-500 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li className="text-green-600">
                <span className="text-gray-700">A SolarX specialist will contact you within 24 hours</span>
              </li>
              <li className="text-green-600">
                <span className="text-gray-700">We'll answer any questions and discuss your options</span>
              </li>
              <li className="text-green-600">
                <span className="text-gray-700">Schedule a free site assessment if you'd like to proceed</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-outline border-navy-500 text-navy-500 inline-flex items-center justify-center">
              <Download size={20} />
              Download PDF
            </button>
            <a href="/" className="btn-primary inline-flex items-center justify-center">
              Back to Home
            </a>
          </div>

          {/* Reference ID */}
          <p className="text-xs text-gray-500 mt-8">
            Reference ID: {leadId}
          </p>
        </div>
      </div>
    )
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
          {/* Personal Information */}
          <div>
            <h3 className="font-semibold text-navy-500 mb-4">Personal Information</h3>
            
            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Smith"
                className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                  errors.fullName ? 'border-red-500' : 'border-gray-200 focus:border-red-500'
                }`}
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                  errors.email ? 'border-red-500' : 'border-gray-200 focus:border-red-500'
                }`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                onBlur={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(416) 555-1234"
                className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                  errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-red-500'
                }`}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="font-semibold text-navy-500 mb-4">Contact Preferences</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Best Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Best Time to Contact
                </label>
                <select
                  value={formData.preferredContactTime}
                  onChange={(e) => setFormData({ ...formData, preferredContactTime: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                >
                  <option value="morning">Morning (8am-12pm)</option>
                  <option value="afternoon">Afternoon (12pm-5pm)</option>
                  <option value="evening">Evening (5pm-8pm)</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>

              {/* Preferred Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Method
                </label>
                <select
                  value={formData.preferredContactMethod}
                  onChange={(e) => setFormData({ ...formData, preferredContactMethod: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
                >
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="text">Text Message</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comments/Questions (Optional)
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Any specific concerns or questions?"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.comments.length}/500
            </p>
          </div>

          {/* Consent */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                className="w-5 h-5 text-red-500 rounded mt-0.5"
              />
              <span className="text-sm text-gray-700">
                I agree to receive communications from SolarX and certified installers regarding my solar estimate. *
              </span>
            </label>
            {errors.consent && <p className="text-red-500 text-sm mt-1 ml-8">{errors.consent}</p>}
          </div>

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

          {/* Submit button */}
          <div className="flex gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="btn-outline border-gray-300 text-gray-700 flex-1"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
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

