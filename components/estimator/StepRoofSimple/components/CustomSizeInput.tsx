'use client'

import { Ruler } from 'lucide-react'
import type { CustomSizeInputProps } from '../types'

export function CustomSizeInput({ customSize, onCustomSizeChange }: CustomSizeInputProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Enter exact roof size:
      </label>
      <div className="relative">
        <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="number"
          value={customSize}
          onChange={(e) => onCustomSizeChange(e.target.value)}
          placeholder="e.g., 1500"
          className="w-full pl-10 pr-20 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base sm:text-lg"
        />
        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
          sq ft
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Find this on property documents or make your best estimate
      </p>
    </div>
  )
}

