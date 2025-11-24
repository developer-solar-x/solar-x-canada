'use client'

import { Home, Building2 } from 'lucide-react'
import type { LeadTypeSelectorProps } from '../types'

export function LeadTypeSelector({ leadType, onLeadTypeChange }: LeadTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-base md:text-lg font-semibold text-gray-700 mb-3">
          Property Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onLeadTypeChange('residential')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              leadType === 'residential'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                leadType === 'residential'
                  ? 'bg-red-500'
                  : 'bg-gray-200'
              }`}>
                <Home className="text-white" size={24} />
              </div>
              <div className="font-semibold text-gray-800">Residential</div>
            </div>
            <div className="text-sm text-gray-600">
              For homes, townhouses, and residential properties
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => onLeadTypeChange('commercial')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              leadType === 'commercial'
                ? 'border-navy-500 bg-navy-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                leadType === 'commercial'
                  ? 'bg-navy-500'
                  : 'bg-gray-200'
              }`}>
                <Building2 className="text-white" size={24} />
              </div>
              <div className="font-semibold text-gray-800">Commercial</div>
            </div>
            <div className="text-sm text-gray-600">
              For businesses and commercial properties
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

