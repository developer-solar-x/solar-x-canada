'use client'

import { Zap, Calendar, Upload } from 'lucide-react'
import type { MethodSelectorProps } from '../types'

export function MethodSelector({ inputMethod, onMethodChange }: MethodSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        How would you like to input your usage data?
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Annual Input */}
        <button
          onClick={() => onMethodChange('annual')}
          className={`p-4 border-2 rounded-lg text-left transition-all ${
            inputMethod === 'annual'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-red-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={20} className={inputMethod === 'annual' ? 'text-red-500' : 'text-gray-600'} />
            <div className="font-semibold text-navy-500">Annual Total</div>
          </div>
          <div className="text-xs text-gray-600">
            Enter total yearly usage (simplest method)
          </div>
        </button>

        {/* Monthly Input */}
        <button
          onClick={() => onMethodChange('monthly')}
          className={`p-4 border-2 rounded-lg text-left transition-all ${
            inputMethod === 'monthly'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-red-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className={inputMethod === 'monthly' ? 'text-red-500' : 'text-gray-600'} />
            <div className="font-semibold text-navy-500">Monthly Values</div>
          </div>
          <div className="text-xs text-gray-600">
            Enter 12 monthly values for accuracy
          </div>
        </button>

        {/* CSV Upload */}
        <button
          onClick={() => onMethodChange('csv')}
          className={`p-4 border-2 rounded-lg text-left transition-all ${
            inputMethod === 'csv'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-red-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Upload size={20} className={inputMethod === 'csv' ? 'text-red-500' : 'text-gray-600'} />
            <div className="font-semibold text-navy-500">Upload CSV</div>
          </div>
          <div className="text-xs text-gray-600">
            Green Button data (most accurate)
          </div>
        </button>
      </div>
    </div>
  )
}

