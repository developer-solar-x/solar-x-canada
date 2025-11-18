'use client'

import { AlertTriangle } from 'lucide-react'
import type { ServiceAreaWarningProps } from '../types'

export function ServiceAreaWarning({ warning, onDismiss }: ServiceAreaWarningProps) {
  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-left">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
        <div>
          <h3 className="font-bold text-red-900 mb-2">Service Area Restricted</h3>
          <p className="text-sm text-red-800 mb-3">
            {warning}
          </p>
          <p className="text-xs text-red-700 mb-3">
            We currently only provide solar installation services in Ontario. 
            This ensures we can deliver the highest quality service and support to our customers.
          </p>
          <p className="text-xs text-red-600 font-semibold">
            Please enter an Ontario address to continue with your solar estimate.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
      >
        Try Ontario Address
      </button>
    </div>
  )
}

