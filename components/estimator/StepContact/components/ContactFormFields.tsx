'use client'

import { formatPhone } from '@/lib/utils'
import type { ContactFormFieldsProps } from '../types'

export function ContactFormFields({ formData, setFormData, errors }: ContactFormFieldsProps) {
  return (
    <>
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
    </>
  )
}

