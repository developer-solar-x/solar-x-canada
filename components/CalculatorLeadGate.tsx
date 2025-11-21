'use client'

// Lead capture form component - shown before calculator results

import { useState, FormEvent } from 'react'
import { Mail, Phone, MapPin, User, CheckCircle, AlertCircle } from 'lucide-react'

interface CalculatorLeadGateProps {
  onSubmit: (data: LeadFormData) => void
  onCancel?: () => void
}

export interface LeadFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  streetAddress: string
  city: string
  postalCode: string
  province: string
  contactPreference: 'email' | 'phone' | 'either'
  permissionGranted: boolean
}

export function CalculatorLeadGate({ onSubmit, onCancel }: CalculatorLeadGateProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    postalCode: '',
    province: 'Ontario',
    contactPreference: 'either',
    permissionGranted: false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({})
  const [loading, setLoading] = useState(false)

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

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LeadFormData, string>> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\d\s\-\(\)]+$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required'
    } else if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Please enter a valid Canadian postal code'
    }
    if (!formData.permissionGranted) {
      newErrors.permissionGranted = 'You must agree to be contacted'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      onSubmit(formData)
      setLoading(false)
    }, 500)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
    // Clear error when user starts typing
    if (errors[name as keyof LeadFormData]) {
      setErrors({ ...errors, [name]: undefined })
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-forest-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-forest-500" size={32} />
          </div>
          <h2 className="heading-lg mb-4">Get Your Solar Savings Results</h2>
          <p className="text-lg text-gray-600">
            We'll use this information to match you with a vetted local installer and send your personalized results.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                First Name <span className="text-maple-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors ${
                  errors.firstName ? 'border-maple-500' : 'border-gray-300'
                }`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-sm text-maple-500 mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name <span className="text-maple-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors ${
                  errors.lastName ? 'border-maple-500' : 'border-gray-300'
                }`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-sm text-maple-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail size={16} className="inline mr-1" />
                Email <span className="text-maple-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors ${
                  errors.email ? 'border-maple-500' : 'border-gray-300'
                }`}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="text-sm text-maple-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone size={16} className="inline mr-1" />
                Phone <span className="text-maple-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors ${
                  errors.phone ? 'border-maple-500' : 'border-gray-300'
                }`}
                placeholder="(555) 123-4567"
              />
              {errors.phone && (
                <p className="text-sm text-maple-500 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Address Fields */}
          <div>
            <label htmlFor="streetAddress" className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Street Address <span className="text-maple-500">*</span>
            </label>
            <input
              type="text"
              id="streetAddress"
              name="streetAddress"
              required
              value={formData.streetAddress}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors ${
                errors.streetAddress ? 'border-maple-500' : 'border-gray-300'
              }`}
              placeholder="123 Main Street"
            />
            {errors.streetAddress && (
              <p className="text-sm text-maple-500 mt-1">{errors.streetAddress}</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                City <span className="text-maple-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors ${
                  errors.city ? 'border-maple-500' : 'border-gray-300'
                }`}
                placeholder="Toronto"
              />
              {errors.city && (
                <p className="text-sm text-maple-500 mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label htmlFor="province" className="block text-sm font-semibold text-gray-700 mb-2">
                Province <span className="text-maple-500">*</span>
              </label>
              <select
                id="province"
                name="province"
                required
                value={formData.province}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors"
              >
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
                Postal Code <span className="text-maple-500">*</span>
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                required
                value={formData.postalCode}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors uppercase ${
                  errors.postalCode ? 'border-maple-500' : 'border-gray-300'
                }`}
                placeholder="M5V 3A8"
                maxLength={7}
              />
              {errors.postalCode && (
                <p className="text-sm text-maple-500 mt-1">{errors.postalCode}</p>
              )}
            </div>
          </div>

          {/* Contact Preference */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Preferred Contact Method <span className="text-maple-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['email', 'phone', 'either'] as const).map((pref) => (
                <label
                  key={pref}
                  className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.contactPreference === pref
                      ? 'border-forest-500 bg-forest-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="contactPreference"
                    value={pref}
                    checked={formData.contactPreference === pref}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="font-medium capitalize">{pref}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Permission Checkbox */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="permissionGranted"
                checked={formData.permissionGranted}
                onChange={handleChange}
                className="mt-1 w-5 h-5 text-forest-500 border-gray-300 rounded focus:ring-forest-500"
              />
              <span className="text-sm text-gray-700">
                I agree to be contacted by a vetted solar installer about my results. <span className="text-maple-500">*</span>
              </span>
            </label>
            {errors.permissionGranted && (
              <p className="text-sm text-maple-500 mt-1 ml-8">{errors.permissionGranted}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 h-14 text-lg"
            >
              {loading ? 'Processing...' : 'See My Results'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-outline h-14 px-6"
              >
                Cancel
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500 text-center">
            <span className="text-maple-500">*</span> Required fields. Your information is secure and will only be shared with vetted installers.
          </p>
        </form>
      </div>
    </div>
  )
}

