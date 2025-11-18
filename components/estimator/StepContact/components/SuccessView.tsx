'use client'

import { CheckCircle } from 'lucide-react'
import type { SuccessViewProps } from '../types'

export function SuccessView({ email, leadId }: SuccessViewProps) {
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
          We've emailed your estimate to <strong>{email}</strong>
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

