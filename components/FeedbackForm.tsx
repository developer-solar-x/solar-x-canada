'use client'

// Feedback form component (modal or page)

import { useState, FormEvent } from 'react'
import { X, Send, CheckCircle, AlertCircle, Lightbulb, Bug, Package } from 'lucide-react'

interface FeedbackFormProps {
  isModal?: boolean
  onClose?: () => void
  onSuccess?: () => void
}

export function FeedbackForm({ isModal = false, onClose, onSuccess }: FeedbackFormProps) {
  const [formData, setFormData] = useState({
    type: '',
    province: '',
    description: '',
    email: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const feedbackTypes = [
    { value: 'product', label: 'Suggest a New Product', icon: Package, description: 'Have an idea for a new product or feature?' },
    { value: 'improvement', label: 'Suggest an Improvement', icon: Lightbulb, description: 'How can we make the calculator better?' },
    { value: 'bug', label: 'Report an Issue', icon: Bug, description: 'Found a bug or error? Let us know!' },
  ]

  const provinces = [
    'Ontario',
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Nova Scotia',
    'Northwest Territories',
    'Nunavut',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon',
  ]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.type || !formData.description) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    
    // Simulate form submission (UI only, no backend yet)
    setTimeout(() => {
      setSubmitted(true)
      setLoading(false)
      if (onSuccess) onSuccess()
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const selectedType = feedbackTypes.find(t => t.value === formData.type)

  const content = (
    <div className={isModal ? 'p-6' : 'max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12'}>
      {!isModal && (
        <div className="text-center mb-12">
          <h1 className="heading-lg mb-4">Help Us Improve</h1>
          <p className="text-lg text-gray-600">
            Your feedback helps us make the calculator better for everyone
          </p>
        </div>
      )}

      {submitted ? (
        <div className="bg-forest-50 border-2 border-forest-500 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-forest-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-forest-500 mb-2">
            Thank You!
          </h3>
          <p className="text-gray-700 mb-6">
            Your feedback has been submitted. We appreciate you taking the time to help us improve.
          </p>
          {isModal && onClose ? (
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Close
            </button>
          ) : (
            <button
              onClick={() => {
                setSubmitted(false)
                setFormData({ type: '', province: '', description: '', email: '' })
              }}
              className="btn-secondary"
            >
              Submit Another
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              What would you like to do? <span className="text-maple-500">*</span>
            </label>
            <div className="grid gap-4">
              {feedbackTypes.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.type === type.value
                      ? 'border-forest-500 bg-forest-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <type.icon className="text-forest-500" size={20} />
                      <span className="font-semibold text-gray-900">{type.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Province Selection */}
          <div>
            <label htmlFor="province" className="block text-sm font-semibold text-gray-700 mb-2">
              Province
            </label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors"
            >
              <option value="">Select your province</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-maple-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors resize-none"
              placeholder={
                selectedType?.value === 'product'
                  ? 'Tell us about the product or feature you\'d like to see...'
                  : selectedType?.value === 'improvement'
                  ? 'How can we improve the calculator? Be as specific as possible...'
                  : 'Describe the issue you encountered. Include steps to reproduce if possible...'
              }
            />
            <p className="text-sm text-gray-500 mt-2">
              Please provide as much detail as possible
            </p>
          </div>

          {/* Email (Optional) */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-gray-400 text-xs">(optional, for follow-up)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors"
              placeholder="your.email@example.com"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-maple-50 border-2 border-maple-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-maple-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-maple-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 h-12 inline-flex items-center justify-center"
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="mr-2" size={18} />
                  Submit Feedback
                </>
              )}
            </button>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn-outline h-12 px-6"
              >
                Cancel
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500 text-center">
            <span className="text-maple-500">*</span> Required fields
          </p>
        </form>
      )}
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-forest-500">Help Us Improve</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>
          {content}
        </div>
      </div>
    )
  }

  return content
}

